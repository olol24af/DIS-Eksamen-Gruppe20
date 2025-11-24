require('dotenv').config();

const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require('express-session');
const MemcachedStore = require('connect-memcached')(session);
const helmet = require('helmet');

const indexRouter = require('./routes/index');
const adminRouter = require('./routes/admin');
const { renderErrorPage } = require('./views/pages');

const app = express();

app.use(helmet());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Configure Session with Memcached Store
app.use(
	session({
		secret: process.env.SESSION_SECRET || 'super-secret-waitlist',
		resave: false,
		saveUninitialized: false,
		store: new MemcachedStore({
			// Default to localhost:11211 if not specified in .env
			hosts: [process.env.MEMCACHED_HOST || '127.0.0.1:11211'],
			secret: process.env.SESSION_SECRET || 'super-secret-waitlist' // Optional: encrypt session data
		}),
		cookie: {
			sameSite: 'lax',
			// Secure cookies require HTTPS, enable if running on production domain
			// secure: process.env.NODE_ENV === 'production' 
		},
	})
);

app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/', adminRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
	next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
	const status = err.status || 500;
	const stack = req.app.get('env') === 'development' ? err.stack : '';

	res.status(status).send(
		renderErrorPage({
			title: 'Something went wrong',
			message: err.message || 'Unexpected error',
			status,
			stack,
		})
	);
});

module.exports = app;