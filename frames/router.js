'use strict';

const router = require('express').Router();
const passport = require('passport');
const mongoose = require('mongoose');
const Frame = require('./model');
const Employee = require('../users/models/employee');

// /aoi/frames/?startDate=date&endDate=date&emloyeeId=id&frameId=id

// Protect endpoints using JWT Strategy
router.use('/', passport.authenticate('jwt', { session: false, failWithError: true }));

// Get all frames
router.get('/', (req, res, next) => {
  
  const frameId = req.query.frameId;
  const adminId = req.user.id;
  const { startDate, endDate } = req.query;

  const filter = { adminId };

  // Only filter on startDate and endDate if they are provided
  if(startDate) {
    filter.startFrame = { $gte: startDate };

  } else if(endDate) {
    filter.endFrame = { $lte: endDate };
  }

  Frame.find(filter)
    .populate('employeeId')
    .then(results => {
      console.log('GET RESULTS', results);
      if(results.length) {
        res.json(results);
      } else {
        next();
      }
    })
    .catch(err => {
      next(err);
    });
});

// Get all frames for one employee
router.get('/:id', (req, res, next) => {

  const employeeId = req.params.id;
  const adminId = req.user.id;

  /***** Never trust users - validate input *****/
  if (!mongoose.Types.ObjectId.isValid(employeeId)) {
    const err = new Error(`The employee id ${employeeId} is not valid`);
    err.status = 400;
    return next(err);
  }

  Frame.find({
    adminId,
    employeeId,
  })
    .then(result => {
      if (result.length) {
        res.json(result);
      } else {
        next();
      }
    })
    .catch(next);
});

// Get a single frame by frameId
router.get('/frame/:id', (req, res, next) => {

  const adminId = req.user.id;
  const frameId = req.params.id;

  /***** Never trust users - validate input *****/
  if (!mongoose.Types.ObjectId.isValid(frameId)) {
    const err = new Error(`The frame id ${frameId} is not valid`);
    err.status = 400;
    return next(err);
  }

  Frame.findOne({
    _id: frameId,
    adminId
  })
    .then(result => {
      if(result) {
        res.json(result);
      } else {
        next();
      }
    })
    .catch(next);


});

// Post/create a frame
router.post('/frame', (req, res, next) => {

  const requiredFields = ['employeeId', 'startFrame', 'endFrame'];
  const missingField = requiredFields.find(field => !(field in req.body));

  if (missingField) {
    const err = new Error(`Missing ${missingField} in request body`);
    err.status = 422;
    console.error(err);
    return next(err);
  }

  const stringFields = ['employeeId', 'startFrame', 'endFrame'];
  const nonStringField = stringFields.find(
    field => (field in req.body && typeof req.body[field]) !== 'string'
  );

  if (nonStringField) {
    const err = new Error(`Field: '${nonStringField}' must be typeof String`);
    err.status = 422;
    console.error(err);
    return next(err);
  }


  const adminId = req.user.id;
  const { employeeId, startFrame, endFrame } = req.body;

  const frame = {
    adminId,
    employeeId,
    startFrame,
    endFrame
  };

  console.log('FRAME', frame);
  Frame.create(frame)
    .then(result => {
      res.location(`${req.originalUrl}/${result.id}`).status(201).json(result);
    })
    .catch(next)
});

// Update a single frame
router.put('/frame/:id', (req, res, next) => {
  const adminId = req.user.id;
  const frameId = req.params.id;
  const { startDate, endDate } = req.body;

  /***** Never trust users - validate input *****/
  if (!mongoose.Types.ObjectId.isValid(frameId)) {
    const err = new Error(`The frame id ${frameId} is not valid`);
    err.status = 400;
    return next(err);
  }

  const requiredFields = ['startDate', 'endDate'];
  const missingField = requiredFields.find(field => !(field in req.body));

  if (missingField) {
    const err = new Error(`Missing ${missingField} in request body`);
    err.status = 422;
    console.error(err);
    return next(err);
  }

  const fields = {
    startFrame: startDate,
    endFrame: endDate };

  Frame.findOne({ _id: frameId, adminId })
    // .populate('adminId')
    .populate('employeeId', 'lastname')
    .then(result => {
      console.log('RESULT', result.employeeId.lastname);



    })


  // Frame.findOne({ _id: frameId, adminId })
  //   .then(result => {
  //     if(!result) {
  //       return next();
  //     }
  //     return Frame.findByIdAndUpdate(frameId, fields, { new: true })
  //   })
  //   .then(frame => {
  //     return res.json(frame);
  //   })
  //   .catch(next);
});

// Delete a single frame
router.delete('/frame/:id', (req, res, next) => {
  const adminId = req.user.id;
  const frameId = req.params.id;

  /***** Never trust users - validate input *****/
  if (!mongoose.Types.ObjectId.isValid(frameId)) {
    const err = new Error(`The frame id ${frameId} is not valid`);
    err.status = 400;
    return next(err);
  }

  Frame.findOneAndRemove({ _id: frameId, adminId })
    .then(() => {
      res.status(204).end();
    })
    .catch(err => {
      next(err);
    });
});

module.exports = router;