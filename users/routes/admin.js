'use strict';

const express = require('express');

const Admin = require('../models/admin');

const router = express.Router();

/* =================================================================================== */
// CREATE NEW ADMIN
router.post('/', (req, res, next) => {
  const requiredFields = ['username', 'email', 'companyName', 'password', 'phoneNumber'];
  const missingField = requiredFields.find(field => !(field in req.body));
  
  if (missingField) {
    const err = new Error(`Missing ${missingField} in request body`);
    err.status = 422;
    console.error(err);
    return next(err);
  }

  const stringFields = ['username', 'email', 'companyname', 'password'];
  const nonStringField = stringFields.find(field => {
    field in req.body && typeof req.body[field] !== 'string';
  });

  if (nonStringField) {
    const err = new Error(`Field: '${nonStringField}' must be typeof String`);
    err.status = 422;
    console.error(err);
    return next(err);
  }

  const trimmedFields = ['username', 'email', 'companyName', 'password', 'phoneNumber'];
  const nonTrimmedField = trimmedFields.find(field => {
    req.body[field].trim() !== req.body[field];
  });

  if (nonTrimmedField) {
    const err = new Error(`Field: '${nonTrimmedField}' cannot start or end with a whitespace!`);
    err.status = 422;
    console.error(err);
    return next(err);
  }

  const sizedFields = {
    username: { min: 1 },
    email: { min: 1 },
    companyName: { min: 1 },
    password: { min: 8, max: 72 }
  };

  const tooSmall = Object.keys(sizedFields).find(field => {
    'min' in sizedFields[field] 
    && 
    req.body[field].trim().length < sizedFields[field].min;
  });
  if (tooSmall) {
    const min = sizedFields[tooSmall].min;
    const err = new Error(`Field: '${tooSmall}' must be at least ${min} characters long`);
    err.status = 422;
    console.error(err);
    return next(err);
  }

  const tooLarge = Object.keys(sizedFields).find(field => {
    'max' in sizedFields[field] 
    &&
    req.body[field].trim().length > sizedFields[field].max;
  });
  if (tooLarge) {
    const max = sizedFields[tooLarge].max;
    const err = new Error(`Field: '${tooLarge}' must be at most ${max} characters long `);
    err.status = 422;
    console.error(err);
    return next(err);
  }

  // Create the new admin user
  let { username, email, companyName, password, phoneNumber } = req.body;
  
  return Admin.hashPassword(password)
    .then(digest => {
      const newAdmin = {
        username, 
        email,
        companyName,
        phoneNumber,
        password: digest
      };
      return Admin.create(newAdmin);
    })
    .then(result => {
      return res.status(201)
        .location(`/api/users/${result.id}`)
        .json(result);
    })
    .catch(err => {
      if (err.code === 11000) {
        err = new Error('The username or email already exists');
        err.status = 400;
      }
      console.error(err);
      next(err);
    });
});

/* =================================================================================== */
// GET ALL ADMINS
router.get('/', (req, res, next) => {
  Admin.find()
    .then(admin => {
      res.json(admin);
    })
    .catch(err => {
      console.error(err);
      next(err);
    });
});

/* =================================================================================== */
// DELETE A USER BY ID
router.delete('/:id', (req, res, next) => {
  const { id } = req.params;

  Admin.findOneAndRemove({ _id: id })
    .then(() => {
      res.json({
        message: 'Deleted Admin user'
      });
      res.status(204).end();
    })
    .catch(err => {
      console.error(err);
      next(err);
    });
});

module.exports = router;