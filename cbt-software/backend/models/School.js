const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema({
  name: { type: String, required: true },
  // Store the database name used for this school's separate database
  dbName: { type: String, required: true, unique: true },
  // Store admin reference information from the school's own DB
  admin: {
    id: { type: String },
    username: { type: String },
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('School', schoolSchema);
