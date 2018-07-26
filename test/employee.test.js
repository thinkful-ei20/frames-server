require('dotenv').config();

const { app } = require('../index');
const chai = require('chai');
const chaiHttp = require('chai-http');
const chaiExclude = require('chai-exclude');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const { TEST_DATABASE_URL, JWT_SECRET } = require('../config');

const Employee = require('../users/models/employee');
const Admin = require('../users/models/admin');

const expect = chai.expect;
chai.use(chaiHttp);
chai.use(chaiExclude);

describe('Employee - /api/employee', () => {
  const dummyEmployee = {
    firstname: 'Firstname',
    lastname: 'Lastname',
    img: 'image.png',
    email: 'example@test.com',
    password: 'password123',
    phoneNumber: 2225551111
  };

  const dummyAdmin = {
    username : 'exampleuser123',
    email : 'example123@test.com',
    companyName : 'merntalists',
    password : 'password123',
    phoneNumber : 2225551111
  };

  let token;
  let admin;
  let employee;


  before(() => {
    return mongoose.connect(TEST_DATABASE_URL)
      .then(() => mongoose.connection.db.dropDatabase());
  });

  beforeEach(() => {
    return Promise.all([
      Admin.hashPassword(dummyAdmin.password),
      Employee.hashPassword(dummyEmployee.password)
    ])
      .then(([ adminHash, employeeHash ]) => {
        dummyAdmin.password = adminHash;
        dummyEmployee.password = employeeHash;
        return Admin.create(dummyAdmin);
      })
      .then(currAdmin => {
        admin = currAdmin;
        token = jwt.sign(
          {user: admin},
          JWT_SECRET,
          {subject : admin.username});
        dummyEmployee.adminId = admin.id;
        return Employee.create(dummyEmployee);
      })
      .then(currEmployee => {
        employee = currEmployee;
        return Promise.all([Admin.createIndexes(), Employee.createIndexes()])
      })
  });

  afterEach(() => {
    return mongoose.connection.db.dropDatabase();
  });

  after(() => {
    return mongoose.disconnect();
  });

  describe('GET /api/employee', () => {
    it('should return correct number of employees for the Admin User', () => {
      let res;
      return chai.request(app)
        .get('/api/employee')
        .set('Authorization', `Bearer ${token}`)
        .then(_res => {
          res = _res;
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('array');
          expect(res.body).to.have.length(1);
          return Employee.find({_id: employee.id, adminId: admin.id});
          })
				.then(([dbData]) => {
          const result = res.body[0];
          expect(dbData.adminId.toString()).to.equal(result.adminId);
          expect(dbData.id.toString()).to.equal(result.id);
				})
    });
  });

  describe('GET /api/employee/:empoyeeId', () => {
  	it('should return correct employee for the Admin User', () => {
			let res;
			return chai.request(app)
				.get(`/api/employee/${employee.id}`)
        .set('Authorization', `Bearer ${token}`)
				.then(_res => {
          res = _res;
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          return Employee.findOne({_id: employee.id, adminId: admin.id})
				})
				.then(dbData => {
					let result = res.body;
          expect(dbData.adminId.toString()).to.equal(result.adminId);
          expect(dbData.id.toString()).to.equal(result.id);
				})
		})

		it('should return correct fields for an employee', () => {
      let res;

      return chai.request(app)
        .get(`/api/employee/${employee.id}`)
        .set('Authorization', `Bearer ${token}`)
        .then(_res => {
          res = _res;
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          return Employee.findOne({_id: employee.id, adminId: admin.id})
        })
        .then(dbData => {
          let result = res.body;
          expect(dbData.adminId.toString()).to.equal(result.adminId);
          expect(dbData.id.toString()).to.equal(result.id);
          expect(res.body['firstname']).to.be.equal(dbData['firstname']);
          expect(res.body['lastname']).to.be.equal(dbData['lastname']);
          expect(res.body['img']).to.be.equal(dbData['img']);
          expect(res.body['email']).to.be.equal(dbData['email']);
          expect(res.body['phoneNumber']).to.be.equal(dbData['phoneNumber']);
        })
		});

    it('should respond with a 400 for an invalid employee ID', () => {
      return chai.request(app)
        .get(`/api/employee/badId`)
        .set('Authorization', `Bearer ${token}`)
        .catch(res => {
          expect(res).to.have.status(400);
          expect(res.response.body.message).to.equal(`The employee id badId is not valid`);
        });
		});

    it('should respond with a 404 for non-existent id', function () {
      // "DOESNOTEXIST" is 12 byte string which is a valid Mongo ObjectId()
      return chai.request(app)
        .get('/api/employee/DOESNOTEXIST')
        .set('Authorization', `Bearer ${token}`)
        .catch(res => {
          expect(res).to.have.status(404);
          expect(res.response.body.message).to.equal('Not Found');
        });
    });
  });

  describe('PUT /api/employee/:empoyeeId', () => {

  	it('should update "lastname" field for an existing employee', () => {
      let res;
      const updateItem = { 'lastname': 'Anothername' };
      return chai.request(app)
        .put(`/api/employee/${employee.id}`)
        .send(updateItem)
        .set('Authorization', `Bearer ${token}`)
        .then( _res => {
          res = _res;
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('object');
          expect(res.body['lastname']).to.be.equal(updateItem.lastname);
          return Employee.findOne({_id: employee.id, adminId: admin.id});
        }).then(dbData => {
        	let result = res.body;
          expect(dbData.adminId.toString()).to.equal(result.adminId);
          expect(dbData.id.toString()).to.equal(result.id);
          expect(res.body['lastname']).to.be.equal(dbData['lastname']);
        });
    });

    it('should respond with a 400 for an invalid ID', () => {
      return chai.request(app)
        .put('/api/employee/badid')
        .send({ 'lastname': 'Anothername' })
        .set('Authorization', `Bearer ${token}`)
        .catch(res => {
          expect(res).to.have.status(400);
          expect(res.response.body.message).to.be.equal('The employee id badid is not valid');
        });
    });

    it('should respond with a 404 for non-existent id', function () {
      // "DOESNOTEXIST" is 12 byte string which is a valid Mongo ObjectId()
      return chai.request(app)
        .put('/api/employee/DOESNOTEXIST')
        .send({ 'lastname': 'Anothername' })
				.set('Authorization', `Bearer ${token}`)
        .catch(res => {
          expect(res).to.have.status(404);
          expect(res.response.body.message).to.equal('Not Found');
        });
    });

    it('should respond with 422 if email is NOT typeof string', () => {
      return chai.request(app)
        .put(`/api/employee/${employee.id}`)
        .send({'email': 123})
        .set('Authorization', `Bearer ${token}`)
        .catch(res => {
          expect(res).to.have.status(422);
          expect(res.response.body.message).to.equal(`Field: 'email' must be typeof String`);
        });
    });

    it('should respond with 422 if phone number is NOT typeof number', () => {
      return chai.request(app)
        .put(`/api/employee/${employee.id}`)
        .send({'phoneNumber': '123'})
        .set('Authorization', `Bearer ${token}`)
        .catch(res => {
          expect(res).to.have.status(422);
          expect(res.response.body.message).to.equal(`Field: 'phoneNumber' must be typeof Number`);
        });
    });

    it('should respond with 422 if email is NOT trimmed', () => {
      return chai.request(app)
        .put(`/api/employee/${employee.id}`)
        .send({'email': 'example@test.com ' })
        .set('Authorization', `Bearer ${token}`)
        .catch(res => {
          expect(res).to.have.status(422);
          expect(res.response.body.message).to.equal(`Field: 'email' cannot start or end with a whitespace!`);
        });
    });

    it('should return 400 when given a duplicate email', () => {
      const anotherEmployee = {
        firstname: 'Firstname',
        lastname: 'Lastname',
        img: 'image.png',
        email: 'fake@email.com',
        password: 'password123',
        phoneNumber: 2225551111,
				adminId: admin.id
      };
    	return Employee.create(anotherEmployee)
				.then(() => {
					return chai.request(app)
						.put(`/api/employee/${employee.id}`)
						.set('Authorization', `Bearer ${token}`)
						.send({ 'email': 'fake@email.com' })
				})
				.catch(res => {
					expect(res).to.have.status(400);
					expect(res.response.body.message).to.equal('Email already exists');
        })
    });

  });

  describe('POST /api/employee', () => {

    it('should create a new employee', () => {
      const anotherEmployee = {
        firstname: 'Firstname',
        lastname: 'Lastname',
        img: 'image.png',
        email: 'test@email.com',
        password: 'password123',
        phoneNumber: 2225551111
      };
      let res;
      return chai.request(app)
        .post('/api/employee')
        .set('Authorization', `Bearer ${token}`)
        .send(anotherEmployee)
        .then(_res => {
          res = _res;
          expect(res).to.have.status(201);
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.keys('id', 'firstname', 'lastname', 'img', 'email', 'adminId', 'phoneNumber');
          expect(res.body.id).to.exist;
          expect(res.body.firstname).to.equal(anotherEmployee.firstname);
          expect(res.body.lastname).to.equal(anotherEmployee.lastname);
          expect(res.body.img).to.equal(anotherEmployee.img);
          expect(res.body.email).to.equal(anotherEmployee.email);
          expect(res.body.phoneNumber).to.equal(anotherEmployee.phoneNumber);
          return Employee.findById(res.body.id);
        })
        .then(dbEmployee => {
          expect(dbEmployee).to.exist;
          expect(dbEmployee.id).to.equal(res.body.id);
          expect(dbEmployee.adminId.toString()).to.equal(res.body.adminId);
        });
    });

    it('should respond with 422 if email is missing', () => {
      const anotherEmployee = {
        firstname: 'Firstname',
        lastname: 'Lastname',
        img: 'image.png',
        password: 'password123',
        phoneNumber: 2225551111
      };
      return chai.request(app)
        .post(`/api/employee`)
        .send(anotherEmployee)
        .set('Authorization', `Bearer ${token}`)
        .catch(res => {
          expect(res).to.have.status(422);
          expect(res.response.body.message).to.equal(`Missing email in request body`);
        });
    });

    it('should respond with 422 if email is NOT typeof string', () => {
      const anotherEmployee = {
        firstname: 'Firstname',
        lastname: 'Lastname',
        img: 'image.png',
        email: 123,
        password: 'password123',
        phoneNumber: 2225551111
      };
      return chai.request(app)
        .post(`/api/employee`)
        .send(anotherEmployee)
        .set('Authorization', `Bearer ${token}`)
        .catch(res => {
          expect(res).to.have.status(422);
          expect(res.response.body.message).to.equal(`Field: 'email' must be typeof String`);
        });
    });

    it('should respond with 422 if phone number is NOT typeof number', () => {
      const anotherEmployee = {
        firstname: 'Firstname',
        lastname: 'Lastname',
        img: 'image.png',
        email: 'test@email.com',
        password: 'password123',
        phoneNumber: '2225551111'
      };
      return chai.request(app)
        .post(`/api/employee`)
        .send(anotherEmployee)
        .set('Authorization', `Bearer ${token}`)
        .catch(res => {
          expect(res).to.have.status(422);
          expect(res.response.body.message).to.equal(`Field: 'phoneNumber' must be typeof Number`);
        });
    });

    it('should respond with 422 if email is NOT trimmed', () => {
      const anotherEmployee = {
        firstname: 'Firstname',
        lastname: 'Lastname',
        img: 'image.png',
        email: 'test@email.com ',
        password: 'password123',
        phoneNumber: 2225551111
      };
      return chai.request(app)
        .post(`/api/employee`)
        .send(anotherEmployee)
        .set('Authorization', `Bearer ${token}`)
        .catch(res => {
          expect(res).to.have.status(422);
          expect(res.response.body.message).to.equal(`Field: 'email' cannot start or end with a whitespace!`);
        });
    });

    it('should respond with 422 if password is too short', () => {
      const anotherEmployee = {
        firstname: 'Firstname',
        lastname: 'Lastname',
        img: 'image.png',
        email: 'test@email.com',
        password: 'pass',
        phoneNumber: 2225551111
      };
      return chai.request(app)
        .post(`/api/employee`)
        .send(anotherEmployee)
        .set('Authorization', `Bearer ${token}`)
        .catch(res => {
          expect(res).to.have.status(422);
          expect(res.response.body.message).to.equal(`Field: 'password' must be at least 8 characters long`);
        });
    });

    it('should respond with 422 if password is too long', () => {
      const anotherEmployee = {
        firstname: 'Firstname',
        lastname: 'Lastname',
        img: 'image.png',
        email: 'test@email.com',
        password: 'password1233333333333333333333333333333333333333333333333333333333333333333333333333333333333333',
        phoneNumber: 2225551111
      };
      return chai.request(app)
        .post(`/api/employee`)
        .send(anotherEmployee)
        .set('Authorization', `Bearer ${token}`)
        .catch(res => {
          expect(res).to.have.status(422);
          expect(res.response.body.message).to.equal(`Field: 'password' must be at most 72 characters long`);
        });
    });

    it('should return 400 when given a duplicate email', () => {
      const anotherEmployee = {
        firstname: 'Firstname',
        lastname: 'Lastname',
        img: 'image.png',
        email: 'example@test.com',
        password: 'password123',
        phoneNumber: 2225551111
      };
			return chai.request(app)
				.post(`/api/employee`)
				.send(anotherEmployee)
				.set('Authorization', `Bearer ${token}`)
				.catch(res => {
					expect(res).to.have.status(400);
					expect(res.response.body.message).to.equal('Email already exists');
			})
    });

	});

  describe('DELETE /api/employee/:employeeId', () => {

  	it('it should delete the employee', () => {
      return chai.request(app)
        .delete(`/api/employee/${employee.id}`)
        .set('Authorization', `Bearer ${token}`)
        .then(res => {
          expect(res).to.have.status(204);
          return Employee.findById(employee.id);
        })
        .then(data => expect(data).to.be.null);
    });

  });

});