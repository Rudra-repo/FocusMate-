const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const Topic = require('../models/Topic');

exports.getQuizzes = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { subjectId, topicId } = req.query;

    const query = {
      $or: [{ userId }, { userId: { $exists: true } }] // allow system/seeded quizzes or user-created
    };
    if (subjectId) query.subjectId = subjectId;
    if (topicId) query.topicId = topicId;

    const quizzes = await Quiz.find(query)
      .populate('subjectId', 'name color code')
      .populate('topicId', 'name masteryLevel')
      .select('-questions.correctOptionIndex -questions.explanation') // Never expose correct answers in list
      .sort({ createdAt: -1 });

    // Also get user's attempt count for each quiz
    const quizIds = quizzes.map(q => q._id);
    const attempts = await QuizAttempt.find({ userId, quizId: { $in: quizIds } }).select('quizId percentage attemptedAt');

    const enriched = quizzes.map(q => {
      const qAttempts = attempts.filter(a => a.quizId.toString() === q._id.toString());
      const bestScore = qAttempts.length > 0 ? Math.max(...qAttempts.map(a => a.percentage)) : null;
      return {
        ...q.toObject(),
        questionsCount: q.questions.length,
        attemptsCount: qAttempts.length,
        bestScore,
      };
    });

    res.status(200).json({
      success: true,
      count: enriched.length,
      quizzes: enriched,
    });
  } catch (error) {
    next(error);
  }
};

exports.getQuizById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const quiz = await Quiz.findById(id)
      .populate('subjectId', 'name color code')
      .populate('topicId', 'name masteryLevel')
      .select('-questions.correctOptionIndex -questions.explanation'); // Protect answers

    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    res.status(200).json({
      success: true,
      quiz,
    });
  } catch (error) {
    next(error);
  }
};

exports.createQuiz = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { subjectId, topicId, title, description, difficulty, timeLimitMinutes, questions, isDiagnostic } = req.body;

    if (!title || !subjectId || !questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Quiz title, subjectId, and at least one question are required',
      });
    }

    const quiz = await Quiz.create({
      userId,
      subjectId,
      topicId: topicId || null,
      title,
      description: description || '',
      difficulty: difficulty || 'medium',
      timeLimitMinutes: timeLimitMinutes || 10,
      questions,
      isDiagnostic: !!isDiagnostic,
    });

    res.status(201).json({
      success: true,
      quiz,
    });
  } catch (error) {
    next(error);
  }
};

exports.submitQuizAttempt = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { answers, timeSpentSeconds = 0 } = req.body;

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ success: false, message: 'Answers array is required' });
    }

    // Retrieve quiz WITH correct answers from database
    const quiz = await Quiz.findById(id).populate('subjectId', 'name color').populate('topicId', 'name');
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    let correctCount = 0;
    const gradedAnswers = [];

    // Evaluate answers strictly on the server
    quiz.questions.forEach((q, index) => {
      const submitted = answers.find((a) => a.questionIndex === index);
      const selectedOption = submitted ? submitted.selectedOption : -1;
      const isCorrect = selectedOption === q.correctOptionIndex;

      if (isCorrect) correctCount++;

      gradedAnswers.push({
        questionIndex: index,
        questionText: q.questionText,
        selectedOption,
        correctOption: q.correctOptionIndex,
        isCorrect,
        explanation: q.explanation || '',
      });
    });

    const totalQuestions = quiz.questions.length;
    const percentage = Math.round((correctCount / totalQuestions) * 100);

    const attempt = await QuizAttempt.create({
      userId,
      quizId: quiz._id,
      subjectId: quiz.subjectId?._id || quiz.subjectId,
      topicId: quiz.topicId?._id || quiz.topicId,
      score: correctCount,
      totalQuestions,
      percentage,
      answers: gradedAnswers,
      timeSpentSeconds,
      attemptedAt: new Date(),
    });

    // Update topic stats if associated
    if (quiz.topicId) {
      const topicId = quiz.topicId._id || quiz.topicId;
      const allTopicAttempts = await QuizAttempt.find({ topicId, userId });
      const avgAccuracy = Math.round(
        allTopicAttempts.reduce((acc, a) => acc + a.percentage, 0) / allTopicAttempts.length
      );

      let newMasteryLevel = 'learning';
      if (avgAccuracy >= 85) newMasteryLevel = 'mastered';
      else if (avgAccuracy < 65) newMasteryLevel = 'revision';

      await Topic.findByIdAndUpdate(topicId, {
        quizAccuracy: avgAccuracy,
        $inc: { totalQuizAttempts: 1 },
        masteryLevel: newMasteryLevel,
        lastReviewedAt: new Date(),
      });
    }

    res.status(200).json({
      success: true,
      result: {
        attemptId: attempt._id,
        score: correctCount,
        totalQuestions,
        percentage,
        answers: gradedAnswers,
        quizTitle: quiz.title,
        subjectName: quiz.subjectId?.name || 'General',
        timeSpentSeconds,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getQuizAttempts = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { quizId } = req.query;

    const query = { userId };
    if (quizId) query.quizId = quizId;

    const attempts = await QuizAttempt.find(query)
      .populate('quizId', 'title difficulty')
      .populate('subjectId', 'name color')
      .populate('topicId', 'name')
      .sort({ attemptedAt: -1 })
      .limit(30);

    res.status(200).json({
      success: true,
      count: attempts.length,
      attempts,
    });
  } catch (error) {
    next(error);
  }
};
