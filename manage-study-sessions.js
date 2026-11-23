function createManageStudySessionsPage() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Manage Study Sessions | Academic Study Planner</title>
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

        /* Buttons with hover elevation */
        .btn {
            font-family: inherit;
            font-size: 0.875rem;
            font-weight: 600;
            padding: 9px 16px;
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
            padding: 7px 14px;
        }

        .btn-outline:hover {
            background-color: var(--teal-soft);
            transform: translateY(-2px);
        }

        .btn-secondary {
            background-color: #FFFFFF;
            color: var(--text-main);
            border: 1.5px solid var(--border-input);
        }

        .btn-secondary:hover {
            background-color: var(--bg-cream);
            border-color: var(--text-muted);
            transform: translateY(-2px);
        }

        /* Workspace Container */
        .workspace {
            max-width: 1200px;
            margin: 28px auto 0;
            padding: 0 24px;
        }

        .page-header {
            margin-bottom: 24px;
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

        /* 2-Column Split Organizer */
        .split-grid {
            display: grid;
            grid-template-columns: 360px 1fr;
            gap: 22px;
            align-items: start;
        }

        .card {
            min-width: 0;
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
            gap: 10px;
            margin-bottom: 18px;
        }

        .card-title {
            font-family: 'Playfair Display', Georgia, serif;
            color: var(--navy);
            font-size: 1.3rem;
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

        /* Form Styling */
        .form-group {
            margin-bottom: 15px;
        }

        label {
            display: block;
            font-size: 0.875rem;
            font-weight: 600;
            color: var(--text-main);
            margin-bottom: 6px;
        }

        input,
        select {
            width: 100%;
            padding: 10px 12px;
            font-family: inherit;
            font-size: 0.9rem;
            color: var(--text-main);
            background-color: var(--bg-cream);
            border: 1.5px solid var(--border-input);
            border-radius: 8px;
            transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
        }

        input:focus,
        select:focus {
            outline: none;
            background-color: #FFFFFF;
            border-color: var(--teal);
            box-shadow: 0 0 0 3px rgba(95, 150, 150, 0.2);
        }

        .form-actions {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 20px;
        }

        #message {
            margin-top: 12px;
            font-size: 0.85rem;
            color: var(--teal-hover);
            font-weight: 600;
        }

        #message.danger {
            color: #991B1B;
        }

        /* Database Table */
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
            padding: 12px;
            border-bottom: 1px solid #F1ECE4;
            vertical-align: middle;
        }

        tbody tr:last-child td {
            border-bottom: none;
        }

        tbody tr:hover {
            background-color: var(--bg-cream);
        }

        tbody td:nth-child(2) {
            font-weight: 500;
            color: var(--text-main);
        }

        tbody td:nth-child(3) {
            color: var(--text-muted);
            font-variant-numeric: tabular-nums;
            white-space: nowrap;
        }

        tbody td:last-child {
            white-space: nowrap;
        }

        /* Pill Badges */
        .course-pill {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 6px;
            font-size: 0.78rem;
            font-weight: 600;
            white-space: nowrap;
        }

        .duration-pill {
            display: inline-block;
            padding: 3px 9px;
            border-radius: 6px;
            font-size: 0.78rem;
            font-weight: 600;
            background-color: var(--teal-soft);
            color: var(--teal-hover);
            font-variant-numeric: tabular-nums;
        }

        .productivity-pill {
            display: inline-block;
            padding: 3px 9px;
            border-radius: 6px;
            font-size: 0.78rem;
            font-weight: 600;
            background-color: #FEF3C7;
            color: #92400E;
            font-variant-numeric: tabular-nums;
        }

        .cell-muted {
            color: var(--text-muted);
        }

        /* Table Action Buttons (Edit & Delete) */
        tbody td:last-child button {
            font-family: inherit;
            font-size: 0.8rem;
            font-weight: 600;
            padding: 5px 11px;
            border-radius: 6px;
            cursor: pointer;
            margin-right: 6px;
            transition: transform 0.16s ease, background-color 0.18s ease, border-color 0.18s ease;
        }

        tbody td:last-child button:first-of-type {
            background-color: #FFFFFF;
            color: var(--teal-hover);
            border: 1.5px solid var(--teal);
        }

        tbody td:last-child button:first-of-type:hover {
            background-color: var(--teal-soft);
            transform: translateY(-1.5px);
        }

        tbody td:last-child button:last-of-type {
            background-color: #FFF8F8;
            color: #991B1B;
            border: 1.5px solid #E5B4B4;
            margin-right: 0;
        }

        tbody td:last-child button:last-of-type:hover {
            background-color: #FEE2E2;
            border-color: #DC2626;
            transform: translateY(-1.5px);
        }

        @media (max-width: 920px) {
            .split-grid {
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
                <a href="/assessment-reports" class="nav-link">Reports</a>
                <a href="/manage-assessments" class="nav-link">Manage Assessments</a>
                <a href="/manage-study-sessions" class="nav-link active">Study Sessions</a>
                <a href="/holidays" class="nav-link">Holidays</a>
            </nav>

            <form action="/logout" method="post" style="display:inline">
                <button type="submit" class="btn btn-outline">Log out</button>
            </form>
        </div>
    </header>

    <main class="workspace">
        <div class="page-header">
            <h1>Manage Study Sessions</h1>
            <p class="page-subtitle">Add, edit, and delete study sessions for your assessments.</p>
        </div>

        <div class="split-grid">
            <section class="card">
                <div class="card-header">
                    <h2 id="form-heading" class="card-title">Add Study Session</h2>
                </div>

                <form id="session-form">
                    <input type="hidden" id="session-id">

                    <div class="form-group">
                        <label for="assessment-id">Assessment</label>
                        <select id="assessment-id" required></select>
                    </div>

                    <div class="form-group">
                        <label for="session-date">Session date</label>
                        <input id="session-date" type="date" required>
                    </div>

                    <div class="form-group">
                        <label for="duration-min">Duration (minutes)</label>
                        <input id="duration-min" type="number"
                               min="1" max="1440" step="1" required>
                    </div>

                    <div class="form-group">
                        <label for="productivity">Productivity (1–5, optional)</label>
                        <input id="productivity" type="number"
                               min="1" max="5" step="1">
                    </div>

                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">Save Study Session</button>
                        <button type="button" id="cancel-edit" class="btn btn-secondary">Cancel Edit</button>
                    </div>
                </form>

                <p id="message" role="status" aria-live="polite"></p>
            </section>

            <section class="card">
                <div class="card-header">
                    <h2 class="card-title">My Study Sessions</h2>
                    <span id="session-count" class="count-badge">0 sessions</span>
                </div>

                <div class="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Course</th>
                                <th>Assessment</th>
                                <th>Date</th>
                                <th>Duration (min)</th>
                                <th>Productivity</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="session-rows"></tbody>
                    </table>
                </div>
            </section>
        </div>
    </main>

    <script>
        // Matching 8-color Notion-inspired course badge palette
        const COURSE_PALETTE = [
            { bg: '#E0F0F0', text: '#2C5E5E' }, // Soft Teal
            { bg: '#E4EFE7', text: '#2D5A3C' }, // Sage Green
            { bg: '#EDE7F6', text: '#4A376B' }, // Muted Lavender
            { bg: '#F7E5DF', text: '#7D3B2B' }, // Soft Terracotta
            { bg: '#F7EEDB', text: '#7C5318' }, // Warm Sand
            { bg: '#E3ECF5', text: '#24486E' }, // Dusty Blue
            { bg: '#ECF0DF', text: '#475724' }, // Soft Olive
            { bg: '#EFE9E0', text: '#0A2647' }  // Warm Oat
        ];

        function getCourseColor(courseName) {
            const name = String(courseName || '').trim();
            let hash = 0;
            for (let i = 0; i < name.length; i++) {
                hash = name.charCodeAt(i) + ((hash << 5) - hash);
            }
            return COURSE_PALETTE[Math.abs(hash) % COURSE_PALETTE.length];
        }

        function styleSessionRows() {
            const tbody = document.getElementById('session-rows');
            const countBadge = document.getElementById('session-count');
            if (!tbody) return;

            const rows = Array.from(tbody.querySelectorAll('tr'));
            const dataRows = rows.filter(r => r.children.length >= 5);

            if (countBadge) {
                countBadge.textContent = dataRows.length + (dataRows.length === 1 ? ' session' : ' sessions');
            }

            dataRows.forEach(row => {
                const courseCell = row.children[0];
                const durationCell = row.children[3];
                const productivityCell = row.children[4];

                if (courseCell && !courseCell.querySelector('.course-pill')) {
                    const text = courseCell.textContent.trim();
                    if (text) {
                        const color = getCourseColor(text);
                        const pill = document.createElement('span');
                        pill.className = 'course-pill';
                        pill.style.backgroundColor = color.bg;
                        pill.style.color = color.text;
                        pill.textContent = text;
                        courseCell.textContent = '';
                        courseCell.appendChild(pill);
                    }
                }

                if (durationCell && !durationCell.querySelector('.duration-pill')) {
                    const text = durationCell.textContent.trim();
                    if (text) {
                        const pill = document.createElement('span');
                        pill.className = 'duration-pill';
                        pill.textContent = text;
                        durationCell.textContent = '';
                        durationCell.appendChild(pill);
                    }
                }

                if (productivityCell && !productivityCell.querySelector('.productivity-pill, .cell-muted')) {
                    const text = productivityCell.textContent.trim();
                    if (text && text !== '-') {
                        const pill = document.createElement('span');
                        pill.className = 'productivity-pill';
                        pill.textContent = text;
                        productivityCell.textContent = '';
                        productivityCell.appendChild(pill);
                    } else if (text === '-') {
                        const span = document.createElement('span');
                        span.className = 'cell-muted';
                        span.textContent = '-';
                        productivityCell.textContent = '';
                        productivityCell.appendChild(span);
                    }
                }
            });
        }

        const tbodyEl = document.getElementById('session-rows');
        if (tbodyEl) {
            new MutationObserver(styleSessionRows).observe(tbodyEl, { childList: true });
        }
    </script>
    <script src="/assets/manage-study-sessions.js"></script>
</body>
</html>`;
}

module.exports = createManageStudySessionsPage;