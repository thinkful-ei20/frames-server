

const router = require('express').Router();
const passport = require('passport');
const mongoose = require('mongoose');
const Frame = require('./model');
const Employee = require('../users/models/employee');

// // Unprotected end point for testing purposes
// router.get('/test', (req, res, next) => {
// 	Frame.find()
// 		.then(result => {
// 			if(result.length) {
// 				res.json(result);
// 			} else {
// 				next();
// 			}
// 		})
// 		.catch(next);
// });

// Protect endpoints using JWT Strategy
router.use('/', passport.authenticate('jwt', { session: false, failWithError: true }));

// Get all frames
router.get('/', (req, res, next) => {

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
			res.json(results);
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

	if(employeeId) {
		Employee.findById(employeeId)
			.then(employee => {
				// Availability validation
				let isAvailable = false;
				const daysOfWeek = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
				const startDay = daysOfWeek[new Date(start).getDay()];
				const endDay = daysOfWeek[new Date(end).getDay()];

				const startHour = new Date(start).getHours();
				const endHour = new Date(end).getHours();

				employee.availability.filter(weekday => {
					// check if the weekday is the same as the frame day
					// check if start time is at or after available time
					// check that end time is at or before available end
					if(
						(weekday.day === startDay || weekday.day === endDay) &&
						(Number.parseInt(weekday.start, 10) >= startHour) &&
						(Number.parseInt(weekday.end, 10) <= endHour)
					){
						isAvailable = true;
					}
				});

				//Throw an error if the employee is not available at the given time
				if (!isAvailable){
					const err = new Error('The employee is not available during these times');
					err.status = 422;
					return next(err);
				}

				return Frame.find({ employeeId });
			})
			.then(results => {
				let errorMessage;
				// Checking for duplicate frames
				const valid = results.filter(frame => {
					const frameStart = new Date(frame.startFrame);
					const frameEnd = new Date(frame.endFrame);
					if(start >= frameStart && end <= frameEnd) { // If frame is inside a frame
						errorMessage = 'This frame is inside an existing frame.';
						return true;
					}
					if(end > frameStart && end < frameEnd) { // If end date is inside a frame
						errorMessage = 'This frame\'s ending is inside another frame.';
						return true;
					}
					if(start < frameEnd && start >= frameStart) { // If start date is inside a frame
						errorMessage = 'This frame\'s start is inside another frame.';
						return true;
					}
					if(start < frameStart && end > frameEnd) {
						errorMessage = 'There is a conflict with the selected time frame.';
						return true;
					}
					return false;
				});

				if(valid.length) {
					const err = new Error(errorMessage);
					err.status = 422;
					return next(err);
				}

				return Frame.create(frame);
			})
			.then(result => {
				res.location(`${req.originalUrl}/${result.id}`).status(201).json(result);
			})
			.catch(next);
	} else {
		// else all checks out create the frame!
		Frame.create(frame)
			.then(result => {
				res.location(`${req.originalUrl}/${result.id}`).status(201).json(result);
			})
			.catch(next);
	}
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

	/**
   *	startFrame : 2018-07-25 18:00:00.000
   *	endFrame : 2018-07-25 19:00:00.000
   */
	// If frame has an employeeId, check that employee isn't already assigned to another shift
	// within the same frame

	if(updatedShift.employeeId) {
		Frame.find({employeeId: updatedShift.employeeId})
			.then( results => {
				let errorMessage;
				const valid = results.filter(frame => {
					const start = new Date(updatedShift.startFrame);
					const end = new Date(updatedShift.endFrame);
					const frameStart = new Date(frame.startFrame);
					const frameEnd = new Date(frame.endFrame);
					if(start >= frameStart && end <= frameEnd) { // If frame is inside a frame
						errorMessage = 'This frame is inside an existing frame.';
						return true;
					}
					if(end > frameStart && end < frameEnd) { // If end date is inside a frame
						errorMessage = 'This frame\'s ending is inside another frame.';
						return true;
					}
					if(start < frameEnd && start >= frameStart) { // If start date is inside a frame
						errorMessage = 'This frame\'s start is inside another frame.';
						return true;
					}
					if(start < frameStart && end > frameEnd) {
						errorMessage = 'There is a conflict with the selected time frame.';
						return true;
					}
					return false;
				});

				if(valid.length) {
					const err = new Error(errorMessage);
					err.status = 422;
					return next(err);
				}

				return Frame.findOneAndUpdate({ _id: frameId, adminId }, updatedShift, {new: true});
			})
			.then(result => {
				res.location(`${req.originalUrl}/${result.id}`).status(201).json(result);
			})
			.catch(next);
	} else {
		// else all checks out update the frame!
		Frame.findOneAndUpdate({ _id: frameId, adminId }, updatedShift, {new: true})
			.then(result => {
				res.json(result);
			})
			.catch(next);
	}
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