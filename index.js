require('dotenv').config();

const express = require('express');
const { Pool } = require('pg');
const { scrypt, timingSafeEqual } = require('node:crypto');
const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);

const app = express();
const pool = new Pool();

if (!process.env.SESSION_SECRET) {
    throw new Error('SESSION_SECRET is missing from the .env file.');
}

const sessionStore = new PgSession({
    pool,
    createTableIfMissing: true
});

app.use(express.urlencoded({ extended: false }));

app.use(session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        maxAge: 1000 * 60 * 60 * 4
    }
}));

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

function verifyPassword(password, storedHash) {
    const parts = storedHash.split('$');

    if (parts.length !== 3 || parts[0] !== 'scrypt') {
        return false;
    }

    const salt = Buffer.from(parts[1], 'hex');
    const expectedKey = Buffer.from(parts[2], 'hex');

    if (salt.length !== 16 || expectedKey.length !== 64) {
        return false;
    }

    return new Promise((resolve, reject) => {
        scrypt(password, salt, 64, {
            N: 131072,
            r: 8,
            p: 1,
            maxmem: 256 * 1024 * 1024
        }, (error, derivedKey) => {
            if (error) {
                reject(error);
                return;
            }

            resolve(timingSafeEqual(derivedKey, expectedKey));
        });
    });
}

function requireLogin(req, res, next) {
    if (!req.session.account) {
        return res.redirect('/login');
    }

    next();
}

function requireAdmin(req, res, next) {
    if (!req.session.account || req.session.account.role !== 'admin') {
        return res.status(403).send('Access denied.');
    }

    next();
}

// --------------------------------------------------
// LOGIN
// --------------------------------------------------

app.get('/login', (req, res) => {
    if (req.session.account) {
        return res.redirect('/');
    }

    res.send(`
        <!doctype html>
        <html lang="en">
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Login | Academic Study Planner</title>
        </head>
        <body>
            <h1>Academic Study Planner</h1>
            <h2>Login</h2>

            <form action="/login" method="post">
                <label for="username">Username</label>
                <input id="username" name="username" required maxlength="50">

                <br><br>

                <label for="password">Password</label>
                <input id="password" name="password" type="password" required>

                <br><br>

                <button type="submit">Log in</button>
            </form>
        </body>
        </html>
    `);
});

app.post('/login', async (req, res) => {
    try {
        const username = typeof req.body.username === 'string'
            ? req.body.username.trim().toLowerCase()
            : '';

        const password = typeof req.body.password === 'string'
            ? req.body.password
            : '';

        const { rows } = await pool.query(
            `SELECT account_id, username, password_hash, role, student_id
             FROM planner_account
             WHERE username = $1`,
            [username]
        );

        if (!rows.length ||
            !(await verifyPassword(password, rows[0].password_hash))) {
            return res.status(401).send(
                'Invalid username or password. <a href="/login">Try again</a>.'
            );
        }

        req.session.regenerate(error => {
            if (error) {
                console.error('Session regeneration failed:', error.message);
                return res.status(500).send('Could not log in.');
            }

            req.session.account = {
                accountId: rows[0].account_id,
                username: rows[0].username,
                role: rows[0].role,
                studentId: rows[0].student_id
            };

            req.session.save(error => {
                if (error) {
                    console.error('Session save failed:', error.message);
                    return res.status(500).send('Could not log in.');
                }

                res.redirect('/');
            });
        });
    } catch (error) {
        console.error('Login failed:', error.message);
        res.status(500).send('Login failed. Check the server terminal.');
    }
});

// --------------------------------------------------
// LOGOUT
// --------------------------------------------------

app.post('/logout', (req, res, next) => {
    req.session.destroy(error => {
        if (error) {
            return next(error);
        }

        res.clearCookie('connect.sid');
        res.redirect('/login');
    });
});

// --------------------------------------------------
// HOMEPAGE
// --------------------------------------------------

app.get('/', requireLogin, async (req, res) => {
    try {
        const search = typeof req.query.q === 'string'
            ? req.query.q.trim().slice(0, 100)
            : '';

        const courseId = typeof req.query.course === 'string'
            ? req.query.course.trim().slice(0, 20)
            : '';

        const studentFilter = req.session.account.role === 'admin'
            ? null
            : req.session.account.studentId;

        const { rows: assessments } = await pool.query(`
            SELECT first_name, last_name, course_name, title,
                   weight_percentage, due_date::text AS due_date
            FROM StudentAssessmentOverview
            WHERE ($1::text IS NULL OR student_id = $1::text)
              AND ($2::text = '' OR strpos(
                  lower(concat_ws(' ', first_name, last_name, course_name, title)),
                  lower($2::text)
              ) > 0)
              AND ($3::text = '' OR course_id = $3::text)
            ORDER BY due_date, assessment_id
        `, [studentFilter, search, courseId]);

        const { rows: filterCourses } = await pool.query(`
            SELECT DISTINCT course_id, course_name
            FROM StudentAssessmentOverview
            WHERE ($1::text IS NULL OR student_id = $1::text)
            ORDER BY course_name, course_id
        `, [studentFilter]);

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
            WHERE ($1::text IS NULL OR student_id = $1::text)
            ORDER BY due_date, assessment_id
        `, [studentFilter]);

        const { rows: overdue } = await pool.query(`
            SELECT course_name, assessment_title, task_name, days_overdue
            FROM OverdueIncompleteTasks
            WHERE ($1::text IS NULL OR student_id = $1::text)
            ORDER BY days_overdue DESC, task_id
        `, [studentFilter]);

        const { rows: priorities } = await pool.query(`
            SELECT course_name, title, due_date::text AS due_date,
                   days_remaining, priority_score
            FROM AssessmentPriority
            WHERE ($1::text IS NULL OR student_id = $1::text)
            ORDER BY priority_score DESC, due_date, assessment_id
        `, [studentFilter]);

        const overdueRows = overdue.map(row => `
            <tr>
                <td>${escapeHtml(row.course_name)}</td>
                <td>${escapeHtml(row.assessment_title)}</td>
                <td>${escapeHtml(row.task_name)}</td>
                <td>${escapeHtml(row.days_overdue)}</td>
            </tr>
        `).join('');

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
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <title>Academic Study Planner</title>
            </head>
            <body>
                <h1>Academic Study Planner</h1>

                <p>
                    Logged in as:
                    ${escapeHtml(req.session.account.username)}
                    (${escapeHtml(req.session.account.role)})
                </p>

                <nav>
                    <a href="/study-progress">Study Progress</a> |
                    <a href="/assessment-reports">Assessment Reports</a> |
                    <form action="/logout" method="post" style="display:inline">
                        <button type="submit">Log out</button>
                    </form>
                </nav>

                <h2>Assessment Priority</h2>
                <p>Priority score = assessment weight ÷ (days remaining + 1).</p>

                <table>
                    <thead>
                        <tr>
                            <th>Course</th>
                            <th>Assessment</th>
                            <th>Due date</th>
                            <th>Days remaining</th>
                            <th>Priority score</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${priorityRows || '<tr><td colspan="5">No upcoming assessments with unfinished tasks.</td></tr>'}
                    </tbody>
                </table>

                <h2>Upcoming Assessments</h2>

                ${upcoming.length ? `
                    <table>
                        <thead>
                            <tr>
                                <th>Course</th>
                                <th>Assessment</th>
                                <th>Due date</th>
                                <th>Days remaining</th>
                            </tr>
                        </thead>
                        <tbody>${upcomingRows}</tbody>
                    </table>
                ` : '<p>No upcoming assessments found.</p>'}

                <h2>Overdue Incomplete Tasks</h2>

                ${overdue.length ? `
                    <table>
                        <thead>
                            <tr>
                                <th>Course</th>
                                <th>Assessment</th>
                                <th>Task</th>
                                <th>Days overdue</th>
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
                            <th>Student</th>
                            <th>Course</th>
                            <th>Assessment</th>
                            <th>Weight</th>
                            <th>Due date</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${assessmentRows || '<tr><td colspan="5">No assessments match your filters.</td></tr>'}
                    </tbody>
                </table>
            </body>
            </html>
        `);
    } catch (error) {
        console.error('Could not load assessment views:', error.message);
        res.status(500).send('Could not load assessments. Check the server terminal.');
    }
});

// --------------------------------------------------
// STUDY PROGRESS
// --------------------------------------------------

app.get('/study-progress', requireLogin, async (req, res) => {
    try {
        const studentFilter = req.session.account.role === 'admin'
            ? null
            : req.session.account.studentId;

        const { rows: courses } = await pool.query(`
            SELECT student_id, course_name, session_count, total_study_minutes
            FROM StudyTimePerCourse
            WHERE ($1::text IS NULL OR student_id = $1::text)
            ORDER BY total_study_minutes DESC, course_id
        `, [studentFilter]);

        const { rows: completion } = await pool.query(`
            SELECT t.title, t.total_tasks, t.completed_tasks,
                   t.completion_percentage, t.task_status
            FROM TaskCompletionPerAssessment t
            JOIN Course c ON c.course_id = t.course_id
            WHERE ($1::text IS NULL OR c.student_id = $1::text)
            ORDER BY t.title, t.assessment_id
        `, [studentFilter]);

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

        const chartData = JSON.stringify(courses.map(course => ({
            label: course.course_name + ' (' + course.student_id + ')',
            minutes: Number(course.total_study_minutes)
        }))).replace(/</g, '\\u003c');

        res.send(`
            <!doctype html>
            <html lang="en">
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <title>Study Progress | Academic Study Planner</title>
            </head>
            <body>
                <nav>
                    <a href="/">Assessments</a> |
                    <a href="/assessment-reports">Assessment Reports</a> |
                    <form action="/logout" method="post" style="display:inline">
                        <button type="submit">Log out</button>
                    </form>
                </nav>

                <h1>Study Progress</h1>
                <h2>Study Minutes by Course</h2>

                ${courses.length ? `
                    <div style="max-width:760px">
                        <canvas id="study-minutes-chart"></canvas>
                    </div>

                    <script src="/assets/chart.js"></script>
                    <script>
                        const studyCourses = ${chartData};

                        new Chart(document.getElementById('study-minutes-chart'), {
                            type: 'bar',
                            data: {
                                labels: studyCourses.map(course => course.label),
                                datasets: [{
                                    label: 'Study minutes',
                                    data: studyCourses.map(course => course.minutes)
                                }]
                            },
                            options: {
                                indexAxis: 'y',
                                scales: {
                                    x: { beginAtZero: true }
                                }
                            }
                        });
                    </script>
                ` : '<p>No course study data to chart.</p>'}

                <h2>Study Time per Course</h2>

                <table>
                    <thead>
                        <tr>
                            <th>Student ID</th>
                            <th>Course</th>
                            <th>Sessions</th>
                            <th>Study minutes</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${courseRows || '<tr><td colspan="4">No courses found.</td></tr>'}
                    </tbody>
                </table>

                <h2>Task Completion per Assessment</h2>

                <table>
                    <thead>
                        <tr>
                            <th>Assessment</th>
                            <th>Total tasks</th>
                            <th>Completed</th>
                            <th>Completion</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${completionRows || '<tr><td colspan="5">No assessments found.</td></tr>'}
                    </tbody>
                </table>
            </body>
            </html>
        `);
    } catch (error) {
        console.error('Could not load study progress:', error.message);
        res.status(500).send('Could not load study progress. Check the server terminal.');
    }
});

// --------------------------------------------------
// ASSESSMENT REPORTS
// --------------------------------------------------

app.get('/assessment-reports', requireLogin, async (req, res) => {
    const studentFilter = req.session.account.role === 'admin'
        ? null
        : req.session.account.studentId;

    const reports = [
        {
            title: 'Assessments Exceeding Every Course Average',
            headers: ['Student ID', 'Course', 'Assessment', 'Weight (%)'],
            sql: `
                SELECT student_id, course_name, title, weight_percentage
                FROM AssessmentsExceedingCourseAverages
                WHERE ($1::text IS NULL OR student_id = $1::text)
                ORDER BY student_id, course_name, assessment_id
            `
        },
        {
            title: 'Assessments Above Their Own Course Average',
            headers: ['Course ID', 'Assessment', 'Weight (%)', 'Due date'],
            sql: `
                SELECT v.course_id, v.title, v.weight_percentage, v.due_date::text
                FROM AssessmentsAboveCourseAverage v
                JOIN Course c ON c.course_id = v.course_id
                WHERE ($1::text IS NULL OR c.student_id = $1::text)
                ORDER BY v.course_id, v.assessment_id
            `
        },
        {
            title: 'Assessment and Study Session Coverage',
            headers: ['Assessment', 'Session ID', 'Session date', 'Minutes', 'Productivity'],
            sql: `
                SELECT v.title, v.session_id, v.session_date::text,
                       v.duration_min, v.productivity
                FROM AssessmentStudySessionCoverage v
                WHERE ($1::text IS NULL OR EXISTS (
                    SELECT 1
                    FROM Assessment a
                    JOIN Course c ON c.course_id = a.course_id
                    WHERE a.assessment_id = v.assessment_id
                      AND c.student_id = $1::text
                ))
                ORDER BY v.assessment_id NULLS LAST, v.session_id NULLS LAST
            `
        },
        {
            title: 'Assessments With Tasks or Study Sessions',
            headers: ['Course ID', 'Assessment', 'Weight (%)', 'Due date'],
            sql: `
                SELECT v.course_id, v.title, v.weight_percentage, v.due_date::text
                FROM AssessmentsWithActivity v
                JOIN Course c ON c.course_id = v.course_id
                WHERE ($1::text IS NULL OR c.student_id = $1::text)
                ORDER BY v.course_id, v.assessment_id
            `
        }
    ];

    try {
        const sections = await Promise.all(reports.map(async report => {
            const { rows } = await pool.query({
                text: report.sql,
                values: [studentFilter],
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
                    <tbody>
                        ${body || `<tr><td colspan="${report.headers.length}">No results.</td></tr>`}
                    </tbody>
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
                <nav>
                    <a href="/">Assessments</a> |
                    <a href="/study-progress">Study Progress</a> |
                    <form action="/logout" method="post" style="display:inline">
                        <button type="submit">Log out</button>
                    </form>
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

// --------------------------------------------------
// CHART.JS
// --------------------------------------------------

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

// --------------------------------------------------
// SERVER
// --------------------------------------------------
// Assessment CRUD API
// Manage Assessments frontend
const createManageAssessmentsPage = require('./manage-assessments');

app.get('/manage-assessments', requireLogin, (req, res) => {
    res.type('html').send(createManageAssessmentsPage());
});

app.get('/assets/manage-assessments.js', requireLogin, (req, res) => {
    res.sendFile(
        require('node:path').join(
            __dirname,
            'public',
            'manage-assessments.js'
        )
    );
});


const createAssessmentExportsRouter = require('./assessment-exports');
app.use('/api/assessments/export', createAssessmentExportsRouter(pool));

const createAssessmentRouter = require('./assessment-crud');
app.use('/api/assessments', createAssessmentRouter(pool));

const createHolidayRouter = require('./holiday-api');

function requireHolidayLogin(req, res, next) {
    if (!req.session || !req.session.account) {
        return res.status(401).json({
            error: 'Please log in first.'
        });
    }

    next();
}

app.use('/api/holidays', requireHolidayLogin, (req, res, next) => {
    if (req.method === 'POST' && req.path === '/sync') {
        if (req.session.account.role !== 'admin') {
            return res.status(403).json({
                error: 'Only administrators can synchronize holidays.'
            });
        }
    }

    next();
}, createHolidayRouter(pool));
// --------------------------------------------------
// Public Holidays page and browser JavaScript
// --------------------------------------------------
const createHolidaysPage = require('./holidays-page');

app.get('/holidays', requireLogin, (req, res) => {
    res.type('html').send(createHolidaysPage());
});

app.get('/assets/holidays.js', requireLogin, (req, res) => {
    res.sendFile(
        require('node:path').join(__dirname, 'public', 'holidays.js')
    );
});

// Allow the frontend to check whether the user is an admin.
app.get('/api/holidays/admin-status', (req, res) => {
    if (!req.session || !req.session.account) {
        return res.status(401).json({
            error: 'Please log in first.'
        });
    }

    res.json({
        isAdmin: req.session.account.role === 'admin'
    });
});

app.listen(3000, '127.0.0.1', () => {
    console.log('Academic Study Planner is running at http://localhost:3000');
});