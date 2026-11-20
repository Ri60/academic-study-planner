require('dotenv').config();

const { Pool } = require('pg');
const { randomBytes, scrypt } = require('node:crypto');
const { promisify } = require('node:util');
const readline = require('node:readline');

const pool = new Pool();
const scryptAsync = promisify(scrypt);

async function main() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const ask = (question) =>
        new Promise((resolve) => rl.question(question, resolve));

    try {
        const username = (await ask('Username: ')).trim();
        const role = (await ask('Role (admin/user/guest): ')).trim();
        const studentId = role === 'user'
            ? (await ask('Student ID (example S001): ')).trim()
            : null;

        if (!/^[a-z0-9_]{3,50}$/.test(username)) {
            throw new Error('Invalid username.');
        }

        if (!['admin', 'user', 'guest'].includes(role)) {
            throw new Error('Invalid role.');
        }

        if (role === 'user' && !studentId) {
            throw new Error('A user account requires a Student ID.');
        }

const password = await new Promise((resolve) => {
            const stdin = process.stdin;
            const stdout = process.stdout;
            let value = '';

            stdout.write('Password (hidden): ');

            stdin.setRawMode(true);
            stdin.resume();

            const onData = (chunk) => {
                const char = chunk.toString();

                if (char === '\r' || char === '\n') {
                    stdin.setRawMode(false);
                    stdin.removeListener('data', onData);
                    stdout.write('\n');
                    resolve(value);
                } else if (char === '\u0003') {
                    stdin.setRawMode(false);
                    process.exit(130);
                } else if (char === '\u007f' || char === '\b') {
                    value = value.slice(0, -1);
                } else {
                    value += char;
                }
            };

            stdin.on('data', onData);
        });
        if (password.length < 12) {
            throw new Error('Password must be at least 12 characters.');
        }

        const salt = randomBytes(16);
        const key = await scryptAsync(password, salt, 64, {
            N: 131072,
            r: 8,
            p: 1,
            maxmem: 256 * 1024 * 1024
        });

        const passwordHash =
            `scrypt$${salt.toString('hex')}$${key.toString('hex')}`;

        await pool.query(
            `INSERT INTO planner_account
             (username, password_hash, role, student_id)
             VALUES ($1, $2, $3, $4)`,
            [username, passwordHash, role, studentId]
        );

        console.log('Account created successfully.');
    } finally {
        rl.close();
        await pool.end();
    }
}

main().catch((error) => {
    console.error('Account creation failed:', error.message);
    process.exitCode = 1;
});

