// src/app.js
// #entry - main app file

require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const initDb = require('./db/initDb');
const userRoutes = require('./routes/users');

const app = express();

const PORT = process.env.PORT || 3000;

// middleware
app.use(express.json()); // parse JSON body
app.use(morgan('dev'));  // HTTP request logging

// initialize DB (create tables + seed managers)
initDb();

// routes
app.use('/', userRoutes);

// default error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// start server
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
