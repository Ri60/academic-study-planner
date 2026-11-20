CREATE TABLE IF NOT EXISTS public_holiday (
    holiday_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    holiday_date DATE NOT NULL,
    local_name VARCHAR(150) NOT NULL,
    holiday_name VARCHAR(150) NOT NULL,
    country_code CHAR(2) NOT NULL,
    holiday_year INTEGER NOT NULL,
    fetched_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (country_code, holiday_date, holiday_name)
);