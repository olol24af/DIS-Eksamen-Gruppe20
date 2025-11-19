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
	}
});

// Initialize schema once on startup.
database.serialize(() => {
	database.run(
		`CREATE TABLE IF NOT EXISTS waitlist (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			full_name TEXT NOT NULL,
			email TEXT NOT NULL,
			created_at TEXT NOT NULL DEFAULT (datetime('now'))
		)`
	);
});

const addWaitlistEntry = ({ fullName, email }) =>
	new Promise((resolve, reject) => {
		database.run(
			`INSERT INTO waitlist (full_name, email) VALUES (?, ?)`,
			[fullName, email.toLowerCase()],
			function onInsert(err) {
				if (err) {
					return reject(err);
				}
				return resolve(this.lastID);
			}
		);
	});

module.exports = {
	addWaitlistEntry,
	database,
	databasePath,
};
