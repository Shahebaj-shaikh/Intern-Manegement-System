const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const app = require('../server');
const User = require('../models/User');
const Candidate = require('../models/Candidate');

let hrToken;

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) await mongoose.connect(process.env.MONGODB_URI);
  await User.deleteMany({ email: 'hr-candidate-test@ims.com' });
  await Candidate.deleteMany({ email: { $in: ['jane.doe@example.com', 'jane.doe.updated@example.com'] } });

  await User.create({ email: 'hr-candidate-test@ims.com', password: bcrypt.hashSync('Hr@1234567', 10), role: 'hr' });
  const loginRes = await request(app).post('/api/auth/login').send({ email: 'hr-candidate-test@ims.com', password: 'Hr@1234567' });
  hrToken = loginRes.body.data.accessToken;
});

afterAll(async () => {
  await User.deleteMany({ email: 'hr-candidate-test@ims.com' });
  await Candidate.deleteMany({ email: { $in: ['jane.doe@example.com', 'jane.doe.updated@example.com'] } });
  await mongoose.disconnect();
});

describe('Candidate module', () => {
  let candidateId;

  it('blocks candidate creation without auth', async () => {
    const res = await request(app).post('/api/candidates').send({ fullName: 'X', email: 'x@x.com' });
    expect(res.statusCode).toBe(401);
  });

  it('creates a candidate as HR', async () => {
    const res = await request(app)
      .post('/api/candidates')
      .set('Authorization', `Bearer ${hrToken}`)
      .send({ fullName: 'Jane Doe', email: 'jane.doe@example.com', source: 'campus', skills: 'React,Node.js' });
    expect(res.statusCode).toBe(201);
    expect(res.body.data.fullName).toBe('Jane Doe');
    expect(res.body.data.skills).toEqual(['React', 'Node.js']);
    candidateId = res.body.data._id;
  });

  it('rejects a duplicate email', async () => {
    const res = await request(app)
      .post('/api/candidates')
      .set('Authorization', `Bearer ${hrToken}`)
      .send({ fullName: 'Jane Duplicate', email: 'jane.doe@example.com' });
    expect(res.statusCode).toBe(409);
  });

  it('fetches the candidate list', async () => {
    const res = await request(app).get('/api/candidates').set('Authorization', `Bearer ${hrToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.candidates.length).toBeGreaterThan(0);
  });

  it('updates the candidate', async () => {
    const res = await request(app)
      .put(`/api/candidates/${candidateId}`)
      .set('Authorization', `Bearer ${hrToken}`)
      .send({ email: 'jane.doe.updated@example.com', phone: '9999999999' });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.email).toBe('jane.doe.updated@example.com');
  });

  it('archives the candidate instead of hard-deleting', async () => {
    const res = await request(app).delete(`/api/candidates/${candidateId}`).set('Authorization', `Bearer ${hrToken}`);
    expect(res.statusCode).toBe(200);

    const check = await Candidate.findById(candidateId);
    expect(check).not.toBeNull(); // still exists
    expect(check.isArchived).toBe(true);
  });

  it('restores an archived candidate', async () => {
    const res = await request(app).put(`/api/candidates/${candidateId}/restore`).set('Authorization', `Bearer ${hrToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.isArchived).toBe(false);
  });
});
