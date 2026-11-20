
function createManageAssessmentsPage() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Manage Assessments | Academic Study Planner</title>
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
        <a href="/study-progress">Study Progress</a>
        <a href="/assessment-reports">Assessment Reports</a>
    </nav>

    <h1>Manage Assessments</h1>
<p>Add, edit, and delete assessments for your courses.</p>
    <section>

    <div style="display: flex; gap: 12px; margin: 20px 0;">
    <a href="/api/assessments/export/csv">Download CSV</a>
    <a href="/api/assessments/export/pdf">Download PDF</a>
</div>
        <h2 id="form-heading">Add Assessment</h2>

        <form id="assessment-form">
            <input type="hidden" id="assessment-id">

            <label for="title">Assessment title</label>
            <input id="title" maxlength="50" required>

            <label for="course-id">Course</label>
            <select id="course-id" required></select>

            <label for="weight">Weight (%)</label>
            <input id="weight" type="number"
                   min="0.01" max="100" step="0.01" required>

            <label for="due-date">Due date</label>
            <input id="due-date" type="date" required>

            <label for="prerequisite">Prerequisite assessment</label>
            <select id="prerequisite">
                <option value="">None</option>
            </select>

            <p>
                <button type="submit">Save Assessment</button>
                <button type="button" id="cancel-edit">Cancel Edit</button>
            </p>
        </form>

        <p id="message" role="status" aria-live="polite"></p>
    </section>

    <section>
        <h2>My Assessments</h2>
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

    <script src="/assets/manage-assessments.js"></script>
</body>
</html>`;
}

module.exports = createManageAssessmentsPage;
