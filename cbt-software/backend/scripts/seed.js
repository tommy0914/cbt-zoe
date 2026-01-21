const mongoose = require('mongoose');

const Question = require('../models/Question');

const Test = require('../models/Test');

const Classroom = require('../models/Classroom');
const School = require('../models/School');
// eslint-disable-next-line no-unused-vars
const User = require('../models/User');
const { getConnection } = require('../utils/dbManager');
const createSchoolUserModel = require('../models/SchoolUser');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cbt-software';

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to system DB for seeding');

  // Create or get school
  const schoolName = 'Test Academy';
  let school = await School.findOne({ name: schoolName });
  let dbName;
  if (!school) {
    // generate dbName for school
    const safeName = schoolName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
    const timestamp = Date.now();
    dbName = `school_${safeName}_${timestamp}`;

    // create the school's DB and admin user
    const conn = await getConnection(dbName);
    const SchoolUser = createSchoolUserModel(conn);
    const schoolAdmin = new SchoolUser({
      username: 'schooladmin@example.com',
      password: '',
      role: 'admin',
    });
    await schoolAdmin.save();

    school = new School({
      name: schoolName,
      dbName,
      admin: { id: schoolAdmin._id.toString(), username: schoolAdmin.username },
    });
    await school.save();
    console.log('Created school and school DB:', schoolName, dbName);
  } else {
    dbName = school.dbName;
    if (!dbName) {
      // generate and assign a dbName for older records
      const safeName = schoolName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '');
      const timestamp = Date.now();
      dbName = `school_${safeName}_${timestamp}`;
      const connNew = await getConnection(dbName);
      const SchoolUserNew = createSchoolUserModel(connNew);
      // create a default admin in the new DB
      const schoolAdmin = new SchoolUserNew({
        username: 'schooladmin@example.com',
        password: '',
        role: 'admin',
      });
      await schoolAdmin.save();
      school.dbName = dbName;
      school.admin = { id: schoolAdmin._id.toString(), username: schoolAdmin.username };
      await school.save();
      console.log('Assigned new school DB for existing school:', schoolName, dbName);
    } else {
      console.log('School already exists:', schoolName, 'db:', dbName);
    }
  }

  // Create users inside school's DB
  const conn = await getConnection(school.dbName);
  const SchoolUser = createSchoolUserModel(conn);

  const users = [];
  const adminUsername = 'admin@example.com';
  const studentUsername = 'student@example.com';
  const teacherUsername = 'teacher@example.com';

  let admin = await SchoolUser.findOne({ username: adminUsername });
  if (!admin) {
    admin = new SchoolUser({ username: adminUsername, password: 'AdminPass123!', role: 'admin' });
    await admin.save();
    console.log('Created admin user in school DB:', adminUsername);
  }

  // Also create a central admin user if one doesn't exist
  let centralAdmin = await User.findOne({ email: adminUsername });
  if (!centralAdmin) {
    centralAdmin = new User({
      name: 'Central Admin',
      email: adminUsername,
      password: 'AdminPass123!',
      // Assign a default school and role
      schools: [{ schoolId: school._id, role: 'admin' }],
    });
    await centralAdmin.save();
    console.log('Created admin user in central DB:', adminUsername);
  }

  let student = await SchoolUser.findOne({ username: studentUsername });
  if (!student) {
    student = new SchoolUser({ username: studentUsername, password: 'StudentPass123!', role: 'student' });
    await student.save();
    console.log('Created student user in school DB:', studentUsername);
  }

  let teacher = await SchoolUser.findOne({ username: teacherUsername });
  if (!teacher) {
    teacher = new SchoolUser({ username: teacherUsername, password: 'TeacherPass123!', role: 'teacher' });
    await teacher.save();
    console.log('Created teacher user in school DB:', teacherUsername);
  }

  users.push(admin, student);

  // Create sample questions
  const existing = await Question.find();
  if (existing.length < 6) {
    const sampleQuestions = [
      {
        questionText: 'What is 2 + 2?',
        options: ['A: 3', 'B: 4', 'C: 5', 'D: 6'],
        correctAnswer: 'B: 4',
        subject: 'Mathematics',
      },
      {
        questionText: 'What is 5 * 6?',
        options: ['A: 30', 'B: 20', 'C: 35', 'D: 25'],
        correctAnswer: 'A: 30',
        subject: 'Mathematics',
      },
      {
        questionText: 'Choose the correct past tense of "go".',
        options: ['A: goed', 'B: went', 'C: gone', 'D: going'],
        correctAnswer: 'B: went',
        subject: 'English',
      },
      {
        questionText: 'Select the synonym of "happy".',
        options: ['A: sad', 'B: joyful', 'C: angry', 'D: tired'],
        correctAnswer: 'B: joyful',
        subject: 'English',
      },
      {
        questionText: 'What is the square root of 16?',
        options: ['A: 2', 'B: 3', 'C: 4', 'D: 6'],
        correctAnswer: 'C: 4',
        subject: 'Mathematics',
      },
      {
        questionText: 'Which is a vowel?',
        options: ['A: b', 'B: c', 'C: a', 'D: d'],
        correctAnswer: 'C: a',
        subject: 'English',
      },
    ];

    const inserted = await Question.insertMany(sampleQuestions);
    console.log('Inserted sample questions:', inserted.length);
  } else {
    console.log('Sufficient questions already exist:', existing.length);
  }

  // Create a Test config
  const testName = 'Sample Mock Exam 2026';
  let test = await Test.findOne({ testName });
  if (!test) {
    const testConfig = new Test({
      testName,
      durationMinutes: 30,
      passScorePercentage: 50,
      questionDistribution: [
        { subject: 'Mathematics', count: 2 },
        { subject: 'English', count: 2 },
      ],
    });
    await testConfig.save();
    console.log('Created test config:', testConfig._id.toString());
  } else {
    console.log('Test config already exists:', test._id.toString());
  }

  // Create or update a sample class and assign teacher and student membership
  const className = 'Class A - 2026';
  let cls = await Classroom.findOne({ name: className });
  if (!cls) {
    cls = new Classroom({
      name: className,
      schoolId: school._id,
      subjects: ['Mathematics', 'English'],
      teacherId: teacher._id,
      members: [student._id],
    });
    await cls.save();
    console.log('Created class and assigned teacher & student member:', cls._id.toString());
  } else {
    // ensure school, teacher and student are set
    let changed = false;
    if (!cls.schoolId) {
      cls.schoolId = school._id;
      changed = true;
    }
    if (!cls.teacherId) {
      cls.teacherId = teacher._id;
      changed = true;
    }
    if (!cls.members.map((m) => m.toString()).includes(student._id.toString())) {
      cls.members.push(student._id);
      changed = true;
    }
    if (!cls.subjects || cls.subjects.length === 0) {
      cls.subjects = ['Mathematics', 'English'];
      changed = true;
    }
    if (changed) {
      await cls.save();
      console.log('Updated existing class with teacher/member info');
    } else {
      console.log('Class already exists and is up to date:', cls._id.toString());
    }
  }

  console.log(
    'Seeding complete. Users created:',
    users.map((u) => ({ id: u._id, username: u.username, role: u.role })),
  );
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
