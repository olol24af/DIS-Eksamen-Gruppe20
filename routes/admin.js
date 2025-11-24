const express = require('express');
const path = require('path');

const {
	getOldestWaitlistEntry,
	removeWaitlistEntry,
} = require('../db/waitlist');
const { validateUserCredentials } = require('../db/users');
const { sendAvailabilityNotification, isTwilioConfigured } = require('../services/notifications');

const router = express.Router();

const loginPagePath = path.join(__dirname, '../views/admin-login.html');
const dashboardPagePath = path.join(__dirname, '../views/admin-dashboard.html');

const ensureAuthenticated = (req, res, next) => {
	if (req.session?.isAdmin) {
		return next();
	}
	return res.redirect('/admin/login');
};

router.get('/admin/login', (req, res) => {
	if (req.session?.isAdmin) {
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

		req.session.isAdmin = true;
		req.session.username = user.username;

		return res.redirect('/admin');
	} catch (error) {
		return next(error);
	}
});

router.post('/admin/logout', (req, res) => {
	const finish = () => {
		res.clearCookie('connect.sid');
		res.redirect('/admin/login');
	};

	if (req.session) {
		req.session.destroy(() => finish());
	} else {
		finish();
	}
});

router.get('/admin', ensureAuthenticated, (req, res) => {
	return res.sendFile(dashboardPagePath);
});

router.post('/admin/open', ensureAuthenticated, async (req, res, next) => {
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
