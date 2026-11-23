function createHolidaysPage() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Public Holidays | Academic Study Planner</title>
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

        [hidden] {
            display: none !important;
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

        .btn-primary:disabled {
            opacity: 0.65;
            cursor: not-allowed;
            transform: none;
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

        /* Main Workspace */
        .workspace {
            max-width: 1200px;
            margin: 28px auto 0;
            padding: 0 24px;
        }

        .page-header-row {
            display: flex;
            flex-wrap: wrap;
            align-items: flex-end;
            justify-content: space-between;
            gap: 16px;
            margin-bottom: 20px;
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

        /* Notion Info & Status Callout */
        .callout-bar {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            background-color: var(--bg-cream);
            border: 1px solid var(--border-subtle);
            border-left: 3.5px solid var(--teal);
            border-radius: 10px;
            padding: 12px 16px;
            margin-bottom: 22px;
            font-size: 0.875rem;
            color: var(--text-muted);
        }

        #status {
            font-weight: 600;
            color: var(--teal-hover);
        }

        /* Database Card */
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

        tbody td:first-child {
            color: var(--text-muted);
            font-variant-numeric: tabular-nums;
            white-space: nowrap;
        }

        tbody td:nth-child(2) {
            font-weight: 500;
            color: var(--text-main);
        }

        tbody td:nth-child(3) {
            color: var(--text-muted);
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

        .tag-teal {
            background-color: var(--teal-soft);
            color: var(--teal-hover);
        }

        .tag-year {
            background-color: #EFE9E0;
            color: var(--navy);
            font-variant-numeric: tabular-nums;
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
                <a href="/manage-study-sessions" class="nav-link">Study Sessions</a>
                <a href="/holidays" class="nav-link active">Holidays</a>
            </nav>

            <form action="/logout" method="post" style="display:inline">
                <button type="submit" class="btn btn-outline">Log out</button>
            </form>
        </div>
    </header>

    <main class="workspace">
        <div class="page-header-row">
            <div class="page-header">
                <h1>Canadian Public Holidays</h1>
                <p class="page-subtitle">Statutory and regional holidays synced to help plan around term breaks.</p>
            </div>

            <div id="adminControls" hidden>
                <button id="syncButton" type="button" class="btn btn-primary">
                    Sync Holidays from API
                </button>
            </div>
        </div>

        <div class="callout-bar">
            <span><strong>Source:</strong> Holidays are retrieved from the Nager.Date external API and stored in PostgreSQL.</span>
            <span id="status" role="status">Loading holidays...</span>
        </div>

        <section class="card">
            <div class="card-header">
                <h2 class="card-title">Public Holiday Schedule</h2>
                <span id="holiday-count" class="count-badge">0 holidays</span>
            </div>

            <div class="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Holiday</th>
                            <th>Local Name</th>
                            <th>Country</th>
                            <th>Year</th>
                        </tr>
                    </thead>
                    <tbody id="holidayRows"></tbody>
                </table>
            </div>
        </section>
    </main>

    <script>
        function styleHolidayRows() {
            const tbody = document.getElementById('holidayRows');
            const countBadge = document.getElementById('holiday-count');
            if (!tbody) return;

            const rows = Array.from(tbody.querySelectorAll('tr'));
            const dataRows = rows.filter(r => r.children.length >= 5);

            if (countBadge) {
                countBadge.textContent = dataRows.length + (dataRows.length === 1 ? ' holiday' : ' holidays');
            }

            dataRows.forEach(row => {
                const countryCell = row.children[3];
                const yearCell = row.children[4];

                if (countryCell && !countryCell.querySelector('.tag')) {
                    const text = countryCell.textContent.trim();
                    if (text) {
                        const pill = document.createElement('span');
                        pill.className = 'tag tag-teal';
                        pill.textContent = text;
                        countryCell.textContent = '';
                        countryCell.appendChild(pill);
                    }
                }

                if (yearCell && !yearCell.querySelector('.tag')) {
                    const text = yearCell.textContent.trim();
                    if (text) {
                        const pill = document.createElement('span');
                        pill.className = 'tag tag-year';
                        pill.textContent = text;
                        yearCell.textContent = '';
                        yearCell.appendChild(pill);
                    }
                }
            });
        }

        const holidayTbody = document.getElementById('holidayRows');
        if (holidayTbody) {
            new MutationObserver(styleHolidayRows).observe(holidayTbody, { childList: true });
        }
    </script>
    <script src="/assets/holidays.js"></script>
</body>
</html>`;
}

module.exports = createHolidaysPage;