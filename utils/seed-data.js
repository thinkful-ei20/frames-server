const mongoose = require('mongoose');

const {TEST_DATABASE_URL} = require('../config');

const {generateAdmins, generateEmployees, generateFrames} = require('./seed-utils');

const Admins = require('../users/models/admin');
const Employees = require('../users/models/employee');
const Frames = require('../frames/model');

const ADMIN_TOTAL = 1;

const yesOrNo = () => {
	return Math.round(Math.random());
};

const seedData = function (url = TEST_DATABASE_URL) {
	mongoose.connect(url)
		.then(() => {
			mongoose.connection.db.dropDatabase();
		})
		.then(() => {
			return generateAdmins(ADMIN_TOTAL);
		})
		.then(admins => {
			return Admins.insertMany(admins)
				.then(admins => {
					return admins;
				});
		})
		.then(admins => {
			const generatedPromises = admins.map(a => generateEmployees(a.id));
			return Promise.all(generatedPromises);
		})
		.then(employees => {
			const insertedEmployees = employees.map(employeeArray => Employees.insertMany(employeeArray));
			return Promise.all(insertedEmployees);
		})
		.then(employees => {
			const generatedPromises = employees.map(e => {
				if(yesOrNo) {
					return generateFrames(e);
				}
			});
			return Promise.all(generatedPromises);
		})
		.then(frames => {
			const insertedFrames = frames.map(framesArray => Frames.insertMany(framesArray));
			return Promise.all(insertedFrames);
		})
		.then(() => {
			mongoose.disconnect();
		})
		.catch(err => console.error(err));

};

module.exports = {seedData};