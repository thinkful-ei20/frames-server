
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

describe('/api/frames', () => {

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

});