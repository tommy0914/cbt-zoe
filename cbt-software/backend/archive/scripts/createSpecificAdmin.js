const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
dotenv.config();

const User = require('../models/User');
const School = require('../models/School');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cbt-software';

async function createSpecificAdmin(email, password) {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    let user = await User.findOne({ email: email });

    if (!user) {
      user = new User({
        name: 'Admin User',
        email: email,
        password: password,
        role: 'superAdmin',
        mustChangePassword: false,
      });
      await user.save();
      console.log(`✅ Created admin user: ${email} with role 'admin'`);
    } else {
      console.log(`✅ User with email ${email} already exists.`);
      if (user.role !== 'superAdmin') {
        user.role = 'superAdmin';
        user.password = password;
        await user.save();
        console.log(`Updated user ${email} to have 'superAdmin' role.`);
      }
    }

    console.log('User object after creation/retrieval:', user);
    console.log('User schools array:', user.schools);


    // Create a school and associate the admin with it
    let school = await School.findOne({ name: 'Default School' });
    if (!school) {
      school = new School({
        name: 'Default School',
        admin: user._id,
        superAdmin: user._id,
      });
      await school.save();
      console.log('✅ Created Default School');
    }

    // Ensure the user has the school and role in their 'schools' array
    if (user.schools && user.schools.length > 0) {
        const schoolExistsInUser = user.schools.some(s => s.schoolId && s.schoolId.toString() === school._id.toString());
        if (!schoolExistsInUser) {
            user.schools.push({ schoolId: school._id, role: 'admin' });
            await user.save();
            console.log(`✅ Added Default School to user ${email}'s schools`);
        } else {
            console.log(`User ${email} already has Default School in their schools`);
        }
    } else {
        user.schools = [{ schoolId: school._id, role: 'admin' }];
        await user.save();
        console.log(`✅ Added Default School to user ${email}'s schools`);
    }


    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ Error creating/updating admin:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

// Provided credentials
const adminEmail = 'sobalajetomiwa@gmail.com';
const adminPassword = 'Adetunji0914';

createSpecificAdmin(adminEmail, adminPassword);