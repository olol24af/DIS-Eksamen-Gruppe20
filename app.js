const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const indexRouter = require('./routes/index');
const { renderErrorPage } = require('./views/pages');

const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);

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
