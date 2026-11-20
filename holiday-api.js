const express = require('express');

function createHolidayRouter(pool) {
    const router = express.Router();

    router.post('/sync', async (req, res) => {
        const year = new Date().getFullYear();

        try {
            const response = await fetch(
                `https://date.nager.at/api/v3/PublicHolidays/${year}/CA`,
                { signal: AbortSignal.timeout(10000) }
            );

            if (!response.ok) {
                return res.status(502).json({
                    error: 'External holidays API request failed.'
                });
            }

            const holidays = await response.json();

            if (!Array.isArray(holidays)) {
                return res.status(502).json({
                    error: 'Unexpected response from holidays API.'
                });
            }

            let saved = 0;

            for (const holiday of holidays) {
                if (
                    typeof holiday.date !== 'string' ||
                    typeof holiday.localName !== 'string' ||
                    typeof holiday.name !== 'string'
                ) {
                    continue;
                }

                const result = await pool.query(
                    `INSERT INTO public_holiday
                        (holiday_date, local_name, holiday_name,
                         country_code, holiday_year)
                     VALUES ($1, $2, $3, 'CA', $4)
                     ON CONFLICT
                        (country_code, holiday_date, holiday_name)
                     DO NOTHING`,
                    [
                        holiday.date,
                        holiday.localName,
                        holiday.name,
                        year
                    ]
                );

                saved += result.rowCount;
            }

            res.json({
                message: 'Canadian public holidays synchronized.',
                year,
                received: holidays.length,
                inserted: saved
            });
        } catch (error) {
            console.error('Holiday sync error:', error.message);

            res.status(500).json({
                error: 'Unable to synchronize public holidays.'
            });
        }
    });

    router.get('/', async (req, res) => {
        try {
            const result = await pool.query(
                `SELECT holiday_date, local_name, holiday_name,
                        country_code, holiday_year
                 FROM public_holiday
                 ORDER BY holiday_date`
            );

            res.json(result.rows);
        } catch (error) {
            console.error('Holiday list error:', error.message);

            res.status(500).json({
                error: 'Unable to retrieve public holidays.'
            });
        }
    });

    return router;
}

module.exports = createHolidayRouter;