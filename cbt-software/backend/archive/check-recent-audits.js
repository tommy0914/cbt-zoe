const mongoose = require('mongoose');
const Audit = require('./models/Audit');
const dotenv = require('dotenv');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cbt-software';

async function checkRecentAudits() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const recent = await Audit.find({}).sort({ createdAt: -1 }).limit(10).lean();
    console.log('--- Recent Audits ---');
    recent.forEach(a => {
      console.log(`${a.createdAt} - ${a.method} ${a.path} - ${a.statusCode}`);
      if (a.statusCode >= 400) {
        console.log('  Role:', a.role, 'User:', a.userId);
      }
    });
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkRecentAudits();
