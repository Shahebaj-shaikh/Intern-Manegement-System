const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
// Ensure the MONGODB_URI from server/.env is used even if an environment variable is already set
const fs = require('fs');
try {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const m = envContent.match(/^MONGODB_URI=(.*)$/m);
    if (m && m[1]) process.env.MONGODB_URI = m[1].trim();
  }
} catch (e) {
  // ignore and rely on dotenv
}
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Employee = require('../models/Employee');
const Intern = require('../models/Intern');
const Department = require('../models/Department');
const Task = require('../models/Task');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Performance = require('../models/Performance');
const EvaluationTemplate = require('../models/EvaluationTemplate');
const EvaluationCategory = require('../models/EvaluationCategory');
const Feedback = require('../models/Feedback');
const Announcement = require('../models/Announcement');
const Notification = require('../models/Notification');

const DEPARTMENTS = ['Software Development', 'Web Development', 'Mobile Development', 'HR', 'Marketing', 'QA', 'UI/UX', 'Data/AI'];

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected. Clearing existing data...');

  await Promise.all([
    User.deleteMany({}), Employee.deleteMany({}), Intern.deleteMany({}), Department.deleteMany({}),
    Task.deleteMany({}), Attendance.deleteMany({}), Leave.deleteMany({}), Performance.deleteMany({}),
    EvaluationTemplate.deleteMany({}), EvaluationCategory.deleteMany({}), Feedback.deleteMany({}),
    Announcement.deleteMany({}), Notification.deleteMany({}),
  ]);

  const departments = await Department.insertMany(DEPARTMENTS.map((name) => ({ name, description: `${name} department` })));
  const deptMap = Object.fromEntries(departments.map((d) => [d.name, d._id]));

  const hash = (pw) => bcrypt.hashSync(pw, 10);

  // --- Super Admin ---
  const adminUser = await User.create({ email: 'admin@ims.com', password: hash('Admin@123'), role: 'super_admin' });
  const adminEmployee = await Employee.create({ user: adminUser._id, email: 'admin@ims.com', fullName: 'System Administrator', designation: 'Super Admin', department: deptMap['HR'] });
  adminUser.profileRef = adminEmployee._id; adminUser.profileModel = 'Employee'; await adminUser.save();

  // --- HR ---
  const hrUser = await User.create({ email: 'hr@ims.com', password: hash('Hr@12345'), role: 'hr' });
  const hrEmployee = await Employee.create({ user: hrUser._id, email: 'hr@ims.com', fullName: 'Priya Sharma', designation: 'HR Manager', department: deptMap['HR'] });
  hrUser.profileRef = hrEmployee._id; hrUser.profileModel = 'Employee'; await hrUser.save();

  // --- Team Leaders ---
  const tlUser1 = await User.create({ email: 'teamlead@ims.com', password: hash('Lead@123'), role: 'team_lead' });
  const tl1 = await Employee.create({ user: tlUser1._id, email: 'teamlead@ims.com', fullName: 'Rahul Verma', designation: 'Senior Software Engineer', department: deptMap['Software Development'] });
  tlUser1.profileRef = tl1._id; tlUser1.profileModel = 'Employee'; await tlUser1.save();

  const tlUser2 = await User.create({ email: 'weblead@ims.com', password: hash('Lead@123'), role: 'team_lead' });
  const tl2 = await Employee.create({ user: tlUser2._id, email: 'weblead@ims.com', fullName: 'Ananya Iyer', designation: 'Lead Web Developer', department: deptMap['Web Development'] });
  tlUser2.profileRef = tl2._id; tlUser2.profileModel = 'Employee'; await tlUser2.save();

  // --- Evaluation Templates & Categories ---
  const defaultCategories = [
    { name: 'Technical Skills', description: 'Proficiency in required programming languages and frameworks', minScore: 1, maxScore: 10, weight: 1.5, order: 1 },
    { name: 'Communication', description: 'Clarity in written and verbal communication, team interaction', minScore: 1, maxScore: 10, weight: 1, order: 2 },
    { name: 'Problem Solving', description: 'Ability to debug, analyze issues, and propose sound solutions', minScore: 1, maxScore: 10, weight: 1.2, order: 3 },
    { name: 'Discipline & Punctuality', description: 'Adherence to work hours, meetings, and workplace decorum', minScore: 1, maxScore: 10, weight: 0.8, order: 4 },
    { name: 'Task Completion', description: 'Timeliness and quality of submitted deliverables', minScore: 1, maxScore: 10, weight: 1.3, order: 5 },
    { name: 'Learning Ability', description: 'Speed of picking up new technologies and incorporating feedback', minScore: 1, maxScore: 10, weight: 1.1, order: 6 },
    { name: 'Professionalism', description: 'Work ethic, accountability, and collaboration with colleagues', minScore: 1, maxScore: 10, weight: 1, order: 7 },
  ];

  await EvaluationCategory.insertMany(defaultCategories);

  const standardTemplate = await EvaluationTemplate.create({
    name: 'Standard Internship Mid-Term Evaluation',
    description: 'Comprehensive rubric covering technical, soft skills, discipline, and deliverable quality.',
    isDefault: true,
    createdBy: adminUser._id,
    categories: defaultCategories,
  });

  // --- Interns ---
  const internSeeds = [
    { email: 'intern@ims.com', fullName: 'Aditya Kumar', college: 'IIT Bombay', degree: 'B.Tech', branch: 'Computer Science', dept: 'Software Development', tl: tl1._id, status: 'active' },
    { email: 'intern2@ims.com', fullName: 'Sneha Patel', college: 'NIT Trichy', degree: 'B.Tech', branch: 'Information Technology', dept: 'Web Development', tl: tl2._id, status: 'active' },
    { email: 'intern3@ims.com', fullName: 'Vikram Singh', college: 'BITS Pilani', degree: 'B.E', branch: 'Computer Science', dept: 'Software Development', tl: tl1._id, status: 'active' },
    { email: 'intern4@ims.com', fullName: 'Kavya Reddy', college: 'VIT Vellore', degree: 'B.Tech', branch: 'CSE', dept: 'UI/UX', tl: tl2._id, status: 'upcoming' },
    { email: 'intern5@ims.com', fullName: 'Rohan Gupta', college: 'Delhi University', degree: 'BCA', branch: 'Computer Applications', dept: 'QA', tl: tl1._id, status: 'completed' },
  ];

  const interns = [];
  for (const s of internSeeds) {
    const u = await User.create({ email: s.email, password: hash('Intern@123'), role: 'intern' });
    const i = await Intern.create({
      user: u._id, email: s.email, fullName: s.fullName, college: s.college, degree: s.degree, branch: s.branch,
      graduationYear: 2026, skills: ['JavaScript', 'React', 'Node.js'], address: 'India',
      department: deptMap[s.dept], teamLeader: s.tl, internshipType: 'stipend',
      joiningDate: new Date('2026-01-01'),
      internshipEndDate: s.status === 'completed' ? new Date('2026-06-01') : new Date('2026-12-01'),
      status: s.status,
    });
    u.profileRef = i._id; u.profileModel = 'Intern'; await u.save();
    interns.push(i);
  }

  // --- Tasks ---
  const taskStatuses = ['not_started', 'in_progress', 'submitted', 'under_review', 'completed'];
  const priorities = ['low', 'medium', 'high', 'critical'];
  for (let i = 0; i < interns.length; i++) {
    for (let j = 0; j < 3; j++) {
      await Task.create({
        title: `Task ${j + 1} for ${interns[i].fullName.split(' ')[0]}`,
        description: 'Sample task generated by the seed script for demo purposes.',
        assignedTo: interns[i]._id,
        createdBy: interns[i].teamLeader,
        department: interns[i].department,
        priority: priorities[j % priorities.length],
        status: taskStatuses[j % taskStatuses.length],
        startDate: new Date('2026-07-01'),
        deadline: new Date('2026-08-30'),
      });
    }
  }

  // --- Attendance (last 5 days for active interns) ---
  for (const intern of interns.filter((i) => i.status === 'active')) {
    for (let d = 1; d <= 5; d++) {
      const date = new Date();
      date.setDate(date.getDate() - d);
      date.setHours(0, 0, 0, 0);
      const checkIn = new Date(date); checkIn.setHours(9, 15);
      const checkOut = new Date(date); checkOut.setHours(18, 10);
      await Attendance.create({ intern: intern._id, date, checkIn, checkOut, workingHours: 8.9, status: 'present' });
    }
  }

  // --- Leaves ---
  await Leave.create({ intern: interns[0]._id, leaveType: 'sick', startDate: new Date('2026-08-20'), endDate: new Date('2026-08-21'), reason: 'Fever', status: 'pending' });
  await Leave.create({ intern: interns[1]._id, leaveType: 'casual', startDate: new Date('2026-08-10'), endDate: new Date('2026-08-10'), reason: 'Personal work', status: 'approved', reviewedBy: tl2._id });

  // --- Feedback ---
  await Feedback.create({
    intern: interns[0]._id,
    author: tlUser1._id,
    category: 'Technical',
    strengths: 'Quick grasp of backend API design and MongoDB schemas.',
    weaknesses: 'Needs deeper attention to edge cases in error handling.',
    improvementSuggestions: 'Write more unit tests covering boundary conditions.',
    comments: 'Great progress in the first month. Demonstrates high enthusiasm and quick learning.',
  });

  await Feedback.create({
    intern: interns[0]._id,
    author: hrUser._id,
    category: 'General',
    strengths: 'Very punctual and active participant in team standups.',
    weaknesses: 'None observed.',
    improvementSuggestions: 'Continue maintaining good communication with mentors.',
    comments: 'Smooth onboarding and high engagement.',
  });

  // --- Mid-Term Evaluations ---
  const sampleScores = [
    { categoryName: 'Technical Skills', score: 8.5, maxScore: 10, weight: 1.5, notes: 'Solid understanding of Node/Express' },
    { categoryName: 'Communication', score: 8.0, maxScore: 10, weight: 1, notes: 'Clear daily updates' },
    { categoryName: 'Problem Solving', score: 8.5, maxScore: 10, weight: 1.2, notes: 'Good analytical breakdown' },
    { categoryName: 'Discipline & Punctuality', score: 9.0, maxScore: 10, weight: 0.8, notes: 'Always on time' },
    { categoryName: 'Task Completion', score: 7.5, maxScore: 10, weight: 1.3, notes: 'Delivers on schedule with minor revisions' },
    { categoryName: 'Learning Ability', score: 9.0, maxScore: 10, weight: 1.1, notes: 'Learns rapidly' },
    { categoryName: 'Professionalism', score: 8.5, maxScore: 10, weight: 1, notes: 'Courteous and team-oriented' },
  ];

  await Performance.create({
    intern: interns[0]._id,
    evaluator: tlUser1._id,
    evaluatedBy: tl1._id,
    template: standardTemplate._id,
    evaluationPeriod: 'Mid-Term',
    categoryScores: sampleScores,
    strengths: 'Strong analytical skills, fast learner, and great team player.',
    weaknesses: 'Can improve on test coverage and code documentation.',
    improvementPlan: 'Assign dedicated tasks focusing on automated testing and architecture documentation.',
    overallRecommendation: 'excellent',
    status: 'finalized',
    finalizedAt: new Date(),
    finalizedBy: hrUser._id,
    version: 1,
    versionHistory: [
      {
        version: 1,
        modifiedBy: tlUser1._id,
        modifiedAt: new Date(),
        status: 'finalized',
        overallScore: 8.4,
        categoryScores: sampleScores,
        strengths: 'Strong analytical skills, fast learner, and great team player.',
        weaknesses: 'Can improve on test coverage and code documentation.',
        improvementPlan: 'Assign dedicated tasks focusing on automated testing and architecture documentation.',
        overallRecommendation: 'excellent',
        changeSummary: 'Finalized mid-term evaluation',
      },
    ],
  });

  // --- Announcements ---
  await Announcement.create({ title: 'Welcome to the Summer Internship Program!', description: 'We are excited to have all interns onboard. Please check your tasks and complete profile setup.', createdBy: hrEmployee._id, targetAudience: 'interns', priority: 'high' });
  await Announcement.create({ title: 'Office Wi-Fi Maintenance', description: 'Wi-Fi will be down for maintenance this Saturday from 10 PM to 2 AM.', createdBy: adminEmployee._id, targetAudience: 'all', priority: 'medium' });

  console.log('\n✅ Seed complete!\n');
  console.log('Demo credentials:');
  console.log('  Super Admin : admin@ims.com / Admin@123');
  console.log('  HR          : hr@ims.com / Hr@12345');
  console.log('  Team Lead   : teamlead@ims.com / Lead@123');
  console.log('  Team Lead 2 : weblead@ims.com / Lead@123');
  console.log('  Intern      : intern@ims.com / Intern@123');
  console.log('  (more interns: intern2..intern5@ims.com / Intern@123)\n');

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
