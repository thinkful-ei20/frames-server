const mongoose = require('mongoose');

const {TEST_DATABASE_URL} = require('../config');

const {generateAdmins, generateEmployees} = require('./seed-utils');

const Admins = require('../users/models/admin');
const Employees = require('../users/models/employee');

const ADMIN_TOTAL = 10;

const seedData = function (url = TEST_DATABASE_URL) {
	mongoose.connect(url)
		.then(() => {
			mongoose.connection.db.dropDatabase();
		})
		.then(() => {
			return generateAdmins(ADMIN_TOTAL);
		})
		.then((admins) => {
			return Admins.insertMany(admins)
				.then(admins => {
					return admins;
				});
		})
		.then( admins => {
			let employeePromises = [];
			for(let i = 0; i < admins.length; i++) {
				let array = generateEmployees(admins[i].id);
				employeePromises.push([...array]);
			}
			return Promise.all(employeePromises)
				.then(employees => {
					console.log('EMPLOYEES', employees.length);
				});
		})
		.then((promises) => {
			mongoose.disconnect();
		})
		.catch(err => console.error(err));

};

module.exports = {seedData};