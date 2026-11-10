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
        const { rows: assessments } = await pool.query(`
            SELECT first_name, last_name, course_name, title,
                   weight_percentage, due_date::text AS due_date
            FROM StudentAssessmentOverview
            ORDER BY due_date, assessment_id
        `);

        const { rows: upcoming } = await pool.query(`
            SELECT course_name, title, due_date::text AS due_date,
                   days_remaining
            FROM UpcomingAssessments
            ORDER BY due_date, assessment_id
        `);

        const { rows: overdue } = await pool.query(`
            SELECT course_name, assessment_title, task_name, days_overdue
            FROM OverdueIncompleteTasks
            ORDER BY days_overdue DESC, task_id
        `);

        const overdueRows = overdue.map(row => `
            <tr>
                <td>${escapeHtml(row.course_name)}</td>
                <td>${escapeHtml(row.assessment_title)}</td>
                <td>${escapeHtml(row.task_name)}</td>
                <td>${escapeHtml(row.days_overdue)}</td>
            </tr>
        `).join('');

        const { rows: priorities } = await pool.query(`
            SELECT course_name, title, due_date::text AS due_date,
                   days_remaining, priority_score
            FROM AssessmentPriority
            ORDER BY priority_score DESC, due_date, assessment_id
        `);

        const priorityRows = priorities.map(row => `
            <tr>
                <td>${escapeHtml(row.course_name)}</td>
                <td>${escapeHtml(row.title)}</td>
                <td>${escapeHtml(row.due_date)}</td>
                <td>${escapeHtml(row.days_remaining)}</td>
                <td>${escapeHtml(row.priority_score)}</td>
            </tr>
        `).join('');

        const assessmentRows = assessments.map(row => `
            <tr>
                <td>${escapeHtml(`${row.first_name} ${row.last_name}`)}</td>
                <td>${escapeHtml(row.course_name)}</td>
                <td>${escapeHtml(row.title)}</td>
                <td>${escapeHtml(row.weight_percentage)}%</td>
                <td>${escapeHtml(row.due_date)}</td>
            </tr>
        `).join('');

        const upcomingRows = upcoming.map(row => `
            <tr>
                <td>${escapeHtml(row.course_name)}</td>
                <td>${escapeHtml(row.title)}</td>
                <td>${escapeHtml(row.due_date)}</td>
                <td>${escapeHtml(row.days_remaining)}</td>
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
                <nav><a href="/study-progress">Study Progress</a></nav>

                <h2>Assessment Priority</h2>
                <p>Priority score = assessment weight ÷ (days remaining + 1).</p>
                <table>
                    <thead>
                        <tr>
                            <th scope="col">Course</th>
                            <th scope="col">Assessment</th>
                            <th scope="col">Due date</th>
                            <th scope="col">Days remaining</th>
                            <th scope="col">Priority score</th>
                        </tr>
                    </thead>
                    <tbody>${priorityRows || '<tr><td colspan="5">No upcoming assessments with unfinished tasks.</td></tr>'}</tbody>
                </table>

                <h2>Upcoming Assessments</h2>
                ${upcoming.length ? `
                    <table>
                        <thead>
                            <tr>
                                <th scope="col">Course</th>
                                <th scope="col">Assessment</th>
                                <th scope="col">Due date</th>
                                <th scope="col">Days remaining</th>
                            </tr>
                        </thead>
                        <tbody>${upcomingRows}</tbody>
                    </table>
                ` : '<p>No assessments are due between today and seven days from now.</p>'}

                <h2>Overdue Incomplete Tasks</h2>
                ${overdue.length ? `
                    <table>
                        <thead>
                            <tr>
                                <th scope="col">Course</th>
                                <th scope="col">Assessment</th>
                                <th scope="col">Task</th>
                                <th scope="col">Days overdue</th>
                            </tr>
                        </thead>
                        <tbody>${overdueRows}</tbody>
                    </table>
                ` : '<p>No overdue incomplete tasks.</p>'}

                <h2>Student Assessment Overview</h2>
                <p>${assessments.length} assessments</p>
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
                    <tbody>${assessmentRows}</tbody>
                </table>
            </body>
            </html>
        `);
    } catch (error) {
        console.error('Could not load assessment views:', error.message);
        res.status(500).send('Could not load assessments. Check the server terminal.');
    }
});

app.get('/study-progress', async (req, res) => {
    try {
        const { rows: courses } = await pool.query(`
            SELECT student_id, course_name, session_count, total_study_minutes
            FROM StudyTimePerCourse
            ORDER BY total_study_minutes DESC, course_id
        `);

        const { rows: completion } = await pool.query(`
            SELECT title, total_tasks, completed_tasks,
                   completion_percentage, task_status
            FROM TaskCompletionPerAssessment
            ORDER BY title, assessment_id
        `);

        const completionRows = completion.map(row => `
            <tr>
                <td>${escapeHtml(row.title)}</td>
                <td>${escapeHtml(row.total_tasks)}</td>
                <td>${escapeHtml(row.completed_tasks)}</td>
                <td>${row.completion_percentage == null
                    ? 'N/A'
                    : `${escapeHtml(row.completion_percentage)}%`}</td>
                <td>${escapeHtml(row.task_status)}</td>
            </tr>
        `).join('');

        const courseRows = courses.map(course => `
            <tr>
                <td>${escapeHtml(course.student_id)}</td>
                <td>${escapeHtml(course.course_name)}</td>
                <td>${escapeHtml(course.session_count)}</td>
                <td>${escapeHtml(course.total_study_minutes)}</td>
            </tr>
        `).join('');

        res.send(`
            <!doctype html>
            <html lang="en">
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <title>Study Progress | Academic Study Planner</title>
            </head>
            <body>
                <nav aria-label="Main navigation">
                    <a href="/">Assessments</a>
                </nav>
                <h1>Study Progress</h1>
                <h2>Study Time per Course</h2>
                <table>
                    <thead>
                        <tr>
                            <th scope="col">Student ID</th>
                            <th scope="col">Course</th>
                            <th scope="col">Sessions</th>
                            <th scope="col">Study minutes</th>
                        </tr>
                    </thead>
                    <tbody>${courseRows || '<tr><td colspan="4">No courses found.</td></tr>'}</tbody>
                </table>

                <h2>Task Completion per Assessment</h2>
                <table>
                    <thead>
                        <tr>
                            <th scope="col">Assessment</th>
                            <th scope="col">Total tasks</th>
                            <th scope="col">Completed</th>
                            <th scope="col">Completion</th>
                            <th scope="col">Status</th>
                        </tr>
                    </thead>
                    <tbody>${completionRows || '<tr><td colspan="5">No assessments found.</td></tr>'}</tbody>
                </table>
            </body>
            </html>
        `);
    } catch (error) {
        console.error('Could not load study progress:', error.message);
        res.status(500).send('Could not load study progress. Check the server terminal.');
    }
});

app.listen(3000, '127.0.0.1', () => {
    console.log('Academic Study Planner is running at http://localhost:3000');
});




