
require('dotenv').config();

const { app } = require('../index');
const chai = require('chai');
const chaiHttp = require('chai-http');
const chaiExclude = require('chai-exclude');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const { TEST_DATABASE_URL, JWT_SECRET } = require('../config');

const Admin = require('../users/models/admin');
const Employee = require('../users/models/employee');
const Frame = require('../frames/model');

const expect = chai.expect;
chai.use(chaiHttp);
chai.use(chaiExclude);

describe('/api/frames', () => {

	let token;
	let user;
	let employee;
	let frame;

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
			.then(curruser => {
				user = curruser;
				token = jwt.sign(
					{user},
					JWT_SECRET,
					{subject : user.username});

				return Employee.create({
					firstname : 'Jane',
					lastname : 'Doe',
					img : 'jane.jpg',
					email : 'janesemail@test.com',
					adminId : user.id,
					password : 'test pass',
					phoneNumber: 1231231234
				});
			})
			.then(curremployee => {
				employee = curremployee;
				return Frame.create({
					adminId : user.id,
					employeeId : employee.id,
					startFrame : '2018-06-18 10:00',
					endFrame : '2018-06-18 11:00'
				});
			})
			.then(currframe => {
				frame = currframe;
				return Promise.all([
					Admin.createIndexes(),
					Employee.createIndexes(),
					Frame.createIndexes()
				]);
			});

	});
	afterEach(() => {
		return mongoose.connection.db.dropDatabase();
	});
	after(() => {
		return mongoose.disconnect();
	});

	describe('GET ALL /api/employee', () => {
		it('should return all employees for this user', () => {
			let res;

			return chai.request(app)
				.get('/api/frames')
				.set('Authorization', `Bearer ${token}`)
				.then(_res => {
					res = _res;
					expect(res).to.have.status(200);
					expect(res.body).to.be.an('array');
					expect(res.body[0].startFrame).to.be.a('string');
					expect(res.body[0].endFrame).to.be.a('string');

					return Frame.find({adminId : user.id});
				})
				.then(([data]) => {
					const result = res.body[0];
					expect(data.adminId.toString()).to.equal(result.adminId);
					expect(data.employeeId.toString()).to.equal(result.employeeId.id);
					expect(data.id).to.equal(result.id);
				});
		});
	});

	describe('GET ALL frames for one employee /api/employee/:employeeId', () => {
		it('should return all frames assigned to to that employee', () => {
			let res;

			return chai.request(app)
				.get(`/api/frames/${employee.id}`)
				.set('Authorization', `Bearer ${token}`)
				.then(_res => {
					res = _res;
					expect(res).to.have.status(200);
					expect(res.body).to.be.an('array');
					expect(res.body[0].startFrame).to.be.a('string');
					expect(res.body[0].endFrame).to.be.a('string');

					return Frame.find({
						adminId : user.id,
						employeeId : employee.id
					});
				})
				.then(([data]) => {
					const result = res.body[0];
					expect(data.adminId.toString()).to.equal(result.adminId);
					expect(data.employeeId.toString()).to.equal(result.employeeId);
					expect(data.id).to.equal(result.id);
				});
		});
	});

	describe('GET BY ID /api/frames/frame/:id', () => {
		it('should return a single frame given a correct ID', () => {
			let res;

			return chai.request(app)
				.get(`/api/frames/frame/${frame.id}`)
				.set('Authorization', `Bearer ${token}`)
				.then(_res => {
					res = _res;
					expect(res).to.have.status(200);
					expect(res).to.be.an('object');
					expect(res.body.startFrame).to.be.a('string');
					expect(res.body.endFrame).to.be.a('string');

					return Frame.findById(frame.id);
				})
				.then(data => {
					expect(data.adminId.toString()).to.equal(res.body.adminId);
					expect(data.employeeId.toString()).to.equal(res.body.employeeId);
					expect(data.id).to.equal(res.body.id);
				});
		});

		it('should throw an error if given incorrect id', () => {
			return chai.request(app)
				.get('/api/frames/frame/notanid')
				.set('Authorization', `Bearer ${token}`)
				.catch(res => {
					expect(res).to.have.status(400);
					expect(res.response.body.message).to.equal('The frame id notanid is not valid');
				});
		});
	});

	describe('POST /api/frames/frame/', () => {
		it('should create a frame given correct info', () => {
			let res;

			return chai.request(app)
				.post('/api/frames/frame')
				.send({
					adminId : user.id,
					employeeId : employee.id,
					startFrame : '2018-07-21 10:00:00.000',
					endFrame: '2018-07-21 11:00:00.000'
				})
				.set('Authorization', `Bearer ${token}`)
				.then( _res => {
					res = _res;
					expect(res).to.have.status(201);
					expect(res.body).to.be.an('object');
					expect(res.body.startFrame).to.be.a('string');
					expect(res.body.endFrame).to.be.a('string');

					return Frame.findById(res.body.id);
				}).then(data => {
					expect(data.adminId.toString()).to.equal(res.body.adminId);
					expect(data.employeeId.toString()).to.equal(res.body.employeeId);
					expect(data.id).to.equal(res.body.id);
				});
		});

		it('should not create an object when missing startFrame', () => {
			return chai.request(app)
				.post('/api/frames/frame')
				.send({
					adminId : user.id,
					employeeId : employee.id,
				})
				.set('Authorization', `Bearer ${token}`)
				.catch(res => {
					expect(res).to.have.status(422);
					expect(res.response.body.message).to.be.equal('Missing startFrame in request body');
				});
		});

		it('should throw an error if startFrame is not a string', () => {
			return chai.request(app)
				.post('/api/frames/frame/')
				.send({
					adminId : user.id,
					employeeId : employee.id,
					startFrame : 1234,
					endFrame: '2018-07-21 11:00:00.000'
				})
				.set('Authorization', `Bearer ${token}`)
				.catch(res => {
					expect(res).to.have.status(422);
					expect(res.response.body.message).to.equal('Field: \'startFrame\' must be typeof String');
				});
		});
	});

	describe('PUT /api/frames/frame/:id', () => {
		it('should update a frame given correct details', () => {
			let res;
			return chai.request(app)
				.put(`/api/frames/frame/${frame.id}`)
				.send({
					endFrame: '2018-07-21 11:30:00.000'
				})
				.set('Authorization', `Bearer ${token}`)
				.then( _res => {
					res = _res;
					expect(res).to.have.status(200);
					expect(res.body).to.be.an('object');
					expect(res.body.startFrame).to.be.a('string');
					expect(res.body.endFrame).to.be.a('string');

					return Frame.findById(frame.id);
				}).then(data => {
					expect(data.adminId.toString()).to.equal(res.body.adminId);
					expect(data.employeeId.toString()).to.equal(res.body.employeeId);
					expect(data.id).to.equal(res.body.id);
				});
		});

		it('should not update a frame when given incorrect ID', () => {
			return chai.request(app)
				.put('/api/frames/frame/notanid')
				.send({
					endFrame: '2018-07-21 11:30:00.000'
				})
				.set('Authorization', `Bearer ${token}`)
				.catch(res => {
					expect(res).to.have.status(400);
					expect(res.response.body.message).to.be.equal('The frame id notanid is not valid');
				});
		});
	});

	describe('DELETE /api/frames/frame/:id', () => {
		it('should delete a frame given correct Id', () => {
			return chai.request(app)
				.delete(`/api/frames/frame/${frame.id}`)
				.set('Authorization', `Bearer ${token}`)
				.then(res => {
					expect(res).to.have.status(204);

					return Frame.findById(frame.id);
				})
				.then(data => {
					expect(data).to.equal(null);
				});
		});

		it('should not delete a frame given invalid Id', () => {
			return chai.request(app)
				.delete('/api/frames/frame/notanid')
				.set('Authorization', `Bearer ${token}`)
				.catch(res => {
					expect(res).to.have.status(400);
					expect(res.response.body.message).to.equal('The frame id notanid is not valid');
				});
		});
	});
});