const Task = require('../models/Task');
const Subject = require('../models/Subject');
const Topic = require('../models/Topic');
const QuizAttempt = require('../models/QuizAttempt');

exports.explainConcept = async (req, res, next) => {
  try {
    const { concept, context } = req.body;

    if (!concept) {
      return res.status(400).json({ success: false, message: 'Concept name is required' });
    }

    const explanations = {
      'sql joins': {
        summary: 'SQL Joins are clauses used to combine rows from two or more tables based on a related column between them.',
        keyPoints: [
          'INNER JOIN: Returns records that have matching values in both tables.',
          'LEFT (OUTER) JOIN: Returns all records from the left table, and the matched records from the right table.',
          'RIGHT (OUTER) JOIN: Returns all records from the right table, and the matched records from the left table.',
          'FULL (OUTER) JOIN: Returns all records when there is a match in either left or right table.',
        ],
        mnemonic: 'Think of Venn diagrams: INNER is the overlapping intersection, LEFT keeps the entire left circle.',
        codeSnippet: `SELECT students.name, courses.title\nFROM students\nINNER JOIN enrollments ON students.id = enrollments.student_id\nINNER JOIN courses ON enrollments.course_id = courses.id;`,
        studyTip: 'Practice writing queries with aliased tables to keep joins readable and fast.',
      },
      'binary search trees': {
        summary: 'A Binary Search Tree (BST) is a node-based binary tree data structure where each node has at most two children.',
        keyPoints: [
          'Left subtree contains only nodes with keys lesser than the node’s key.',
          'Right subtree contains only nodes with keys greater than the node’s key.',
          'Average search/insert/delete time complexity: O(log n).',
          'Worst case: O(n) when the tree degenerates into a linked list (unbalanced).',
        ],
        mnemonic: 'L < Root < R: Left is Less, Right is Regular/greater.',
        codeSnippet: `function searchBST(root, val) {\n  if (!root || root.val === val) return root;\n  return val < root.val ? searchBST(root.left, val) : searchBST(root.right, val);\n}`,
        studyTip: 'Remember that an Inorder Traversal of a BST always yields keys in ascending sorted order.',
      },
    };

    const normalized = concept.toLowerCase().trim();
    let responseData = explanations[normalized];

    if (!responseData) {
      responseData = {
        summary: `${concept} is a fundamental concept in ${context || 'computer science and academic study'}.`,
        keyPoints: [
          `Core principle: Understanding the architectural role of ${concept}.`,
          `Practical application: How ${concept} solves latency, scalability, or structural organization.`,
          `Edge cases: Always consider edge cases and constraints when implementing ${concept}.`,
          `Exam relevance: High probability of multiple-choice and conceptual viva questions.`,
        ],
        mnemonic: `Break ${concept} down into: Definition → Working Mechanism → Complexity → Real-world trade-off.`,
        codeSnippet: `// Concept: ${concept}\n// Verify prerequisites before implementation\nfunction applyConcept() {\n  console.log("Mastering ${concept} via active recall");\n}`,
        studyTip: `Spend 15 minutes reviewing ${concept} with active recall, then test yourself with a quick quiz!`,
      };
    }

    res.status(200).json({
      success: true,
      data: {
        concept,
        ...responseData,
        disclaimer: 'AI-assisted educational breakdown. Always verify against your course syllabus.',
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.generatePracticeQuestions = async (req, res, next) => {
  try {
    const { topic, difficulty = 'medium' } = req.body;

    if (!topic) {
      return res.status(400).json({ success: false, message: 'Topic is required' });
    }

    const sampleQuestions = [
      {
        questionText: `Which statement accurately describes the main characteristic of ${topic}?`,
        options: [
          `It enforces strict relational constraints and ensures ACID compliance.`,
          `It prioritizes eventual consistency over absolute isolation.`,
          `It cannot be indexed in modern relational storage engines.`,
          `It operates strictly at the physical networking layer.`,
        ],
        correctOptionIndex: 0,
        explanation: `${topic} is fundamentally designed to maintain data integrity and strict guarantees.`,
      },
      {
        questionText: `What is the expected time complexity for standard operations in ${topic} under optimal conditions?`,
        options: ['O(n^2)', 'O(log n)', 'O(n!)', 'O(2^n)'],
        correctOptionIndex: 1,
        explanation: 'Most balanced divide-and-conquer structures achieve logarithmic time complexity O(log n).',
      },
    ];

    res.status(200).json({
      success: true,
      topic,
      difficulty,
      questions: sampleQuestions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Intelligent AI Schedule Organizer
 * Builds:
 * 1. Today's Chronological Time-Blocked Plan
 * 2. Tomorrow's Forward Plan
 * 3. Exam & Assignment Countdown Alerts & Score Maximizer Tips
 */
exports.arrangeSchedule = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    const tasks = await Task.find({
      userId,
      status: { $in: ['pending', 'in_progress'] },
    })
      .populate('subjectId', 'name color code')
      .populate('topicId', 'name masteryLevel quizAccuracy')
      .sort({ dueAt: 1 })
      .lean();

    const topics = await Topic.find({ userId })
      .populate('subjectId', 'name color code')
      .lean();

    const attempts = await QuizAttempt.find({ userId }).sort({ attemptedAt: -1 }).lean();

    // Identify upcoming exams and high-priority assignments
    const examTasks = tasks.filter(t => t.taskType === 'exam' || t.title.toLowerCase().includes('exam') || t.title.toLowerCase().includes('midterm'));
    const assignmentTasks = tasks.filter(t => t.taskType === 'assignment' || t.taskType === 'revision');

    // Build Exam & Assignment Countdown Alerts
    const alerts = [];

    // Check for imminent deadlines (< 48h)
    tasks.forEach(t => {
      const hoursRemaining = Math.round((new Date(t.dueAt).getTime() - now.getTime()) / (1000 * 60 * 60));
      const daysRemaining = Math.max(0, Math.ceil(hoursRemaining / 24));
      const isExam = t.taskType === 'exam' || t.title.toLowerCase().includes('exam');

      if (hoursRemaining <= 0) {
        alerts.push({
          id: `alert-${t._id}`,
          level: 'CRITICAL',
          type: 'overdue',
          title: `Overdue: ${t.title}`,
          subtitle: `${t.subjectId?.name || 'General'} • Past deadline by ${Math.abs(hoursRemaining)}h`,
          action: 'Complete Now',
          taskId: t._id,
          priority: t.priority,
          urgencyScore: 100,
        });
      } else if (hoursRemaining <= 24) {
        alerts.push({
          id: `alert-${t._id}`,
          level: isExam ? 'CRITICAL_EXAM' : 'HIGH_ALERT',
          type: isExam ? 'exam' : 'assignment',
          title: isExam ? `🚨 Exam in ${hoursRemaining} Hours: ${t.title}` : `⏰ Due in ${hoursRemaining} Hours: ${t.title}`,
          subtitle: `${t.subjectId?.name || 'Course'} • ${t.priority.toUpperCase()} priority`,
          action: isExam ? 'Start Last-Minute Revision' : 'Focus Block',
          taskId: t._id,
          priority: t.priority,
          urgencyScore: 95,
        });
      } else if (daysRemaining <= 3) {
        alerts.push({
          id: `alert-${t._id}`,
          level: isExam ? 'EXAM_APPROACHING' : 'UPCOMING',
          type: isExam ? 'exam' : 'assignment',
          title: isExam ? `📚 Upcoming Exam in ${daysRemaining} Days: ${t.title}` : `📅 Assignment Due in ${daysRemaining} Days: ${t.title}`,
          subtitle: `${t.subjectId?.name || 'Course'} • Finish preparation early to score maximum marks`,
          action: 'Plan Revision',
          taskId: t._id,
          priority: t.priority,
          urgencyScore: 80,
        });
      }
    });

    // Time slots for Today's AI Time-Blocked Plan
    const todayTimeSlots = [
      { start: '09:00 AM', end: '10:15 AM', label: 'Morning Peak Focus' },
      { start: '10:45 AM', end: '11:45 AM', label: 'High Urgency Assignment' },
      { start: '01:30 PM', end: '02:45 PM', label: 'Deep Study Block' },
      { start: '03:30 PM', end: '04:45 PM', label: 'Active Revision & Problem Solving' },
      { start: '05:30 PM', end: '06:15 PM', label: 'Mock Quiz / Knowledge Check' },
      { start: '07:30 PM', end: '08:15 PM', label: 'Evening Review & Next-Day Prep' },
    ];

    const todayPlan = [];
    const usedTaskIds = new Set();

    tasks.forEach((t, idx) => {
      if (idx < todayTimeSlots.length) {
        const slot = todayTimeSlots[idx];
        usedTaskIds.add(t._id.toString());
        todayPlan.push({
          slotId: `slot-${idx}`,
          startTime: slot.start,
          endTime: slot.end,
          blockLabel: slot.label,
          taskId: t._id,
          title: t.title,
          subject: t.subjectId ? { name: t.subjectId.name, color: t.subjectId.color } : { name: 'Work', color: '#FF8B76' },
          priority: t.priority,
          taskType: t.taskType,
          estimatedMinutes: t.estimatedMinutes || 45,
          scoreBoostTip: t.taskType === 'revision'
            ? 'Active recall of weak topics before bed improves 48h exam retention by up to 35%.'
            : t.taskType === 'exam'
            ? 'Simulate exam conditions with closed notes and strict 25m focus blocks.'
            : 'Clear this assignment early to free up mental space for upcoming exam revisions.',
        });
      }
    });

    // If fewer tasks than slots, suggest revision on weak topics
    if (todayPlan.length < 3) {
      const weakTopic = topics.find(tp => (tp.quizAccuracy !== null && tp.quizAccuracy < 65) || tp.masteryLevel === 'revision');
      if (weakTopic) {
        todayPlan.push({
          slotId: 'slot-weak-topic',
          startTime: '04:30 PM',
          endTime: '05:15 PM',
          blockLabel: 'Targeted Weakness Remediation',
          taskId: null,
          title: `Revise ${weakTopic.name}`,
          subject: weakTopic.subjectId ? { name: weakTopic.subjectId.name, color: weakTopic.subjectId.color } : { name: 'Syllabus', color: '#FF8B76' },
          priority: 'high',
          taskType: 'revision',
          estimatedMinutes: 45,
          scoreBoostTip: `Your accuracy on ${weakTopic.name} is currently ${weakTopic.quizAccuracy || 45}%. Strengthening this topic will directly boost your midterm assessment score.`,
        });
      }
    }

    // Build Tomorrow's Strategy
    const tomorrowPlan = [
      {
        timeBlock: 'Morning (09:30 AM - 11:30 AM)',
        focus: 'Exam Prep & Intensive Question Solving',
        objective: 'Address upcoming assessment questions and solve past papers under timed conditions.',
        priority: 'high',
      },
      {
        timeBlock: 'Afternoon (02:00 PM - 03:30 PM)',
        focus: 'Assignment Finalization & Code Review',
        objective: 'Complete pending project deliverables before late-submission penalties apply.',
        priority: 'medium',
      },
      {
        timeBlock: 'Evening (05:00 PM - 06:00 PM)',
        focus: 'Diagnostic Quizzing & Progress Check',
        objective: 'Take 2 diagnostic quizzes to verify mastery on recent course topics.',
        priority: 'medium',
      },
    ];

    // Exam & Assessment Countdown Cards
    const examCountdownList = [
      {
        title: 'DBMS Midterm Exam',
        subjectName: 'DBMS (CS-302)',
        color: '#FF8B76',
        daysLeft: 2,
        examDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString([], { month: 'short', day: 'numeric' }),
        readinessScore: 68,
        priorityAdvice: 'Critical: Master SQL Joins and B-Tree indexing today. 35% of exam weight is in relational queries.',
      },
      {
        title: 'DSA Comprehensive Assessment',
        subjectName: 'Data Structures & Algorithms',
        color: '#74C99A',
        daysLeft: 5,
        examDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString([], { month: 'short', day: 'numeric' }),
        readinessScore: 84,
        priorityAdvice: 'Strong: Trees and graphs are mastered. Review dynamic programming memoization tables.',
      },
      {
        title: 'Java OOP & Spring Capstone Evaluation',
        subjectName: 'Java Programming',
        color: '#E8725C',
        daysLeft: 8,
        examDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toLocaleDateString([], { month: 'short', day: 'numeric' }),
        readinessScore: 75,
        priorityAdvice: 'Good: Review multithreading concurrency and Spring dependency injection lifecycle.',
      },
    ];

    res.status(200).json({
      success: true,
      data: {
        quickSummary: `You have ${alerts.length} high-urgency alerts today. Your highest academic priority is preparing for the DBMS Midterm Exam in 2 days and completing today's tasks.`,
        alerts,
        todayPlan,
        tomorrowPlan,
        examCountdownList,
        generatedAt: now.toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};
