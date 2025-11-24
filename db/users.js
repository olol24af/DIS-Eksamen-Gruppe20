const crypto = require('crypto');

const { database } = require('./waitlist');

const run = (sql, params = []) =>
	new Promise((resolve, reject) => {
		database.run(sql, params, function callback(err) {
			if (err) {
				return reject(err);
			}
			return resolve(this);
		});
	});

const get = (sql, params = []) =>
	new Promise((resolve, reject) => {
		database.get(sql, params, (err, row) => {
			if (err) {
				return reject(err);
			}
			return resolve(row || null);
		});
	});

const hashPassword = (password) =>
	crypto.createHash('sha256').update(String(password)).digest('hex');

const ensureAdminUser = async () => {
	await run(
		`CREATE TABLE IF NOT EXISTS users (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			username TEXT UNIQUE NOT NULL,
			password_hash TEXT NOT NULL,
			created_at TEXT NOT NULL DEFAULT (datetime('now'))
		)`
	);

	const adminUsername = 'admin';
	const adminPasswordHash = hashPassword('admin');

	await run(
		`INSERT INTO users (username, password_hash)
		 VALUES (?, ?)
		 ON CONFLICT(username) DO UPDATE SET password_hash = excluded.password_hash`,
		[adminUsername, adminPasswordHash]
	);
};

const usersReady = ensureAdminUser().catch((err) => {
	throw err;
});

const validateUserCredentials = async (username, password) => {
	await usersReady;

	if (!username || !password) {
		return null;
	}

	const row = await get(`SELECT id, username, password_hash FROM users WHERE username = ?`, [username]);

	if (!row) {
		return null;
	}

	const submittedHash = hashPassword(password);
	if (submittedHash !== row.password_hash) {
		return null;
	}

	return {
		id: row.id,
		username: row.username,
	};
};

module.exports = {
	validateUserCredentials,
};
