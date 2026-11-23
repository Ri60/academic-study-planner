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

    // Guests may only access explicitly permitted public pages.
    if (req.session.account.role === 'guest') {
        const allowedPaths = [
            '/guest',
            '/holidays',
            '/assets/holidays.js'
        ];

        if (!allowedPaths.includes(req.path)) {
            return res.status(403).send(
                'Guest access is read-only. ' +
                '<a href="/guest">Return to Guest Page</a>.'
            );
        }
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
        return res.redirect(
            req.session.account.role === 'guest' ? '/guest' : '/'
        );
    }

    res.send(/* html */ `
        <!doctype html>
        <html lang="en">
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Login | Academic Study Planner</title>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet">
            <style>
                :root {
                    --bg-beige: #F4ECE4;
                    --card-bg: #FFFFFF;
                    --navy: #0A2647;
                    --teal: #5F9696;
                    --teal-hover: #4C7F7F;
                    --teal-tint: rgba(95, 150, 150, 0.12);
                    --text-main: #1E293B;
                    --text-muted: #64748B;
                    --border-color: #CBD5E1;
                }

                * {
                    box-sizing: border-box;
                    margin: 0;
                    padding: 0;
                }

                body {
                    font-family: 'Inter', system-ui, -apple-system, sans-serif;
                    background-color: var(--bg-beige);
                    color: var(--text-main);
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 24px;
                }

                .login-wrapper {
                    width: 100%;
                    max-width: 420px;
                }

                .login-card {
                    background-color: var(--card-bg);
                    border-radius: 16px;
                    padding: 40px 36px 32px;
                    box-shadow: 0 12px 32px rgba(10, 38, 71, 0.08);
                    border: 1px solid rgba(10, 38, 71, 0.06);
                }

                h1 {
                    font-family: 'Playfair Display', Georgia, serif;
                    color: var(--navy);
                    font-size: 2rem;
                    font-weight: 700;
                    line-height: 1.2;
                    text-align: center;
                    margin-bottom: 12px;
                }

                h2 {
                    font-size: 1.15rem;
                    font-weight: 600;
                    color: var(--text-main);
                    text-align: center;
                    margin-bottom: 28px;
                }

                .form-group {
                    margin-bottom: 18px;
                }

                label {
                    display: block;
                    font-size: 0.9rem;
                    font-weight: 500;
                    color: var(--text-main);
                    margin-bottom: 6px;
                }

                input {
                    width: 100%;
                    padding: 11px 14px;
                    font-family: inherit;
                    font-size: 0.95rem;
                    color: var(--text-main);
                    background-color: #FAF8F5;
                    border: 1.5px solid var(--border-color);
                    border-radius: 8px;
                    transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
                }

                input:focus {
                    outline: none;
                    background-color: #FFFFFF;
                    border-color: var(--teal);
                    box-shadow: 0 0 0 3px rgba(95, 150, 150, 0.22);
                }

                .btn {
                    width: 100%;
                    padding: 12px 16px;
                    font-family: inherit;
                    font-size: 0.95rem;
                    font-weight: 600;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: transform 0.18s ease, background-color 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
                }

                .btn-primary {
                    background-color: var(--teal, #5F9696);
                    color: #FFFFFF;
                    border: none;
                    margin-top: 8px;
                    box-shadow: 0 3px 10px rgba(95, 150, 150, 0.25);
                }

                .btn-primary:hover {
                    background-color: var(--teal-hover, #4C7F7F);
                    transform: translateY(-2px);
                    box-shadow: 0 7px 18px rgba(95, 150, 150, 0.35);
                }

                .btn-primary:active {
                    transform: translateY(0);
                    box-shadow: 0 2px 6px rgba(95, 150, 150, 0.25);
                }

                .divider {
                    display: flex;
                    align-items: center;
                    text-align: center;
                    color: var(--text-muted);
                    font-size: 0.85rem;
                    margin: 22px 0 18px;
                }

                .divider::before,
                .divider::after {
                    content: '';
                    flex: 1;
                    border-bottom: 1px solid #E2E8F0;
                }

                .divider span {
                    padding: 0 12px;
                }

                .btn-secondary {
                    background-color: #FFFFFF;
                    color: var(--teal-hover, #4C7F7F);
                    border: 1.5px solid var(--teal, #5F9696);
                }

                .btn-secondary:hover {
                    background-color: var(--teal-tint);
                    transform: translateY(-2px);
                    box-shadow: 0 5px 14px rgba(95, 150, 150, 0.16);
                }

                .btn-secondary:active {
                    transform: translateY(0);
                }

                .guest-note {
                    margin-top: 14px;
                    text-align: center;
                    font-size: 0.85rem;
                    line-height: 1.45;
                    color: var(--text-muted);
                }
            </style>
        </head>
        <body>
            <main class="login-wrapper">
                <div class="login-card">
                    <h1>Academic Study Planner</h1>
                    <h2>Login</h2>

                    <form action="/login" method="post">
                        <div class="form-group">
                            <label for="username">Username</label>
                            <input id="username" name="username" required maxlength="50" autocomplete="username">
                        </div>

                        <div class="form-group">
                            <label for="password">Password</label>
                            <input id="password" name="password" type="password" required autocomplete="current-password">
                        </div>

                        <button type="submit" class="btn btn-primary">Log in</button>
                    </form>

                    <div class="divider"><span>or</span></div>

                    <form action="/guest-login" method="post">
                        <button type="submit" class="btn btn-secondary">Continue as Guest</button>
                    </form>

                    <p class="guest-note">Guest mode provides read-only access to Canadian public holidays.</p>
                </div>
            </main>
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
// GUEST ACCESS
// --------------------------------------------------

app.get('/guest', requireLogin, (req, res) => {
    if (req.session.account.role !== 'guest') {
        return res.redirect('/');
    }

    res.type('html').send(/* html */ `
        <!doctype html>
        <html lang="en">
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Guest Access | Academic Study Planner</title>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet">
            <style>
                :root {
                    --bg-beige: #F4ECE4;
                    --bg-cream: #FAF8F5;
                    --card-bg: #FFFFFF;
                    --navy: #0A2647;
                    --teal: #5F9696;
                    --teal-hover: #4C7F7F;
                    --teal-soft: rgba(95, 150, 150, 0.14);
                    --text-main: #1E293B;
                    --text-muted: #64748B;
                    --border-subtle: #EAE3DA;
                }

                * {
                    box-sizing: border-box;
                    margin: 0;
                    padding: 0;
                }

                body {
                    font-family: 'Inter', system-ui, -apple-system, sans-serif;
                    background-color: var(--bg-beige);
                    color: var(--text-main);
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 24px;
                    line-height: 1.5;
                }

                .guest-wrapper {
                    width: 100%;
                    max-width: 450px;
                }

                .guest-card {
                    background-color: var(--card-bg);
                    border-radius: 16px;
                    padding: 38px 36px 32px;
                    box-shadow: 0 12px 32px rgba(10, 38, 71, 0.08);
                    border: 1px solid var(--border-subtle);
                    text-align: center;
                }

                .role-badge {
                    display: inline-block;
                    background-color: var(--teal-soft);
                    color: var(--teal-hover);
                    font-size: 0.78rem;
                    font-weight: 600;
                    letter-spacing: 0.03em;
                    text-transform: uppercase;
                    padding: 4px 12px;
                    border-radius: 999px;
                    margin-bottom: 14px;
                }

                h1 {
                    font-family: 'Playfair Display', Georgia, serif;
                    color: var(--navy);
                    font-size: 1.95rem;
                    font-weight: 700;
                    line-height: 1.2;
                    margin-bottom: 6px;
                }

                h2 {
                    font-size: 1.1rem;
                    font-weight: 600;
                    color: var(--text-muted);
                    margin-bottom: 22px;
                }

                .callout {
                    background-color: var(--bg-cream);
                    border: 1px solid var(--border-subtle);
                    border-left: 3.5px solid var(--teal);
                    border-radius: 10px;
                    padding: 13px 16px;
                    font-size: 0.88rem;
                    color: var(--text-main);
                    text-align: left;
                    margin-bottom: 24px;
                }

                .callout strong {
                    color: var(--navy);
                }

                .btn {
                    width: 100%;
                    padding: 12px 16px;
                    font-family: inherit;
                    font-size: 0.95rem;
                    font-weight: 600;
                    border-radius: 8px;
                    cursor: pointer;
                    text-decoration: none;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    transition: transform 0.18s ease, background-color 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
                }

                .btn-primary {
                    background-color: var(--teal, #5F9696);
                    color: #FFFFFF;
                    border: none;
                    box-shadow: 0 3px 10px rgba(95, 150, 150, 0.25);
                }

                .btn-primary:hover {
                    background-color: var(--teal-hover, #4C7F7F);
                    transform: translateY(-2px);
                    box-shadow: 0 7px 18px rgba(95, 150, 150, 0.35);
                }

                .btn-primary:active {
                    transform: translateY(0);
                    box-shadow: 0 2px 6px rgba(95, 150, 150, 0.25);
                }

                .divider {
                    display: flex;
                    align-items: center;
                    text-align: center;
                    color: var(--text-muted);
                    font-size: 0.85rem;
                    margin: 18px 0;
                }

                .divider::before,
                .divider::after {
                    content: '';
                    flex: 1;
                    border-bottom: 1px solid #E2E8F0;
                }

                .divider span {
                    padding: 0 12px;
                }

                .btn-secondary {
                    background-color: #FFFFFF;
                    color: var(--teal-hover, #4C7F7F);
                    border: 1.5px solid var(--teal, #5F9696);
                }

                .btn-secondary:hover {
                    background-color: var(--teal-soft);
                    transform: translateY(-2px);
                    box-shadow: 0 5px 14px rgba(95, 150, 150, 0.16);
                }

                .btn-secondary:active {
                    transform: translateY(0);
                }
            </style>
        </head>
        <body>
            <main class="guest-wrapper">
                <div class="guest-card">
                    <span class="role-badge">Read-Only Session</span>
                    <h1>Academic Study Planner</h1>
                    <h2>Guest Mode</h2>

                    <div class="callout">
                        <strong>Guest access is read-only.</strong> You can browse synced Canadian public holidays without signing in to a student or admin account.
                    </div>

                    <a href="/holidays" class="btn btn-primary">View Canadian Public Holidays</a>

                    <div class="divider"><span>or</span></div>

                    <form action="/logout" method="post">
                        <button type="submit" class="btn btn-secondary">Leave Guest Mode</button>
                    </form>
                </div>
            </main>
        </body>
        </html>
    `);
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
                <td><span class="tag tag-course">${escapeHtml(row.course_name)}</span></td>
                <td>
                    <div class="cell-primary">${escapeHtml(row.task_name)}</div>
                    <div class="cell-sub">${escapeHtml(row.assessment_title)}</div>
                </td>
                <td class="num"><span class="tag tag-danger">${escapeHtml(row.days_overdue)}d late</span></td>
            </tr>
        `).join('');

        const priorityRows = priorities.map(row => `
            <tr>
                <td><span class="tag tag-course">${escapeHtml(row.course_name)}</span></td>
                <td class="cell-primary">${escapeHtml(row.title)}</td>
                <td class="cell-muted">${escapeHtml(row.due_date)}</td>
                <td class="num">${escapeHtml(row.days_remaining)}d</td>
                <td class="num"><span class="tag tag-teal">${escapeHtml(row.priority_score)}</span></td>
            </tr>
        `).join('');

        const assessmentRows = assessments.map(row => `
            <tr>
                <td class="cell-primary">${escapeHtml(`${row.first_name} ${row.last_name}`)}</td>
                <td><span class="tag tag-course">${escapeHtml(row.course_name)}</span></td>
                <td class="cell-primary">${escapeHtml(row.title)}</td>
                <td class="num">${escapeHtml(row.weight_percentage)}%</td>
                <td class="cell-muted">${escapeHtml(row.due_date)}</td>
            </tr>
        `).join('');

        const upcomingRows = upcoming.map(row => `
            <tr>
                <td><span class="tag tag-course">${escapeHtml(row.course_name)}</span></td>
                <td>
                    <div class="cell-primary">${escapeHtml(row.title)}</div>
                    <div class="cell-sub">Due ${escapeHtml(row.due_date)}</div>
                </td>
                <td class="num"><span class="tag tag-amber">${escapeHtml(row.days_remaining)}d left</span></td>
            </tr>
        `).join('');

        res.send(/* html */ `
            <!doctype html>
            <html lang="en">
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <title>Academic Study Planner</title>
                <link rel="preconnect" href="https://fonts.googleapis.com">
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet">
                <style>
                    :root {
                        --bg-beige: #F4ECE4;
                        --bg-cream: #FAF8F5;
                        --card-bg: #FFFFFF;
                        --navy: #0A2647;
                        --teal: #5F9696;
                        --teal-hover: #4C7F7F;
                        --teal-soft: rgba(95, 150, 150, 0.14);
                        --text-main: #1E293B;
                        --text-muted: #64748B;
                        --border-subtle: #EAE3DA;
                        --border-input: #CBD5E1;
                    }

                    * {
                        box-sizing: border-box;
                        margin: 0;
                        padding: 0;
                    }

                    body {
                        font-family: 'Inter', system-ui, -apple-system, sans-serif;
                        background-color: var(--bg-beige);
                        color: var(--text-main);
                        line-height: 1.5;
                        padding-bottom: 48px;
                    }

                    /* Sticky Notion Workspace Header */
                    .topbar {
                        background-color: var(--card-bg);
                        border-bottom: 1px solid var(--border-subtle);
                        position: sticky;
                        top: 0;
                        z-index: 20;
                    }

                    .topbar-inner {
                        max-width: 1200px;
                        margin: 0 auto;
                        padding: 14px 24px;
                        display: flex;
                        flex-wrap: wrap;
                        align-items: center;
                        justify-content: space-between;
                        gap: 14px;
                    }

                    .brand {
                        font-family: 'Playfair Display', Georgia, serif;
                        color: var(--navy);
                        font-size: 1.45rem;
                        font-weight: 700;
                        text-decoration: none;
                    }

                    .nav-links {
                        display: flex;
                        flex-wrap: wrap;
                        align-items: center;
                        gap: 6px;
                    }

                    .nav-link {
                        text-decoration: none;
                        color: var(--text-muted);
                        font-size: 0.875rem;
                        font-weight: 500;
                        padding: 6px 12px;
                        border-radius: 7px;
                        transition: background-color 0.15s ease, color 0.15s ease;
                    }

                    .nav-link:hover {
                        background-color: var(--bg-cream);
                        color: var(--navy);
                    }

                    .nav-link.active {
                        background-color: var(--teal-soft);
                        color: var(--teal-hover);
                        font-weight: 600;
                    }

                    .user-controls {
                        display: flex;
                        align-items: center;
                        gap: 12px;
                    }

                    .user-pill {
                        background-color: var(--bg-cream);
                        border: 1px solid var(--border-subtle);
                        padding: 5px 12px;
                        border-radius: 999px;
                        font-size: 0.82rem;
                        color: var(--text-main);
                    }

                    .user-role {
                        color: var(--teal-hover);
                        font-weight: 600;
                        text-transform: capitalize;
                    }

                    /* Buttons with subtle hover lift */
                    .btn {
                        font-family: inherit;
                        font-size: 0.875rem;
                        font-weight: 600;
                        padding: 8px 15px;
                        border-radius: 8px;
                        cursor: pointer;
                        text-decoration: none;
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        transition: transform 0.18s ease, background-color 0.2s ease, box-shadow 0.2s ease;
                    }

                    .btn-primary {
                        background-color: var(--teal, #5F9696);
                        color: #FFFFFF;
                        border: none;
                        box-shadow: 0 2px 8px rgba(95, 150, 150, 0.25);
                    }

                    .btn-primary:hover {
                        background-color: var(--teal-hover, #4C7F7F);
                        transform: translateY(-2px);
                        box-shadow: 0 5px 14px rgba(95, 150, 150, 0.35);
                    }

                    .btn-outline {
                        background-color: #FFFFFF;
                        color: var(--teal-hover, #4C7F7F);
                        border: 1.5px solid var(--teal, #5F9696);
                        padding: 6px 13px;
                    }

                    .btn-outline:hover {
                        background-color: var(--teal-soft);
                        transform: translateY(-2px);
                    }

                    .btn-ghost {
                        color: var(--text-muted);
                        font-size: 0.85rem;
                        font-weight: 500;
                        padding: 8px 10px;
                    }

                    .btn-ghost:hover {
                        color: var(--navy);
                        text-decoration: underline;
                    }

                    /* Main Workspace Container */
                    .workspace {
                        max-width: 1200px;
                        margin: 28px auto 0;
                        padding: 0 24px;
                    }

                    .page-header {
                        margin-bottom: 22px;
                    }

                    .page-header h1 {
                        font-family: 'Playfair Display', Georgia, serif;
                        color: var(--navy);
                        font-size: 2rem;
                        font-weight: 700;
                        margin-bottom: 4px;
                    }

                    .page-subtitle {
                        color: var(--text-muted);
                        font-size: 0.92rem;
                    }

                    /* Notion Summary KPI Strip */
                    .kpi-grid {
                        display: grid;
                        grid-template-columns: repeat(4, 1fr);
                        gap: 16px;
                        margin-bottom: 22px;
                    }

                    .kpi-card {
                        background-color: var(--card-bg);
                        border: 1px solid var(--border-subtle);
                        border-radius: 12px;
                        padding: 16px 20px;
                        box-shadow: 0 4px 14px rgba(10, 38, 71, 0.04);
                    }

                    .kpi-label {
                        font-size: 0.78rem;
                        font-weight: 600;
                        text-transform: uppercase;
                        letter-spacing: 0.04em;
                        color: var(--text-muted);
                        margin-bottom: 6px;
                    }

                    .kpi-value {
                        font-family: 'Playfair Display', Georgia, serif;
                        font-size: 1.75rem;
                        font-weight: 700;
                        color: var(--navy);
                    }

                    .kpi-value.accent-teal { color: var(--teal-hover); }
                    .kpi-value.accent-warn { color: #B45309; }

                    /* 2-Column Organizer Grid */
                    .organizer-grid {
                        display: grid;
                        grid-template-columns: 1.35fr 1fr;
                        gap: 20px;
                        margin-bottom: 22px;
                        align-items: start;
                    }

                    .side-stack {
                        display: flex;
                        flex-direction: column;
                        gap: 20px;
                    }

                    /* Notion Database Cards */
                    .card {
                        background-color: var(--card-bg);
                        border: 1px solid var(--border-subtle);
                        border-radius: 14px;
                        padding: 22px 24px;
                        box-shadow: 0 6px 20px rgba(10, 38, 71, 0.045);
                    }

                    .card-header {
                        display: flex;
                        flex-wrap: wrap;
                        align-items: center;
                        justify-content: space-between;
                        gap: 10px;
                        margin-bottom: 14px;
                    }

                    .card-title {
                        font-family: 'Playfair Display', Georgia, serif;
                        color: var(--navy);
                        font-size: 1.25rem;
                        font-weight: 700;
                    }

                    .count-badge {
                        background-color: var(--bg-cream);
                        border: 1px solid var(--border-subtle);
                        color: var(--text-muted);
                        font-size: 0.78rem;
                        font-weight: 600;
                        padding: 3px 10px;
                        border-radius: 999px;
                    }

                    /* Notion Formula Callout */
                    .callout {
                        background-color: var(--bg-cream);
                        border-left: 3.5px solid var(--teal);
                        border-radius: 8px;
                        padding: 10px 14px;
                        font-size: 0.85rem;
                        color: var(--text-muted);
                        margin-bottom: 16px;
                    }

                    /* Filter Toolbar */
                    .filter-bar {
                        display: flex;
                        flex-wrap: wrap;
                        align-items: center;
                        gap: 10px;
                        background-color: var(--bg-cream);
                        border: 1px solid var(--border-subtle);
                        padding: 12px 14px;
                        border-radius: 10px;
                        margin-bottom: 16px;
                    }

                    .filter-bar input,
                    .filter-bar select {
                        font-family: inherit;
                        font-size: 0.88rem;
                        color: var(--text-main);
                        background-color: #FFFFFF;
                        border: 1.5px solid var(--border-input);
                        border-radius: 8px;
                        padding: 8px 12px;
                        transition: border-color 0.2s ease, box-shadow 0.2s ease;
                    }

                    .filter-bar input {
                        flex: 1;
                        min-width: 210px;
                    }

                    .filter-bar select {
                        min-width: 180px;
                    }

                    .filter-bar input:focus,
                    .filter-bar select:focus {
                        outline: none;
                        border-color: var(--teal);
                        box-shadow: 0 0 0 3px rgba(95, 150, 150, 0.2);
                    }

                    /* Notion-Style Database Tables */
                    .table-wrap {
                        overflow-x: auto;
                    }

                    table {
                        width: 100%;
                        border-collapse: collapse;
                        text-align: left;
                        font-size: 0.9rem;
                    }

                    th {
                        font-size: 0.75rem;
                        font-weight: 600;
                        text-transform: uppercase;
                        letter-spacing: 0.04em;
                        color: var(--text-muted);
                        padding: 10px 12px;
                        border-bottom: 1.5px solid var(--border-subtle);
                        white-space: nowrap;
                    }

                    td {
                        padding: 11px 12px;
                        border-bottom: 1px solid #F1ECE4;
                        vertical-align: middle;
                    }

                    tbody tr:last-child td {
                        border-bottom: none;
                    }

                    tbody tr:hover {
                        background-color: var(--bg-cream);
                    }

                    .num {
                        text-align: right;
                        font-variant-numeric: tabular-nums;
                        white-space: nowrap;
                    }

                    .cell-primary {
                        font-weight: 500;
                        color: var(--text-main);
                    }

                    .cell-sub {
                        font-size: 0.8rem;
                        color: var(--text-muted);
                    }

                    .cell-muted {
                        color: var(--text-muted);
                        font-variant-numeric: tabular-nums;
                        white-space: nowrap;
                    }

                    /* Notion Property Pill Tags */
                    .tag {
                        display: inline-block;
                        padding: 3px 9px;
                        border-radius: 6px;
                        font-size: 0.78rem;
                        font-weight: 600;
                        white-space: nowrap;
                    }

                    .tag-course {
                        background-color: #EFE9E0;
                        color: var(--navy);
                    }

                    .tag-teal {
                        background-color: var(--teal-soft);
                        color: var(--teal-hover);
                    }

                    .tag-amber {
                        background-color: #FEF3C7;
                        color: #92400E;
                    }

                    .tag-danger {
                        background-color: #FEE2E2;
                        color: #991B1B;
                    }

                    .empty-state {
                        padding: 18px;
                        text-align: center;
                        color: var(--text-muted);
                        background-color: var(--bg-cream);
                        border-radius: 8px;
                        font-size: 0.88rem;
                    }

                    @media (max-width: 920px) {
                        .kpi-grid {
                            grid-template-columns: repeat(2, 1fr);
                        }
                        .organizer-grid {
                            grid-template-columns: 1fr;
                        }
                    }
                </style>
            </head>
            <body>
                <header class="topbar">
                    <div class="topbar-inner">
                        <a href="/" class="brand">Academic Study Planner</a>

                        <nav class="nav-links">
                            <a href="/" class="nav-link active">Overview</a>
                            <a href="/study-progress" class="nav-link">Study Progress</a>
                            <a href="/assessment-reports" class="nav-link">Reports</a>
                            <a href="/manage-assessments" class="nav-link">Manage Assessments</a>
                            <a href="/manage-study-sessions" class="nav-link">Study Sessions</a>
                            <a href="/holidays" class="nav-link">Holidays</a>
                        </nav>

                        <div class="user-controls">
                            <span class="user-pill">
                                ${escapeHtml(req.session.account.username)} ·
                                <span class="user-role">${escapeHtml(req.session.account.role)}</span>
                            </span>
                            <form action="/logout" method="post" style="display:inline">
                                <button type="submit" class="btn btn-outline">Log out</button>
                            </form>
                        </div>
                    </div>
                </header>

                <main class="workspace">
                    <div class="page-header">
                        <h1>Academic Overview</h1>
                        <p class="page-subtitle">Track priorities, upcoming deadlines, overdue tasks, and course assessments in one place.</p>
                    </div>

                    <section class="kpi-grid">
                        <div class="kpi-card">
                            <div class="kpi-label">Priority Queue</div>
                            <div class="kpi-value accent-teal">${priorities.length}</div>
                        </div>
                        <div class="kpi-card">
                            <div class="kpi-label">Upcoming Due</div>
                            <div class="kpi-value">${upcoming.length}</div>
                        </div>
                        <div class="kpi-card">
                            <div class="kpi-label">Overdue Tasks</div>
                            <div class="kpi-value ${overdue.length ? 'accent-warn' : ''}">${overdue.length}</div>
                        </div>
                        <div class="kpi-card">
                            <div class="kpi-label">Total Assessments</div>
                            <div id="kpi-total-assessments" class="kpi-value">${assessments.length}</div>
                        </div>
                    </section>

                    <div class="organizer-grid">
                        <section class="card">
                            <div class="card-header">
                                <h2 class="card-title">Assessment Priority</h2>
                                <span class="count-badge">${priorities.length} active</span>
                            </div>

                            <div class="callout">
                                <strong>Formula:</strong> Priority score = assessment weight ÷ (days remaining + 1)
                            </div>

                            <div class="table-wrap">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Course</th>
                                            <th>Assessment</th>
                                            <th>Due date</th>
                                            <th class="num">Remaining</th>
                                            <th class="num">Priority</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${priorityRows || '<tr><td colspan="5" class="cell-muted">No upcoming assessments with unfinished tasks.</td></tr>'}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        <div class="side-stack">
                            <section class="card">
                                <div class="card-header">
                                    <h2 class="card-title">Overdue Incomplete Tasks</h2>
                                    <span class="count-badge">${overdue.length} overdue</span>
                                </div>

                                ${overdue.length ? `
                                    <div class="table-wrap">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Course</th>
                                                    <th>Task &amp; Assessment</th>
                                                    <th class="num">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>${overdueRows}</tbody>
                                        </table>
                                    </div>
                                ` : '<p class="empty-state">No overdue incomplete tasks.</p>'}
                            </section>

                            <section class="card">
                                <div class="card-header">
                                    <h2 class="card-title">Upcoming Assessments</h2>
                                    <span class="count-badge">${upcoming.length} soon</span>
                                </div>

                                ${upcoming.length ? `
                                    <div class="table-wrap">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Course</th>
                                                    <th>Assessment</th>
                                                    <th class="num">Window</th>
                                                </tr>
                                            </thead>
                                            <tbody>${upcomingRows}</tbody>
                                        </table>
                                    </div>
                                ` : '<p class="empty-state">No upcoming assessments found.</p>'}
                            </section>
                        </div>
                    </div>

                    <section class="card">
                        <div class="card-header">
                            <h2 class="card-title">Student Assessment Overview</h2>
                            <span id="assessment-overview-count" class="count-badge">${assessments.length} assessments</span>
                        </div>

                        <form action="/" method="get" class="filter-bar">
                            <input id="q" name="q" type="search" maxlength="100"
                                value="${escapeHtml(search)}"
                                placeholder="Search by student, course, or assessment...">

                            <select id="course" name="course" aria-label="Course">
                                <option value="">All courses</option>
                                ${courseOptions}
                            </select>

                            <button type="submit" class="btn btn-primary">Apply filters</button>
                            <a href="/" class="btn-ghost">Clear filters</a>
                        </form>

                        <div class="table-wrap">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Student</th>
                                        <th>Course</th>
                                        <th>Assessment</th>
                                        <th class="num">Weight</th>
                                        <th>Due date</th>
                                    </tr>
                                </thead>
                                <tbody id="assessment-overview-tbody">
                                    ${assessmentRows || '<tr><td colspan="5" class="cell-muted">No assessments match your filters.</td></tr>'}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </main>

                <script>
                    (function () {
                        const filterForm = document.querySelector('.filter-bar');
                        if (!filterForm) return;

                        const searchInput = document.getElementById('q');
                        const courseSelect = document.getElementById('course');
                        const clearLink = filterForm.querySelector('a[href="/"]');

                        async function applyOverviewFilters(url) {
                            try {
                                const response = await fetch(url, {
                                    headers: { 'X-Requested-With': 'fetch' }
                                });
                                if (!response.ok) {
                                    window.location.href = url;
                                    return;
                                }

                                const html = await response.text();
                                const doc = new DOMParser().parseFromString(html, 'text/html');

                                const newTbody = doc.getElementById('assessment-overview-tbody');
                                const currentTbody = document.getElementById('assessment-overview-tbody');
                                if (newTbody && currentTbody) {
                                    currentTbody.innerHTML = newTbody.innerHTML;
                                }

                                const newCount = doc.getElementById('assessment-overview-count');
                                const currentCount = document.getElementById('assessment-overview-count');
                                if (newCount && currentCount) {
                                    currentCount.textContent = newCount.textContent;
                                }

                                const newKpi = doc.getElementById('kpi-total-assessments');
                                const currentKpi = document.getElementById('kpi-total-assessments');
                                if (newKpi && currentKpi) {
                                    currentKpi.textContent = newKpi.textContent;
                                }

                                window.history.replaceState(null, '', url);
                            } catch (_) {
                                window.location.href = url;
                            }
                        }

                        filterForm.addEventListener('submit', (event) => {
                            event.preventDefault();
                            const params = new URLSearchParams();
                            const q = searchInput ? searchInput.value.trim() : '';
                            const course = courseSelect ? courseSelect.value : '';

                            if (q) params.set('q', q);
                            if (course) params.set('course', course);

                            const queryString = params.toString();
                            const url = queryString ? '/?' + queryString : '/';
                            applyOverviewFilters(url);
                        });

                        if (clearLink) {
                            clearLink.addEventListener('click', (event) => {
                                event.preventDefault();
                                if (searchInput) searchInput.value = '';
                                if (courseSelect) courseSelect.value = '';
                                applyOverviewFilters('/');
                            });
                        }
                    })();
                </script>
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

        const totalMinutes = courses.reduce(
            (sum, c) => sum + Number(c.total_study_minutes || 0),
            0
        );
        const totalSessions = courses.reduce(
            (sum, c) => sum + Number(c.session_count || 0),
            0
        );
        const completedCount = completion.filter(
            row => String(row.task_status).toLowerCase() === 'complete'
        ).length;

        const completionRows = completion.map(row => {
            const pct = row.completion_percentage == null
                ? null
                : Math.min(100, Math.max(0, Number(row.completion_percentage)));
            const isComplete = String(row.task_status).toLowerCase() === 'complete';

            return `
                <tr>
                    <td class="cell-primary">${escapeHtml(row.title)}</td>
                    <td class="num cell-muted">${escapeHtml(row.total_tasks)}</td>
                    <td class="num cell-muted">${escapeHtml(row.completed_tasks)}</td>
                    <td>
                        ${pct == null
                            ? '<span class="cell-muted">N/A</span>'
                            : `<div class="progress-cell">
                                   <div class="progress-track">
                                       <div class="progress-fill ${isComplete ? 'is-complete' : ''}" style="width: ${pct}%"></div>
                                   </div>
                                   <span class="progress-text">${escapeHtml(row.completion_percentage)}%</span>
                               </div>`
                        }
                    </td>
                    <td class="num">
                        <span class="tag ${isComplete ? 'tag-teal' : 'tag-amber'}">
                            ${escapeHtml(row.task_status)}
                        </span>
                    </td>
                </tr>
            `;
        }).join('');

        const courseRows = courses.map(course => `
            <tr>
                <td><span class="tag tag-id">${escapeHtml(course.student_id)}</span></td>
                <td><span class="tag tag-course">${escapeHtml(course.course_name)}</span></td>
                <td class="num">${escapeHtml(course.session_count)}</td>
                <td class="num"><span class="tag tag-teal">${escapeHtml(course.total_study_minutes)}</span></td>
            </tr>
        `).join('');

        const chartData = JSON.stringify(courses.map(course => ({
            label: course.course_name + ' (' + course.student_id + ')',
            minutes: Number(course.total_study_minutes)
        }))).replace(/</g, '\\u003c');

        const chartHeight = Math.max(240, courses.length * 48);

        res.send(/* html */ `
            <!doctype html>
            <html lang="en">
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <title>Study Progress | Academic Study Planner</title>
                <link rel="preconnect" href="https://fonts.googleapis.com">
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet">
                <style>
                    :root {
                        --bg-beige: #F4ECE4;
                        --bg-cream: #FAF8F5;
                        --card-bg: #FFFFFF;
                        --navy: #0A2647;
                        --teal: #5F9696;
                        --teal-hover: #4C7F7F;
                        --teal-soft: rgba(95, 150, 150, 0.14);
                        --text-main: #1E293B;
                        --text-muted: #64748B;
                        --border-subtle: #EAE3DA;
                    }

                    * {
                        box-sizing: border-box;
                        margin: 0;
                        padding: 0;
                    }

                    body {
                        font-family: 'Inter', system-ui, -apple-system, sans-serif;
                        background-color: var(--bg-beige);
                        color: var(--text-main);
                        line-height: 1.5;
                        padding-bottom: 48px;
                    }

                    /* Sticky Workspace Header */
                    .topbar {
                        background-color: var(--card-bg);
                        border-bottom: 1px solid var(--border-subtle);
                        position: sticky;
                        top: 0;
                        z-index: 20;
                    }

                    .topbar-inner {
                        max-width: 1200px;
                        margin: 0 auto;
                        padding: 14px 24px;
                        display: flex;
                        flex-wrap: wrap;
                        align-items: center;
                        justify-content: space-between;
                        gap: 14px;
                    }

                    .brand {
                        font-family: 'Playfair Display', Georgia, serif;
                        color: var(--navy);
                        font-size: 1.45rem;
                        font-weight: 700;
                        text-decoration: none;
                    }

                    .nav-links {
                        display: flex;
                        flex-wrap: wrap;
                        align-items: center;
                        gap: 6px;
                    }

                    .nav-link {
                        text-decoration: none;
                        color: var(--text-muted);
                        font-size: 0.875rem;
                        font-weight: 500;
                        padding: 6px 12px;
                        border-radius: 7px;
                        transition: background-color 0.15s ease, color 0.15s ease;
                    }

                    .nav-link:hover {
                        background-color: var(--bg-cream);
                        color: var(--navy);
                    }

                    .nav-link.active {
                        background-color: var(--teal-soft);
                        color: var(--teal-hover);
                        font-weight: 600;
                    }

                    .user-controls {
                        display: flex;
                        align-items: center;
                        gap: 12px;
                    }

                    .user-pill {
                        background-color: var(--bg-cream);
                        border: 1px solid var(--border-subtle);
                        padding: 5px 12px;
                        border-radius: 999px;
                        font-size: 0.82rem;
                        color: var(--text-main);
                    }

                    .user-role {
                        color: var(--teal-hover);
                        font-weight: 600;
                        text-transform: capitalize;
                    }

                    .btn-outline {
                        font-family: inherit;
                        font-size: 0.875rem;
                        font-weight: 600;
                        background-color: #FFFFFF;
                        color: var(--teal-hover, #4C7F7F);
                        border: 1.5px solid var(--teal, #5F9696);
                        padding: 6px 13px;
                        border-radius: 8px;
                        cursor: pointer;
                        transition: transform 0.18s ease, background-color 0.2s ease;
                    }

                    .btn-outline:hover {
                        background-color: var(--teal-soft);
                        transform: translateY(-2px);
                    }

                    /* Main Workspace */
                    .workspace {
                        max-width: 1200px;
                        margin: 28px auto 0;
                        padding: 0 24px;
                    }

                    .page-header {
                        margin-bottom: 22px;
                    }

                    .page-header h1 {
                        font-family: 'Playfair Display', Georgia, serif;
                        color: var(--navy);
                        font-size: 2rem;
                        font-weight: 700;
                        margin-bottom: 4px;
                    }

                    .page-subtitle {
                        color: var(--text-muted);
                        font-size: 0.92rem;
                    }

                    /* KPI Summary Row */
                    .kpi-grid {
                        display: grid;
                        grid-template-columns: repeat(4, 1fr);
                        gap: 16px;
                        margin-bottom: 22px;
                    }

                    .kpi-card {
                        background-color: var(--card-bg);
                        border: 1px solid var(--border-subtle);
                        border-radius: 12px;
                        padding: 16px 20px;
                        box-shadow: 0 4px 14px rgba(10, 38, 71, 0.04);
                    }

                    .kpi-label {
                        font-size: 0.78rem;
                        font-weight: 600;
                        text-transform: uppercase;
                        letter-spacing: 0.04em;
                        color: var(--text-muted);
                        margin-bottom: 6px;
                    }

                    .kpi-value {
                        font-family: 'Playfair Display', Georgia, serif;
                        font-size: 1.75rem;
                        font-weight: 700;
                        color: var(--navy);
                    }

                    .kpi-value.accent-teal {
                        color: var(--teal-hover);
                    }

                    /* 2-Column Analytics Grid */
                    .analytics-grid {
                        display: grid;
                        grid-template-columns: 1.25fr 1fr;
                        gap: 20px;
                        margin-bottom: 22px;
                        align-items: start;
                    }

                    .card {
                        background-color: var(--card-bg);
                        border: 1px solid var(--border-subtle);
                        border-radius: 14px;
                        padding: 22px 24px;
                        box-shadow: 0 6px 20px rgba(10, 38, 71, 0.045);
                    }

                    .card-header {
                        display: flex;
                        flex-wrap: wrap;
                        align-items: center;
                        justify-content: space-between;
                        gap: 10px;
                        margin-bottom: 16px;
                    }

                    .card-title {
                        font-family: 'Playfair Display', Georgia, serif;
                        color: var(--navy);
                        font-size: 1.25rem;
                        font-weight: 700;
                    }

                    .count-badge {
                        background-color: var(--bg-cream);
                        border: 1px solid var(--border-subtle);
                        color: var(--text-muted);
                        font-size: 0.78rem;
                        font-weight: 600;
                        padding: 3px 10px;
                        border-radius: 999px;
                    }

                    .chart-box {
                        position: relative;
                        width: 100%;
                        height: ${chartHeight}px;
                    }

                    /* Database Tables */
                    .table-wrap {
                        overflow-x: auto;
                    }

                    table {
                        width: 100%;
                        border-collapse: collapse;
                        text-align: left;
                        font-size: 0.9rem;
                    }

                    th {
                        font-size: 0.75rem;
                        font-weight: 600;
                        text-transform: uppercase;
                        letter-spacing: 0.04em;
                        color: var(--text-muted);
                        padding: 10px 12px;
                        border-bottom: 1.5px solid var(--border-subtle);
                        white-space: nowrap;
                    }

                    td {
                        padding: 11px 12px;
                        border-bottom: 1px solid #F1ECE4;
                        vertical-align: middle;
                    }

                    tbody tr:last-child td {
                        border-bottom: none;
                    }

                    tbody tr:hover {
                        background-color: var(--bg-cream);
                    }

                    .num {
                        text-align: right;
                        font-variant-numeric: tabular-nums;
                        white-space: nowrap;
                    }

                    .cell-primary {
                        font-weight: 500;
                        color: var(--text-main);
                    }

                    .cell-muted {
                        color: var(--text-muted);
                        font-variant-numeric: tabular-nums;
                    }

                    /* Notion Property Pills & Progress Bars */
                    .tag {
                        display: inline-block;
                        padding: 3px 9px;
                        border-radius: 6px;
                        font-size: 0.78rem;
                        font-weight: 600;
                        white-space: nowrap;
                    }

                    .tag-id {
                        background-color: var(--bg-cream);
                        border: 1px solid var(--border-subtle);
                        color: var(--text-muted);
                    }

                    .tag-course {
                        background-color: #EFE9E0;
                        color: var(--navy);
                    }

                    .tag-teal {
                        background-color: var(--teal-soft);
                        color: var(--teal-hover);
                    }

                    .tag-amber {
                        background-color: #FEF3C7;
                        color: #92400E;
                    }

                    .progress-cell {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        min-width: 160px;
                    }

                    .progress-track {
                        flex: 1;
                        height: 8px;
                        background-color: #EAE3DA;
                        border-radius: 999px;
                        overflow: hidden;
                    }

                    .progress-fill {
                        height: 100%;
                        background-color: var(--teal);
                        border-radius: 999px;
                        transition: width 0.3s ease;
                    }

                    .progress-fill.is-complete {
                        background-color: #3D7A7A;
                    }

                    .progress-text {
                        font-size: 0.82rem;
                        font-weight: 600;
                        color: var(--text-muted);
                        font-variant-numeric: tabular-nums;
                        min-width: 54px;
                        text-align: right;
                    }

                    .empty-state {
                        padding: 18px;
                        text-align: center;
                        color: var(--text-muted);
                        background-color: var(--bg-cream);
                        border-radius: 8px;
                        font-size: 0.88rem;
                    }

                    @media (max-width: 920px) {
                        .kpi-grid {
                            grid-template-columns: repeat(2, 1fr);
                        }
                        .analytics-grid {
                            grid-template-columns: 1fr;
                        }
                    }
                </style>
            </head>
            <body>
                <header class="topbar">
                    <div class="topbar-inner">
                        <a href="/" class="brand">Academic Study Planner</a>

                        <nav class="nav-links">
                            <a href="/" class="nav-link">Overview</a>
                            <a href="/study-progress" class="nav-link active">Study Progress</a>
                            <a href="/assessment-reports" class="nav-link">Reports</a>
                            <a href="/manage-assessments" class="nav-link">Manage Assessments</a>
                            <a href="/manage-study-sessions" class="nav-link">Study Sessions</a>
                            <a href="/holidays" class="nav-link">Holidays</a>
                        </nav>

                        <div class="user-controls">
                            <span class="user-pill">
                                ${escapeHtml(req.session.account.username)} ·
                                <span class="user-role">${escapeHtml(req.session.account.role)}</span>
                            </span>
                            <form action="/logout" method="post" style="display:inline">
                                <button type="submit" class="btn-outline">Log out</button>
                            </form>
                        </div>
                    </div>
                </header>

                <main class="workspace">
                    <div class="page-header">
                        <h1>Study Progress</h1>
                        <p class="page-subtitle">Analyze study time across courses and track task completion for each assessment.</p>
                    </div>

                    <section class="kpi-grid">
                        <div class="kpi-card">
                            <div class="kpi-label">Total Study Time</div>
                            <div class="kpi-value accent-teal">${totalMinutes.toLocaleString()} min</div>
                        </div>
                        <div class="kpi-card">
                            <div class="kpi-label">Study Sessions</div>
                            <div class="kpi-value">${totalSessions}</div>
                        </div>
                        <div class="kpi-card">
                            <div class="kpi-label">Courses Tracked</div>
                            <div class="kpi-value">${courses.length}</div>
                        </div>
                        <div class="kpi-card">
                            <div class="kpi-label">Completed Assessments</div>
                            <div class="kpi-value">${completedCount} / ${completion.length}</div>
                        </div>
                    </section>

                    <div class="analytics-grid">
                        <section class="card">
                            <div class="card-header">
                                <h2 class="card-title">Study Minutes by Course</h2>
                                <span class="count-badge">${courses.length} courses</span>
                            </div>

                            ${courses.length ? `
                                <div class="chart-box">
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
                                                data: studyCourses.map(course => course.minutes),
                                                backgroundColor: '#5F9696',
                                                hoverBackgroundColor: '#4C7F7F',
                                                borderRadius: 6,
                                                barThickness: 24
                                            }]
                                        },
                                        options: {
                                            indexAxis: 'y',
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            plugins: {
                                                legend: { display: false },
                                                tooltip: {
                                                    backgroundColor: '#0A2647',
                                                    padding: 10,
                                                    cornerRadius: 8
                                                }
                                            },
                                            scales: {
                                                x: {
                                                    beginAtZero: true,
                                                    grid: { color: '#F1ECE4' },
                                                    ticks: {
                                                        color: '#64748B',
                                                        font: { family: 'Inter, sans-serif' }
                                                    }
                                                },
                                                y: {
                                                    grid: { display: false },
                                                    ticks: {
                                                        color: '#1E293B',
                                                        font: {
                                                            family: 'Inter, sans-serif',
                                                            weight: '500'
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    });
                                </script>
                            ` : '<p class="empty-state">No course study data to chart.</p>'}
                        </section>

                        <section class="card">
                            <div class="card-header">
                                <h2 class="card-title">Study Time per Course</h2>
                                <span class="count-badge">${totalSessions} sessions</span>
                            </div>

                            <div class="table-wrap">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Student ID</th>
                                            <th>Course</th>
                                            <th class="num">Sessions</th>
                                            <th class="num">Study minutes</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${courseRows || '<tr><td colspan="4" class="cell-muted">No courses found.</td></tr>'}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </div>

                    <section class="card">
                        <div class="card-header">
                            <h2 class="card-title">Task Completion per Assessment</h2>
                            <span class="count-badge">${completion.length} assessments</span>
                        </div>

                        <div class="table-wrap">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Assessment</th>
                                        <th class="num">Total Tasks</th>
                                        <th class="num">Completed Tasks</th>
                                        <th>Completion %</th>
                                        <th class="num">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${completionRows || '<tr><td colspan="5" class="cell-muted">No assessments found.</td></tr>'}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </main>
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
            id: 'exceeding-all',
            title: 'Assessments Exceeding Every Course Average',
            subtitle: 'Assessments weighted higher than the average across every course.',
            headers: ['Student ID', 'Course', 'Assessment', 'Weight (%)'],
            sql: `
                SELECT student_id, course_name, title, weight_percentage
                FROM AssessmentsExceedingCourseAverages
                WHERE ($1::text IS NULL OR student_id = $1::text)
                ORDER BY student_id, course_name, assessment_id
            `
        },
        {
            id: 'above-own',
            title: 'Assessments Above Their Own Course Average',
            subtitle: 'Assessments exceeding the mean weight within their own course.',
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
            id: 'session-coverage',
            title: 'Assessment and Study Session Coverage',
            subtitle: 'Logged study sessions, durations, and productivity scores per assessment.',
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
            id: 'with-activity',
            title: 'Assessments With Tasks or Study Sessions',
            subtitle: 'Assessments that currently have associated tasks or recorded study sessions.',
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

    const numericHeaders = new Set(['Weight (%)', 'Minutes', 'Productivity']);

    function formatReportCell(header, value) {
        if (value == null || value === '-') {
            return '<span class="cell-muted">-</span>';
        }

        const safe = escapeHtml(value);

        switch (header) {
            case 'Student ID':
            case 'Course ID':
            case 'Session ID':
                return `<span class="tag tag-id">${safe}</span>`;
            case 'Course':
                return `<span class="tag tag-course">${safe}</span>`;
            case 'Assessment':
                return `<span class="cell-primary">${safe}</span>`;
            case 'Weight (%)':
                return `<span class="tag tag-teal">${safe}%</span>`;
            case 'Minutes':
                return `<span class="tag tag-teal">${safe} min</span>`;
            case 'Productivity':
                return `<span class="tag tag-amber">${safe} / 5</span>`;
            case 'Due date':
            case 'Session date':
                return `<span class="cell-muted">${safe}</span>`;
            default:
                return safe;
        }
    }

    try {
        const reportResults = await Promise.all(reports.map(async report => {
            const { rows } = await pool.query({
                text: report.sql,
                values: [studentFilter],
                rowMode: 'array'
            });

            const headersHtml = report.headers.map(header => {
                const alignClass = numericHeaders.has(header) ? ' class="num"' : '';
                return `<th scope="col"${alignClass}>${escapeHtml(header)}</th>`;
            }).join('');

            const bodyHtml = rows.map(row => {
                const cells = row.map((value, idx) => {
                    const header = report.headers[idx];
                    const alignClass = numericHeaders.has(header) ? ' class="num"' : '';
                    return `<td${alignClass}>${formatReportCell(header, value)}</td>`;
                }).join('');

                return `<tr>${cells}</tr>`;
            }).join('');

            const cardHtml = `
                <section id="${escapeHtml(report.id)}" class="card">
                    <div class="card-header">
                        <div>
                            <h2 class="card-title">${escapeHtml(report.title)}</h2>
                            <p class="card-subtitle">${escapeHtml(report.subtitle)}</p>
                        </div>
                        <span class="count-badge">${rows.length} ${rows.length === 1 ? 'result' : 'results'}</span>
                    </div>

                    <div class="table-wrap">
                        <table>
                            <thead><tr>${headersHtml}</tr></thead>
                            <tbody>
                                ${bodyHtml || `<tr><td colspan="${report.headers.length}" class="cell-muted">No results.</td></tr>`}
                            </tbody>
                        </table>
                    </div>
                </section>
            `;

            return {
                count: rows.length,
                cardHtml
            };
        }));

        res.send(/* html */ `
            <!doctype html>
            <html lang="en">
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <title>Assessment Reports | Academic Study Planner</title>
                <link rel="preconnect" href="https://fonts.googleapis.com">
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet">
                <style>
                    :root {
                        --bg-beige: #F4ECE4;
                        --bg-cream: #FAF8F5;
                        --card-bg: #FFFFFF;
                        --navy: #0A2647;
                        --teal: #5F9696;
                        --teal-hover: #4C7F7F;
                        --teal-soft: rgba(95, 150, 150, 0.14);
                        --text-main: #1E293B;
                        --text-muted: #64748B;
                        --border-subtle: #EAE3DA;
                    }

                    * {
                        box-sizing: border-box;
                        margin: 0;
                        padding: 0;
                    }

                    html {
                        scroll-behavior: smooth;
                    }

                    body {
                        font-family: 'Inter', system-ui, -apple-system, sans-serif;
                        background-color: var(--bg-beige);
                        color: var(--text-main);
                        line-height: 1.5;
                        padding-bottom: 48px;
                    }

                    /* Sticky Workspace Header */
                    .topbar {
                        background-color: var(--card-bg);
                        border-bottom: 1px solid var(--border-subtle);
                        position: sticky;
                        top: 0;
                        z-index: 20;
                    }

                    .topbar-inner {
                        max-width: 1200px;
                        margin: 0 auto;
                        padding: 14px 24px;
                        display: flex;
                        flex-wrap: wrap;
                        align-items: center;
                        justify-content: space-between;
                        gap: 14px;
                    }

                    .brand {
                        font-family: 'Playfair Display', Georgia, serif;
                        color: var(--navy);
                        font-size: 1.45rem;
                        font-weight: 700;
                        text-decoration: none;
                    }

                    .nav-links {
                        display: flex;
                        flex-wrap: wrap;
                        align-items: center;
                        gap: 6px;
                    }

                    .nav-link {
                        text-decoration: none;
                        color: var(--text-muted);
                        font-size: 0.875rem;
                        font-weight: 500;
                        padding: 6px 12px;
                        border-radius: 7px;
                        transition: background-color 0.15s ease, color 0.15s ease;
                    }

                    .nav-link:hover {
                        background-color: var(--bg-cream);
                        color: var(--navy);
                    }

                    .nav-link.active {
                        background-color: var(--teal-soft);
                        color: var(--teal-hover);
                        font-weight: 600;
                    }

                    .user-controls {
                        display: flex;
                        align-items: center;
                        gap: 12px;
                    }

                    .user-pill {
                        background-color: var(--bg-cream);
                        border: 1px solid var(--border-subtle);
                        padding: 5px 12px;
                        border-radius: 999px;
                        font-size: 0.82rem;
                        color: var(--text-main);
                    }

                    .user-role {
                        color: var(--teal-hover);
                        font-weight: 600;
                        text-transform: capitalize;
                    }

                    .btn-outline {
                        font-family: inherit;
                        font-size: 0.875rem;
                        font-weight: 600;
                        background-color: #FFFFFF;
                        color: var(--teal-hover, #4C7F7F);
                        border: 1.5px solid var(--teal, #5F9696);
                        padding: 6px 13px;
                        border-radius: 8px;
                        cursor: pointer;
                        transition: transform 0.18s ease, background-color 0.2s ease;
                    }

                    .btn-outline:hover {
                        background-color: var(--teal-soft);
                        transform: translateY(-2px);
                    }

                    /* Main Workspace */
                    .workspace {
                        max-width: 1200px;
                        margin: 28px auto 0;
                        padding: 0 24px;
                    }

                    .page-header {
                        margin-bottom: 22px;
                    }

                    .page-header h1 {
                        font-family: 'Playfair Display', Georgia, serif;
                        color: var(--navy);
                        font-size: 2rem;
                        font-weight: 700;
                        margin-bottom: 4px;
                    }

                    .page-subtitle {
                        color: var(--text-muted);
                        font-size: 0.92rem;
                    }

                    /* KPI Summary Strip */
                    .kpi-grid {
                        display: grid;
                        grid-template-columns: repeat(4, 1fr);
                        gap: 16px;
                        margin-bottom: 22px;
                    }

                    .kpi-card {
                        display: block;
                        text-decoration: none;
                        background-color: var(--card-bg);
                        border: 1px solid var(--border-subtle);
                        border-radius: 12px;
                        padding: 16px 20px;
                        box-shadow: 0 4px 14px rgba(10, 38, 71, 0.04);
                        transition: transform 0.18s ease, border-color 0.2s ease, box-shadow 0.2s ease;
                    }

                    .kpi-card:hover {
                        transform: translateY(-2px);
                        border-color: var(--teal);
                        box-shadow: 0 8px 20px rgba(10, 38, 71, 0.07);
                    }

                    .kpi-label {
                        font-size: 0.78rem;
                        font-weight: 600;
                        text-transform: uppercase;
                        letter-spacing: 0.04em;
                        color: var(--text-muted);
                        margin-bottom: 6px;
                    }

                    .kpi-value {
                        font-family: 'Playfair Display', Georgia, serif;
                        font-size: 1.75rem;
                        font-weight: 700;
                        color: var(--navy);
                    }

                    .kpi-value.accent-teal {
                        color: var(--teal-hover);
                    }

                    /* Report Layout Grids */
                    .benchmark-grid {
                        display: grid;
                        grid-template-columns: repeat(2, 1fr);
                        gap: 20px;
                        margin-bottom: 22px;
                        align-items: start;
                    }

                    .reports-stack {
                        display: flex;
                        flex-direction: column;
                        gap: 22px;
                    }

                    .card {
                        min-width: 0;
                        background-color: var(--card-bg);
                        border: 1px solid var(--border-subtle);
                        border-radius: 14px;
                        padding: 22px 24px;
                        box-shadow: 0 6px 20px rgba(10, 38, 71, 0.045);
                        scroll-margin-top: 84px;
                    }

                    .card-header {
                        display: flex;
                        flex-wrap: wrap;
                        align-items: flex-start;
                        justify-content: space-between;
                        gap: 10px;
                        margin-bottom: 16px;
                    }

                    .card-title {
                        font-family: 'Playfair Display', Georgia, serif;
                        color: var(--navy);
                        font-size: 1.25rem;
                        font-weight: 700;
                    }

                    .card-subtitle {
                        font-size: 0.83rem;
                        color: var(--text-muted);
                        margin-top: 2px;
                    }

                    .count-badge {
                        background-color: var(--bg-cream);
                        border: 1px solid var(--border-subtle);
                        color: var(--text-muted);
                        font-size: 0.78rem;
                        font-weight: 600;
                        padding: 3px 10px;
                        border-radius: 999px;
                        white-space: nowrap;
                    }

                    /* Notion-Style Database Tables */
                    .table-wrap {
                        overflow-x: auto;
                    }

                    table {
                        width: 100%;
                        border-collapse: collapse;
                        text-align: left;
                        font-size: 0.9rem;
                    }

                    th {
                        font-size: 0.75rem;
                        font-weight: 600;
                        text-transform: uppercase;
                        letter-spacing: 0.04em;
                        color: var(--text-muted);
                        padding: 10px 12px;
                        border-bottom: 1.5px solid var(--border-subtle);
                        white-space: nowrap;
                    }

                    td {
                        padding: 11px 12px;
                        border-bottom: 1px solid #F1ECE4;
                        vertical-align: middle;
                    }

                    tbody tr:last-child td {
                        border-bottom: none;
                    }

                    tbody tr:hover {
                        background-color: var(--bg-cream);
                    }

                    .num {
                        text-align: right;
                        font-variant-numeric: tabular-nums;
                        white-space: nowrap;
                    }

                    .cell-primary {
                        font-weight: 500;
                        color: var(--text-main);
                    }

                    .cell-muted {
                        color: var(--text-muted);
                        font-variant-numeric: tabular-nums;
                        white-space: nowrap;
                    }

                    /* Notion Property Pills */
                    .tag {
                        display: inline-block;
                        padding: 3px 9px;
                        border-radius: 6px;
                        font-size: 0.78rem;
                        font-weight: 600;
                        white-space: nowrap;
                    }

                    .tag-id {
                        background-color: var(--bg-cream);
                        border: 1px solid var(--border-subtle);
                        color: var(--text-muted);
                    }

                    .tag-course {
                        background-color: #EFE9E0;
                        color: var(--navy);
                    }

                    .tag-teal {
                        background-color: var(--teal-soft);
                        color: var(--teal-hover);
                    }

                    .tag-amber {
                        background-color: #FEF3C7;
                        color: #92400E;
                    }

                    @media (max-width: 920px) {
                        .kpi-grid {
                            grid-template-columns: repeat(2, 1fr);
                        }
                        .benchmark-grid {
                            grid-template-columns: 1fr;
                        }
                    }
                </style>
            </head>
            <body>
                <header class="topbar">
                    <div class="topbar-inner">
                        <a href="/" class="brand">Academic Study Planner</a>

                        <nav class="nav-links">
                            <a href="/" class="nav-link">Overview</a>
                            <a href="/study-progress" class="nav-link">Study Progress</a>
                            <a href="/assessment-reports" class="nav-link active">Reports</a>
                            <a href="/manage-assessments" class="nav-link">Manage Assessments</a>
                            <a href="/manage-study-sessions" class="nav-link">Study Sessions</a>
                            <a href="/holidays" class="nav-link">Holidays</a>
                        </nav>

                        <div class="user-controls">
                            <span class="user-pill">
                                ${escapeHtml(req.session.account.username)} ·
                                <span class="user-role">${escapeHtml(req.session.account.role)}</span>
                            </span>
                            <form action="/logout" method="post" style="display:inline">
                                <button type="submit" class="btn-outline">Log out</button>
                            </form>
                        </div>
                    </div>
                </header>

                <main class="workspace">
                    <div class="page-header">
                        <h1>Assessment Reports</h1>
                        <p class="page-subtitle">Cross-course weight benchmarks, study session coverage, and active assessment breakdowns.</p>
                    </div>

                    <section class="kpi-grid">
                        <a href="#exceeding-all" class="kpi-card">
                            <div class="kpi-label">Exceeding All Avgs</div>
                            <div class="kpi-value accent-teal">${reportResults[0].count}</div>
                        </a>
                        <a href="#above-own" class="kpi-card">
                            <div class="kpi-label">Above Course Avg</div>
                            <div class="kpi-value">${reportResults[1].count}</div>
                        </a>
                        <a href="#session-coverage" class="kpi-card">
                            <div class="kpi-label">Session Coverage</div>
                            <div class="kpi-value">${reportResults[2].count}</div>
                        </a>
                        <a href="#with-activity" class="kpi-card">
                            <div class="kpi-label">With Activity</div>
                            <div class="kpi-value">${reportResults[3].count}</div>
                        </a>
                    </section>

                    <div class="benchmark-grid">
                        ${reportResults[0].cardHtml}
                        ${reportResults[1].cardHtml}
                    </div>

                    <div class="reports-stack">
                        ${reportResults[2].cardHtml}
                        ${reportResults[3].cardHtml}
                    </div>
                </main>
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

// Study Session CRUD API
// Manage Study Sessions frontend
const createManageStudySessionsPage = require('./manage-study-sessions');

app.get('/manage-study-sessions', requireLogin, (req, res) => {
    res.type('html').send(createManageStudySessionsPage());
});

app.get('/assets/manage-study-sessions.js', requireLogin, (req, res) => {
    res.sendFile(
        require('node:path').join(
            __dirname,
            'public',
            'manage-study-sessions.js'
        )
    );
});

const createStudySessionRouter = require('./study-session-crud');
app.use('/api/study-sessions', createStudySessionRouter(pool));

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
