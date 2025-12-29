const fetch = require('node-fetch');
const dotenv = require('dotenv');
dotenv.config();

const BASE = process.env.TEST_API_BASE || 'http://localhost:5000';

async function login(username, password) {
  const res = await fetch(BASE + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return res.json();
}

async function run() {
  console.log('Running simple integration checks against', BASE);
  // Ensure users search works (admin)
  const admin = await login('admin@example.com', 'AdminPass123!');
  if (!admin.token) return console.error('Admin login failed', admin);
  console.log('Admin login ok');

  const usersRes = await fetch(BASE + '/api/users/search?email=student', {
    headers: { Authorization: `Bearer ${admin.token}` },
  });
  const users = await usersRes.json();
  console.log('User search response:', users.users ? users.users.length + ' users' : users);

  // Login as student and attempt to start a test using an invalid classId (expect 403 or 400)
  const student = await login('student@example.com', 'StudentPass123!');
  if (!student.token) return console.error('Student login failed', student);
  console.log('Student login ok');

  // Try starting test with a random classId
  const testStart = await fetch(
    BASE + '/api/tests/start/invalidTestId?classId=000000000000000000000000&subject=Mathematics',
    { headers: { Authorization: `Bearer ${student.token}` } },
  );
  console.log('Start with invalid test/class response status:', testStart.status);
  const body = await testStart.text();
  console.log('Body:', body);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
