const bcrypt = require('bcrypt');

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

const DEFAULT_BCRYPT_ROUNDS = 12;
const configuredRounds = Number.parseInt(process.env.BCRYPT_ROUNDS ?? `${DEFAULT_BCRYPT_ROUNDS}`, 10);
const BCRYPT_ROUNDS = Number.isNaN(configuredRounds) ? DEFAULT_BCRYPT_ROUNDS : configuredRounds;

const hashPassword = async (password) =>
	bcrypt.hash(String(password), BCRYPT_ROUNDS);

const ensureAdminUser = async () => {
	await run(
		`CREATE TABLE IF NOT EXISTS users (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			username TEXT UNIQUE NOT NULL,
			password_hash TEXT NOT NULL,
			created_at TEXT NOT NULL DEFAULT (datetime('now'))
		)`
	);

	const adminUsername = process.env.ADMIN_USERNAME || 'admin';
	const adminPassword = process.env.ADMIN_PASSWORD || 'admin';
	const existingAdmin = await get(`SELECT id, password_hash FROM users WHERE username = ?`, [adminUsername]);

	const passwordMatches = existingAdmin
		? await bcrypt.compare(adminPassword, existingAdmin.password_hash)
		: false;

	if (!existingAdmin) {
		const adminPasswordHash = await hashPassword(adminPassword);
		await run(`INSERT INTO users (username, password_hash) VALUES (?, ?)`, [adminUsername, adminPasswordHash]);
	} else if (!passwordMatches) {
		const adminPasswordHash = await hashPassword(adminPassword);
		await run(`UPDATE users SET password_hash = ? WHERE id = ?`, [adminPasswordHash, existingAdmin.id]);
	}
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

	const passwordIsValid = await bcrypt.compare(password, row.password_hash);
	if (!passwordIsValid) {
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
