const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const app = require('../server');
const User = require('../models/User');
const Candidate = require('../models/Candidate');
const Application = require('../models/Application');
const Department = require('../models/Department');

let hrToken;
let candidateId;
let departmentId;
let applicationId;

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) await mongoose.connect(process.env.MONGODB_URI);
  await User.deleteMany({ email: 'hr-application-test@ims.com' });
  await Candidate.deleteMany({ email: 'app.candidate@example.com' });
  await Department.deleteMany({ name: 'Application Test Dept' });

  await User.create({ email: 'hr-application-test@ims.com', password: bcrypt.hashSync('Hr@1234567', 10), role: 'hr' });
  const loginRes = await request(app).post('/api/auth/login').send({ email: 'hr-application-test@ims.com', password: 'Hr@1234567' });
  hrToken = loginRes.body.data.accessToken;

  const candidate = await Candidate.create({ fullName: 'App Candidate', email: 'app.candidate@example.com' });
  candidateId = candidate._id;

  const department = await Department.create({ name: 'Application Test Dept' });
  departmentId = department._id;
});

afterAll(async () => {
  await User.deleteMany({ email: 'hr-application-test@ims.com' });
  await Candidate.deleteMany({ email: 'app.candidate@example.com' });
  await Department.deleteMany({ name: 'Application Test Dept' });
  await Application.deleteMany({ candidate: candidateId });
  await mongoose.disconnect();
});

describe('Application module & selection workflow', () => {
  it('creates an application starting in "applied" status', async () => {
    const res = await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${hrToken}`)
      .send({ candidate: candidateId, department: departmentId, positionTitle: 'Frontend Intern' });
    expect(res.statusCode).toBe(201);
    expect(res.body.data.status).toBe('applied');
    expect(res.body.data.statusHistory.length).toBe(1);
    applicationId = res.body.data._id;
  });

  it('rejects skipping stages (applied -> interview)', async () => {
    const res = await request(app)
      .put(`/api/applications/${applicationId}/status`)
      .set('Authorization', `Bearer ${hrToken}`)
      .send({ status: 'interview' });
    expect(res.statusCode).toBe(400);
  });

  it('moves applied -> shortlisted', async () => {
    const res = await request(app)
      .put(`/api/applications/${applicationId}/status`)
      .set('Authorization', `Bearer ${hrToken}`)
      .send({ status: 'shortlisted', note: 'Strong resume' });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.status).toBe('shortlisted');
    expect(res.body.data.statusHistory.length).toBe(2);
  });

  it('moves shortlisted -> interview', async () => {
    const res = await request(app)
      .put(`/api/applications/${applicationId}/status`)
      .set('Authorization', `Bearer ${hrToken}`)
      .send({ status: 'interview', interviewDate: '2026-09-01' });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.status).toBe('interview');
  });

  it('moves interview -> selected and records the decision', async () => {
    const res = await request(app)
      .put(`/api/applications/${applicationId}/status`)
      .set('Authorization', `Bearer ${hrToken}`)
      .send({ status: 'selected', note: 'Great interview' });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.status).toBe('selected');
    expect(res.body.data.decision).toBe('selected');
    expect(res.body.data.decisionAt).toBeTruthy();
  });

  it('rejects further transitions once selected (terminal state)', async () => {
    const res = await request(app)
      .put(`/api/applications/${applicationId}/status`)
      .set('Authorization', `Bearer ${hrToken}`)
      .send({ status: 'rejected' });
    expect(res.statusCode).toBe(400);
  });
});
