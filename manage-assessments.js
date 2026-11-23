function createManageAssessmentsPage() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Manage Assessments | Academic Study Planner</title>
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

        .btn-primary:active {
            transform: translateY(0);
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
            box-shadow: 0 4px 12px rgba(95, 150, 150, 0.16);
        }

        .btn-outline:active {
            transform: translateY(0);
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

        .page-header-row {
            display: flex;
            flex-wrap: wrap;
            align-items: flex-end;
            justify-content: space-between;
            gap: 16px;
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

        .export-actions {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
        }

        /* 2-Column Split Organizer */
        .split-grid {
            display: grid;
            grid-template-columns: 335px 1fr;
            gap: 20px;
            align-items: start;
        }

        .card {
            min-width: 0;
            background-color: var(--card-bg);
            border: 1px solid var(--border-subtle);
            border-radius: 14px;
            padding: 22px;
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
            font-size: 0.86rem;
        }

        th {
            font-size: 0.73rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            color: var(--text-muted);
            padding: 10px 9px;
            border-bottom: 1.5px solid var(--border-subtle);
            white-space: nowrap;
        }

        td {
            padding: 11px 9px;
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
            font-weight: 500;
            color: var(--text-main);
        }

        tbody td:nth-child(4) {
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
            padding: 3px 9px;
            border-radius: 6px;
            font-size: 0.76rem;
            font-weight: 600;
            white-space: nowrap;
        }

        .weight-pill {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 6px;
            font-size: 0.76rem;
            font-weight: 600;
            background-color: var(--teal-soft);
            color: var(--teal-hover);
            font-variant-numeric: tabular-nums;
        }

        /* Table Action Buttons (Edit & Delete) */
        tbody td:last-child button {
            font-family: inherit;
            font-size: 0.78rem;
            font-weight: 600;
            padding: 5px 10px;
            border-radius: 6px;
            cursor: pointer;
            margin-right: 5px;
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

        /* Custom Notion Delete Confirmation Modal */
        .modal-backdrop {
            position: fixed;
            inset: 0;
            background-color: rgba(10, 38, 71, 0.35);
            backdrop-filter: blur(2px);
            display: none;
            align-items: center;
            justify-content: center;
            padding: 20px;
            z-index: 100;
        }

        .modal-backdrop.open {
            display: flex;
        }

        .modal-card {
            background-color: var(--card-bg);
            border: 1px solid var(--border-subtle);
            border-radius: 16px;
            max-width: 420px;
            width: 100%;
            padding: 26px 28px;
            box-shadow: 0 20px 44px rgba(10, 38, 71, 0.18);
            animation: modalPop 0.16s ease-out;
        }

        @keyframes modalPop {
            from {
                opacity: 0;
                transform: scale(0.96) translateY(4px);
            }
            to {
                opacity: 1;
                transform: scale(1) translateY(0);
            }
        }

        .modal-badge {
            display: inline-block;
            background-color: var(--teal-soft);
            color: var(--teal-hover);
            font-size: 0.74rem;
            font-weight: 600;
            letter-spacing: 0.03em;
            text-transform: uppercase;
            padding: 3px 10px;
            border-radius: 999px;
            margin-bottom: 10px;
        }

        .modal-title {
            font-family: 'Playfair Display', Georgia, serif;
            color: var(--navy);
            font-size: 1.38rem;
            font-weight: 700;
            margin-bottom: 12px;
        }

        .modal-callout {
            background-color: var(--bg-cream);
            border: 1px solid var(--border-subtle);
            border-left: 3.5px solid var(--teal);
            border-radius: 10px;
            padding: 12px 14px;
            font-size: 0.88rem;
            color: var(--text-main);
            margin-bottom: 22px;
        }

        .modal-callout strong {
            color: var(--navy);
        }

        .modal-actions {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
        }

        .modal-actions .btn {
            padding: 9px 18px;
        }

        @media (max-width: 960px) {
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
                <a href="/manage-assessments" class="nav-link active">Manage Assessments</a>
                <a href="/manage-study-sessions" class="nav-link">Study Sessions</a>
                <a href="/holidays" class="nav-link">Holidays</a>
            </nav>

            <form action="/logout" method="post" style="display:inline">
                <button type="submit" class="btn btn-outline">Log out</button>
            </form>
        </div>
    </header>

    <main class="workspace">
        <div class="page-header-row">
            <div class="page-header">
                <h1>Manage Assessments</h1>
                <p class="page-subtitle">Add, edit, and delete assessments for your courses.</p>
            </div>

            <div class="export-actions">
                <a href="/api/assessments/export/csv" class="btn btn-outline">Download CSV</a>
                <a href="/api/assessments/export/pdf" class="btn btn-outline">Download PDF</a>
            </div>
        </div>

        <div class="split-grid">
            <section class="card">
                <div class="card-header">
                    <h2 id="form-heading" class="card-title">Add Assessment</h2>
                </div>

                <form id="assessment-form">
                    <input type="hidden" id="assessment-id">

                    <div class="form-group">
                        <label for="title">Assessment title</label>
                        <input id="title" maxlength="50" required>
                    </div>

                    <div class="form-group">
                        <label for="course-id">Course</label>
                        <select id="course-id" required></select>
                    </div>

                    <div class="form-group">
                        <label for="weight">Weight (%)</label>
                        <input id="weight" type="number"
                               min="0.01" max="100" step="0.01" required>
                    </div>

                    <div class="form-group">
                        <label for="due-date">Due date</label>
                        <input id="due-date" type="date" required>
                    </div>

                    <div class="form-group">
                        <label for="prerequisite">Prerequisite assessment</label>
                        <select id="prerequisite">
                            <option value="">None</option>
                        </select>
                    </div>

                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">Save Assessment</button>
                        <button type="button" id="cancel-edit" class="btn btn-secondary">Cancel Edit</button>
                    </div>
                </form>

                <p id="message" role="status" aria-live="polite"></p>
            </section>

            <section class="card">
                <div class="card-header">
                    <h2 class="card-title">My Assessments</h2>
                    <span id="assessment-count" class="count-badge">0 assessments</span>
                </div>

                <div class="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Assessment</th>
                                <th>Course</th>
                                <th>Weight</th>
                                <th>Due Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="assessment-rows"></tbody>
                    </table>
                </div>
            </section>
        </div>
    </main>

    <!-- Custom Notion-Styled Delete Confirmation Modal -->
    <div id="delete-modal" class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="delete-modal-title">
        <div class="modal-card">
            <span class="modal-badge">Confirm Deletion</span>
            <h3 id="delete-modal-title" class="modal-title">Delete Assessment?</h3>
            <div class="modal-callout">
                Delete assessment <strong id="modal-assessment-name"></strong> for <strong id="modal-course-name"></strong>? This cannot be undone.
            </div>
            <div class="modal-actions">
                <button type="button" id="modal-cancel-btn" class="btn btn-outline">Cancel</button>
                <button type="button" id="modal-confirm-btn" class="btn btn-primary">Delete Assessment</button>
            </div>
        </div>
    </div>

    <script>
        // 8-color Notion-inspired course badge palette
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

        function styleAssessmentRows() {
            const tbody = document.getElementById('assessment-rows');
            const countBadge = document.getElementById('assessment-count');
            if (!tbody) return;

            const rows = Array.from(tbody.querySelectorAll('tr'));
            const dataRows = rows.filter(r => r.children.length >= 4);

            if (countBadge) {
                countBadge.textContent = dataRows.length + (dataRows.length === 1 ? ' assessment' : ' assessments');
            }

            dataRows.forEach(row => {
                const courseCell = row.children[1];
                const weightCell = row.children[2];

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

                if (weightCell && !weightCell.querySelector('.weight-pill')) {
                    const text = weightCell.textContent.trim();
                    if (text) {
                        const pill = document.createElement('span');
                        pill.className = 'weight-pill';
                        pill.textContent = text;
                        weightCell.textContent = '';
                        weightCell.appendChild(pill);
                    }
                }
            });
        }

        const tbodyEl = document.getElementById('assessment-rows');
        if (tbodyEl) {
            new MutationObserver(styleAssessmentRows).observe(tbodyEl, { childList: true });
        }

        // Custom Delete Modal Controller
        const deleteModal = document.getElementById('delete-modal');
        const modalAssessmentEl = document.getElementById('modal-assessment-name');
        const modalCourseEl = document.getElementById('modal-course-name');
        const modalCancelBtn = document.getElementById('modal-cancel-btn');
        const modalConfirmBtn = document.getElementById('modal-confirm-btn');
        let pendingDeleteBtn = null;

        function closeDeleteModal() {
            deleteModal.classList.remove('open');
            pendingDeleteBtn = null;
        }

        document.addEventListener('click', (event) => {
            const deleteBtn = event.target.closest('#assessment-rows td:last-child button:last-of-type');
            if (!deleteBtn) return;

            if (deleteBtn.dataset.confirmed === 'true') {
                delete deleteBtn.dataset.confirmed;
                return;
            }

            event.stopImmediatePropagation();
            event.preventDefault();

            const row = deleteBtn.closest('tr');
            const assessmentName = row?.children[0]?.textContent.trim() || 'this assessment';
            const courseName = row?.children[1]?.textContent.trim() || 'this course';

            modalAssessmentEl.textContent = '"' + assessmentName + '"';
            modalCourseEl.textContent = courseName;
            pendingDeleteBtn = deleteBtn;
            deleteModal.classList.add('open');
            modalCancelBtn.focus();
        }, true);

        modalCancelBtn.addEventListener('click', closeDeleteModal);

        deleteModal.addEventListener('click', (event) => {
            if (event.target === deleteModal) {
                closeDeleteModal();
            }
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && deleteModal.classList.contains('open')) {
                closeDeleteModal();
            }
        });

        modalConfirmBtn.addEventListener('click', () => {
            const targetBtn = pendingDeleteBtn;
            closeDeleteModal();
            if (!targetBtn) return;

            const originalConfirm = window.confirm;
            window.confirm = () => true;
            targetBtn.dataset.confirmed = 'true';
            try {
                targetBtn.click();
            } finally {
                window.confirm = originalConfirm;
            }
        });
    </script>
    <script src="/assets/manage-assessments.js"></script>
</body>
</html>`;
}

module.exports = createManageAssessmentsPage;