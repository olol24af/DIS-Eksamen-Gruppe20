require('dotenv').config();

const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

const logger = require('./config/logger');

const indexRouter = require('./routes/index');
const adminRouter = require('./routes/admin');
const { renderErrorPage } = require('./views/pages');

const app = express();

const accessLogFormatter = (tokens, req, res) =>
	JSON.stringify({
		method: tokens.method(req, res),
		url: tokens.url(req, res),
		status: Number(tokens.status(req, res)) || 0,
		responseTimeMs: Number.parseFloat(tokens['response-time'](req, res)) || 0,
		contentLength: tokens.res(req, res, 'content-length') || '0',
		userAgent: tokens['user-agent'](req, res),
		remoteAddress: req.ip,
	});

const morganStream = {
	write: (message) => {
		try {
			const payload = JSON.parse(message);
			logger.info('http_access', payload);
		} catch (error) {
			logger.info('http_access', { raw: message.trim() });
		}
	},
};

app.use(morgan(accessLogFormatter, { stream: morganStream }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

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

	logger.error('unhandled_error', {
		method: req.method,
		url: req.originalUrl,
		status,
		message: err.message,
		stack: err.stack,
	});

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