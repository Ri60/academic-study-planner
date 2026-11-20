require('dotenv').config();

const { randomBytes, scryptSync } = require('node:crypto');
const { Pool } = require('pg');

async function main() {
    const [username, role, studentId] = process.argv.slice(2);
    const password = process.env.PLANNER_ACCOUNT_PASSWORD;

    if (!/^[a-z0-9_]{3,50}$/.test(username ?? '') ||
        !['admin', 'user'].includes(role) ||
        (role === 'user' && !studentId)) {
        throw new Error('Usage: node create-account.js <username> <admin|user> [student_id]');
    }

    if (!password || password.length < 12 || password.length > 128) {
        throw new Error('Use a password between 12 and 128 characters.');
    }

    const salt = randomBytes(16);
    const key = scryptSync(password, salt, 64, {
        N: 131072, r: 8, p: 1, maxmem: 256 * 1024 * 1024
    });
    const passwordHash = `scrypt$${salt.toString('hex')}$${key.toString('hex')}`;

    const pool = new Pool();
    try {
        const { rows } = await pool.query(`
            INSERT INTO planner_account (username, password_hash, role, student_id)
            VALUES ($1, $2, $3, $4)
            RETURNING username, role, student_id
        `, [username, passwordHash, role, studentId ?? null]);

        const account = rows[0];
        console.log(`Created account: ${account.username} (${account.role}, ${account.student_id ?? 'no student ID'})`);
    } finally {
        await pool.end();
    }
}

main().catch(error => {
    console.error(error.code === '23505'
        ? 'That username or student already has an account.'
        : error.message);
    process.exitCode = 1;
});
