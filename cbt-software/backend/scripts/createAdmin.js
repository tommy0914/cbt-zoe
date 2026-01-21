const mongoose = require('mongoose');
const User = require('../models/User');
const dotenv = require('dotenv');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cbt-software';

async function createAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const adminData = {
      name: 'Admin User',
      email: 'sobalajetomiwa@gmail.com',
      username: 'admin_' + Date.now(), // Unique username
      password: 'Adetunji0914+',
      schools: [
        {
          schoolId: undefined, // Global admin - no specific school
          role: 'admin'
        }
      ]
    };

    // Check if user already exists
    const existingUser = await User.findOne({ email: adminData.email });
    if (existingUser) {
      console.log('❌ User with this email already exists:', adminData.email);
      process.exit(0);
    }

    // Create new admin user
    const newAdmin = new User(adminData);
    await newAdmin.save();

    console.log('✅ Admin account created successfully!');
    console.log('Email:', adminData.email);
    console.log('Password:', adminData.password);
    console.log('\nYou can now login at: http://localhost:5000/login');
    console.log('\nNext steps:');
    console.log('1. Go to http://localhost:5000');
    console.log('2. Click Login');
    console.log('3. Enter email: ' + adminData.email);
    console.log('4. Enter password: ' + adminData.password);
    console.log('5. You will be prompted to change your password');
    console.log('6. After password change, you will have full admin access');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    process.exit(1);
  }
}

createAdmin();
