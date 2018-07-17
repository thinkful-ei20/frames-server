'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const passport = require('passport');

// Strategies
const localStrategy = require('./auth/local');
const jwtStrategy = require('./auth/jwt');

const { PORT, CLIENT_ORIGIN } = require('./config');
const { dbConnect } = require('./db-mongoose');

// ROUTERS
const adminRouter = require('./users/routes/admin');
const authRouter = require('./users/routes/auth');

// Express app
const app = express();

// Morgan
app.use(
  morgan(process.env.NODE_ENV === 'production' ? 'common' : 'dev', {
    skip: (req, res) => process.env.NODE_ENV === 'test'
  })
);

// CORS
app.use(
  cors({
    origin: CLIENT_ORIGIN
  })
);

// Parse request body
app.use(express.json());

// Auth
passport.use(localStrategy);
passport.use(jwtStrategy);

// Endpoints
app.use('/api', authRouter);
app.use('/api/admin', adminRouter);

// Catch All 404
app.use(function(req, res, next) {
  const err = new Error('404 Not found');
  err.status = 404;
  console.error(err);
  next(err);
});

// RUN SERVER
function runServer(port = PORT) {
  const server = app
    .listen(port, () => {
      console.info(`App listening on port ${server.address().port}`);
    })
    .on('error', err => {
      console.error('Express failed to start');
      console.error(err);
    });
}

if (require.main === module) {
  dbConnect();
  runServer();
}

module.exports = { app };
