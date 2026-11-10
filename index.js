require('dotenv').config();

const express = require('express');
const { Pool } = require('pg');

const app = express();
const pool = new Pool();

function escapeHtml(value) {
    const entities = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    };
    return String(value ?? '').replace(/[&<>"']/g, char => entities[char]);
}

app.get('/', async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT first_name, last_name, course_name, title,
                   weight_percentage, due_date::text AS due_date
            FROM StudentAssessmentOverview
            ORDER BY due_date, assessment_id
        `);

        const tableRows = rows.map(row => `
            <tr>
                <td>${escapeHtml(`${row.first_name} ${row.last_name}`)}</td>
                <td>${escapeHtml(row.course_name)}</td>
                <td>${escapeHtml(row.title)}</td>
                <td>${escapeHtml(row.weight_percentage)}%</td>
                <td>${escapeHtml(row.due_date)}</td>
            </tr>
        `).join('');

        res.send(`
            <!doctype html>
            <html lang="en">
            <head>
                <meta charset="utf-8">
                <title>Academic Study Planner</title>
            </head>
            <body>
                <h1>Academic Study Planner</h1>
                <h2>Student Assessment Overview</h2>
                <p>${rows.length} assessments</p>
                <table>
                    <thead>
                        <tr>
                            <th scope="col">Student</th>
                            <th scope="col">Course</th>
                            <th scope="col">Assessment</th>
                            <th scope="col">Weight</th>
                            <th scope="col">Due date</th>
                        </tr>
                    </thead>
                    <tbody>${tableRows}</tbody>
                </table>
            </body>
            </html>
        `);
    } catch (error) {
        console.error('Could not query StudentAssessmentOverview:', error.message);
        res.status(500).send('Could not load assessments. Check the server terminal.');
    }
});

app.listen(3000, '127.0.0.1', () => {
    console.log('Academic Study Planner is running at http://localhost:3000');
});
