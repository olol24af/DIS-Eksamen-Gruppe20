const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const morgan = require('morgan');

const indexRouter = require('./routes/index');

const app = express();
const port = process.env.PORT || 3000;

app.set('trust proxy', true);

// Middleware
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// Serve static assets from `public` (empty for now)
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/', indexRouter);

// Fallback 404
app.use((req, res) => {
	res.status(404).send('Not Found');
});

app.listen(port, () => {
	console.log(`Server listening on http://localhost:${port}`);
});
