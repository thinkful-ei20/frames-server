'use strict';

const router = require('express').Router();
const passport = require('passport');
const Employee = require('../models/employee');

// Protect endpoints using JWT Strategy
router.use('/', passport.authenticate('jwt', { session: false, failWithError: true }));

// Get all employees
router.get('/', (req, res, next) => {
  const adminId = req.user.id;

  Employee.find({adminId})
    .sort('lastname')
    .then(result => {
      if(result.length) {
        res.json(result);
      } else {
        next();
      }
    })
    .catch(next);
});

module.exports = router;