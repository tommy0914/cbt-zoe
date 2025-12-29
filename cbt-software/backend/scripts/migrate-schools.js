require('dotenv').config();
const mongoose = require('mongoose');
const School = require('../models/School');
const User = require('../models/User');
const Classroom = require('../models/Classroom');
const Question = require('../models/Question');
const Test = require('../models/Test');
const { getConnection } = require('../utils/dbManager');
const createSchoolUserModel = require('../models/SchoolUser');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cbt-software';

const argv = require('minimist')(process.argv.slice(2));
const APPLY = argv.apply || argv.a || false; // --apply to actually perform the copy
const CLEANUP = argv.cleanup || argv.c || false; // --cleanup to remove originals after copy

async function ensureSchoolDb(school) {
  if (school.dbName) return school.dbName;
  const safeName = school.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
  const timestamp = Date.now();
  const dbName = `school_${safeName}_${timestamp}`;
  if (APPLY) {
    const connNew = await getConnection(dbName);
    const SchoolUserNew = createSchoolUserModel(connNew);
    const adminUser = new SchoolUserNew({
      username: 'schooladmin@example.com',
      password: '',
      role: 'admin',
    });
    await adminUser.save();
    school.dbName = dbName;
    school.admin = { id: adminUser._id.toString(), username: adminUser.username };
    await school.save();
    console.log('Assigned new dbName and created admin for school:', school.name, dbName);
  } else {
    console.log('Dry-run: would assign dbName for school:', school.name, dbName);
  }
  return dbName;
}

async function copyIfNotExists(collection, doc) {
  const exists = await collection.findOne({ _id: doc._id });
  if (exists) return false;
  await collection.insertOne(doc);
  return true;
}

async function migrate() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to system DB for migration (dry-run:', !APPLY, ')');

  const schools = await School.find();
  console.log('Found', schools.length, 'schools.');

  for (const school of schools) {
    console.log('\n---\nProcessing school:', school.name, school._id.toString());
    const dbName = await ensureSchoolDb(school);
    const conn = await getConnection(dbName);

    // raw collections on school DB
    const schoolUsersColl = conn.collection('users');
    const schoolClassesColl = conn.collection('classrooms');
    const schoolQuestionsColl = conn.collection('questions');
    const schoolTestsColl = conn.collection('tests');

    // 1) Copy users from system User model into school DB (preserve _id and hashed password)
    const sysUsers = await User.find({ schoolId: school._id });
    console.log('System users for school:', sysUsers.length);
    let usersCopied = 0;
    for (const u of sysUsers) {
      const plain = u.toObject();
      // remove system-specific fields
      delete plain.__v;
      // remove schoolId since users live in school DB
      delete plain.schoolId;
      // Ensure createdAt exists
      if (!plain.createdAt) plain.createdAt = new Date();
      if (APPLY) {
        const inserted = await copyIfNotExists(schoolUsersColl, plain);
        if (inserted) usersCopied++;
      } else {
        usersCopied++;
      }
    }
    console.log('Users to copy/created in school DB:', usersCopied);

    // 2) Copy classrooms that reference this school
    const sysClasses = await Classroom.find({ schoolId: school._id });
    console.log('System classrooms for school:', sysClasses.length);
    let classesCopied = 0;
    for (const c of sysClasses) {
      const plain = c.toObject();
      delete plain.__v;
      // remove schoolId field for per-school storage
      delete plain.schoolId;
      if (APPLY) {
        const inserted = await copyIfNotExists(schoolClassesColl, plain);
        if (inserted) classesCopied++;
      } else {
        classesCopied++;
      }
    }
    console.log('Classes to copy/created in school DB:', classesCopied);

    // 3) Copy questions (system-level questions can be copied into every school's DB)
    const sysQuestions = await Question.find();
    console.log('System questions total:', sysQuestions.length);
    let questionsCopied = 0;
    for (const q of sysQuestions) {
      const plain = q.toObject();
      delete plain.__v;
      if (APPLY) {
        const inserted = await copyIfNotExists(schoolQuestionsColl, plain);
        if (inserted) questionsCopied++;
      } else {
        questionsCopied++;
      }
    }
    console.log('Questions to copy/created in school DB:', questionsCopied);

    // 4) Copy tests
    const sysTests = await Test.find();
    console.log('System tests total:', sysTests.length);
    let testsCopied = 0;
    for (const t of sysTests) {
      const plain = t.toObject();
      delete plain.__v;
      if (APPLY) {
        const inserted = await copyIfNotExists(schoolTestsColl, plain);
        if (inserted) testsCopied++;
      } else {
        testsCopied++;
      }
    }
    console.log('Tests to copy/created in school DB:', testsCopied);

    // Optional cleanup of system docs
    if (APPLY && CLEANUP) {
      // Remove system-level users belonging to that school
      const sysUserIds = sysUsers.map((u) => u._id);
      await User.deleteMany({ _id: { $in: sysUserIds } });
      console.log('Removed', sysUserIds.length, 'system users for school');

      // Remove system-level classrooms for that school
      const sysClassIds = sysClasses.map((c) => c._id);
      await Classroom.deleteMany({ _id: { $in: sysClassIds } });
      console.log('Removed', sysClassIds.length, 'system classrooms for school');
    }
  }

  console.log('\nMigration finished (dry-run:', !APPLY, ', cleanup:', !!CLEANUP, ')');
  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
