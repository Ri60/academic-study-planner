function createManageStudySessionsPage() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Manage Study Sessions | Academic Study Planner</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 1100px;
            margin: 30px auto;
            padding: 0 20px;
            background: #f5f7fb;
            color: #243047;
        }
        h1, h2 { color: #243b67; }
        nav { margin-bottom: 24px; }
        nav a { margin-right: 15px; }
        section {
            background: white;
            padding: 22px;
            border-radius: 12px;
            margin-bottom: 24px;
            box-shadow: 0 2px 10px #00000010;
        }
        label {
            display: block;
            margin-top: 14px;
            font-weight: bold;
        }
        input, select, button {
            font: inherit;
            padding: 9px;
            margin-top: 5px;
        }
        input, select {
            width: 100%;
            max-width: 450px;
            box-sizing: border-box;
        }
        button {
            cursor: pointer;
            margin-right: 8px;
        }
        table {
            border-collapse: collapse;
            width: 100%;
        }
        th, td {
            padding: 10px;
            border-bottom: 1px solid #ddd;
            text-align: left;
        }
        .table-wrap { overflow-x: auto; }
        .danger { color: #a80000; }
        #message { font-weight: bold; }
    </style>
</head>
<body>
    <nav>
        <a href="/">Home</a>
        <a href="/manage-assessments">Manage Assessments</a>
        <a href="/study-progress">Study Progress</a>
        <a href="/assessment-reports">Assessment Reports</a>
    </nav>

    <h1>Manage Study Sessions</h1>
    <p>Add, edit, and delete study sessions for your assessments.</p>

    <section>
        <h2 id="form-heading">Add Study Session</h2>

        <form id="session-form">
            <input type="hidden" id="session-id">

            <label for="assessment-id">Assessment</label>
            <select id="assessment-id" required></select>

            <label for="session-date">Session date</label>
            <input id="session-date" type="date" required>

            <label for="duration-min">Duration (minutes)</label>
            <input id="duration-min" type="number"
                   min="1" max="1440" step="1" required>

            <label for="productivity">Productivity (1–5, optional)</label>
            <input id="productivity" type="number"
                   min="1" max="5" step="1">

            <p>
                <button type="submit">Save Study Session</button>
                <button type="button" id="cancel-edit">Cancel Edit</button>
            </p>
        </form>

        <p id="message" role="status" aria-live="polite"></p>
    </section>

    <section>
        <h2>My Study Sessions</h2>
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

    <script src="/assets/manage-study-sessions.js"></script>
</body>
</html>`;
}

module.exports = createManageStudySessionsPage;