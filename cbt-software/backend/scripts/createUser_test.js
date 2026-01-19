const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

const BASE_URL = process.env.TEST_API_BASE || 'http://localhost:5000';

const adminCredentials = {
  email: 'admin@example.com',
  password: 'AdminPass123!',
};

let adminToken;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function loginAdmin() {
  const maxRetries = 5;
  const retryDelay = 2000; // 2 seconds

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await axios.post(`${BASE_URL}/api/auth/login`, adminCredentials);
      adminToken = response.data.token;
      console.log('Admin logged in successfully.');
      return; // Exit if login is successful
    } catch (error) {
      console.warn(`Attempt ${i + 1}/${maxRetries}: Failed to log in as admin. Retrying in ${retryDelay / 1000} seconds...`);
      if (i < maxRetries - 1) {
        await sleep(retryDelay);
      } else {
        console.error('Failed to log in as admin after multiple retries:', error);
        process.exit(1);
      }
    }
  }
}


async function createTeacher() {
  try {
    const teacherData = {
      name: 'Test Teacher',
      email: `test.teacher.${Date.now()}@example.com`,
      department: 'Testing',
      staffId: `T${Date.now()}`,
    };

    const response = await axios.post(`${BASE_URL}/api/admin/teachers`, teacherData, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    console.log('Create teacher successful:', response.data);
  } catch (error) {
    console.error('Failed to create teacher:', error.response ? error.response.data : error.message);
  }
}

async function createStudent() {
  try {
    const studentData = {
      name: 'Test Student',
      email: `test.student.${Date.now()}@example.com`,
      matricNumber: `S${Date.now()}`,
      level: '100',
    };

    const response = await axios.post(`${BASE_URL}/api/admin/students`, studentData, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    console.log('Create student successful:', response.data);
  } catch (error) {
    console.error('Failed to create student:', error.response ? error.response.data : error.message);
  }
}

async function runTests() {
  await loginAdmin();
  await createTeacher();
  await createStudent();
}

runTests();
