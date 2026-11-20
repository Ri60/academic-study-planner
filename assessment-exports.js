
const express = require('express');
const PDFDocument = require('pdfkit');

function createAssessmentExportsRouter(pool) {
    const router = express.Router();

router.use((req, res, next) => {
    if (!req.session?.account) {
        return res.status(401).send('Please log in first.');
    }

    if (!['admin', 'user'].includes(req.session.account.role)) {
        return res.status(403).send(
            'Access denied. Guests cannot export private assessments.'
        );
    }

    next();
});
    async function getAssessments(req) {
        const { role, studentId } = req.session.account;

        const result = await pool.query(`
            SELECT
                a.assessment_id,
                a.title,
                c.course_name,
                a.weight_percentage,
                a.due_date::text AS due_date
            FROM Assessment a
            JOIN Course c ON c.course_id = a.course_id
            WHERE ($1::text = 'admin' OR c.student_id = $2)
            ORDER BY a.due_date, a.assessment_id
        `, [role, studentId]);

        return result.rows;
    }

    function csvCell(value) {
        let text = String(value ?? '');

        // Prevent spreadsheet formula injection.
        if (/^[\s]*[=+\-@\t\r]/.test(text)) {
            text = "'" + text;
        }

        return '"' + text.replace(/"/g, '""') + '"';
    }

    router.get('/csv', async (req, res) => {
        try {
            const assessments = await getAssessments(req);

            const headers = [
                'Assessment ID',
                'Title',
                'Course',
                'Weight (%)',
                'Due Date'
            ];

            const rows = assessments.map(a => [
                a.assessment_id,
                a.title,
                a.course_name,
                a.weight_percentage,
                a.due_date
            ]);

            const csv = [headers, ...rows]
                .map(row => row.map(csvCell).join(','))
                .join('\r\n');

            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader(
                'Content-Disposition',
                'attachment; filename="assessments.csv"'
            );

            res.send('\uFEFF' + csv);
        } catch (error) {
            console.error('CSV export error:', error.message);
            res.status(500).send('Could not export assessments.');
        }
    });

    router.get('/pdf', async (req, res) => {
        try {
            const assessments = await getAssessments(req);

            const doc = new PDFDocument({
                size: 'A4',
                margin: 45
            });

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader(
                'Content-Disposition',
                'attachment; filename="assessments.pdf"'
            );

            doc.on('error', error => {
                console.error('PDF generation error:', error.message);
                res.destroy(error);
            });

            doc.pipe(res);

            doc.fontSize(20).text('Academic Study Planner');
            doc.moveDown(0.3);
            doc.fontSize(14).text('Assessment Report');
            doc.moveDown();

            if (assessments.length === 0) {
                doc.fontSize(11).text('No assessments found.');
            }

            for (const assessment of assessments) {
                if (doc.y > 690) {
                    doc.addPage();
                }

                doc.fontSize(12)
                    .text(assessment.title, { underline: true });

                doc.fontSize(10)
                    .text(`ID: ${assessment.assessment_id}`)
                    .text(`Course: ${assessment.course_name}`)
                    .text(`Weight: ${assessment.weight_percentage}%`)
                    .text(`Due date: ${assessment.due_date}`);

                doc.moveDown();
            }

            doc.end();
        } catch (error) {
            console.error('PDF export error:', error.message);

            if (!res.headersSent) {
                res.status(500).send('Could not export assessments.');
            } else {
                res.destroy(error);
            }
        }
    });

    return router;
}

module.exports = createAssessmentExportsRouter;
