'use strict';
/** api/auth/login test */

require('dotenv').config();

const { app } = require('../index');
const chai = require('chai');
const chaiHttp = require('chai-http');
const jwt = require('jsonwebtoken');

const { TEST_DATABASE_URL, JWT_SECRET } = require('../config');
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