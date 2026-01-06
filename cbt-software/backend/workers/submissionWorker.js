require('dotenv').config();
const agenda = require('../services/jobQueue');
const { getConnection } = require('../utils/dbManager');
const createSchoolAttempt = require('../models/SchoolAttempt');
const createSchoolTest = require('../models/SchoolTest');
const createSchoolQuestion = require('../models/SchoolQuestion');
const { logAudit } = require('../services/auditLogger');


agenda.define('score-submission', async (job) => {
  const { attemptId, dbName, userId } = job.attrs.data;

  console.log(`Processing submission for attemptId: ${attemptId} in db: ${dbName}`);

  const conn = await getConnection(dbName);
  const AttemptModel = createSchoolAttempt(conn);
  const TestModel = createSchoolTest(conn);
  const QuestionModel = createSchoolQuestion(conn);

  const attempt = await AttemptModel.findById(attemptId);
  if (!attempt) {
    console.error(`Attempt not found: ${attemptId}`);
    return;
  }

  const test = await TestModel.findById(attempt.testId);
  if (!test) {
    console.error(`Associated test not found for attempt: ${attemptId}`);
    return;
  }

  // Score
  const questionIds = attempt.questions.map((id) => id.toString());
  const correctQuestions = await QuestionModel.find({ _id: { $in: questionIds } }).select('correctAnswer');
  const answerMap = correctQuestions.reduce((m, q) => {
    m[q._id.toString()] = q.correctAnswer;
    return m;
  }, {});

  let correctCount = 0;

  for (const a of attempt.userAnswers) {
    const qid = a.questionId.toString();
    const selected = a.selectedAnswer;
    const correct = answerMap[qid];
    const isCorrect = correct && selected === correct;
    if (isCorrect) correctCount++;
  }

  const total = attempt.userAnswers.length;
  const percentage = total > 0 ? (correctCount / total) * 100 : 0;
  const isPassed = percentage >= test.passScorePercentage;

  attempt.score = correctCount;
  attempt.endTime = new Date();
  attempt.isPassed = isPassed;
  await attempt.save();

  try {
    // a mock user object is created for the audit log
    await logAudit({
      action: 'background_score_test',
      resourceType: 'attempt',
      resourceId: attempt._id,
      user: { _id: userId },
      details: { score: correctCount, total, percentage, isPassed },
      ip: 'background_worker',
    });
  } catch(e) {
    console.error(`Failed to log audit for attempt: ${attemptId}`, e);
  }


  console.log(`Finished processing submission for attemptId: ${attemptId}`);
});

(async function () {
  await agenda.start();
  console.log('Agenda worker started');
})();
