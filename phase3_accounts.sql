CREATE TABLE IF NOT EXISTS planner_account (
    account_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE
        CHECK (username ~ '^[a-z0-9_]{3,50}$'),
    password_hash TEXT NOT NULL,
    role VARCHAR(10) NOT NULL CHECK (role IN ('admin', 'user')),
    student_id VARCHAR(20) UNIQUE REFERENCES Student(student_id),
    CHECK (role <> 'user' OR student_id IS NOT NULL)
);
