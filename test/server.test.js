
/** api/auth/login test */

// it('', () => {
// });

require('dotenv').config();

const { app } = require('../index');
const chai = require('chai');
const chaiHttp = require('chai-http');

const { TEST_DATABASE_URL } = require('../config');
const {dbConnect, dbDisconnect} = require('../db-mongoose');

const expect = chai.expect;

chai.use(chaiHttp);

describe('Frames API - Login', function() {
	before(function() {
		return dbConnect(TEST_DATABASE_URL);
	});

	after(function() {
		return dbDisconnect();
	});
});

/* ================================================================================= */
// SANITY CHECK
describe('Sanity check', () => {
	it('true should be true', () => {
		expect(true).to.be.true;
	});

	it('2 + 2 = 4', () => {
		expect(2 + 2).to.equal(4);
	});
});

/* ================================================================================= */
// ENVIORONMENT
describe('ENVIRONMENT', () => {
	it('NODE_ENV should be "test"', () => {
		expect(process.env.NODE_ENV).to.equal('test');
	});
});

/* ================================================================================= */
describe('404 handler', () => {
	it('Should respond with 404 when given a bad path', () => {
		return chai.request(app)
			.get('/bad/path')
			.catch(res => {
				expect(res).to.have.status(404);
			});
	});
});
