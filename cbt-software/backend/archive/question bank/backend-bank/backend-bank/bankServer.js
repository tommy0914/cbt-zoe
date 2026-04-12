
// ...existing code...


// Serve React build folder in production (after all require statements and after app is initialized)


// ...existing code...

// Place this after app is initialized and middleware is set up
// Simple test endpoint to confirm backend is running
// (Moved here to avoid ReferenceError)

// ...existing code...


// Place this after all middleware and route definitions and before app.listen
// app.get('/api/ping', (req, res) => {
//   res.json({ message: 'pong' });
const express = require('express');
// const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const rateLimit = require("express-rate-limit");
const { body, validationResult } = require("express-validator");
const fileUpload = require("express-fileupload");
const mammoth = require("mammoth");
const xlsx = require("xlsx");
const fs = require("fs");
const path = require("path");
const Question = require('./models/question');
const User = require('./models/user');
const cors = require('cors');

// Load environment variables first
require("dotenv").config();

// Define constants after loading env vars
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_key";
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/question-bank";

const app = express();
// Enable CORS as the very first middleware
app.use(cors({
  origin: true, // Allow all origins for development (including all localhost ports)
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));
app.use(express.json());
app.use(fileUpload());

// Serve React build folder in production (after all require statements and after app is initialized)
const frontendBuildPath = path.join(__dirname, '../question-bank-frontend/project_name/dist');
app.use(express.static(frontendBuildPath));
// For any non-API route, serve index.html (for React Router)
app.get(/^((?!\/api\/).)*$/, (req, res) => {
  res.sendFile(path.join(frontendBuildPath, 'index.html'));
});

const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);

// Connect to MongoDB
mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Verify that the request includes a valid JWT token.
function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ error: "No token provided" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: "Failed to authenticate token" });
    req.user = decoded; // Attach the decoded user information to the request
    next();
  });
}

// Require that the authenticated user has an 'admin' role.
function requireAdmin(req, res, next) {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ error: "Admin role required" });
  }
}

/* ================================
   Authentication Routes
================================ */

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: "Too many login attempts. Please try again later.",
});

// Optional: Registration endpoint to create new admin users.
// Registration endpoint is intentionally hidden/disabled by default. To enable
// controlled creation of an admin via this route, set the environment variable
// ADMIN_CREATION_TOKEN to a secret value and POST { username, password, role, adminToken }
// where adminToken matches the env var. Without the token the route returns 404.
app.post("/api/bank/auth/register", async (req, res) => {
  const { username, password, role, classId, adminToken } = req.body;
  const ADMIN_CREATION_TOKEN = process.env.ADMIN_CREATION_TOKEN;

  // If no creation token is configured, hide this route.
  if (!ADMIN_CREATION_TOKEN) {
    return res.status(404).json({ error: 'Not found' });
  }

  // Require the correct token to allow creation.
  if (!adminToken || adminToken !== ADMIN_CREATION_TOKEN) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    if (!username || !password || !role || (role === 'user' && !classId)) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword, role, classId: role === 'user' ? classId : undefined });
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error('Error during registration:', err);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Login endpoint. Returns a JWT token if credentials are valid.
app.post("/api/bank/auth/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ error: "Invalid username or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: "Invalid username or password" });
    }

    // Include the user's role in the token
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ token });
  } catch (err) {
    console.error("Error during login:", err);
    res.status(500).json({ error: "Server error during login" });
  }
});

/* ================================
   Question Bank Endpoints
================================ */

// GET /api/bank/questions
// Returns all questions in the bank.
app.get("/api/bank/questions", verifyToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, classId, subjectId } = req.query;
    let filter = {};
    if (classId) filter.classId = classId;
    if (subjectId) filter.subjectId = subjectId;
    const questions = await Question.find(filter)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    const totalQuestions = await Question.countDocuments(filter);
    res.status(200).json({ questions, totalQuestions });
  } catch (err) {
    console.error("Error fetching questions:", err);
    res.status(500).json({ error: "Failed to fetch questions" });
  }
});

// POST /api/bank/questions
// Create a new question. Admin only.
app.post('/api/bank/questions', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { text, options, answer, topic, classId, subjectId } = req.body;

    // Validate input
    if (!text || !options || !answer || !topic || !classId || !subjectId) {
      return res.status(400).json({ error: 'All fields are required, including classId and subjectId' });
    }

    // Save the question to the database
    const newQuestion = new Question({ text, options, answer, topic, classId, subjectId });
    await newQuestion.save();

    res.status(201).json({ message: 'Question added successfully', question: newQuestion });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add question' });
  }
});

// PUT /api/bank/questions/:id
// Update an existing question. Admin only.
app.put('/api/bank/questions/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const questionId = req.params.id;
    const updateData = req.body;
    const question = await Question.findById(questionId);
    if (!question) return res.status(404).json({ error: 'Question not found' });

    // Merge existing question data with the update.
    Object.assign(question, updateData);
    
    // Advanced Linking:
    // If topic is updated and no linkedQuestionIds is provided, update automatically.
    if (updateData.topic && !updateData.linkedQuestionIds) {
      const relatedQuestions = await Question.find({ 
        topic: updateData.topic,
        _id: { $ne: questionId }
      });
      question.linkedQuestionIds = relatedQuestions.map(q => q._id);
    }
    await question.save();
    res.json(question);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error updating question' });
  }
});

// DELETE /api/bank/questions/:id
// Delete a question. Admin only.
app.delete('/api/bank/questions/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const questionId = req.params.id;
    const deletedQuestion = await Question.findByIdAndDelete(questionId);
    if (!deletedQuestion) return res.status(404).json({ error: 'Question not found' });
    res.json({ message: 'Question deleted successfully', question: deletedQuestion });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error deleting question' });
  }
});

// GET /api/bank/questions/:id/linked
// Returns a question along with its linked questions.
app.get('/api/bank/questions/:id/linked', async (req, res) => {
  try {
    const questionId = req.params.id;
    const question = await Question.findById(questionId);
    if (!question) return res.status(404).json({ error: 'Question not found' });
    
    // Retrieve the linked questions using the stored IDs.
    const linkedQuestions = await Question.find({
      _id: { $in: question.linkedQuestionIds }
    });
    res.json({ question, linkedQuestions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching linked questions' });
  }
});

// GET /api/bank/questions/:id/suggested
// Returns suggested related questions based on the question's topic and not already linked.
app.get('/api/bank/questions/:id/suggested', async (req, res) => {
  try {
    const questionId = req.params.id;
    const question = await Question.findById(questionId);
    if (!question) return res.status(404).json({ error: 'Question not found' });
    
    // Find suggestions by matching topic and excluding already linked and the question itself.
    const suggested = await Question.find({ 
      topic: question.topic,
      _id: { $ne: questionId, $nin: question.linkedQuestionIds }
    });
    res.json({ question, suggested });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching suggested related questions' });
  }
});

// Batch fetch questions by IDs
// GET /api/bank/questions/batch?ids=id1,id2,id3
app.get('/api/bank/questions/batch', verifyToken, async (req, res) => {
  try {
    const idsParam = req.query.ids;
    if (!idsParam) return res.status(400).json({ error: 'ids query parameter required' });
    const ids = String(idsParam).split(',').map(s => s.trim()).filter(Boolean);
    if (ids.length === 0) return res.status(400).json({ error: 'no ids provided' });
    const objectIds = ids.map(id => {
      try { return mongoose.Types.ObjectId(id); } catch(e) { return null; }
    }).filter(Boolean);
    const questions = await Question.find({ _id: { $in: objectIds } }).select('text options answer');
    res.json(questions);
  } catch (err) {
    console.error('Error fetching questions batch:', err);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

// Batch Import:
// POST /api/bank/questions/import
// Bulk import an array of question objects. Admin only.
app.post('/api/bank/questions/import', verifyToken, requireAdmin, async (req, res) => {
  try {
    const questionsArray = req.body; // Expecting an array of question objects.
    if (!Array.isArray(questionsArray)) {
      return res.status(400).json({ error: 'Data must be an array of questions' });
    }
    const importedQuestions = await Question.insertMany(questionsArray);
    res.status(201).json({ message: 'Questions imported successfully', importedQuestions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error importing questions' });
  }
});

// Batch Export:
// GET /api/bank/questions/export
// Export all questions as JSON. Admin only.
app.get('/api/bank/questions/export', verifyToken, requireAdmin, async (req, res) => {
  try {
    const questions = await Question.find();
    res.json(questions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error exporting questions' });
  }
});

// Upload .docx file and parse questions
app.post('/api/bank/questions/upload', verifyToken, requireAdmin, async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const file = req.files.file;
    const allowedExts = [".docx", ".xlsx", ".csv"];
    const ext = file.name.slice(file.name.lastIndexOf("."));
    if (!allowedExts.includes(ext)) {
      return res.status(400).json({ error: "Only .docx, .xlsx, or .csv files are allowed" });
    }
    let questionsArray = [];
    if (ext === ".docx") {
      // Parse the .docx file (legacy support)
      const result = await mammoth.extractRawText({ buffer: file.data });
      const questionsText = result.value;
      questionsArray = questionsText.split("\n").filter((line) => line.trim() !== "").map((line) => {
        const [text, ...optionsAndAnswer] = line.split(";");
        const options = optionsAndAnswer.slice(0, -1);
        const answer = optionsAndAnswer[optionsAndAnswer.length - 1];
        return { text, options, answer, topic: "General" };
      });
    } else if (ext === ".xlsx" || ext === ".csv") {
      // Parse Excel or CSV
      const workbook = xlsx.read(file.data, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows = xlsx.utils.sheet_to_json(worksheet, { defval: "" });
      questionsArray = rows;
      // We'll resolve classId and subjectId below
    }
    // Normalize question rows so they contain an `options` array and consistent fields
    const normalizeOptions = (q) => {
      // If already an array, keep as is
      if (Array.isArray(q.options)) return q;
      // Try common column names option1..option4 or option_1 etc
      const optKeys = ['option1','option2','option3','option4','option_1','option_2','option_3','option_4','opt1','opt2','opt3','opt4'];
      const opts = [];
      for (const k of optKeys) {
        if (q[k] && typeof q[k] === 'string' && q[k].trim() !== '') opts.push(String(q[k]).trim());
      }
      if (opts.length > 0) {
        q.options = opts;
        return q;
      }

      // If there's an `options` string, try to parse JSON array, or split by pipe or semicolon
      if (q.options && typeof q.options === 'string') {
        const s = q.options.trim();
        if (s.startsWith('[') && s.endsWith(']')) {
          try { q.options = JSON.parse(s); return q; } catch(e) { /* fallthrough */ }
        }
        // Try common separators
        if (s.includes('|')) { q.options = s.split('|').map(x=>x.trim()).filter(Boolean); return q; }
        if (s.includes(';')) { q.options = s.split(';').map(x=>x.trim()).filter(Boolean); return q; }
        if (s.includes(',')) { q.options = s.split(',').map(x=>x.trim()).filter(Boolean); return q; }
      }

      // Last resort: try to collect any fields that look like choices (A/B/C/D)
      const fallbackOpts = [];
      for (let i=1;i<=6;i++) {
        const key = 'choice' + i;
        if (q[key]) fallbackOpts.push(String(q[key]).trim());
      }
      if (fallbackOpts.length>0) { q.options = fallbackOpts; return q; }

      // leave as-is (will be filtered out later if invalid)
      return q;
    };

    questionsArray = questionsArray.map(normalizeOptions);

    // Save questions to the database
    const Class = require('./models/Class');
    const Subject = require('./models/Subject');
    const savedQuestions = [];
    for (const q of questionsArray) {
      // Try to resolve classId and subjectId from names if not provided
      let classId = q.classId || q.class_id || q.ClassId || q.ClassID || q.class || "";
      let subjectId = q.subjectId || q.subject_id || q.SubjectId || q.SubjectID || q.subject || "";
      // If classId is not a valid ObjectId, try to resolve by name
      if (!classId || classId.length < 12) {
        const className = q.className || q.class_name || q.ClassName || q.Class || q.class;
        if (className) {
          const classDoc = await Class.findOne({ name: className });
          if (classDoc) classId = classDoc._id;
        }
      }
      // If subjectId is not a valid ObjectId, try to resolve by name and classId
      if ((!subjectId || subjectId.length < 12) && classId) {
        const subjectName = q.subjectName || q.subject_name || q.SubjectName || q.Subject || q.subject;
        if (subjectName) {
          const subjectDoc = await Subject.findOne({ name: subjectName, classId });
          if (subjectDoc) subjectId = subjectDoc._id;
        }
      }
      if (!q.text || !q.options || q.options.length < 2 || !q.answer || !classId || !subjectId) {
        continue; // Skip invalid
      }
      const newQuestion = new Question({
        text: typeof q.text === 'string' ? q.text.trim() : String(q.text || '').trim(),
        options: q.options.map((opt) => (typeof opt === 'string' ? opt.trim() : String(opt || '').trim())),
        answer: typeof q.answer === 'string' ? q.answer.trim() : String(q.answer || '').trim(),
        topic: q.topic ? (typeof q.topic === 'string' ? q.topic.trim() : String(q.topic).trim()) : "General",
        classId,
        subjectId
      });
      const savedQuestion = await newQuestion.save();
      savedQuestions.push(savedQuestion);
    }
    res.status(201).json({
      message: `${savedQuestions.length} questions added successfully`,
      questions: savedQuestions,
    });
  } catch (err) {
    console.error("Error uploading questions:", err);
    res.status(500).json({ error: "Failed to upload questions" });
  }
});

// Endpoint to save scores to an Excel file
app.post("/api/save-score", async (req, res) => {
  try {
    const { username, score, totalQuestions, classId, subjectId, subjectName, className, timeTaken } = req.body;

    if (!username || score === undefined || !totalQuestions) {
      return res.status(400).json({ error: "Username, score, and totalQuestions are required" });
    }

    const filePath = path.join(__dirname, "scores.xlsx");
    let workbook;
    let worksheet;

    // Check if the file already exists
    if (fs.existsSync(filePath)) {
      // Read the existing workbook
      workbook = xlsx.readFile(filePath);
      worksheet = workbook.Sheets["Scores"];
    } else {
      // Create a new workbook and worksheet
      workbook = xlsx.utils.book_new();
      worksheet = xlsx.utils.aoa_to_sheet([[
        "Username", "Score", "Total Questions", "Percentage", "Class", "Subject", 
        "Class ID", "Subject ID", "Time Taken (mins)", "Date", "Status"
      ]]); // Add enhanced headers
      xlsx.utils.book_append_sheet(workbook, worksheet, "Scores");
    }

    // Calculate percentage and status
    const percentage = ((score / totalQuestions) * 100).toFixed(2);
    const status = percentage >= 70 ? "Pass" : "Fail"; // 70% pass mark
    const testDate = new Date().toLocaleDateString();
    const timeInMinutes = timeTaken ? Math.round(timeTaken / 60) : "N/A";

    // Append the new score to the worksheet
    const newRow = [
      username, 
      score, 
      totalQuestions, 
      percentage + "%",
      className || "N/A",
      subjectName || "N/A",
      classId || "N/A",
      subjectId || "N/A",
      timeInMinutes,
      testDate,
      status
    ];
    const sheetData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
    sheetData.push(newRow);

    // Write the updated data back to the worksheet
    const updatedWorksheet = xlsx.utils.aoa_to_sheet(sheetData);
    workbook.Sheets["Scores"] = updatedWorksheet;

    // Save the workbook
    xlsx.writeFile(workbook, filePath);

    res.status(201).json({ 
      message: "Score saved successfully", 
      scoreData: {
        score,
        totalQuestions,
        percentage,
        status
      }
    });
  } catch (error) {
    console.error("Error saving score:", error);
    res.status(500).json({ error: "Failed to save score" });
  }
});

// Endpoint to download the scores file
// Helper to flexibly verify a token from Authorization header or ?token= query param
function verifyTokenFlexible(req) {
  const authHeader = req.headers["authorization"];
  let token = null;
  if (authHeader && authHeader.split(" ").length > 1) token = authHeader.split(" ")[1];
  if (!token && req.query && req.query.token) token = req.query.token;
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

app.get("/api/download-scores", async (req, res) => {
  // Allow either Authorization header or ?token=... so the frontend can open a download URL
  const decoded = verifyTokenFlexible(req);
  if (!decoded || decoded.role !== "admin") {
    return res.status(403).json({ error: "Admin role required" });
  }

  const filePath = path.join(__dirname, "scores.xlsx");
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "No scores file found" });

  res.download(filePath, "scores.xlsx", (err) => {
    if (err) {
      console.error("Error downloading scores:", err);
      // Note: headers may already be sent here
    }
  });
});

// Download scores for a single subject as an Excel file (supports ?token=...)
app.get('/api/scores/by-subject/:subjectId/download', async (req, res) => {
  const decoded = verifyTokenFlexible(req);
  if (!decoded || decoded.role !== 'admin') {
    return res.status(403).json({ error: 'Admin role required' });
  }

  try {
    const subjectId = req.params.subjectId;
    const filePath = path.join(__dirname, 'scores.xlsx');
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'No scores file found' });

    const workbook = xlsx.readFile(filePath);
    const worksheet = workbook.Sheets['Scores'];
    const scores = xlsx.utils.sheet_to_json(worksheet);

    const getSubjectId = (s) => s['Subject ID'] || s['__EMPTY_4'];
    const subjectScores = scores.filter((s) => getSubjectId(s) === subjectId);

    // Build a new workbook with subjectScores
    const newWb = xlsx.utils.book_new();
    const newWs = xlsx.utils.json_to_sheet(subjectScores);
    xlsx.utils.book_append_sheet(newWb, newWs, 'SubjectScores');

    const buf = xlsx.write(newWb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', `attachment; filename="scores_subject_${subjectId}.xlsx"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (err) {
    console.error('Error creating subject download:', err);
    res.status(500).json({ error: 'Failed to create download' });
  }
});

app.get("/api/scores/history", verifyToken, async (req, res) => {
  try {
    const filePath = path.join(__dirname, "scores.xlsx");
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "No scores found" });
    }

    const workbook = xlsx.readFile(filePath);
    const worksheet = workbook.Sheets["Scores"];
    const scores = xlsx.utils.sheet_to_json(worksheet);

    const userScores = scores.filter((score) => score.Username === req.user.username);
    res.status(200).json(userScores);
  } catch (err) {
    console.error("Error fetching score history:", err);
    res.status(500).json({ error: "Failed to fetch score history" });
  }
});

// Get scores by subject (Admin only)
app.get("/api/scores/by-subject/:subjectId", verifyToken, requireAdmin, async (req, res) => {
  try {
    const filePath = path.join(__dirname, "scores.xlsx");
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "No scores found" });
    }

    const workbook = xlsx.readFile(filePath);
    const worksheet = workbook.Sheets["Scores"];
    const scores = xlsx.utils.sheet_to_json(worksheet);

    const getSubjectId = (s) => s["Subject ID"] || s["__EMPTY_4"];
    const getPercent = (s) => {
      const val = s["Percentage"] || s["__EMPTY"] || 0;
      const num = parseFloat(String(val).replace('%',''));
      return isNaN(num) ? 0 : num;
    };

    const subjectScores = scores.filter((s) => getSubjectId(s) === req.params.subjectId);
    
    // Calculate analytics
    const analytics = {
      totalStudents: subjectScores.length,
      averageScore: subjectScores.length > 0 
        ? (subjectScores.reduce((sum, s) => sum + getPercent(s), 0) / subjectScores.length).toFixed(2)
        : 0,
      passCount: subjectScores.filter(s => (s.Status || s["__EMPTY_7"]) === "Pass").length,
      failCount: subjectScores.filter(s => (s.Status || s["__EMPTY_7"]) === "Fail").length,
      scores: subjectScores
    };

    res.status(200).json(analytics);
  } catch (err) {
    console.error("Error fetching subject scores:", err);
    res.status(500).json({ error: "Failed to fetch subject scores" });
  }
});

// Get scores by class (Admin only)
app.get("/api/scores/by-class/:classId", verifyToken, requireAdmin, async (req, res) => {
  try {
    const filePath = path.join(__dirname, "scores.xlsx");
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "No scores found" });
    }

    const workbook = xlsx.readFile(filePath);
    const worksheet = workbook.Sheets["Scores"];
    const scores = xlsx.utils.sheet_to_json(worksheet);

    const getClassId = (s) => s["Class ID"] || s["__EMPTY_3"];
    const getSubjectId = (s) => s["Subject ID"] || s["__EMPTY_4"];
    const getSubjectName = (s) => s["Subject"] || s["__EMPTY_2"] || "";
    const getPercent = (s) => {
      const val = s["Percentage"] || s["__EMPTY"] || 0;
      const num = parseFloat(String(val).replace('%',''));
      return isNaN(num) ? 0 : num;
    };

    const classScores = scores.filter((s) => getClassId(s) === req.params.classId);
    
    // Group by subjects
    const subjectGroups = {};
    classScores.forEach(s => {
      const subjectId = getSubjectId(s);
      const subjectName = getSubjectName(s);
      if (!subjectGroups[subjectId]) {
        subjectGroups[subjectId] = {
          subjectId,
          subjectName,
          scores: [],
          totalStudents: 0,
          averageScore: 0,
          passCount: 0,
          failCount: 0
        };
      }
      subjectGroups[subjectId].scores.push(s);
    });
    
    // Calculate analytics for each subject
    Object.values(subjectGroups).forEach(group => {
      group.totalStudents = group.scores.length;
      group.averageScore = group.scores.length > 0 
        ? (group.scores.reduce((sum, s) => sum + getPercent(s), 0) / group.scores.length).toFixed(2)
        : 0;
      group.passCount = group.scores.filter(s => (s.Status || s["__EMPTY_7"]) === "Pass").length;
      group.failCount = group.scores.filter(s => (s.Status || s["__EMPTY_7"]) === "Fail").length;
    });

    const analytics = {
      classId: req.params.classId,
      totalStudents: classScores.length,
      subjectBreakdown: Object.values(subjectGroups),
      overallAverage: classScores.length > 0 
        ? (classScores.reduce((sum, s) => sum + getPercent(s), 0) / classScores.length).toFixed(2)
        : 0,
      overallPassCount: classScores.filter(s => (s.Status || s["__EMPTY_7"]) === "Pass").length,
      overallFailCount: classScores.filter(s => (s.Status || s["__EMPTY_7"]) === "Fail").length
    };

    res.status(200).json(analytics);
  } catch (err) {
    console.error("Error fetching class scores:", err);
    res.status(500).json({ error: "Failed to fetch class scores" });
  }
});

// Get all scores with analytics (Admin only)
app.get("/api/scores/analytics", verifyToken, requireAdmin, async (req, res) => {
  try {
    const filePath = path.join(__dirname, "scores.xlsx");
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "No scores found" });
    }

    const workbook = xlsx.readFile(filePath);
    const worksheet = workbook.Sheets["Scores"];
    const scores = xlsx.utils.sheet_to_json(worksheet);

    const getPercent = (s) => {
      const val = s["Percentage"] || s["__EMPTY"] || 0;
      const num = parseFloat(String(val).replace('%',''));
      return isNaN(num) ? 0 : num;
    };

    // Overall analytics
    const analytics = {
      totalTests: scores.length,
      totalStudents: [...new Set(scores.map(s => s.Username))].length,
      averageScore: scores.length > 0 
        ? (scores.reduce((sum, s) => sum + getPercent(s), 0) / scores.length).toFixed(2)
        : 0,
      passRate: scores.length > 0 
        ? ((scores.filter(s => (s.Status || s["__EMPTY_7"]) === "Pass").length / scores.length) * 100).toFixed(2)
        : 0,
      recentScores: scores.slice(-10) // Last 10 scores
    };

    res.status(200).json(analytics);
  } catch (err) {
    console.error("Error fetching score analytics:", err);
    res.status(500).json({ error: "Failed to fetch score analytics" });
  }
});


// Class Routes
const classRoutes = require("./routes/classRoutes");
app.use("/api/classes", classRoutes);

// Subject Routes
const subjectRoutes = require("./routes/subjectRoutes");
app.use("/api/subjects", subjectRoutes);

// Exam Routes
const examRoutes = require("./routes/examRoutes");
app.use("/api/exams", examRoutes);

// Analytics Routes
const analyticsRoutes = require("./routes/analyticsRoutes");
app.use("/api/analytics", analyticsRoutes);

/* ================================
   Start the Server
================================ */
app.get('/api/ping', (req, res) => {
  res.json({ message: 'pong' });
});

app.listen(PORT, () => {
  console.log(`Question Bank backend is running on http://localhost:${PORT}`);
});


module.exports = app; // Export the app for testing purposes
