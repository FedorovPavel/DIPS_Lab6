const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const rec = require('./../receiver/receiver');

module.exports = (app) => {
  app.use('/', router);
};

router.get('/', (req, res, next) => {
  res.send('OK');
});
