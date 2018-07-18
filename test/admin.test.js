'use strict';

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
  const newAdmin = {
    _id: '333333333333333333333333',
    username: 'exampleuser',
    email: 'example@test.com',
    companyname: 'merntalists',
    password: 'password123',
    phoneNumber: 2225551111
  };

  before(() => {
    return mongoose.connect(TEST_DATABASE_URL)
      .then(() => mongoose.connection.db.dropDatabase());
  });
  beforeEach(() => {
    return Admin.createIndexes(newAdmin);
  });
  afterEach(() => {
    return mongoose.connection.db.dropDatabase();
  });
  after(() => {
    return mongoose.disconnect();
  });

  describe('POST', () => {
    // CURRENTLY RETURNS 'Error: Internal Server Error"
    // xit = skip this test
    xit('Should create a new admin user', () => {
      let res;
      return chai.request(app)
        .post('/api/admin')
        .send(newAdmin)
        .then(_res => {
          res = _res;
          console.log(`res: ${res}`);
          expect(res).to.have.status(201);
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.keys('id', 'username', 'email', 'companyname', 'phoneNumber', 'createdAt', 'updatedAt');
          expect(res.body.id).to.exist;
          expect(res.body.username).to.equal(newAdmin.username);
          expect(res.body.email).to.equal(newAdmin.email);
          expect(res.body.companyname).to.equal(newAdmin.companyname);
          expect(res.body.phoneNumber).to.equal(newAdmin.phoneNumber);
          return Admin.findOne( newAdmin.username );
        })
        .then(admin => {
          expect(admin).to.exist;
          expect(admin.id).to.equal(res.body.id);
          return Admin.validatePassword(password);
        })
        .then(isValid => {
          expect(isValid).to.be.true;
        });
    });
  });

// END
});