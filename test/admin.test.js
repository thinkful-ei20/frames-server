
require('dotenv').config();

const { app } = require('../index');
const chai = require('chai');
const chaiHttp = require('chai-http');
const chaiExclude = require('chai-exclude');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const { TEST_DATABASE_URL, JWT_SECRET } = require('../config');

const Admin = require('../users/models/admin');

const expect = chai.expect;
chai.use(chaiHttp);
chai.use(chaiExclude);

describe('/api/admin', () => {
	const _id = '333333333333333333333333';
	const username = 'exampleuser';
	const email = 'example@test.com';
	const companyName = 'merntalists';
	const password = 'password123';
	const phoneNumber = 2225551111;

	before(() => {
		return mongoose.connect(TEST_DATABASE_URL)
			.then(() => mongoose.connection.db.dropDatabase());
	});
	beforeEach(() => {
		return Admin.createIndexes();
	});
	afterEach(() => {
		return mongoose.connection.db.dropDatabase();
	});
	after(() => {
		return mongoose.disconnect();
	});

	describe('POST', () => {
		it('Should create a new admin user', () => {
			let res;
			return chai
				.request(app)
				.post('/api/admin')
				.send({ username, email, companyName, password, phoneNumber })
				.then(_res => {
					res = _res;
					expect(res).to.have.status(201);
					expect(res.body).to.be.an('object');
					expect(res.body).to.have.keys('id', 'username', 'email', 'companyName', 'phoneNumber', 'createdAt', 'updatedAt');
					expect(res.body.id).to.exist;
					expect(res.body.username).to.equal(username);
					expect(res.body.email).to.equal(email);
					expect(res.body.companyName).to.equal(companyName);
					expect(res.body.phoneNumber).to.equal(phoneNumber);
					return Admin.findOne({ username });
				})
				.then(Admin => {
					expect(Admin).to.exist;
					expect(Admin.id).to.equal(res.body.id);
					return Admin.validatePassword(password);
				})
				.then(isValid => {
					expect(isValid).to.be.true;
				});
		});
	});
// END
});