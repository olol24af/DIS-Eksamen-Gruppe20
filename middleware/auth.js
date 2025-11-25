const jwt = require('jsonwebtoken');

const TOKEN_COOKIE_NAME = 'admin_token';
const TOKEN_EXPIRATION_SECONDS = Number.parseInt(process.env.JWT_EXPIRATION_SECONDS || '', 10) || 60 * 60 * 8; // 8 hours
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-waitlist-jwt';

const secureCookie = process.env.NODE_ENV === 'production';

const buildCookieOptions = () => ({
	httpOnly: true,
	sameSite: 'lax',
	secure: secureCookie,
	maxAge: TOKEN_EXPIRATION_SECONDS * 1000,
});

const setAdminTokenCookie = (res, payload) => {
	const token = jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRATION_SECONDS });
	res.cookie(TOKEN_COOKIE_NAME, token, buildCookieOptions());
	return token;
};

const clearAdminTokenCookie = (res) => {
	res.clearCookie(TOKEN_COOKIE_NAME, {
		httpOnly: true,
		sameSite: 'lax',
		secure: secureCookie,
	});
};

const decodeAdminToken = (req) => {
	const token = req.cookies?.[TOKEN_COOKIE_NAME];
	if (!token) {
		return null;
	}

	try {
		return jwt.verify(token, JWT_SECRET);
	} catch (error) {
		return null;
	}
};

const requireAdminAuth = (req, res, next) => {
	const decoded = decodeAdminToken(req);

	if (!decoded) {
		clearAdminTokenCookie(res);
		return res.redirect('/admin/login');
	}

	req.admin = decoded;
	return next();
};

module.exports = {
	setAdminTokenCookie,
	clearAdminTokenCookie,
	requireAdminAuth,
	decodeAdminToken,
	TOKEN_COOKIE_NAME,
};
