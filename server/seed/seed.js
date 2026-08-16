require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
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
const Announcement = require('../models/Announcement');
const Notification = require('../models/Notification');
const Candidate = require('../models/Candidate');
const Application = require('../models/Application');

const DEPARTMENTS = ['Software Development', 'Web Development', 'Mobile Development', 'HR', 'Marketing', 'QA', 'UI/UX', 'Data/AI'];

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected. Clearing existing data...');

  await Promise.all([
    User.deleteMany({}), Employee.deleteMany({}), Intern.deleteMany({}), Department.deleteMany({}),
    Task.deleteMany({}), Attendance.deleteMany({}), Leave.deleteMany({}), Performance.deleteMany({}),
    Announcement.deleteMany({}), Notification.deleteMany({}),
    Candidate.deleteMany({}), Application.deleteMany({}),
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

  // --- Performance ---
  await Performance.create({
    intern: interns[0]._id, evaluatedBy: tl1._id,
    ratings: { technicalSkills: 8, taskCompletion: 7, problemSolving: 8, communication: 7, teamwork: 9, punctuality: 8, learningAbility: 9, professionalism: 8 },
    feedback: 'Strong technical performance, great attitude towards learning.',
    evaluationPeriod: 'Month 1',
  });

  // --- Announcements ---
  await Announcement.create({ title: 'Welcome to the Summer Internship Program!', description: 'We are excited to have all interns onboard. Please check your tasks and complete profile setup.', createdBy: hrEmployee._id, targetAudience: 'interns', priority: 'high' });
  await Announcement.create({ title: 'Office Wi-Fi Maintenance', description: 'Wi-Fi will be down for maintenance this Saturday from 10 PM to 2 AM.', createdBy: adminEmployee._id, targetAudience: 'all', priority: 'medium' });

  // --- Candidates & Applications (recruitment pipeline demo data) ---
  const candidateSeeds = [
    { fullName: 'Meera Nair', email: 'meera.nair@example.com', source: 'campus', degree: 'B.Tech', institution: 'NIT Surathkal', skills: ['React', 'JavaScript', 'CSS'], dept: 'Web Development', status: 'applied' },
    { fullName: 'Arjun Malhotra', email: 'arjun.malhotra@example.com', source: 'linkedin', degree: 'B.E', institution: 'PES University', skills: ['Node.js', 'MongoDB', 'Express'], dept: 'Software Development', status: 'shortlisted' },
    { fullName: 'Divya Krishnan', email: 'divya.krishnan@example.com', source: 'referral', degree: 'B.Tech', institution: 'IIIT Hyderabad', skills: ['Python', 'Machine Learning'], dept: 'Data/AI', status: 'interview' },
    { fullName: 'Karan Bhatia', email: 'karan.bhatia@example.com', source: 'job_portal', degree: 'BCA', institution: 'Christ University', skills: ['Figma', 'UI Design'], dept: 'UI/UX', status: 'selected' },
    { fullName: 'Fatima Sheikh', email: 'fatima.sheikh@example.com', source: 'campus', degree: 'B.Tech', institution: 'Jamia Millia Islamia', skills: ['Manual Testing', 'Selenium'], dept: 'QA', status: 'rejected' },
  ];

  const stageOrder = ['applied', 'shortlisted', 'interview', 'selected', 'rejected'];

  for (const s of candidateSeeds) {
    const candidate = await Candidate.create({
      fullName: s.fullName,
      email: s.email,
      phone: '+91 90000 00000',
      source: s.source,
      education: { degree: s.degree, institution: s.institution, graduationYear: 2026 },
      skills: s.skills,
      profileSummary: `${s.fullName.split(' ')[0]} is a motivated candidate with hands-on experience in ${s.skills[0]}.`,
      createdBy: hrEmployee._id,
    });

    const targetIndex = stageOrder.indexOf(s.status);
    // Build a realistic status history leading up to the candidate's current stage
    // (rejections can happen from any stage, so walk forward then reject if needed)
    const historyStages = s.status === 'rejected'
      ? ['applied', 'shortlisted', 'rejected']
      : stageOrder.slice(0, targetIndex + 1);

    const statusHistory = historyStages.map((stage, idx) => ({
      status: stage,
      changedBy: hrEmployee._id,
      changedByName: 'hr@ims.com',
      note: stage === 'applied' ? 'Application created' : `Moved to ${stage}`,
      changedAt: new Date(Date.now() - (historyStages.length - idx) * 86400000),
    }));

    const finalStatus = s.status === 'rejected' ? 'rejected' : s.status;

    await Application.create({
      candidate: candidate._id,
      department: deptMap[s.dept],
      positionTitle: `${s.dept} Intern`,
      status: finalStatus,
      statusHistory,
      decision: ['selected', 'rejected'].includes(finalStatus) ? finalStatus : undefined,
      decisionAt: ['selected', 'rejected'].includes(finalStatus) ? new Date() : undefined,
      decisionBy: ['selected', 'rejected'].includes(finalStatus) ? hrEmployee._id : undefined,
      createdBy: hrEmployee._id,
    });
  }

  console.log('\n✅ Seed complete!\n');
  console.log('Demo credentials:');
  console.log('  Super Admin : admin@ims.com / Admin@123');
  console.log('  HR          : hr@ims.com / Hr@12345');
  console.log('  Team Lead   : teamlead@ims.com / Lead@123');
  console.log('  Team Lead 2 : weblead@ims.com / Lead@123');
  console.log('  Intern      : intern@ims.com / Intern@123');
  console.log('  (more interns: intern2..intern5@ims.com / Intern@123)\n');
  console.log('  Candidates & applications seeded across all pipeline stages (see /candidates and /applications)\n');

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
