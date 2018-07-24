
const faker = require('faker');
const mongoose = require('mongoose');

const ADMIN_TOTAL = 10;
const EMPLOYEE_TOTAL = 20;

// HS256 generated password
const test_password = '$2a$10$tZ.k8k41b9OjHDN.U/DHWuz7OUjPW8sX0zGytKzndhaIl/rJQMihe'; // password: password10;

const generateAdmins = (total = ADMIN_TOTAL) => {
	const admins = [];
	for(let i = 0; i < total; i++) {
		admins.push({
			username: faker.internet.userName(),
			password: test_password,
			email: faker.internet.email(),
			companyName: faker.company.companyName(),
			phoneNumber: 9999999999
		});
	}
	return Promise.all(admins)
		.then(values => {
			return values;
		})
		.catch(err => console.error(err));
};

const generateEmployees = (adminId, total = EMPLOYEE_TOTAL) => {
	const employees = [];
	for(let i = 0; i < total; i++) {
		employees.push({
			firstname: faker.name.firstName(),
			lastname: faker.name.lastName(),
			img: faker.image.imageUrl(),
			password: test_password,
			email: faker.internet.email(),
			phoneNumber: 9999999999,
			adminId: mongoose.Types.ObjectId(adminId)
		});
	}
	return Promise.all(employees)
		.then(values => {
			console.log('THATS ONE!',employees);
			return values;
		})
		.catch(err => {
			console.error(err);
		});
};


module.exports = {generateAdmins, generateEmployees};