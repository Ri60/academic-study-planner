const express = require('express');
const { randomUUID } = require('node:crypto');

function createStudySessionRouter(pool) {
    const router = express.Router();

    router.use(express.json({ limit: '20kb' }));

    // Authentication and role authorization
    router.use((req, res, next) => {
        if (!req.session?.account) {
            return res.status(401).json({
                error: 'Please log in first.'
            });
        }

        if (!['admin', 'user'].includes(req.session.account.role)) {
            return res.status(403).json({
                error: 'Guests cannot access private study sessions.'
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

    function validateStudySession(body) {
        if (!body || typeof body !== 'object' || Array.isArray(body)) {
            return { error: 'Invalid study session data.' };
        }

        const assessmentId = typeof body.assessment_id === 'string'
            ? body.assessment_id.trim()
            : '';

        const sessionDate = body.session_date;
        const durationMin = Number(body.duration_min);

        const productivity = body.productivity == null ||
            body.productivity === ''
            ? null
            : Number(body.productivity);

        if (!validId(assessmentId)) {
            return { error: 'Invalid assessment ID.' };
        }

        if (
            typeof sessionDate !== 'string' ||
            !/^\d{4}-\d{2}-\d{2}$/.test(sessionDate) ||
            !Number.isFinite(Date.parse(sessionDate)) ||
            new Date(sessionDate).toISOString().slice(0, 10) !== sessionDate
        ) {
            return {
                error: 'Session date must be a valid YYYY-MM-DD date.'
            };
        }

        if (
            body.duration_min === '' ||
            body.duration_min == null ||
            !Number.isInteger(durationMin) ||
            durationMin <= 0 ||
            durationMin > 1440
        ) {
            return {
                error: 'Duration must be an integer between 1 and 1440 minutes.'
            };
        }

        if (
            productivity !== null &&
            (!Number.isInteger(productivity) ||
                productivity < 1 ||
                productivity > 5)
        ) {
            return {
                error: 'Productivity must be an integer between 1 and 5.'
            };
        }

        return {
            data: {
                assessmentId,
                sessionDate,
                durationMin,
                productivity
            }
        };
    }

    async function canAccessAssessment(req, assessmentId) {
        const { role, studentId } = accountFilter(req);

        const result = await pool.query(`
            SELECT 1
            FROM Assessment a
            JOIN Course c ON c.course_id = a.course_id
            WHERE a.assessment_id = $1
              AND ($2::text = 'admin' OR c.student_id = $3)
        `, [assessmentId, role, studentId]);

        return result.rowCount > 0;
    }

    function databaseError(res, error) {
        console.error('Study Session API error:', error.message);

        if (error.code === '23503') {
            return res.status(409).json({
                error: 'This operation conflicts with a related database record.'
            });
        }

        if (error.code === '23505') {
            return res.status(409).json({
                error: 'A study session with this ID already exists.'
            });
        }

        if (error.code === '23514' || error.code === '22003') {
            return res.status(400).json({
                error: 'Study session values do not meet database requirements.'
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
                    s.session_id,
                    s.session_date::text AS session_date,
                    s.duration_min,
                    s.productivity,
                    s.assessment_id,
                    a.title AS assessment_title,
                    c.course_id,
                    c.course_name
                FROM StudySession s
                JOIN Assessment a ON a.assessment_id = s.assessment_id
                JOIN Course c ON c.course_id = a.course_id
                WHERE ($1::text = 'admin' OR c.student_id = $2)
                ORDER BY s.session_date DESC, s.session_id
            `, [role, studentId]);

            res.json(rows);
        } catch (error) {
            databaseError(res, error);
        }
    });

    // CREATE
    router.post('/', async (req, res) => {
        const validation = validateStudySession(req.body);

        if (validation.error) {
            return res.status(400).json({
                error: validation.error
            });
        }

        const data = validation.data;

        try {
            if (!(await canAccessAssessment(req, data.assessmentId))) {
                return res.status(403).json({
                    error: 'You cannot log study sessions for this assessment.'
                });
            }

            const sessionId = 'SS' + randomUUID()
                .replace(/-/g, '')
                .slice(0, 18);

            const { rows } = await pool.query(`
                INSERT INTO StudySession (
                    session_id,
                    session_date,
                    duration_min,
                    productivity,
                    assessment_id
                )
                VALUES ($1, $2, $3, $4, $5)
                RETURNING
                    session_id,
                    session_date::text AS session_date,
                    duration_min,
                    productivity,
                    assessment_id
            `, [
                sessionId,
                data.sessionDate,
                data.durationMin,
                data.productivity,
                data.assessmentId
            ]);

            res.status(201).json(rows[0]);
        } catch (error) {
            databaseError(res, error);
        }
    });

    // UPDATE
    router.put('/:id', async (req, res) => {
        const sessionId = req.params.id;

        if (!validId(sessionId)) {
            return res.status(400).json({
                error: 'Invalid session ID.'
            });
        }

        const validation = validateStudySession(req.body);

        if (validation.error) {
            return res.status(400).json({
                error: validation.error
            });
        }

        const data = validation.data;
        const { role, studentId } = accountFilter(req);

        try {
            if (!(await canAccessAssessment(req, data.assessmentId))) {
                return res.status(403).json({
                    error: 'You cannot move this study session to that course.'
                });
            }

            const { rows } = await pool.query(`
                UPDATE StudySession s
                SET
                    session_date = $1,
                    duration_min = $2,
                    productivity = $3,
                    assessment_id = $4
                FROM Assessment original_a, Course original_c
                WHERE s.session_id = $5
                  AND original_a.assessment_id = s.assessment_id
                  AND original_c.course_id = original_a.course_id
                  AND (
                      $6::text = 'admin'
                      OR original_c.student_id = $7
                  )
                RETURNING
                    s.session_id,
                    s.session_date::text AS session_date,
                    s.duration_min,
                    s.productivity,
                    s.assessment_id
            `, [
                data.sessionDate,
                data.durationMin,
                data.productivity,
                data.assessmentId,
                sessionId,
                role,
                studentId
            ]);

            if (!rows.length) {
                return res.status(404).json({
                    error: 'Study session not found or access denied.'
                });
            }

            res.json(rows[0]);
        } catch (error) {
            databaseError(res, error);
        }
    });

    // DELETE
    router.delete('/:id', async (req, res) => {
        const sessionId = req.params.id;

        if (!validId(sessionId)) {
            return res.status(400).json({
                error: 'Invalid session ID.'
            });
        }

        const { role, studentId } = accountFilter(req);

        try {
            const result = await pool.query(`
                DELETE FROM StudySession s
                USING Assessment a, Course c
                WHERE s.session_id = $1
                  AND a.assessment_id = s.assessment_id
                  AND c.course_id = a.course_id
                  AND ($2::text = 'admin' OR c.student_id = $3)
                RETURNING s.session_id
            `, [sessionId, role, studentId]);

            if (!result.rowCount) {
                return res.status(404).json({
                    error: 'Study session not found or access denied.'
                });
            }

            res.json({
                message: 'Study session deleted successfully.'
            });
        } catch (error) {
            databaseError(res, error);
        }
    });

    return router;
}

module.exports = createStudySessionRouter;