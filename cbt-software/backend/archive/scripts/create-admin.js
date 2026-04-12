const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('../models/User');
const createSchoolUserModel = require('../models/SchoolUser');
const { getConnection } = require('../utils/dbManager');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cbt-software';

async function createAdmin() {
  try {
    // Connect to system DB
    await mongoose.connect(MONGO_URI);
    console.log('Connected to system DB');

    // Create system-level admin user
    const adminEmail = 'admin@example.com';
    let admin = await User.findOne({ email: adminEmail });
    
    if (!admin) {
      admin = new User({
        name: 'Admin User',
        email: adminEmail,
        password: 'AdminPass123!',
        role: 'admin'
      });
      await admin.save();
      console.log('✅ Created system admin user:', adminEmail, 'with password: AdminPass123!');
    } else {
      console.log('✅ Admin user already exists:', adminEmail);
    }

    // Also create admin in school DB if it exists
    const schoolDbName = 'school_test_academy_1772289371224';
    try {
      const conn = await getConnection(schoolDbName);
      const SchoolUser = createSchoolUserModel(conn);
      
      let schoolAdmin = await SchoolUser.findOne({ username: adminEmail });
      if (!schoolAdmin) {
        schoolAdmin = new SchoolUser({
          username: adminEmail,
          password: 'AdminPass123!',
          role: 'admin'
        });
        await schoolAdmin.save();
        console.log('✅ Created school admin user:', adminEmail);
      } else {
        console.log('✅ School admin user already exists:', adminEmail);
      }
    } catch (err) {
      console.log('⚠️ School DB not found or unavailable, skipping school admin creation');
    }

    console.log('\n📝 Login with:');
    console.log('   Email: admin@example.com');
    console.log('   Password: AdminPass123!');

    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ Error creating admin:', err.message);
    process.exit(1);
  }
}

createAdmin();
