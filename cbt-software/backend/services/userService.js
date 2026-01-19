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
    username: email, // Use email as username for central user
    password, // Password will be hashed by the pre-save hook
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
      username: email.split('@')[0], // or another logic for username in school
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

module.exports = {
  createUser,
};
