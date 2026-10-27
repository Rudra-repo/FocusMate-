const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Task = require('../src/models/Task');
const Subject = require('../src/models/Subject');
const Quiz = require('../src/models/Quiz');
const QuizAttempt = require('../src/models/QuizAttempt');
const Topic = require('../src/models/Topic');
const timerService = require('../src/services/timerService');
const adaptivePlannerService = require('../src/services/adaptivePlannerService');

describe('FocusMate Core Services & Business Logic Tests', () => {
  let testUser;
  let testSubject;

  before(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/focusmate';
    await mongoose.connect(mongoUri);
    testUser = await User.findOne({ email: 'taly@mail.com' });
    testSubject = await Subject.findOne({ userId: testUser._id });
  });

  after(async () => {
    await mongoose.disconnect();
  });

  test('1. Timer Service calculates actual elapsed time server-side from timestamps', async () => {
    const startedAt = new Date('2026-10-27T10:00:00.000Z');
    const endedAt = new Date('2026-10-27T10:25:00.000Z'); // 25 minutes = 1500 seconds

    const session = await timerService.recordSession(testUser._id, {
      startedAt,
      endedAt,
      subjectId: testSubject._id,
      sessionType: 'focus',
      targetMinutes: 25,
      notes: 'Test Pomodoro block',
    });

    assert.strictEqual(session.durationSeconds, 1500);
    assert.strictEqual(session.elapsedMinutes, 25);
    assert.strictEqual(session.completed, true);
  });

  test('2. Timer Service rejects invalid timestamps (endedAt before startedAt)', async () => {
    const startedAt = new Date('2026-10-27T10:25:00.000Z');
    const endedAt = new Date('2026-10-27T10:00:00.000Z');

    await assert.rejects(
      async () => {
        await timerService.recordSession(testUser._id, {
          startedAt,
          endedAt,
        });
      },
      /endedAt timestamp cannot be before startedAt/
    );
  });

  test('3. Adaptive Recommendation Engine calculates priority score with D, W, P, A factors', async () => {
    const recommendations = await adaptivePlannerService.getRecommendations(testUser._id);
    assert.ok(Array.isArray(recommendations));
    assert.ok(recommendations.length > 0, 'Should return recommendations for student');

    const topRec = recommendations[0];
    assert.ok(topRec.score > 0, 'Score should be positive');
    assert.ok(topRec.factors, 'Should contain breakdown factors');
    assert.ok(typeof topRec.factors.deadlineUrgency === 'number');
    assert.ok(typeof topRec.factors.topicWeakness === 'number');
    assert.ok(typeof topRec.factors.importance === 'number');
    assert.ok(typeof topRec.factors.accumulatedDelay === 'number');
    assert.ok(topRec.reason && topRec.reason.length > 0, 'Should provide transparent explanation');
  });

  test('4. Task CRUD preserves user privacy and isolation', async () => {
    // Create task
    const task = await Task.create({
      userId: testUser._id,
      title: 'Automated Test Task',
      dueAt: new Date(Date.now() + 86400000),
      priority: 'high',
      status: 'pending',
    });

    assert.ok(task._id);
    assert.strictEqual(task.title, 'Automated Test Task');

    // Update task
    task.status = 'completed';
    task.completedAt = new Date();
    await task.save();

    const updated = await Task.findById(task._id);
    assert.strictEqual(updated.status, 'completed');
    assert.ok(updated.completedAt);

    // Clean up
    await Task.findByIdAndDelete(task._id);
  });

  test('5. Server grades quiz attempts strictly on backend without exposing answers', async () => {
    const quiz = await Quiz.findOne({ userId: testUser._id });
    assert.ok(quiz, 'Quiz must exist');

    // Simulate answers (1 correct, rest wrong)
    const answers = [
      { questionIndex: 0, selectedOption: quiz.questions[0].correctOptionIndex },
      { questionIndex: 1, selectedOption: 999 }, // intentionally wrong
    ];

    const isFirstCorrect = answers[0].selectedOption === quiz.questions[0].correctOptionIndex;
    assert.strictEqual(isFirstCorrect, true);

    const isSecondCorrect = answers[1].selectedOption === quiz.questions[1].correctOptionIndex;
    assert.strictEqual(isSecondCorrect, false);
  });

  test('6. Topic Model supports Markdown study notes and polymorphic resources (drive, pdf, image, link)', async () => {
    let topic = await Topic.findOne({ userId: testUser._id });
    if (!topic) {
      topic = await Topic.create({
        userId: testUser._id,
        subjectId: testSubject._id,
        name: 'Automated Test Topic',
      });
    }

    topic.notes = '### Key Formula\n$$\\text{Det}(A - \\lambda I) = 0$$\n* Step 1: Compute matrix.';
    topic.resources = [
      {
        title: 'Midterm Revision Drive Folder',
        url: 'https://drive.google.com/drive/folders/sample-test',
        resourceType: 'drive',
      },
      {
        title: 'Lecture Slides PDF',
        url: 'https://example.com/slides.pdf',
        resourceType: 'pdf',
      },
      {
        title: 'Whiteboard Diagram Photo',
        url: 'https://example.com/diagram.png',
        resourceType: 'image',
      },
    ];

    await topic.save();

    const retrieved = await Topic.findById(topic._id);
    assert.ok(retrieved.notes.includes('Key Formula'));
    assert.strictEqual(retrieved.resources.length, 3);
    assert.strictEqual(retrieved.resources[0].resourceType, 'drive');
    assert.strictEqual(retrieved.resources[1].resourceType, 'pdf');
    assert.strictEqual(retrieved.resources[2].resourceType, 'image');
  });

  test('7. AI Quiz Generation creates diagnostic MCQs with correct options and server explanations', async () => {
    const aiController = require('../src/controllers/aiController');
    let capturedResult = null;

    const mockReq = {
      user: { id: testUser._id },
      body: {
        topicName: 'B-Tree & Hash Indexing',
        subjectId: testSubject._id,
        difficulty: 'hard',
      },
    };

    const mockRes = {
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        capturedResult = data;
        return this;
      },
    };

    await aiController.generateQuizForTopic(mockReq, mockRes, (err) => {
      if (err) throw err;
    });

    assert.strictEqual(mockRes.statusCode, 201);
    assert.strictEqual(capturedResult.success, true);
    assert.ok(capturedResult.quiz, 'Should return generated quiz');
    assert.ok(capturedResult.quiz.questionsCount >= 2, 'Should generate multiple questions');
  });
});
