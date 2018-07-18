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

describe('Frames API - Login', () => {
  let token;
  const _id = '333333333333333333333333';
  const username = 'exampleuser';
  const email = 'example@test.com';
  const companyname = 'merntalists';
  const password = 'password123';
  const phoneNumber = 2225551111;

  before(() => {
    return mongoose.connect(TEST_DATABASE_URL)
      .then(() => mongoose.connection.db.dropDatabase());
  });

  beforeEach(() => {
    return Admin.hashPassword(password)
      .then(digest => Admin.create({
        _id,
        username,
        email,
        companyname,
        password: digest,
        phoneNumber,
      }));
  });

  afterEach(() => {
    return mongoose.connection.db.dropDatabase();
  });

  after(() => {
    return mongoose.disconnect();
  });

  /* =================================================================================== */
  describe('Frames /api/login', () => {
    it('Should return a valid auth token', () => {
      return chai.request(app)
        .post('/api/login')
        .send({ username, email, companyname, password })
        .then(res => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('object');
          expect(res.body.authToken).to.be.a('string');
          
          const payload = jwt.verify(res.body.authToken, JWT_SECRET);
          expect(payload.user).to.not.have.property('password');
          expect(payload.user).excluding(['createdAt', 'updatedAt']).to.deep.equal({ username, email, phoneNumber, id: _id });
        });
    });

    it('Should reject requests without credentials', () => {
      return chai.request(app)
        .post('/api/login')
        .send({ username, email, companyname, password })
        .catch(res => {
          expect(res).to.have.status(422);
          expect(res.body).to.be.an('object');
        });
    });
  });

  describe('/api/refresh', () => {
    it('Should reject requests with an invalid token', () => {
      token = jwt.sign({ username, email, companyname, password }, 'Incorrect Secret');
      return chai.request(app)
        .post('/api/refresh')
        .set('Authorization', `Bearer ${token}`)
        .catch(res => {
          expect(res).to.have.status(401);
        });
    });

    it('Should reject requests with an expired token', () => {
      token = jwt.sign({ username, email, companyname, password }, JWT_SECRET, { subject: username, expiresIn: Math.floor(Date.now() / 1000) - 10 });
      return chai.request(app)
        .post('/api/refresh')
        .set('Authorization', `Bearer ${token}`)
        .catch(res => {
          expect(res).to.have.status(401);
        });
    });

    it('Should return a valid auth token with a newer expiry date', () => {
      const user = { id: _id, username, email, companyname, password };
      const token = jwt.sign({ user }, JWT_SECRET, { subject: username, expiresIn: '1m' });
      const decoded = jwt.decode(token);

      return chai.request(app)
        .post('/api/refresh')
        .set('Authorization', `Bearer ${token}`)
        .then(res => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('object');
          const authToken = res.body.authToken;
          expect(authToken).to.be.a('string');

          const payload = jwt.verify(authToken, JWT_SECRET);
          expect(payload.user).to.not.have.property('password');
          expect(payload.user).excluding(['createdAt', 'updatedAt']).to.deep.equal({ username, email, phoneNumber, id: _id });
          expect(payload.exp).to.be.greaterThan(decoded.exp);
        });
    });
  });
// End
});