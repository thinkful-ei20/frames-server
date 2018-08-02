
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

describe.only('ADMIN - /api/admin', () => {

	const username = 'exampleuser123';
	const email = 'exampleuser123@test.com';
	const companyName = 'merntalists';
	const password = 'password123';
	const phoneNumber = '2225551111';

	let token;
	let user;


	before(() => {
		return mongoose.connect(TEST_DATABASE_URL)
			.then(() => mongoose.connection.db.dropDatabase());
	});
	beforeEach(() => {
		return Admin.create({
			username,
			email,
			companyName,
			password,
			phoneNumber,
		})
			.then((currUser) => {
				user = currUser;
				token = jwt.sign(
					{user},
					JWT_SECRET,
					{subject : user.username});
			})
			.then(() => {
				return Admin.createIndexes();
			});
	});
	afterEach(() => {
		return mongoose.connection.db.dropDatabase();
	});
	after(() => {
		return mongoose.disconnect();
	});

	// describe('GET ALL /api/admin', () => {
	// 	it('should return an array of all admins', () => {
	// 		let res;

	// 		return chai
	// 			.request(app)
	// 			.get('/api/admin')
	// 			.then(_res => {
	// 				console.log(_res);
	// 				res = _res;
	// 				expect(res).to.have.status(200);
	// 				expect(res.body).to.be.an('array');

	// 				return Admin.find();
	// 			})
	// 			.then(data => {
	// 				expect(res.body[0]['username']).to.be.equal(data[0]['username']);
	// 				expect(res.body[0]['email']).to.be.equal(data[0]['email']);
	// 				expect(res.body[0]['companyName']).to.be.equal(data[0]['companyName']);
	// 				expect(res.body[0]['phoneNumber']).to.be.equal(data[0]['phoneNumber']);
	// 				expect(res.body[0]['id']).to.be.equal(data[0]['id']);
	// 			});
	// 	});
	// });

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
				.send({ username : 'mycooluser',
					email : 'auniqueemail@gmail.com',
					companyName : 'Cool Co Kweens!',
					password : 'password10',
					phoneNumber : '1231231234' })
				.then(_res => {
					res = _res;
					expect(res).to.have.status(201);
					expect(res.body).to.be.an('object');
					expect(res.body).to.have.keys('id', 'username', 'email', 'companyName', 'phoneNumber', 'createdAt', 'updatedAt');
					expect(res.body.id).to.exist;
					expect(res.body.username).to.equal('mycooluser');
					expect(res.body.email).to.equal('auniqueemail@gmail.com');
					expect(res.body.companyName).to.equal('Cool Co Kweens!');
					expect(res.body.phoneNumber).to.equal('1231231234');
					return Admin.findOne({ username : 'mycooluser' });
				})
				.then(Admin => {
					expect(Admin).to.exist;
					expect(Admin.id).to.equal(res.body.id);
					return Admin.validatePassword('password10');
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
				.send({username : 'mycoolusername', password: 'password123'})
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

		it('should not update the user if required string fields are not typeof string', () => {
			const usernameUpdate = chai.request(app)
				.put(`/api/admin/${user.id}`)
				.send({'username': 123})
				.set('Authorization', `Bearer ${token}`)
				.catch(res => {
					expect(res).to.have.status(422);
					expect(res.response.body.message).to.equal('Field: \'username\' must be typeof String');
				});

			const emailUpdate = chai.request(app)
				.put(`/api/admin/${user.id}`)
				.send({'email': 123})
				.set('Authorization', `Bearer ${token}`)
				.catch(res => {
					expect(res).to.have.status(422);
					expect(res.response.body.message).to.equal('Field: \'email\' must be typeof String');
				});

			const companyNameUpdate = chai.request(app)
				.put(`/api/admin/${user.id}`)
				.send({'companyName': 123})
				.set('Authorization', `Bearer ${token}`)
				.catch(res => {
					expect(res).to.have.status(422);
					expect(res.response.body.message).to.equal('Field: \'companyName\' must be typeof String');
				});

			const passwordUpdate = chai.request(app)
				.put(`/api/admin/${user.id}`)
				.send({'password': 123})
				.set('Authorization', `Bearer ${token}`)
				.catch(res => {
					expect(res).to.have.status(422);
					expect(res.response.body.message).to.equal('Field: \'password\' must be typeof String');
				});

			const phoneNumberUpdate = chai.request(app)
				.put(`/api/admin/${user.id}`)
				.send({'phoneNumber': 123})
				.set('Authorization', `Bearer ${token}`)
				.catch(res => {
					expect(res).to.have.status(422);
					expect(res.response.body.message).to.equal('Field: \'phoneNumber\' must be typeof String');
				});

			Promise.all([
				usernameUpdate,
				emailUpdate,
				companyNameUpdate,
				passwordUpdate,
				phoneNumberUpdate
			]);
		});

		it('should not update the user if required trimmed fields are not trimmed', () => {
			const usernameUpdate = chai.request(app)
				.put(`/api/admin/${user.id}`)
				.send({'username': ' newusername '})
				.set('Authorization', `Bearer ${token}`)
				.catch(res => {
					expect(res).to.have.status(422);
					expect(res.response.body.message).to.equal('Field: \'username\' cannot start or end with a whitespace!');
				});

			const emailUpdate = chai.request(app)
				.put(`/api/admin/${user.id}`)
				.send({'email': ' test@email.com '})
				.set('Authorization', `Bearer ${token}`)
				.catch(res => {
					expect(res).to.have.status(422);
					expect(res.response.body.message).to.equal('Field: \'email\' cannot start or end with a whitespace!');
				});

			const companyNameUpdate = chai.request(app)
				.put(`/api/admin/${user.id}`)
				.send({'companyName': ' test company name '})
				.set('Authorization', `Bearer ${token}`)
				.catch(res => {
					expect(res).to.have.status(422);
					expect(res.response.body.message).to.equal('Field: \'companyName\' cannot start or end with a whitespace!');
				});

			const passwordUpdate = chai.request(app)
				.put(`/api/admin/${user.id}`)
				.send({'password': ' testpassword '})
				.set('Authorization', `Bearer ${token}`)
				.catch(res => {
					expect(res).to.have.status(422);
					expect(res.response.body.message).to.equal('Field: \'password\' cannot start or end with a whitespace!');
				});

			const phoneNumberUpdate = chai.request(app)
				.put(`/api/admin/${user.id}`)
				.send({'phoneNumber': ' 1234567890 '})
				.set('Authorization', `Bearer ${token}`)
				.catch(res => {
					expect(res).to.have.status(422);
					expect(res.response.body.message).to.equal('Field: \'phoneNumber\' cannot start or end with a whitespace!');
				});

			Promise.all([
				usernameUpdate,
				emailUpdate,
				companyNameUpdate,
				passwordUpdate,
				phoneNumberUpdate
			]);
		});

		it.only('should not update the field if the length requirements are not met', () => {
			const usernameUpdateShort = chai.request(app)
				.put(`/api/admin/${user.id}`)
				.send({'username': ''})
				.set('Authorization', `Bearer ${token}`)
				.catch(res => {
					// console.log(res);
					expect(res).to.have.status(422);
					expect(res.response.body.message).to.equal('Field: \'username\' must be at least 1 characters long');
				});

			// const emailUpdateShort = chai.request(app)
			// 	.put(`/api/admin/${user.id}`)
			// 	.send({'email': 't@s.t'})
			// 	.set('Authorization', `Bearer ${token}`)
			// 	.catch(res => {
			// 		expect(res).to.have.status(422);
			// 		expect(res.response.body.message).to.equal('Field: \'email\' must be at least 6 characters long');
			// 	});

			// const companyNameUpdateShort = chai.request(app)
			// 	.put(`/api/admin/${user.id}`)
			// 	.send({'companyName': ''})
			// 	.set('Authorization', `Bearer ${token}`)
			// 	.catch(res => {
			// 		expect(res).to.have.status(422);
			// 		expect(res.response.body.message).to.equal('Field: \'companyName\' must be at least 1 characters long');
			// 	});

			// const passwordUpdateShort = chai.request(app)
			// 	.put(`/api/admin/${user.id}`)
			// 	.send({'password': '1234567'})
			// 	.set('Authorization', `Bearer ${token}`)
			// 	.catch(res => {
			// 		expect(res).to.have.status(422);
			// 		expect(res.response.body.message).to.equal('Field: \'password\' must be at least 8 characters long');
			// 	});

			// const passwordUpdateLong= chai.request(app)
			// 	.put(`/api/admin/${user.id}`)
			// 	.send({'password': '1234567890123456789012345678901234567890123456789012345678901234567890123'})
			// 	.set('Authorization', `Bearer ${token}`)
			// 	.catch(res => {
			// 		expect(res).to.have.status(422);
			// 		expect(res.response.body.message).to.equal('Field: \'password\' must be at most 72 characters long ');
			// 	});


			Promise.all([
				usernameUpdateShort//,
				// emailUpdateShort,
				// companyNameUpdateShort,
				// passwordUpdateShort,
				// passwordUpdateLong
			]);
		});
	});

	// describe('DELETE /api/admin/:adminId', () => {

	// 	it('should delete the user', () => {
	// 		return chai.request(app)
	// 			.delete(`/api/admin/${user.id}`)
	// 			.then(res => {
	// 				expect(res).to.have.status(204);

	// 				return Admin.findById(user.id);
	// 			})
	// 			.then(data => expect(data).to.be.null);
	// 	});
	// });

});