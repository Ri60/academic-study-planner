const holidayRows = document.getElementById('holidayRows');
const statusText = document.getElementById('status');
const syncButton = document.getElementById('syncButton');
const adminControls = document.getElementById('adminControls');

async function loadHolidays() {
    statusText.textContent = 'Loading holidays...';
    holidayRows.replaceChildren();

    try {
        const response = await fetch('/api/holidays');

        if (!response.ok) {
            throw new Error('Unable to load holidays.');
        }

        const holidays = await response.json();

        for (const holiday of holidays) {
            const row = document.createElement('tr');

            const values = [
                holiday.holiday_date
                    ? holiday.holiday_date.slice(0, 10)
                    : '',
                holiday.holiday_name,
                holiday.local_name,
                holiday.country_code,
                holiday.holiday_year
            ];

            for (const value of values) {
                const cell = document.createElement('td');
                cell.textContent = value ?? '';
                row.appendChild(cell);
            }

            holidayRows.appendChild(row);
        }

        statusText.textContent =
            `${holidays.length} public holidays loaded.`;
    } catch (error) {
        statusText.textContent = error.message;
    }
}

async function checkAdmin() {
    try {
        const response = await fetch('/api/holidays/admin-status');

        if (response.ok) {
            const data = await response.json();
            adminControls.hidden = !data.isAdmin;
        }
    } catch (error) {
        console.error('Unable to check admin status:', error);
    }
}

syncButton.addEventListener('click', async () => {
    syncButton.disabled = true;
    statusText.textContent = 'Synchronizing holidays...';

    try {
        const response = await fetch('/api/holidays/sync', {
            method: 'POST'
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Synchronization failed.');
        }

        await loadHolidays();

        statusText.textContent =
            `Synchronization complete. ${data.inserted} new holidays saved.`;
    } catch (error) {
        statusText.textContent = error.message;
    } finally {
        syncButton.disabled = false;
    }
});

loadHolidays();
checkAdmin();