

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

// Get a single employee by ID
router.get('/:employeeId', (req,res,next) => {
	const adminId = req.user.id;
	const {employeeId} = req.params;

	Employee.find({_id : employeeId, adminId})
		.then(result => {
			if(result.length){
				return res.json(result);
			}
			next();
		})
		.catch(error => next(error));
});

// Update an existing employee
router.put('/:employeeId', (req, res, next) => {
	const updatedEmployee = {
		adminId : req.user.id
	};

	// Only add fields that can be updated to updatedEmployee object
	const employeeFields = ['firstname', 'lastname', 'img', 'email', 'phoneNumber', 'password'];
	employeeFields.map(field => {
		if (field in req.body){
			updatedEmployee[field] = req.body[field];
		}
	});

	// Check that all string fields are strings
	const stringFields = ['firstname', 'lastname', 'img', 'email', 'password'];
	stringFields.map(field => {
		if (updatedEmployee[field] && (typeof updatedEmployee[field] !== 'string')){
			const err = new Error(`${field} in request body must be a string`);
			err.status = 422;
			return next(err);
		}
	});

	// Check that fields are trimmed as needed
	const trimmedFields = ['password', 'email'];
	trimmedFields.map(field => {
		if(updatedEmployee[field] && updatedEmployee[field].trim() !== updatedEmployee[field]){
			const err = new Error(`${field} must not have any leading or traliing spaces`);
			err.status = 422;
			return next(err);
		}
	});

	// Check that password is long enough
	if (updatedEmployee.password && updatedEmployee.password < 8){
		const err = new Error('Passowrd must be at least 8 characters long');
		err.status = 422;
		return next(err);
	}

	Employee.findOneAndUpdate(
		{_id : req.params.employeeId, adminId : req.user.id},
		updatedEmployee,
		{new : true})
		.then(result => {
			if (result){
				return res.json(result);
			}
			return next();
		})
		.catch(error => next(error));
});


// Create a new employee
router.post('/', (req,res,next) => {
	const newEmployee = {
		adminId : req.user.id
	};

	// Only add fields that can be updated to newEmployee object
	const employeeFields = ['firstname', 'lastname', 'img', 'email', 'phoneNumber', 'password'];
	employeeFields.map(field => {
		if (field in req.body){
			newEmployee[field] = req.body[field];
		}
	});

	// Check that all required fields are present
	const requiredFields = ['email', 'phoneNumber', 'password'];
	requiredFields.map(field => {
		if (!(field in req.body)){
			const err = new Error(`Missing ${field} in request body`);
			err.status = 422;
			return next(err);
		}
	});

	// Check that all string fields are strings
	const stringFields = ['firstname', 'lastname', 'img', 'email', 'password'];
	stringFields.map(field => {
		if (typeof newEmployee[field] !== 'string'){
			const err = new Error(`${field} in request body must be a string`);
			err.status = 422;
			return next(err);
		}
	});

	// Check that fields are trimmed as needed
	const trimmedFields = ['password', 'email'];
	trimmedFields.map(field => {
		if(newEmployee[field].trim() !== newEmployee[field]){
			const err = new Error(`${field} must not have any leading or traliing spaces`);
			err.status = 422;
			return next(err);
		}
	});

	// Check that fields are as long/short as they need to be
	const sizedFields = {
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
		return next(err);
	}

	// Make request to backend
	Employee.create(newEmployee)
		.then(result => {
			if(result){
				return res.json(result);
			}
			return next();
		})
		.catch(error => next(error));

});

// Delete an employee
router.delete('/:employeeId', (req,res,next) => {
	Employee.findOneAndRemove({_id : req.params.employeeId, adminId : req.user.id})
		.then(() => {
			return res.sendStatus(204);
		})
		.catch(error => next(error));
});


module.exports = router;