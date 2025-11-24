const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dataDir = path.join(__dirname, '..', 'data');
const databasePath = path.join(dataDir, 'waitlist.db');

fs.mkdirSync(dataDir, { recursive: true });

const database = new sqlite3.Database(databasePath, (err) => {
	if (err) {
		// Bubble the error so the server fails fast instead of running without persistence.
		throw err;
	} else {
		// Enable WAL mode for better concurrency in PM2 Cluster Mode
		database.run('PRAGMA journal_mode = WAL;', (pragmaErr) => {
			if (pragmaErr) console.error('Failed to enable WAL mode:', pragmaErr);
		});
	}
});

const run = (sql, params = []) =>
	new Promise((resolve, reject) => {
		database.run(sql, params, function callback(err) {
			if (err) {
				return reject(err);
			}
			return resolve(this);
		});
	});

const all = (sql, params = []) =>
	new Promise((resolve, reject) => {
		database.all(sql, params, (err, rows) => {
			if (err) {
				return reject(err);
			}
			return resolve(rows);
		});
	});

const get = (sql, params = []) =>
	new Promise((resolve, reject) => {
		database.get(sql, params, (err, row) => {
			if (err) {
				return reject(err);
			}
			return resolve(row);
		});
	});

const migrateWaitlistTable = async () => {
	await run('BEGIN TRANSACTION');
	try {
		await run(
			`CREATE TABLE waitlist_migration (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				full_name TEXT NOT NULL,
				phone TEXT NOT NULL,
				created_at TEXT NOT NULL DEFAULT (datetime('now'))
			)`
		);

		await run(
			`INSERT INTO waitlist_migration (id, full_name, phone, created_at)
			 SELECT id,
				full_name,
				CASE
					WHEN phone IS NOT NULL AND TRIM(phone) != '' THEN phone
					WHEN email IS NOT NULL AND TRIM(email) != '' THEN email
					ELSE NULL
				END AS phone,
				created_at
			 FROM waitlist
			 WHERE (phone IS NOT NULL AND TRIM(phone) != '')
				OR (email IS NOT NULL AND TRIM(email) != '')`
		);

		await run(`DROP TABLE waitlist`);
		await run(`ALTER TABLE waitlist_migration RENAME TO waitlist`);
		await run('COMMIT');
	} catch (error) {
		try {
			await run('ROLLBACK');
		} catch (rollbackErr) {
			// Ignore rollback errors to avoid masking the original failure.
			console.error('Failed to rollback waitlist migration:', rollbackErr);
		}
		throw error;
	}
};

const ensureSchema = async () => {
	await run(
		`CREATE TABLE IF NOT EXISTS waitlist (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			full_name TEXT NOT NULL,
			phone TEXT NOT NULL,
			created_at TEXT NOT NULL DEFAULT (datetime('now'))
		)`
	);

	const columns = await all(`PRAGMA table_info(waitlist)`);
	if (!columns.length) {
		return;
	}

	const phoneColumn = columns.find((col) => col.name === 'phone');
	const hasEmailColumn = columns.some((col) => col.name === 'email');
	const phoneNotNull = phoneColumn ? Number(phoneColumn.notnull) === 1 : false;

	if (!phoneColumn || hasEmailColumn || !phoneNotNull) {
		await migrateWaitlistTable();
	}
};

const schemaReady = ensureSchema().catch((err) => {
	// Surface the error early so the app fails fast if the schema cannot be prepared.
	throw err;
});

const addWaitlistEntry = async ({ fullName, phone }) => {
	await schemaReady;
	const result = await run(`INSERT INTO waitlist (full_name, phone) VALUES (?, ?)`, [fullName, phone]);
	return result.lastID;
};

const getOldestWaitlistEntry = async () => {
	await schemaReady;
	const row = await get(
		`SELECT id, full_name AS fullName, phone, created_at AS createdAt
		 FROM waitlist
		 WHERE phone IS NOT NULL AND TRIM(phone) != ''
		 ORDER BY id ASC
		 LIMIT 1`
	);
	return row || null;
};

const removeWaitlistEntry = async (id) => {
	await schemaReady;
	const result = await run(`DELETE FROM waitlist WHERE id = ?`, [id]);
	return result.changes > 0;
};

module.exports = {
	addWaitlistEntry,
	getOldestWaitlistEntry,
	removeWaitlistEntry,
	database,
	databasePath,
};