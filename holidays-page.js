function createHolidaysPage() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Public Holidays - Academic Study Planner</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 1000px;
            margin: 40px auto;
            padding: 0 20px;
            line-height: 1.5;
        }
        table {
            border-collapse: collapse;
            width: 100%;
            margin-top: 20px;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 10px;
            text-align: left;
        }
        th { background: #eef2ff; }
        tr:nth-child(even) { background: #f8fafc; }
        button {
            padding: 10px 16px;
            cursor: pointer;
        }
        #status { margin-top: 12px; }
    </style>
</head>
<body>
    <h1>Canadian Public Holidays</h1>
    <p><a href="/">Back to Dashboard</a></p>

    <p>
        Holidays are retrieved from the Nager.Date external API
        and stored in PostgreSQL.
    </p>

    <div id="adminControls" hidden>
        <button id="syncButton" type="button">
            Sync Holidays from API
        </button>
    </div>

    <p id="status" role="status">Loading holidays...</p>

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

    <script src="/assets/holidays.js"></script>
</body>
</html>`;
}

module.exports = createHolidaysPage;