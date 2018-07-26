

const router = require('express').Router();
const passport = require('passport');
const mongoose = require('mongoose');
const Frame = require('./model');
const Employee = require('../users/models/employee');

// Unprotected end point for testing purposes
router.get('/test', (req, res, next) => {
	Frame.find()
		.then(result => {
			if(result.length) {
				res.json(result);
			} else {
				next();
			}
		})
		.catch(next);
});

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
		filter.startFrame = { $gte: startDate, $lte: endDate };
	}

	// if(endDate) {
	// 	filter.startFrame = { $lte: endDate };
	// }

	Frame.find(filter)
		.populate('employeeId')
		.sort({'startFrame': 1})
		.then(results => {
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

	const { employeeId = null, startFrame, endFrame } = req.body;

	const requiredFields = ['startFrame', 'endFrame'];
	const missingField = requiredFields.find(field => !(field in req.body));

	if (missingField) {
		const err = new Error(`Missing ${missingField} in request body`);
		err.status = 422;
		return next(err);
	}

	let stringFields = ['employeeId','startFrame', 'endFrame'];
	if(!employeeId) {
		stringFields = ['startFrame', 'endFrame'];
	}

	const nonStringField = stringFields.find(
		field => (field in req.body && typeof req.body[field]) !== 'string'
	);

	if (nonStringField) {
		const err = new Error(`Field: '${nonStringField}' must be typeof String`);
		err.status = 422;
		return next(err);
	}

	const adminId = req.user.id;

	const frame = {
		adminId,
		employeeId,
		startFrame,
		endFrame
	};

	//Check that end frame is later than start frame
	const start = new Date(startFrame);
	const end = new Date(endFrame);
	if(start > end){
		const err = new Error('endFrame must be later than startFrame');
		err.status = 422;
		return next(err);
	}

	Frame.create(frame)
		.then(result => {
			res.location(`${req.originalUrl}/${result.id}`).status(201).json(result);
		})
		.catch(next);
});

// Update a single frame
router.put('/frame/:id', (req, res, next) => {
	// console.log('START DATE', req.body.startFrame);
	const adminId = req.user.id;
	const frameId = req.params.id;
	const updateableFields = ['startFrame', 'endFrame', 'employeeId'];
	const updatedShift = {};
	updateableFields.map(field => {
		if (field in req.body){
			updatedShift[field] = req.body[field];
		}
	});

	if (!mongoose.Types.ObjectId.isValid(frameId)) {
		const err = new Error(`The frame id ${frameId} is not valid`);
		err.status = 400;
		return next(err);
	}

	// Check that end frame is later than start frame
	if(updatedShift.startFrame && updatedShift.endFrame){
		const start = new Date(updatedShift.startFrame);
		const end = new Date(updatedShift.endFrame);
		if(start > end){
			const err = new Error('endFrame must be later than startFrame');
			err.status = 422;
			return next(err);
		}
	}

	Frame.findOneAndUpdate({ _id: frameId, adminId }, updatedShift, {new: true})
		.then(result => {
			res.json(result);
		})
		.catch(next);
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