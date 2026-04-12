require('dotenv').config();
const mongoose = require('mongoose');
const Test = require('../models/Test');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cbt-software';

async function run() {
  await mongoose.connect(MONGO_URI);
  const tests = await Test.find().limit(1);
  if (!tests || tests.length === 0) {
    console.error('No tests found.');
    process.exit(1);
  }
  console.log(tests[0]._id.toString());
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
