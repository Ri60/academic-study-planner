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
        const search = typeof req.query.q === 'string'
            ? req.query.q.trim().slice(0, 100)
            : '';
        const courseId = typeof req.query.course === 'string'
            ? req.query.course.trim().slice(0, 20)
            : '';

        const { rows: assessments } = await pool.query(`
            SELECT first_name, last_name, course_name, title,
                   weight_percentage, due_date::text AS due_date
            FROM StudentAssessmentOverview
            WHERE ($1::text = '' OR strpos(
                lower(concat_ws(' ', first_name, last_name, course_name, title)),
                lower($1::text)
            ) > 0)
              AND ($2::text = '' OR course_id = $2::text)
            ORDER BY due_date, assessment_id
        `, [search, courseId]);

        const { rows: filterCourses } = await pool.query(`
            SELECT DISTINCT course_id, course_name
            FROM StudentAssessmentOverview
            ORDER BY course_name, course_id
        `);

        const courseOptions = filterCourses.map(course => `
            <option value="${escapeHtml(course.course_id)}"
                ${course.course_id === courseId ? 'selected' : ''}>
                ${escapeHtml(course.course_name)}
            </option>
        `).join('');

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
                <nav><a href="/study-progress">Study Progress</a> | <a href="/assessment-reports">Assessment Reports</a></nav>

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
                <form action="/" method="get">
                    <label for="q">Search assessments</label>
                    <input id="q" name="q" type="search" maxlength="100"
                        value="${escapeHtml(search)}"
                        placeholder="Student, course, or assessment">

                    <label for="course">Course</label>
                    <select id="course" name="course">
                        <option value="">All courses</option>
                        ${courseOptions}
                    </select>

                    <button type="submit">Apply filters</button>
                    <a href="/">Clear filters</a>
                </form>
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
                    <tbody>${assessmentRows || '<tr><td colspan="5">No assessments match your filters.</td></tr>'}</tbody>
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
                <h2>Study Minutes by Course</h2>
                ${courses.length ? `
                    <div style="max-width: 760px;">
                        <canvas id="study-minutes-chart" role="img"
                            aria-label="Study minutes by course. Exact values are in the table below.">
                        </canvas>
                    </div>
                    <script src="/assets/chart.js"></script>
                    <script>
                        const studyCourses = ${JSON.stringify(courses.map(course => ({
                            label: course.course_name + ' (' + course.student_id + ')',
                            minutes: Number(course.total_study_minutes)
                        }))).replace(/</g, '\\u003c')};

                        new Chart(document.getElementById('study-minutes-chart'), {
                            type: 'bar',
                            data: {
                                labels: studyCourses.map(course => course.label),
                                datasets: [{
                                    label: 'Study minutes',
                                    data: studyCourses.map(course => course.minutes),
                                    backgroundColor: '#2563eb'
                                }]
                            },
                            options: {
                                indexAxis: 'y',
                                scales: { x: { beginAtZero: true } }
                            }
                        });
                    </script>
                ` : '<p>No course study data to chart.</p>'}

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

app.get('/assessment-reports', async (req, res) => {
    const reports = [
        {
            title: 'Assessments Exceeding Every Course Average',
            headers: ['Student ID', 'Course', 'Assessment', 'Weight (%)'],
            sql: `SELECT student_id, course_name, title, weight_percentage
                  FROM AssessmentsExceedingCourseAverages
                  ORDER BY student_id, course_name, assessment_id`
        },
        {
            title: 'Assessments Above Their Own Course Average',
            headers: ['Course ID', 'Assessment', 'Weight (%)', 'Due date'],
            sql: `SELECT course_id, title, weight_percentage, due_date::text
                  FROM AssessmentsAboveCourseAverage
                  ORDER BY course_id, assessment_id`
        },
        {
            title: 'Assessment and Study Session Coverage',
            headers: ['Assessment', 'Session ID', 'Session date', 'Minutes', 'Productivity'],
            sql: `SELECT title, session_id, session_date::text, duration_min, productivity
                  FROM AssessmentStudySessionCoverage
                  ORDER BY assessment_id NULLS LAST, session_id NULLS LAST`
        },
        {
            title: 'Assessments With Tasks or Study Sessions',
            headers: ['Course ID', 'Assessment', 'Weight (%)', 'Due date'],
            sql: `SELECT course_id, title, weight_percentage, due_date::text
                  FROM AssessmentsWithActivity
                  ORDER BY course_id, assessment_id`
        }
    ];

    try {
        const sections = await Promise.all(reports.map(async report => {
            const { rows } = await pool.query({
                text: report.sql,
                rowMode: 'array'
            });

            const headers = report.headers.map(header =>
                `<th scope="col">${escapeHtml(header)}</th>`
            ).join('');

            const body = rows.map(row => {
                const cells = row.map(value =>
                    `<td>${escapeHtml(value ?? '-')}</td>`
                ).join('');
                return `<tr>${cells}</tr>`;
            }).join('');

            return `
                <h2>${escapeHtml(report.title)}</h2>
                <p>${rows.length} results</p>
                <table>
                    <thead><tr>${headers}</tr></thead>
                    <tbody>${body || `<tr><td colspan="${report.headers.length}">No results.</td></tr>`}</tbody>
                </table>
            `;
        }));

        res.send(`
            <!doctype html>
            <html lang="en">
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <title>Assessment Reports | Academic Study Planner</title>
            </head>
            <body>
                <nav aria-label="Main navigation">
                    <a href="/">Assessments</a> |
                    <a href="/study-progress">Study Progress</a>
                </nav>
                <h1>Assessment Reports</h1>
                ${sections.join('')}
            </body>
            </html>
        `);
    } catch (error) {
        console.error('Could not load assessment reports:', error.message);
        res.status(500).send('Could not load assessment reports. Check the server terminal.');
    }
});

const chartDist = require('node:path').dirname(require.resolve('chart.js'));
const chartBundle = ['chart.umd.min.js', 'chart.umd.js']
    .map(file => require('node:path').join(chartDist, file))
    .find(file => require('node:fs').existsSync(file));

if (!chartBundle) {
    throw new Error('Could not find the Chart.js browser bundle.');
}

app.get('/assets/chart.js', (req, res) => {
    res.sendFile(chartBundle);
});

app.listen(3000, '127.0.0.1', () => {
    console.log('Academic Study Planner is running at http://localhost:3000');
});







