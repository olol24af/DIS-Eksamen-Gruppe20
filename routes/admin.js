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
const logger = require('../config/logger');

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
			logger.info('admin.login.failed', {
				method: req.method,
				url: req.originalUrl,
				username: username.trim(),
				ip: req.ip,
			});

			const params = new URLSearchParams({ error: 'Invalid username or password.' });
			if (req.accepts('json')) {
				return res.status(401).json({ error: 'Invalid username or password.' });
			}
			return res.redirect(`/admin/login?${params.toString()}`);
		}

		setAdminTokenCookie(res, { id: user.id, username: user.username });
		logger.info('admin.login.success', {
			method: req.method,
			url: req.originalUrl,
			username: user.username,
			ip: req.ip,
		});

		return res.redirect('/admin');
	} catch (error) {
		logger.error('admin.login.error', {
			method: req.method,
			url: req.originalUrl,
			error: error.message,
			stack: error.stack,
		});
		return next(error);
	}
});

router.post('/admin/logout', (req, res) => {
	const adminUser = decodeAdminToken(req);
	clearAdminTokenCookie(res);
	logger.info('admin.logout', {
		method: req.method,
		url: req.originalUrl,
		username: adminUser?.username || 'unknown',
		ip: req.ip,
	});
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
			logger.warn('admin.notify.twilio_missing', {
				method: req.method,
				url: req.originalUrl,
				username: req.admin?.username,
			});
			return res.redirect(`/admin?${params.toString()}`);
		}

		const entry = await getOldestWaitlistEntry();

		if (!entry) {
			const params = new URLSearchParams({
				error: 'No waitlist entries available to notify.',
			});
			logger.info('admin.notify.empty_waitlist', {
				method: req.method,
				url: req.originalUrl,
				username: req.admin?.username,
			});
			return res.redirect(`/admin?${params.toString()}`);
		}

		await sendAvailabilityNotification({ fullName: entry.fullName, phone: entry.phone });
		await removeWaitlistEntry(entry.id);
		logger.info('admin.notify.success', {
			method: req.method,
			url: req.originalUrl,
			username: req.admin?.username,
			waitlistEntryId: entry.id,
		});

		const params = new URLSearchParams({
			message: `Notification sent to ${entry.fullName}.`,
		});
		return res.redirect(`/admin?${params.toString()}`);
	} catch (error) {
		logger.error('admin.notify.error', {
			method: req.method,
			url: req.originalUrl,
			username: req.admin?.username,
			error: error.message,
			stack: error.stack,
		});
		return next(error);
	}
});

module.exports = router;
