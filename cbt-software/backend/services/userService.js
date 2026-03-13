const User = require('../models/User');
const School = require('../models/School');
const { getConnection } = require('../utils/dbManager');
const createSchoolUserModel = require('../models/SchoolUser');

async function createUser(userData, schoolId) {
  const { name, email, password, role, department, staffId, matricNumber, level } = userData;

  // 1. Create user in the central database
  const centralUser = new User({
    name,
    email,
    username: role === 'student' && matricNumber ? matricNumber.toLowerCase() : email,
    password, // Password will be hashed by the pre-save hook
    role,     // REQUIRED FIELD
    schools: schoolId ? [{ schoolId, role }] : [],
  });
  await centralUser.save();

  // 2. If a schoolId is provided, create the user in the school's DB as well
  if (schoolId) {
    const school = await School.findById(schoolId);
    if (!school) {
      throw new Error('School not found');
    }

    const conn = await getConnection(school.dbName);
    const SchoolUser = createSchoolUserModel(conn);

    const schoolUser = new SchoolUser({
      username: role === 'student' && matricNumber ? matricNumber.toLowerCase() : email.split('@')[0], 
      password,
      role,
      // Add other school-specific fields if necessary
      department,
      staffId,
      matricNumber,
      level,
    });
    await schoolUser.save();
  }

  return centralUser;
}

async function updateUser(userId, updates, schoolId) {
  // Update in central DB
  const centralUser = await User.findById(userId);
  if (!centralUser) throw new Error('User not found in central DB');

  if (updates.name) centralUser.name = updates.name;
  if (updates.email) centralUser.email = updates.email;
  // If the user uploaded a new profile picture, save the base64 string
  if (updates.profilePicture !== undefined) centralUser.profilePicture = updates.profilePicture;
  // Note: if matric number changes, we don't retroactively change username right now to avoid login breakage, 
  // but we update the basic details.

  await centralUser.save();

  // Update in school DB
  let schoolUserUpdated = null;
  if (schoolId) {
    const school = await School.findById(schoolId);
    if (school) {
      const conn = await getConnection(school.dbName);
      const SchoolUser = createSchoolUserModel(conn);
      
      const schoolUser = await SchoolUser.findOne({ 
        // We match by username or email heuristically since school DB uses raw username
        $or: [
          { username: centralUser.username },
          { username: centralUser.email?.split('@')[0] },
          { _id: userId } // If ID matches (unlikely cross-DB, but some systems sync it)
        ]
      }) || await SchoolUser.findOne({ role: centralUser.role, level: centralUser.level, matricNumber: centralUser.matricNumber }); // Fallback lookup

      if (schoolUser) {
        if (updates.name) schoolUser.name = updates.name;
        if (updates.matricNumber) schoolUser.matricNumber = updates.matricNumber;
        if (updates.level) schoolUser.level = updates.level;
        if (updates.profilePicture !== undefined) schoolUser.profilePicture = updates.profilePicture;
        await schoolUser.save();
        schoolUserUpdated = schoolUser;
      }
    }
  }

  return centralUser;
}

module.exports = {
  createUser,
  updateUser,
};
