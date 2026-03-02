const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  dbName: {
    // unique identifier for the school's database (used by dbManager)
    type: String,
    required: true,
    unique: true,
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  superAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
});

// automatically generate a dbName before saving if missing
schoolSchema.pre('validate', function() {
  if (!this.dbName) {
    // slugify name and append timestamp/random to avoid duplicates
    const slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    this.dbName = `${slug}_${Date.now()}`;
  }
});

module.exports = mongoose.model('School', schoolSchema);
