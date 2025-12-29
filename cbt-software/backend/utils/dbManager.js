const mongoose = require('mongoose');

// Simple connection manager that caches connections per database name
const connections = new Map();

// Derive base URI (without DB name) from MONGO_URI
function getBaseUri() {
  const raw = process.env.MONGO_URI || 'mongodb://localhost:27017/cbt-software';
  try {
    // Drop anything after the last '/'
    const idx = raw.lastIndexOf('/');
    if (idx === -1) return raw;
    return raw.substring(0, idx);
  } catch (_error) {
    return raw;
  }
}

function getDbUri(dbName) {
  const base = getBaseUri();
  return `${base}/${dbName}`;
}

async function getConnection(dbName) {
  if (!dbName) throw new Error('dbName is required');
  if (connections.has(dbName)) return connections.get(dbName);

  const uri = getDbUri(dbName);
  const conn = mongoose.createConnection(uri);

  // Simple event handlers for debug
  conn.on('connected', () => console.log(`Connected to school DB: ${dbName}`));
  conn.on('error', (err) => console.error(`School DB connection error (${dbName}):`, err.message));

  connections.set(dbName, conn);
  return conn;
}

module.exports = {
  getConnection,
};
