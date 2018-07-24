
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

	let token;
	let user;

	before(() => {
		return mongoose.connect(TEST_DATABASE_URL)
			.then(() => mongoose.connection.db.dropDatabase());
	});
	beforeEach(() => {
		return Admin.create({
			username : 'exampleuser123',
			email : 'example123@test.com',
			companyName : 'merntalists',
			password : 'password123',
			phoneNumber : 2225551111
		})
			.then((currUser) => {
				user = currUser;

				token = jwt.sign(
					{user},
					JWT_SECRET,
					{subject : user.username});
			})
			.then(() => Admin.createIndexes());
	});
	afterEach(() => {
		return mongoose.connection.db.dropDatabase();
	});
	after(() => {
		return mongoose.disconnect();
	});


	describe('GET ALL /api/admin', () => {
		it('should return an array of all admins', () => {
			let res;

			return chai
				.request(app)
				.get('/api/admin')
				.then(_res => {
					res = _res;
					expect(res).to.have.status(200);
					expect(res.body).to.be.an('array');

					return Admin.find();
				})
				.then(data => {
					expect(res.body[0]['username']).to.be.equal(data[0]['username']);
					expect(res.body[0]['email']).to.be.equal(data[0]['email']);
					expect(res.body[0]['companyName']).to.be.equal(data[0]['companyName']);
					expect(res.body[0]['phoneNumber']).to.be.equal(data[0]['phoneNumber']);
					expect(res.body[0]['id']).to.be.equal(data[0]['id']);
				});
		});
	});

	describe('GET ONE /api/admin/:adminId', () => {
		it('should return the admin, given valid credentials', () => {

			let res;

			return chai.request(app)
				.get(`/api/admin/${user.id}`)
				.set('Authorization', `Bearer ${token}`)
				.then(_res => {
					res = _res;
					expect(res).to.have.status(200);
					expect(res.body).to.be.an('object');

					return Admin.findById(user.id);
				})
				.then(data => {
					expect(data.username).to.equal(res.body.username);
					expect(data.email).to.equal(res.body.email);
					expect(data.companyName).to.equal(res.body.companyName);
					expect(data.phoneNumber).to.equal(res.body.phoneNumber);
					expect(data.id).to.equal(res.body.id);
				});
		});

		it('should not return the admin given incorrect credentials', () => {
			return chai.request(app)
				.get(`/api/admin/${user.id}`)
				.set('Authorization', 'Bearer sonotqualified')
				.catch(res => {
					expect(res).to.have.status(401);
					expect(res.message).to.equal('Unauthorized');
				});
		});

		it('should not return the admin given incorrect ID', () => {
			return chai.request(app)
				.get('/api/admin/notanid')
				.set('Authorization', `Bearer ${token}`)
				.catch(res => {
					expect(res).to.have.status(400);
					expect(res.response.body.message).to.equal('The `id` is not valid');
				});
		});
	});

	describe('POST /api/admin', () => {
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

	describe('PUT /api/admin/:adminId', () => {
		it('should update the admin given correct credentials', () => {
			let res;

			return chai.request(app)
				.put(`/api/admin/${user.id}`)
				.send({username : 'mycoolusername'})
				.set('Authorization', `Bearer ${token}`)
				.then(_res => {
					res = _res;
					expect(res).to.have.status(200);
					expect(res.body).to.be.an('object');

					return Admin.findById(user.id);
				})
				.then(data => {
					expect(res.body.username).to.equal(data.username);
					expect(res.body.email).to.equal(data.email);
					expect(res.body.companyName).to.equal(data.companyName);
					expect(res.body.phoneNumber).to.equal(data.phoneNumber);
					expect(res.body.id).to.equal(data.id);
				});
		});

		it('should not update the user if adminId is not valid', () => {
			return chai.request(app)
				.put('/api/admin/notanid')
				.set('Authorization', `Bearer ${token}`)
				.catch(res => {
					expect(res).to.have.status(400);
					expect(res.response.body.message).to.equal('The `id` is not valid');
				});
		});

		it('should not update the user if username is not a string', () => {
			return chai.request(app)
				.put(`/api/admin/${user.id}`)
				.send({'username': 123})
				.set('Authorization', `Bearer ${token}`)
				.catch(res => {
					expect(res).to.have.status(422);
					expect(res.response.body.message).to.equal('Field: \'username\' must be typeof String');
				});
		});

		it('should not update the user if phoneNumber is not a number', () => {
			return chai.request(app)
				.put(`/api/admin/${user.id}`)
				.send({'phoneNumber': '123'})
				.set('Authorization', `Bearer ${token}`)
				.catch(res => {
					expect(res).to.have.status(422);
					expect(res.response.body.message).to.equal('Field: \'phoneNumber\' must be typeof Number');
				});
		});

		it('should not update the user username is not trimmed', () => {
			return chai.request(app)
				.put(`/api/admin/${user.id}`)
				.send({'username': 'nyupdatedemployee '})
				.set('Authorization', `Bearer ${token}`)
				.catch(res => {
					expect(res).to.have.status(422);
					expect(res.response.body.message).to.equal('Field: \'username\' cannot start or end with a whitespace!');
				});
		});

		it('should not update the user if username is too short', () => {
			return chai.request(app)
				.put(`/api/admin/${user.id}`)
				.send({'username': ''})
				.set('Authorization', `Bearer ${token}`)
				.catch(res => {
					expect(res).to.have.status(422);
					expect(res.response.body.message).to.equal('Field: \'username\' must be at least 1 characters long');
				});
		});

	});

	describe('DELETE /api/admin/:adminId', () => {
		it('should delete the user', () => {

			return chai.request(app)
				.delete(`/api/admin/${user.id}`)
				.then(res => {
					expect(res).to.have.status(204);

					return Admin.findById(user.id);
				})
				.then(data => expect(data).to.be.null);
		});

	});


});