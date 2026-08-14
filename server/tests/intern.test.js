const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const app = require('../server');
const User = require('../models/User');
const Intern = require('../models/Intern');

let hrToken;

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) await mongoose.connect(process.env.MONGODB_URI);
  await User.deleteMany({ email: { $in: ['hrtest@ims.com', 'newintern@ims.com'] } });
  await Intern.deleteMany({ email: 'newintern@ims.com' });

  await User.create({ email: 'hrtest@ims.com', password: bcrypt.hashSync('Hr@1234567', 10), role: 'hr' });
  const loginRes = await request(app).post('/api/auth/login').send({ email: 'hrtest@ims.com', password: 'Hr@1234567' });
  hrToken = loginRes.body.data.accessToken;
});

afterAll(async () => {
  await User.deleteMany({ email: { $in: ['hrtest@ims.com', 'newintern@ims.com'] } });
  await Intern.deleteMany({ email: 'newintern@ims.com' });
  await mongoose.disconnect();
});

describe('Intern CRUD', () => {
  it('creates a new intern as HR', async () => {
    const res = await request(app)
      .post('/api/interns')
      .set('Authorization', `Bearer ${hrToken}`)
      .send({
        email: 'newintern@ims.com', password: 'Intern@1234', fullName: 'Test Intern',
        joiningDate: '2026-01-01', internshipEndDate: '2026-06-01',
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.data.fullName).toBe('Test Intern');
  });

  it('blocks intern creation without auth', async () => {
    const res = await request(app).post('/api/interns').send({ email: 'x@x.com' });
    expect(res.statusCode).toBe(401);
  });
});
