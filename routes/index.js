const express = require('express');
const path = require('path');

const { addWaitlistEntry } = require('../db/waitlist');

const router = express.Router();

const indexPagePath = path.join(__dirname, '../views/index.html');
const waitlistPagePath = path.join(__dirname, '../views/waitlist.html');

router.get('/', (req, res) => {
	const visits = Number(req.cookies?.visited || 0) + 1;
	res.cookie('visited', String(visits), {
		sameSite: 'lax',
		maxAge: 1000 * 60 * 60 * 24 * 365,
	});

	res.sendFile(indexPagePath);
});

router.get('/waitlist', (req, res) => {
	res.sendFile(waitlistPagePath);
});

router.post('/waitlist', async (req, res, next) => {
	const { fullName = '', email = '' } = req.body;
	const trimmedName = fullName.trim();
	const trimmedEmail = email.trim();

	if (!trimmedName || !trimmedEmail) {
		const params = new URLSearchParams({
			error: 'Please provide both your name and email to join the waitlist.',
			name: trimmedName,
			email: trimmedEmail,
		});
		return res.redirect(303, `/?${params.toString()}`);
	}

	try {
		await addWaitlistEntry({ fullName: trimmedName, email: trimmedEmail });
	} catch (error) {
		return next(error);
	}

	const params = new URLSearchParams({ name: trimmedName, email: trimmedEmail });
	return res.redirect(303, `/waitlist?${params.toString()}`);
});

module.exports = router;
