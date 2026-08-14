const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const app = require('../server');
const User = require('../models/User');

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI);
  }
  await User.deleteMany({ email: 'test@ims.com' });
  await User.create({ email: 'test@ims.com', password: bcrypt.hashSync('Test@1234', 10), role: 'hr' });
});

afterAll(async () => {
  await User.deleteMany({ email: 'test@ims.com' });
  await mongoose.disconnect();
});

describe('Auth', () => {
  it('rejects login with wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'test@ims.com', password: 'wrong' });
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('logs in with correct credentials and returns a token', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'test@ims.com', password: 'Test@1234' });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
  });

  it('rejects protected route without a token', async () => {
    const res = await request(app).get('/api/interns');
    expect(res.statusCode).toBe(401);
  });
});
