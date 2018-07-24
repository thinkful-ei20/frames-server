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

describe.only('FRAMES - Employee', () => {
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
      console.log('ADMIN HASH', adminHash);
      dummyAdmin.password = adminHash;
      dummyEmployee.password = employeeHash;
      return Admin.create(dummyAdmin);
    })
      .then(currAdmin => {
        admin = currAdmin;
        console.log('ADMIN', admin);
        token = jwt.sign(
          {admin},
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
    it('should return an array of all employees', () => {
      let res;
      console.log('ADMIN', admin);
      console.log('EMPLOYEE', employee);

      return chai.request(app)
        .get('/api/employee')
        .set('Authorization', `Bearer ${token}`)
        .then(_res => {

          console.log('RESSSSS', _res);
          // res = _res;
          // expect(res).to.have.status(200);
          // expect(res).to.be.json;
          // expect(res.body).to.be.an('array');
          // expect(res.body).to.have.length()
          //
          // return Admin.find();
        // })
        // .then(data => {
        //   expect(res.body[0]['username']).to.be.equal(data[0]['username']);
        //   expect(res.body[0]['email']).to.be.equal(data[0]['email']);
        //   expect(res.body[0]['companyName']).to.be.equal(data[0]['companyName']);
        //   expect(res.body[0]['phoneNumber']).to.be.equal(data[0]['phoneNumber']);
        //   expect(res.body[0]['id']).to.be.equal(data[0]['id']);
        });
    });
  });

});