const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

require('dotenv').config({
  path: require('path').join(__dirname, '..', '.env'),
});

jest.setTimeout(30000);

const app = require('../server');
const User = require('../models/User');

const { connectTestDb, disconnectTestDb } = require('./setupDb');

beforeAll(async () => {
  await connectTestDb();

  await User.deleteMany({
    email: {
      $in: [
        'test@ims.com',
        'inactive@ims.com',
      ],
    },
  });

  await User.create({
    email: 'test@ims.com',
    password: bcrypt.hashSync('Test@1234', 10),
    role: 'hr',
  });

  await User.create({
    email: 'inactive@ims.com',
    password: bcrypt.hashSync('Test@1234', 10),
    role: 'hr',
    isActive: false,
  });
});

afterAll(async () => {
  await User.deleteMany({
    email: {
      $in: [
        'test@ims.com',
        'inactive@ims.com',
      ],
    },
  });

  await disconnectTestDb();
});

describe('Auth', () => {
  it('rejects login with wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@ims.com',
        password: 'wrong',
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('logs in with correct credentials and returns a token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@ims.com',
        password: 'Test@1234',
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
  });

  it('rejects protected route without a token', async () => {
    const res = await request(app)
      .get('/api/interns');

    expect(res.statusCode).toBe(401);
  });

  it('rejects an invalid JWT', async () => {
    const res = await request(app)
      .get('/api/interns')
      .set('Authorization', 'Bearer invalid.jwt.token');

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('rejects an expired JWT', async () => {
    const user = await User.findOne({
      email: 'test@ims.com',
    });

    const expiredToken = jwt.sign(
      { id: user._id },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: '-1s' }
    );

    const res = await request(app)
      .get('/api/interns')
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('rejects an inactive user even with a valid JWT', async () => {
    const user = await User.findOne({
      email: 'inactive@ims.com',
    });

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: '15m' }
    );

    const res = await request(app)
      .get('/api/interns')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });
});