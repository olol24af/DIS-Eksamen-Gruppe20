const express = require('express');
const path = require('path');

const {
	getOldestWaitlistEntry,
	removeWaitlistEntry,
} = require('../db/waitlist');
const { validateUserCredentials } = require('../db/users');
const { sendAvailabilityNotification, isTwilioConfigured } = require('../services/notifications');
const {
	setAdminTokenCookie,
	clearAdminTokenCookie,
	requireAdminAuth,
	decodeAdminToken,
} = require('../middleware/auth');

const router = express.Router();

const loginPagePath = path.join(__dirname, '../views/admin-login.html');
const dashboardPagePath = path.join(__dirname, '../views/admin-dashboard.html');

router.get('/admin/login', (req, res) => {
	const adminUser = decodeAdminToken(req);
	if (adminUser) {
		return res.redirect('/admin');
	}
	return res.sendFile(loginPagePath);
});

router.post('/admin/login', async (req, res, next) => {
	const { username = '', password = '' } = req.body;

	try {
		const user = await validateUserCredentials(username.trim(), password);
		if (!user) {
			const params = new URLSearchParams({ error: 'Invalid username or password.' });
			return res.redirect(`/admin/login?${params.toString()}`);
		}
 
		setAdminTokenCookie(res, { id: user.id, username: user.username });

		return res.redirect('/admin');
	} catch (error) {
		return next(error);
	}
});

router.post('/admin/logout', (req, res) => {
	clearAdminTokenCookie(res);
	return res.redirect('/admin/login');
});

router.get('/admin', requireAdminAuth, (req, res) => {
	return res.sendFile(dashboardPagePath);
});

router.post('/admin/open', requireAdminAuth, async (req, res, next) => {
	try {
		if (!isTwilioConfigured) {
			const params = new URLSearchParams({
				error: 'Twilio is not configured. Set TWILIO credentials before notifying guests.',
			});
			return res.redirect(`/admin?${params.toString()}`);
		}

		const entry = await getOldestWaitlistEntry();

		if (!entry) {
			const params = new URLSearchParams({
				error: 'No waitlist entries available to notify.',
			});
			return res.redirect(`/admin?${params.toString()}`);
		}

		await sendAvailabilityNotification({ fullName: entry.fullName, phone: entry.phone });
		await removeWaitlistEntry(entry.id);

		const params = new URLSearchParams({
			message: `Notification sent to ${entry.fullName}.`,
		});
		return res.redirect(`/admin?${params.toString()}`);
	} catch (error) {
		return next(error);
	}
});

module.exports = router;
