const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

require('dotenv').config({
  path: require('path').join(__dirname, '..', '.env'),
});

jest.setTimeout(30000);

const app = require('../server');
const User = require('../models/User');
const Intern = require('../models/Intern');

let hrToken;
let internAToken;
let internA;
let internB;

const testEmails = [
  'hrtest@ims.com',
  'newintern@ims.com',
  'interna@ims.com',
  'internb@ims.com',
  'unauthorized@ims.com',
];

const testInternEmails = [
  'newintern@ims.com',
  'interna@ims.com',
  'internb@ims.com',
  'unauthorized@ims.com',
];

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI);
  }

  // Clean test data before running tests
  await User.deleteMany({
    email: { $in: testEmails },
  });

  await Intern.deleteMany({
    email: { $in: testInternEmails },
  });

  // -----------------------------
  // Create HR test user
  // -----------------------------
  await User.create({
    email: 'hrtest@ims.com',
    password: bcrypt.hashSync('Hr@1234567', 10),
    role: 'hr',
  });

  // Login as HR
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'hrtest@ims.com',
      password: 'Hr@1234567',
    });

  expect(loginRes.statusCode).toBe(200);

  hrToken = loginRes.body.data.accessToken;

  // -----------------------------
  // Create Intern A user
  // -----------------------------
  const internAUser = await User.create({
    email: 'interna@ims.com',
    password: bcrypt.hashSync('Intern@1234', 10),
    role: 'intern',
  });

  // Create Intern A profile
  internA = await Intern.create({
    user: internAUser._id,
    email: 'interna@ims.com',
    fullName: 'Intern A',
    joiningDate: new Date('2026-01-01'),
    internshipEndDate: new Date('2026-06-01'),
    status: 'upcoming',
  });

  // Connect Intern A user to Intern A profile
  internAUser.profileRef = internA._id;
  internAUser.profileModel = 'Intern';

  await internAUser.save();

  // -----------------------------
  // Create Intern B user
  // -----------------------------
  const internBUser = await User.create({
    email: 'internb@ims.com',
    password: bcrypt.hashSync('Intern@1234', 10),
    role: 'intern',
  });

  // Create Intern B profile
  internB = await Intern.create({
    user: internBUser._id,
    email: 'internb@ims.com',
    fullName: 'Intern B',
    joiningDate: new Date('2026-01-01'),
    internshipEndDate: new Date('2026-06-01'),
    status: 'upcoming',
  });

  // Connect Intern B user to Intern B profile
  internBUser.profileRef = internB._id;
  internBUser.profileModel = 'Intern';

  await internBUser.save();

  // -----------------------------
  // Login as Intern A
  // -----------------------------
  const internLoginRes = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'interna@ims.com',
      password: 'Intern@1234',
    });

  expect(internLoginRes.statusCode).toBe(200);

  internAToken = internLoginRes.body.data.accessToken;
});

afterAll(async () => {
  // Clean up test data
  await User.deleteMany({
    email: { $in: testEmails },
  });

  await Intern.deleteMany({
    email: { $in: testInternEmails },
  });

  await mongoose.disconnect();
});

describe('Intern CRUD', () => {

  // ---------------------------------
  // HR authorization
  // ---------------------------------

  it('creates a new intern as HR', async () => {
    const res = await request(app)
      .post('/api/interns')
      .set('Authorization', `Bearer ${hrToken}`)
      .send({
        email: 'newintern@ims.com',
        password: 'Intern@1234',
        fullName: 'Test Intern',
        joiningDate: '2026-01-01',
        internshipEndDate: '2026-06-01',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.fullName).toBe('Test Intern');
  });

  // ---------------------------------
  // Authentication
  // ---------------------------------

  it('blocks intern creation without auth', async () => {
    const res = await request(app)
      .post('/api/interns')
      .send({
        email: 'x@x.com',
      });

    expect(res.statusCode).toBe(401);
  });

  // ---------------------------------
  // RBAC / Role bypass protection
  // ---------------------------------

  it('blocks an intern from creating another intern', async () => {
    const res = await request(app)
      .post('/api/interns')
      .set('Authorization', `Bearer ${internAToken}`)
      .send({
        email: 'unauthorized@ims.com',
        password: 'Intern@1234',
        fullName: 'Unauthorized Intern',
        joiningDate: '2026-01-01',
        internshipEndDate: '2026-06-01',
      });

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
  });

  // ---------------------------------
  // IDOR protection
  // ---------------------------------

  it('blocks an intern from accessing another intern profile', async () => {
    const res = await request(app)
      .get(`/api/interns/${internB._id}`)
      .set('Authorization', `Bearer ${internAToken}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
  });

  // ---------------------------------
  // Own resource access
  // ---------------------------------

  it('allows an intern to access their own profile', async () => {
    const res = await request(app)
      .get(`/api/interns/${internA._id}`)
      .set('Authorization', `Bearer ${internAToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.fullName).toBe('Intern A');
  });

});