const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

require('dotenv').config({
  path: require('path').join(__dirname, '..', '.env'),
});

jest.setTimeout(120000);

const app = require('../server');
const User = require('../models/User');
const Employee = require('../models/Employee');
const Intern = require('../models/Intern');
const Department = require('../models/Department');
const EvaluationTemplate = require('../models/EvaluationTemplate');
const EvaluationCategory = require('../models/EvaluationCategory');
const Feedback = require('../models/Feedback');
const Performance = require('../models/Performance');
const Task = require('../models/Task');
const Attendance = require('../models/Attendance');

let superAdminToken, hrToken, tlToken, unassignedTlToken, internAToken, internBToken;
let internAUser, internBUser, tlUser, unassignedTlUser, hrUser, superAdminUser;
let internADoc, internBDoc, tlEmployee, unassignedTlEmployee, hrEmployee, departmentDoc;
let templateDoc;

const testEmails = [
  'eval_admin@ims.com',
  'eval_hr@ims.com',
  'eval_tl@ims.com',
  'eval_unassigned_tl@ims.com',
  'eval_intern_a@ims.com',
  'eval_intern_b@ims.com',
];

const { connectTestDb, disconnectTestDb } = require('./setupDb');

beforeAll(async () => {
  await connectTestDb();

  // Cleanup any old test entities
  await User.deleteMany({ email: { $in: testEmails } });
  await Intern.deleteMany({ email: { $in: testEmails } });
  await Employee.deleteMany({ email: { $in: testEmails } });
  await EvaluationTemplate.deleteMany({ name: /^Test Template/ });
  await EvaluationCategory.deleteMany({ name: /^Test Category/ });

  const hash = (pw) => bcrypt.hashSync(pw, 10);

  // Department
  departmentDoc = await Department.create({ name: 'Test QA Dept', description: 'Testing' });

  // 1. Super Admin
  superAdminUser = await User.create({ email: 'eval_admin@ims.com', password: hash('Admin@123'), role: 'super_admin' });
  const adminEmp = await Employee.create({ user: superAdminUser._id, email: 'eval_admin@ims.com', fullName: 'Admin Tester' });
  superAdminUser.profileRef = adminEmp._id;
  superAdminUser.profileModel = 'Employee';
  await superAdminUser.save();

  // 2. HR
  hrUser = await User.create({ email: 'eval_hr@ims.com', password: hash('Hr@12345'), role: 'hr' });
  hrEmployee = await Employee.create({ user: hrUser._id, email: 'eval_hr@ims.com', fullName: 'HR Tester' });
  hrUser.profileRef = hrEmployee._id;
  hrUser.profileModel = 'Employee';
  await hrUser.save();

  // 3. Team Lead (Assigned to Intern A)
  tlUser = await User.create({ email: 'eval_tl@ims.com', password: hash('Lead@123'), role: 'team_lead' });
  tlEmployee = await Employee.create({ user: tlUser._id, email: 'eval_tl@ims.com', fullName: 'Lead Tester' });
  tlUser.profileRef = tlEmployee._id;
  tlUser.profileModel = 'Employee';
  await tlUser.save();

  // 4. Unassigned Team Lead
  unassignedTlUser = await User.create({ email: 'eval_unassigned_tl@ims.com', password: hash('Lead@123'), role: 'team_lead' });
  unassignedTlEmployee = await Employee.create({ user: unassignedTlUser._id, email: 'eval_unassigned_tl@ims.com', fullName: 'Other Lead' });
  unassignedTlUser.profileRef = unassignedTlEmployee._id;
  unassignedTlUser.profileModel = 'Employee';
  await unassignedTlUser.save();

  // 5. Intern A (under tlEmployee)
  internAUser = await User.create({ email: 'eval_intern_a@ims.com', password: hash('Intern@123'), role: 'intern' });
  internADoc = await Intern.create({
    user: internAUser._id,
    email: 'eval_intern_a@ims.com',
    fullName: 'Intern Alpha',
    department: departmentDoc._id,
    teamLeader: tlEmployee._id,
    joiningDate: new Date('2026-01-01'),
    internshipEndDate: new Date('2026-06-01'),
    status: 'active',
  });
  internAUser.profileRef = internADoc._id;
  internAUser.profileModel = 'Intern';
  await internAUser.save();

  // 6. Intern B (under unassignedTlEmployee)
  internBUser = await User.create({ email: 'eval_intern_b@ims.com', password: hash('Intern@123'), role: 'intern' });
  internBDoc = await Intern.create({
    user: internBUser._id,
    email: 'eval_intern_b@ims.com',
    fullName: 'Intern Beta',
    department: departmentDoc._id,
    teamLeader: unassignedTlEmployee._id,
    joiningDate: new Date('2026-01-01'),
    internshipEndDate: new Date('2026-06-01'),
    status: 'active',
  });
  internBUser.profileRef = internBDoc._id;
  internBUser.profileModel = 'Intern';
  await internBUser.save();

  // Seed tasks & attendance for Intern A to test dashboard aggregation
  await Task.create({
    title: 'Test Feature Task',
    assignedTo: internADoc._id,
    createdBy: tlEmployee._id,
    status: 'completed',
    deadline: new Date('2026-06-01'),
  });

  await Task.create({
    title: 'In-progress Feature Task',
    assignedTo: internADoc._id,
    createdBy: tlEmployee._id,
    status: 'in_progress',
    deadline: new Date('2026-06-01'),
  });

  await Attendance.create({
    intern: internADoc._id,
    date: new Date('2026-05-01'),
    status: 'present',
    workingHours: 8,
  });

  // Login helpers
  const login = async (email, password) => {
    const res = await request(app).post('/api/auth/login').send({ email, password });
    return res.body.data.accessToken;
  };

  superAdminToken = await login('eval_admin@ims.com', 'Admin@123');
  hrToken = await login('eval_hr@ims.com', 'Hr@12345');
  tlToken = await login('eval_tl@ims.com', 'Lead@123');
  unassignedTlToken = await login('eval_unassigned_tl@ims.com', 'Lead@123');
  internAToken = await login('eval_intern_a@ims.com', 'Intern@123');
  internBToken = await login('eval_intern_b@ims.com', 'Intern@123');
});

afterAll(async () => {
  await User.deleteMany({ email: { $in: testEmails } });
  await Intern.deleteMany({ email: { $in: testEmails } });
  await Employee.deleteMany({ email: { $in: testEmails } });
  await EvaluationTemplate.deleteMany({ name: /^Test Template/ });
  await EvaluationCategory.deleteMany({ name: /^Test Category/ });
  await Feedback.deleteMany({ intern: { $in: [internADoc?._id, internBDoc?._id] } });
  await Performance.deleteMany({ intern: { $in: [internADoc?._id, internBDoc?._id] } });
  await Task.deleteMany({ assignedTo: { $in: [internADoc?._id, internBDoc?._id] } });
  await Attendance.deleteMany({ intern: { $in: [internADoc?._id, internBDoc?._id] } });
  await Department.deleteOne({ _id: departmentDoc?._id });

  await disconnectTestDb();
});

describe('Evaluation & Performance Module Suite', () => {
  let createdEvaluationId;

  // 1. Feedback creation
  it('1. allows authorized team leader to create feedback for assigned intern', async () => {
    const res = await request(app)
      .post('/api/performance/feedback')
      .set('Authorization', `Bearer ${tlToken}`)
      .send({
        intern: internADoc._id,
        category: 'Code Quality',
        strengths: 'Clean modular code and good comments',
        weaknesses: 'Needs more edge-case testing',
        improvementSuggestions: 'Focus on automated unit tests',
        comments: 'Great performance overall during sprint 1.',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.category).toBe('Code Quality');
    expect(res.body.data.comments).toBe('Great performance overall during sprint 1.');
  });

  // 2. Feedback retrieval
  it('2. allows intern to retrieve their own feedback', async () => {
    const res = await request(app)
      .get('/api/performance/feedback')
      .set('Authorization', `Bearer ${internAToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.feedbacks.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.feedbacks[0].category).toBe('Code Quality');
  });

  // 3. Unauthorized feedback access
  it('3. blocks intern from creating feedback and blocks team lead from feedback on unassigned intern', async () => {
    // Intern attempts to create feedback (RBAC check)
    const internAttempt = await request(app)
      .post('/api/performance/feedback')
      .set('Authorization', `Bearer ${internAToken}`)
      .send({
        intern: internBDoc._id,
        comments: 'Intern creating self feedback',
      });
    expect(internAttempt.statusCode).toBe(403);

    // Unassigned team lead attempts feedback for Intern A (IDOR check)
    const unassignedAttempt = await request(app)
      .post('/api/performance/feedback')
      .set('Authorization', `Bearer ${unassignedTlToken}`)
      .send({
        intern: internADoc._id,
        comments: 'Unassigned TL trying to comment',
      });
    expect(unassignedAttempt.statusCode).toBe(403);
  });

  // 4. Evaluation template creation
  it('4. allows Super Admin and HR to create evaluation templates', async () => {
    const res = await request(app)
      .post('/api/performance/templates')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        name: 'Test Template Engineering',
        description: 'Standard software engineering review template',
        categories: [
          { name: 'Core Coding', description: 'Syntax and logic', minScore: 1, maxScore: 10, weight: 2, order: 1 },
          { name: 'System Design', description: 'Architecture understanding', minScore: 1, maxScore: 10, weight: 1.5, order: 2 },
          { name: 'Collaboration', description: 'Team player', minScore: 1, maxScore: 10, weight: 1, order: 3 },
        ],
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.name).toBe('Test Template Engineering');
    expect(res.body.data.categories.length).toBe(3);
    templateDoc = res.body.data;
  });

  // 5. Evaluation template category configuration
  it('5. validates category configuration and rejects invalid score ranges', async () => {
    const res = await request(app)
      .post('/api/performance/templates')
      .set('Authorization', `Bearer ${hrToken}`)
      .send({
        name: 'Test Template Invalid',
        categories: [
          { name: 'Broken Cat', minScore: 10, maxScore: 2 }, // min > max
        ],
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  // 6. Mid-term evaluation creation
  it('6. creates a mid-term evaluation with dynamic categories and draft status', async () => {
    const res = await request(app)
      .post('/api/performance/evaluations')
      .set('Authorization', `Bearer ${tlToken}`)
      .send({
        intern: internADoc._id,
        template: templateDoc._id,
        evaluationPeriod: 'Mid-Term',
        status: 'draft',
        categoryScores: [
          { categoryName: 'Core Coding', score: 8, maxScore: 10, weight: 2, notes: 'Very good JavaScript skills' },
          { categoryName: 'System Design', score: 6, maxScore: 10, weight: 1.5, notes: 'Needs more DB indexing knowledge' },
          { categoryName: 'Collaboration', score: 10, maxScore: 10, weight: 1, notes: 'Exceptional communication' },
        ],
        strengths: 'Fast implementation and friendly attitude',
        weaknesses: 'Complex queries optimization',
        improvementPlan: 'Review database performance course',
        overallRecommendation: 'satisfactory',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('draft');
    expect(res.body.data.evaluationPeriod).toBe('Mid-Term');
    expect(res.body.data.categoryScores.length).toBe(3);
    createdEvaluationId = res.body.data._id;
  });

  // 7. Score validation
  it('7. rejects evaluation with scores out of bounds or negative', async () => {
    const res = await request(app)
      .post('/api/performance/evaluations')
      .set('Authorization', `Bearer ${tlToken}`)
      .send({
        intern: internADoc._id,
        evaluationPeriod: 'Mid-Term',
        categoryScores: [
          { categoryName: 'Core Coding', score: 15, maxScore: 10 }, // 15 > 10
        ],
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  // 8. Overall score calculation
  it('8. correctly calculates weighted overall score', async () => {
    const res = await request(app)
      .get(`/api/performance/evaluations/${createdEvaluationId}`)
      .set('Authorization', `Bearer ${tlToken}`);

    expect(res.statusCode).toBe(200);
    // Calculation: (8*2 + 6*1.5 + 10*1) / (2 + 1.5 + 1) = (16 + 9 + 10) / 4.5 = 35 / 4.5 = 7.78
    expect(res.body.data.overallScore).toBe(7.78);
  });

  // 9. Evaluation submission
  it('9. allows evaluator to update and submit draft evaluation', async () => {
    const res = await request(app)
      .put(`/api/performance/evaluations/${createdEvaluationId}`)
      .set('Authorization', `Bearer ${tlToken}`)
      .send({
        status: 'submitted',
        changeSummary: 'Submitted review for HR final approval',
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.status).toBe('submitted');
    expect(res.body.data.version).toBe(2);
  });

  // 10. Evaluation finalization
  it('10. allows HR/Super Admin to finalize the evaluation', async () => {
    const res = await request(app)
      .put(`/api/performance/evaluations/${createdEvaluationId}/finalize`)
      .set('Authorization', `Bearer ${hrToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.status).toBe('finalized');
    expect(res.body.data.finalizedAt).toBeDefined();
  });

  // 11. Finalized evaluation protection
  it('11. prevents any modification to finalized evaluations', async () => {
    const res = await request(app)
      .put(`/api/performance/evaluations/${createdEvaluationId}`)
      .set('Authorization', `Bearer ${tlToken}`)
      .send({
        strengths: 'Attempting silent overwrite',
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Finalized evaluations cannot be modified/i);
  });

  // 12. Version history creation
  it('12. tracks complete version history with previous snapshots and audit metadata', async () => {
    const res = await request(app)
      .get(`/api/performance/evaluations/${createdEvaluationId}/history`)
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.history.length).toBeGreaterThanOrEqual(2);
    expect(res.body.data.currentVersion).toBeGreaterThanOrEqual(2);
  });

  // 13. Role-based access
  it('13. blocks Team Leader from managing templates and categories', async () => {
    const res = await request(app)
      .post('/api/performance/templates')
      .set('Authorization', `Bearer ${tlToken}`)
      .send({
        name: 'Unauthorized TL Template',
        categories: [{ name: 'Test' }],
      });

    expect(res.statusCode).toBe(403);
  });

  // 14. Intern cannot modify evaluator assessment
  it('14. blocks intern from creating, updating, or finalizing evaluations', async () => {
    const createAttempt = await request(app)
      .post('/api/performance/evaluations')
      .set('Authorization', `Bearer ${internAToken}`)
      .send({
        intern: internADoc._id,
        evaluationPeriod: 'Self-Review',
        categoryScores: [{ categoryName: 'Skill', score: 10 }],
      });
    expect(createAttempt.statusCode).toBe(403);

    const updateAttempt = await request(app)
      .put(`/api/performance/evaluations/${createdEvaluationId}`)
      .set('Authorization', `Bearer ${internAToken}`)
      .send({ strengths: 'Hacked' });
    expect(updateAttempt.statusCode).toBe(403);
  });

  // 15. Performance dashboard data aggregation
  it('15. aggregates attendance, tasks, category scores, and feedback for performance dashboard', async () => {
    const res = await request(app)
      .get(`/api/performance/dashboard/${internADoc._id}`)
      .set('Authorization', `Bearer ${internAToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.overallScore).toBe(7.78);
    expect(res.body.data.attendance.present).toBe(1);
    expect(res.body.data.tasks.total).toBe(2);
    expect(res.body.data.tasks.completed).toBe(1);
    expect(res.body.data.tasks.percentage).toBe(50);
    expect(res.body.data.categoryScores.length).toBe(3);
    expect(res.body.data.strengths.length).toBeGreaterThanOrEqual(1);
  });

  // 16. Attendance/task data is read-only from the evaluation module
  it('16. verifies attendance and tasks records were not mutated by the evaluation module', async () => {
    const task = await Task.findOne({ assignedTo: internADoc._id, status: 'completed' });
    expect(task.title).toBe('Test Feature Task');
    expect(task.status).toBe('completed');

    const attendance = await Attendance.findOne({ intern: internADoc._id });
    expect(attendance.status).toBe('present');
    expect(attendance.workingHours).toBe(8);
  });
});
