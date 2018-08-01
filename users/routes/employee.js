

const router = require('express').Router();
const passport = require('passport');
const Employee = require('../models/employee');
const mongoose = require('mongoose');

// Protect endpoints using JWT Strategy
router.use('/', passport.authenticate('jwt', { session: false, failWithError: true }));

// Get all employees
router.get('/', (req, res, next) => {
	const adminId = req.user.id;

	Employee.find({adminId})
		.sort('lastname')
		.then(result => {
			res.json(result);
		})
		.catch(next);
});

// Get a single employee by ID
router.get('/:employeeId', (req,res,next) => {
	const adminId = req.user.id;
	const {employeeId} = req.params;

	/***** Never trust users - validate input *****/
	if (!mongoose.Types.ObjectId.isValid(employeeId)) {
		const err = new Error(`The employee id ${employeeId} is not valid`);
		err.status = 400;
		return next(err);
	}

	Employee.findOne({_id : employeeId, adminId})
		.then(result => {
			if(result){
				return res.json(result);
			}
			next();
		})
		.catch(next);
});

// Update an existing employee
router.put('/:employeeId', (req, res, next) => {
	const {employeeId} = req.params;
	const updatedEmployee = {
		adminId : req.user.id
	};

	/***** Never trust users - validate input *****/
	if (!mongoose.Types.ObjectId.isValid(employeeId)) {
		const err = new Error(`The employee id ${employeeId} is not valid`);
		err.status = 400;
		return next(err);
	}

	// Only add fields that can be updated to updatedEmployee object
	const employeeFields = ['firstname', 'lastname', 'img', 'email', 'phoneNumber', 'password', 'availability'];
	employeeFields.map(field => {
		if (field in req.body){
			updatedEmployee[field] = req.body[field];
		}
	});

  // Check that all required fields are present
  const requiredFields = ['email', 'password', 'phoneNumber'];

  const missingField = requiredFields.find(field => !(field in req.body));

  if(missingField) {
    const err = new Error(`Missing ${missingField} in request body`);
    err.status = 422;
    return next(err);
  }

	// Check that all string fields are strings
	const stringFields = ['firstname', 'lastname', 'img', 'email', 'password', 'phoneNumber'];

	const nonStringField = stringFields.find(field =>
		field in updatedEmployee && typeof updatedEmployee[field] !== 'string'
	);

	if (nonStringField) {
		const err = new Error(`Field: '${nonStringField}' must be typeof String`);
		err.status = 422;
		return next(err);
	}

	// Check that fields are trimmed as needed
	const trimmedFields = ['password', 'email'];

	const nonTrimmedField = trimmedFields.find(field => {
		if (field in updatedEmployee){
			return updatedEmployee[field].trim() !== updatedEmployee[field];
		}
	});

	if (nonTrimmedField) {
		const err = new Error(`Field: '${nonTrimmedField}' cannot start or end with a whitespace!`);
		err.status = 422;
		return next(err);
	}

  // Check that fields are as long/short as they need to be
  const sizedFields = {
    password: { min: 8, max: 72 },
    phoneNumber: { min: 10, max: 10 },
    email: { min: 6 }
  };

  const tooSmall = Object.keys(sizedFields).find(field =>
    'min' in sizedFields[field] && req.body[field].length < sizedFields[field].min
  );

  if (tooSmall) {
    const min = sizedFields[tooSmall].min;
    const err = new Error(`Field: '${tooSmall}' must be at least ${min} characters long`);
    err.status = 422;
    return next(err);
  }

  const tooLarge = Object.keys(sizedFields).find(field =>
    'max' in sizedFields[field] && req.body[field].length > sizedFields[field].max
  );

  if (tooLarge) {
    const max = sizedFields[tooLarge].max;
    const err = new Error(`Field: '${tooLarge}' must be at most ${max} characters long`);
    err.status = 422;
    return next(err);
  }

  Employee.hashPassword(updatedEmployee.password)
		.then(digest => {
			const employee = {
				...updatedEmployee,
				password: digest
			};
			return Employee.findOneAndUpdate(
				{_id: employeeId, adminId: req.user.id},
				employee,
				{new: true}
				)
				.then(result => {
				if(result) {
					return res.json(result);
				}
				return next();
			})
				.catch(err => {
          if (err.code === 11000) {
            err = new Error('Email already exists');
            err.status = 400;
          }
          next(err);
				})
		})
});

// Create a new employee
router.post('/', (req,res,next) => {
	const newEmployee = {
		adminId : req.user.id
	};

	// Only add fields that can be updated to newEmployee object
	const employeeFields = ['firstname', 'lastname', 'img', 'email', 'phoneNumber', 'password', 'availability'];
	employeeFields.map(field => {
		if (field in req.body){
			newEmployee[field] = req.body[field];
		}
	});

	// Check that all required fields are present
	const requiredFields = ['email', 'password', 'phoneNumber'];

	const missingField = requiredFields.find(field => !(field in req.body));

	if(missingField) {
		const err = new Error(`Missing ${missingField} in request body`);
		err.status = 422;
		return next(err);
	}

	// Check that all string fields are strings
	const stringFields = ['firstname', 'lastname', 'img', 'email', 'password', 'phoneNumber'];

	const nonStringField = stringFields.find(field =>
		field in newEmployee && typeof newEmployee[field] !== 'string'
	);

	if (nonStringField) {
		const err = new Error(`Field: '${nonStringField}' must be typeof String`);
		err.status = 422;
		return next(err);
	}

	// Check that fields are trimmed as needed
	const trimmedFields = ['password', 'email'];

	const nonTrimmedField = trimmedFields.find(field => {
		if (field in newEmployee){
			return newEmployee[field].trim() !== newEmployee[field];
		}
	});

	if (nonTrimmedField) {
		const err = new Error(`Field: '${nonTrimmedField}' cannot start or end with a whitespace!`);
		err.status = 422;
		return next(err);
	}

	// Check that fields are as long/short as they need to be
	const sizedFields = {
		password: { min: 8, max: 72 },
		phoneNumber: { min: 10, max: 10 },
    email: { min: 6 }
	};

	const tooSmall = Object.keys(sizedFields).find(field =>
		'min' in sizedFields[field] && req.body[field].length < sizedFields[field].min
	);

	if (tooSmall) {
		const min = sizedFields[tooSmall].min;
		const err = new Error(`Field: '${tooSmall}' must be at least ${min} characters long`);
		err.status = 422;
		return next(err);
	}

	const tooLarge = Object.keys(sizedFields).find(field =>
		'max' in sizedFields[field] && req.body[field].length > sizedFields[field].max
	);

	if (tooLarge) {
		const max = sizedFields[tooLarge].max;
		const err = new Error(`Field: '${tooLarge}' must be at most ${max} characters long`);
		err.status = 422;
		return next(err);
	}

	// Make request to backend
	return Employee.hashPassword(newEmployee.password)
		.then(digest => {
			const employee = {
				...newEmployee,
				password: digest
			};
			return Employee.create(employee);
		})
		.then(result => {
			return res.status(201)
				.location(`/api/employee/${result.id}`)
				.json(result);
		})
		.catch(err => {
			if (err.code === 11000) {
				err = new Error('Email already exists');
				err.status = 400;
			}
			return next(err);
		});

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