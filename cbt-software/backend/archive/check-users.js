const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cbt-software';

async function checkUsers() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const users = await User.find({}, 'name email role');
    console.log('--- Current Users in Database ---');
    if (users.length === 0) {
      console.log('No users found.');
    } else {
      users.forEach(u => {
        console.log(`- Name: ${u.name}, Email: ${u.email}, Role: ${u.role}`);
      });
    }
    console.log('---------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkUsers();
