// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');

// Initialize passport configuration
require('./services/passport-setup');

const questionsRoute = require('./routes/questions');
const testRoute = require('./routes/test');
const authRoute = require('./routes/auth');
const reportsRoute = require('./routes/reports');
const classesRoute = require('./routes/classes');
const usersRoute = require('./routes/users');
const schoolsRoute = require('./routes/schools');
const adminRoute = require('./routes/admin');
const auditMiddleware = require('./middleware/audit');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cbt-software';

// Middleware (cors + body parsers)
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Session middleware for passport
app.use(
  session({
    secret: process.env.SESSION_SECRET || '',
    resave: false,
    saveUninitialized: false,
  })
);

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// Connect to MongoDB
mongoose
  .connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('Failed to connect to MongoDB:', err.message));

// Routes
// Audit middleware logs request/response activity to the system Audit collection
app.use(auditMiddleware);

app.use('/api/auth', authRoute);
// app.use('/api/schools', schoolsRoute);
// app.use('/api/questions', questionsRoute);
// app.use('/api/tests', testRoute);
// app.use('/api/reports', reportsRoute);
// app.use('/api/classes', classesRoute);
// app.use('/api/users', usersRoute);
// app.use('/api/admin', adminRoute);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
