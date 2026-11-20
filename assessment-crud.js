
const express = require('express');
const { randomUUID } = require('node:crypto');

function createAssessmentRouter(pool) {
    const router = express.Router();

    router.use(express.json({ limit: '20kb' }));

    router.use((req, res, next) => {
        if (!req.session?.account) {
            return res.status(401).json({
                error: 'Please log in first.'
            });
        }
        next();
    });

    function accountFilter(req) {
        const account = req.session.account;
        return {
            role: account.role,
            studentId: account.studentId
        };
    }

    function validId(value) {
        return typeof value === 'string' &&
            /^[A-Za-z0-9_-]{1,20}$/.test(value);
    }

    function validateAssessment(body) {
        if (!body || typeof body !== 'object' || Array.isArray(body)) {
            return { error: 'Invalid assessment data.' };
        }

        const title = typeof body.title === 'string'
            ? body.title.trim()
            : '';

        const courseId = typeof body.course_id === 'string'
            ? body.course_id.trim()
            : '';

        const weight = Number(body.weight_percentage);
        const dueDate = body.due_date;

        const prereqId = body.prereq_assessment_id == null ||
            body.prereq_assessment_id === ''
            ? null
            : body.prereq_assessment_id;

        if (!title || title.length > 50) {
            return { error: 'Title must be 1–50 characters.' };
        }

        if (!validId(courseId)) {
            return { error: 'Invalid course ID.' };
        }

        if (
            body.weight_percentage === '' ||
            body.weight_percentage == null ||
            !Number.isFinite(weight) ||
            weight <= 0 ||
            weight > 100
        ) {
            return { error: 'Weight must be greater than 0 and at most 100.' };
        }

        if (
            typeof dueDate !== 'string' ||
            !/^\d{4}-\d{2}-\d{2}$/.test(dueDate) ||
            !Number.isFinite(Date.parse(dueDate)) ||
            new Date(dueDate).toISOString().slice(0, 10) !== dueDate
        ) {
            return { error: 'Due date must be a valid YYYY-MM-DD date.' };
        }

        if (prereqId !== null && !validId(prereqId)) {
            return { error: 'Invalid prerequisite assessment ID.' };
        }

        return {
            data: {
                title,
                courseId,
                weight,
                dueDate,
                prereqId
            }
        };
    }

    async function canAccessCourse(req, courseId) {
        const { role, studentId } = accountFilter(req);

        const result = await pool.query(`
            SELECT 1
            FROM Course
            WHERE course_id = $1
              AND ($2::text = 'admin' OR student_id = $3)
        `, [courseId, role, studentId]);

        return result.rowCount > 0;
    }

    async function prerequisiteIsValid(prereqId, courseId, currentId = null) {
        if (prereqId === null) return true;
        if (prereqId === currentId) return false;

        const result = await pool.query(`
            SELECT 1
            FROM Assessment
            WHERE assessment_id = $1
              AND course_id = $2
        `, [prereqId, courseId]);

        return result.rowCount > 0;
    }

    function databaseError(res, error) {
        console.error('Assessment API error:', error.message);

        if (error.code === '23503') {
            return res.status(409).json({
                error: 'This operation conflicts with a related database record.'
            });
        }

        if (error.code === '23505') {
            return res.status(409).json({
                error: 'An assessment with this ID already exists.'
            });
        }

        if (error.code === '23514' || error.code === '22003') {
            return res.status(400).json({
                error: 'Assessment values do not meet database requirements.'
            });
        }

        return res.status(500).json({
            error: 'A database error occurred.'
        });
    }

    // READ
    router.get('/', async (req, res) => {
        try {
            const { role, studentId } = accountFilter(req);

            const { rows } = await pool.query(`
                SELECT
                    a.assessment_id,
                    a.title,
                    a.weight_percentage,
                    a.due_date::text AS due_date,
                    a.course_id,
                    c.course_name,
                    a.prereq_assessment_id
                FROM Assessment a
                JOIN Course c ON c.course_id = a.course_id
                WHERE ($1::text = 'admin' OR c.student_id = $2)
                ORDER BY a.due_date, a.assessment_id
            `, [role, studentId]);

            res.json(rows);
        } catch (error) {
            databaseError(res, error);
        }
    });

    // CREATE
    router.post('/', async (req, res) => {
        const validation = validateAssessment(req.body);

        if (validation.error) {
            return res.status(400).json({
                error: validation.error
            });
        }

        const data = validation.data;

        try {
            if (!(await canAccessCourse(req, data.courseId))) {
                return res.status(403).json({
                    error: 'You cannot add assessments to this course.'
                });
            }

            if (!(await prerequisiteIsValid(data.prereqId, data.courseId))) {
                return res.status(400).json({
                    error: 'Prerequisite must belong to the same course.'
                });
            }

            const assessmentId = 'A' + randomUUID()
                .replace(/-/g, '')
                .slice(0, 19);

            const { rows } = await pool.query(`
                INSERT INTO Assessment (
                    assessment_id,
                    title,
                    weight_percentage,
                    due_date,
                    course_id,
                    prereq_assessment_id
                )
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING
                    assessment_id,
                    title,
                    weight_percentage,
                    due_date::text AS due_date,
                    course_id,
                    prereq_assessment_id
            `, [
                assessmentId,
                data.title,
                data.weight,
                data.dueDate,
                data.courseId,
                data.prereqId
            ]);

            res.status(201).json(rows[0]);
        } catch (error) {
            databaseError(res, error);
        }
    });

    // UPDATE
    router.put('/:id', async (req, res) => {
        const assessmentId = req.params.id;

        if (!validId(assessmentId)) {
            return res.status(400).json({
                error: 'Invalid assessment ID.'
            });
        }

        const validation = validateAssessment(req.body);

        if (validation.error) {
            return res.status(400).json({
                error: validation.error
            });
        }

        const data = validation.data;
        const { role, studentId } = accountFilter(req);

        try {
            if (!(await canAccessCourse(req, data.courseId))) {
                return res.status(403).json({
                    error: 'You cannot move this assessment to that course.'
                });
            }

            if (!(await prerequisiteIsValid(
                data.prereqId,
                data.courseId,
                assessmentId
            ))) {
                return res.status(400).json({
                    error: 'Invalid prerequisite assessment.'
                });
            }

            const { rows } = await pool.query(`
                UPDATE Assessment a
                SET
                    title = $1,
                    weight_percentage = $2,
                    due_date = $3,
                    course_id = $4,
                    prereq_assessment_id = $5
                FROM Course original_course
                WHERE a.assessment_id = $6
                  AND original_course.course_id = a.course_id
                  AND (
                      $7::text = 'admin'
                      OR original_course.student_id = $8
                  )
                RETURNING
                    a.assessment_id,
                    a.title,
                    a.weight_percentage,
                    a.due_date::text AS due_date,
                    a.course_id,
                    a.prereq_assessment_id
            `, [
                data.title,
                data.weight,
                data.dueDate,
                data.courseId,
                data.prereqId,
                assessmentId,
                role,
                studentId
            ]);

            if (!rows.length) {
                return res.status(404).json({
                    error: 'Assessment not found or access denied.'
                });
            }

            res.json(rows[0]);
        } catch (error) {
            databaseError(res, error);
        }
    });

    // DELETE
    router.delete('/:id', async (req, res) => {
        const assessmentId = req.params.id;

        if (!validId(assessmentId)) {
            return res.status(400).json({
                error: 'Invalid assessment ID.'
            });
        }

        const { role, studentId } = accountFilter(req);

        const client = await pool.connect().catch(error => {
            console.error('Database connection failed:', error.message);
            return null;
        });

        if (!client) {
            return res.status(500).json({
                error: 'Could not connect to the database.'
            });
        }

        try {
            await client.query('BEGIN');

            const owned = await client.query(`
                SELECT a.assessment_id
                FROM Assessment a
                JOIN Course c ON c.course_id = a.course_id
                WHERE a.assessment_id = $1
                  AND ($2::text = 'admin' OR c.student_id = $3)
                FOR UPDATE OF a
            `, [assessmentId, role, studentId]);

            if (!owned.rowCount) {
                await client.query('ROLLBACK');
                return res.status(404).json({
                    error: 'Assessment not found or access denied.'
                });
            }

            const dependencies = await client.query(`
                SELECT
                    (SELECT COUNT(*) FROM Task
                     WHERE assessment_id = $1) AS task_count,
                    (SELECT COUNT(*) FROM StudySession
                     WHERE assessment_id = $1) AS session_count,
                    (SELECT COUNT(*) FROM Assessment
                     WHERE prereq_assessment_id = $1) AS dependent_count
            `, [assessmentId]);

            const counts = dependencies.rows[0];

            if (
                Number(counts.task_count) > 0 ||
                Number(counts.session_count) > 0 ||
                Number(counts.dependent_count) > 0
            ) {
                await client.query('ROLLBACK');
                return res.status(409).json({
                    error: 'Cannot delete an assessment with tasks, study sessions, or dependent assessments.'
                });
            }

            await client.query(`
                DELETE FROM Assessment
                WHERE assessment_id = $1
            `, [assessmentId]);

            await client.query('COMMIT');

            res.json({
                message: 'Assessment deleted successfully.'
            });
        } catch (error) {
            await client.query('ROLLBACK');
            databaseError(res, error);
        } finally {
            client.release();
        }
    });

    return router;
}

module.exports = createAssessmentRouter;
