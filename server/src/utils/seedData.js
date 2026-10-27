require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Subject = require('../models/Subject');
const Topic = require('../models/Topic');
const Task = require('../models/Task');
const FocusSession = require('../models/FocusSession');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const Goal = require('../models/Goal');

const seed = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/focusmate';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing collections
    await User.deleteMany({});
    await Subject.deleteMany({});
    await Topic.deleteMany({});
    await Task.deleteMany({});
    await FocusSession.deleteMany({});
    await Quiz.deleteMany({});
    await QuizAttempt.deleteMany({});
    await Goal.deleteMany({});

    console.log('Cleared existing collections.');

    // 1. Create Demo User "Taly" matching the reference mockup
    const passwordHash = await User.hashPassword('focusmate123');
    const user = await User.create({
      name: 'Taly',
      email: 'taly@mail.com',
      passwordHash,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
      dailyGoalMinutes: 180, // 3 hours
      preferences: {
        focusDuration: 25,
        breakDuration: 5,
        longBreakDuration: 15,
        soundEnabled: true,
        ambientSound: 'none',
        theme: 'pastel',
        blockedItems: [
          { id: 'telegram', name: 'Telegram', icon: 'telegram', category: 'Chat' },
          { id: 'instagram', name: 'Instagram', icon: 'instagram', category: 'Social' },
          { id: 'x', name: 'X', icon: 'x', category: 'Social' },
        ],
        focusMoodActive: false,
      },
      streak: {
        current: 5,
        longest: 12,
        lastActiveDate: new Date(),
      },
    });

    console.log(`Created user: ${user.name} (${user.email})`);

    // 2. Create Subjects
    const subjectsData = [
      {
        userId: user._id,
        name: 'Math practice',
        code: 'MATH-201',
        color: '#FF9856',
        icon: 'Calculator',
        targetHours: 25,
        description: 'Discrete mathematics, linear algebra, and calculus foundations.',
      },
      {
        userId: user._id,
        name: 'DBMS',
        code: 'CS-302',
        color: '#FF8B76',
        icon: 'Database',
        targetHours: 30,
        description: 'Relational algebra, SQL queries, indexing, and normalization.',
      },
      {
        userId: user._id,
        name: 'Data Structures & Algorithms',
        code: 'CS-201',
        color: '#74C99A',
        icon: 'Cpu',
        targetHours: 40,
        description: 'Trees, graphs, dynamic programming, and asymptotic analysis.',
      },
      {
        userId: user._id,
        name: 'Java Programming',
        code: 'CS-204',
        color: '#E8725C',
        icon: 'Code2',
        targetHours: 20,
        description: 'Object-oriented programming, streams, multithreading, and Spring Boot.',
      },
      {
        userId: user._id,
        name: 'Web Development',
        code: 'CS-310',
        color: '#E6A817',
        icon: 'Globe',
        targetHours: 35,
        description: 'MERN stack, frontend architecture, REST APIs, and authentication.',
      },
    ];

    const subjects = await Subject.insertMany(subjectsData);
    console.log(`Inserted ${subjects.length} subjects.`);

    const mathSub = subjects[0];
    const dbmsSub = subjects[1];
    const dsaSub = subjects[2];
    const javaSub = subjects[3];
    const webSub = subjects[4];

    // 3. Create Topics
    const topicsData = [
      // DBMS Topics
      {
        userId: user._id,
        subjectId: dbmsSub._id,
        name: 'SQL Joins',
        masteryLevel: 'revision', // Marked as weak/revision as specified in PRD!
        difficulty: 'medium',
        notes: 'Review INNER, LEFT, RIGHT, and FULL OUTER joins. Be careful with NULL handling in LEFT JOIN where clauses.',
        quizAccuracy: 45,
        totalQuizAttempts: 2,
        timeSpentMinutes: 90,
        resources: [
          {
            title: 'Unit 3 Lecture Slides & Midterm Revision',
            url: 'https://drive.google.com/drive/folders/1aBcDeFgHiJkLmNoPqRsTuVwXyZ',
            resourceType: 'drive',
          },
          {
            title: 'SQL Joins Visual Venn Diagram & Cheat Sheet',
            url: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800',
            resourceType: 'image',
          },
          {
            title: 'Prof. Rao DBMS Problem Set PDF',
            url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
            resourceType: 'pdf',
          },
        ],
      },
      {
        userId: user._id,
        subjectId: dbmsSub._id,
        name: 'B-Tree & Hash Indexing',
        masteryLevel: 'learning',
        difficulty: 'hard',
        notes: 'B-Trees are optimized for range queries. Hash indexes are O(1) for equality but do not support ranges.',
        quizAccuracy: 70,
        totalQuizAttempts: 1,
        timeSpentMinutes: 120,
      },
      {
        userId: user._id,
        subjectId: dbmsSub._id,
        name: 'Normalization (1NF to BCNF)',
        masteryLevel: 'mastered',
        difficulty: 'medium',
        notes: 'Decomposition should preserve functional dependencies and lossless join property.',
        quizAccuracy: 90,
        totalQuizAttempts: 3,
        timeSpentMinutes: 150,
      },
      // DSA Topics
      {
        userId: user._id,
        subjectId: dsaSub._id,
        name: 'Binary Search Trees & AVL',
        masteryLevel: 'learning',
        difficulty: 'medium',
        notes: 'Inorder traversal gives sorted keys. AVL maintains height balance factor between -1 and +1.',
        quizAccuracy: 65,
        totalQuizAttempts: 2,
        timeSpentMinutes: 140,
        resources: [
          {
            title: 'AVL Rotations & Balance Factors Diagram',
            url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800',
            resourceType: 'image',
          },
          {
            title: 'DSA Lecture Notes Google Drive Folder',
            url: 'https://drive.google.com/drive/folders/dsa-lecture-notes',
            resourceType: 'drive',
          },
        ],
      },
      {
        userId: user._id,
        subjectId: dsaSub._id,
        name: 'Graph Traversal (BFS & DFS)',
        masteryLevel: 'mastered',
        difficulty: 'medium',
        notes: 'BFS uses a Queue for shortest path in unweighted graphs. DFS uses Stack/recursion for cycle detection.',
        quizAccuracy: 88,
        totalQuizAttempts: 4,
        timeSpentMinutes: 200,
      },
      // Math Topics
      {
        userId: user._id,
        subjectId: mathSub._id,
        name: 'Linear Algebra Matrix Operations',
        masteryLevel: 'learning',
        difficulty: 'medium',
        notes: 'Eigenvalues and Eigenvectors: det(A - lambda*I) = 0.',
        quizAccuracy: 60,
        totalQuizAttempts: 1,
        timeSpentMinutes: 80,
      },
    ];

    const topics = await Topic.insertMany(topicsData);
    console.log(`Inserted ${topics.length} topics.`);

    const sqlJoinsTopic = topics[0];
    const bstTopic = topics[3];

    // 4. Create Today's and Upcoming Tasks (matching reference image)
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const tasksData = [
      {
        userId: user._id,
        title: 'Meeting',
        description: 'Academic advisor sync on semester capstone project.',
        subjectId: javaSub._id,
        dueAt: new Date(today.getTime() + 8 * 60 * 60 * 1000), // 8:00 AM
        priority: 'medium',
        status: 'completed',
        taskType: 'work',
        estimatedMinutes: 30,
        actualMinutes: 30,
        completedAt: new Date(today.getTime() + 8.5 * 60 * 60 * 1000),
      },
      {
        userId: user._id,
        title: 'Learning Python',
        description: 'Complete decorators, generators, and list comprehensions modules.',
        subjectId: webSub._id,
        dueAt: new Date(today.getTime() + 14 * 60 * 60 * 1000), // 2:00 PM
        priority: 'high',
        status: 'in_progress',
        taskType: 'study',
        estimatedMinutes: 60,
        actualMinutes: 25,
      },
      {
        userId: user._id,
        title: 'Research',
        description: 'Literature review on distributed consensus algorithms and Raft.',
        subjectId: dbmsSub._id,
        dueAt: new Date(today.getTime() + 18 * 60 * 60 * 1000), // 6:00 PM
        priority: 'low',
        status: 'pending',
        taskType: 'work',
        estimatedMinutes: 45,
      },
      {
        userId: user._id,
        title: 'SQL Joins Practice Set',
        description: 'Solve 10 LeetCode / HackerRank SQL join challenges before quiz.',
        subjectId: dbmsSub._id,
        topicId: sqlJoinsTopic._id,
        dueAt: new Date(today.getTime() + 20 * 60 * 60 * 1000), // tonight 8 PM
        priority: 'high',
        status: 'pending',
        taskType: 'revision',
        estimatedMinutes: 40,
      },
      {
        userId: user._id,
        title: 'DBMS Assessment Exam',
        description: 'Midterm covering relational algebra, SQL joins, and indexing.',
        subjectId: dbmsSub._id,
        dueAt: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000), // in 2 days
        priority: 'high',
        status: 'pending',
        taskType: 'exam',
        estimatedMinutes: 90,
      },
    ];

    await Task.insertMany(tasksData);
    console.log(`Inserted tasks.`);

    // 5. Create Sample Completed Focus Sessions for the past 7 days
    // to give realistic weekly chart data matching the reference image!
    const focusSessionsData = [];
    const minutesByDay = [150, 90, 180, 210, 160, 240, 130]; // Past 7 days

    for (let i = 6; i >= 0; i--) {
      const sessionDate = new Date(now);
      sessionDate.setDate(sessionDate.getDate() - i);
      sessionDate.setHours(10, 0, 0, 0);

      const mins = minutesByDay[6 - i];
      const durationSeconds = mins * 60;
      const endDate = new Date(sessionDate.getTime() + durationSeconds * 1000);

      focusSessionsData.push({
        userId: user._id,
        subjectId: subjects[i % subjects.length]._id,
        sessionType: 'focus',
        startedAt: sessionDate,
        endedAt: endDate,
        durationSeconds,
        elapsedMinutes: mins,
        completed: true,
        targetMinutes: mins,
        notes: `Focused study block on ${subjects[i % subjects.length].name}`,
      });
    }

    await FocusSession.insertMany(focusSessionsData);
    console.log(`Inserted ${focusSessionsData.length} focus sessions.`);

    // 6. Create Quizzes with questions & explanations
    const sqlQuiz = await Quiz.create({
      userId: user._id,
      subjectId: dbmsSub._id,
      topicId: sqlJoinsTopic._id,
      title: 'SQL Joins & Relational Queries',
      description: 'Test your understanding of INNER, LEFT, RIGHT, and FULL OUTER joins.',
      difficulty: 'medium',
      timeLimitMinutes: 10,
      questions: [
        {
          questionText: 'Which SQL join returns all rows from the left table, and matching rows from the right table, filling with NULL when there is no match?',
          options: ['INNER JOIN', 'LEFT JOIN', 'FULL JOIN', 'CROSS JOIN'],
          correctOptionIndex: 1,
          explanation: 'LEFT JOIN (or LEFT OUTER JOIN) returns all records from the left table, and the matched records from the right table. If there is no match, the result is NULL on the right side.',
        },
        {
          questionText: 'What is the result of a CROSS JOIN between a table with 5 rows and a table with 4 rows?',
          options: ['9 rows', '20 rows', '5 rows', '4 rows'],
          correctOptionIndex: 1,
          explanation: 'A CROSS JOIN produces the Cartesian product of the two tables: 5 * 4 = 20 rows.',
        },
        {
          questionText: 'In a query with `SELECT * FROM A LEFT JOIN B ON A.id = B.a_id WHERE B.id IS NULL`, what is being filtered?',
          options: [
            'Rows that exist in both A and B',
            'Rows that exist in A but have NO corresponding record in B',
            'Rows that exist in B but not in A',
            'All rows from B with NULL values',
          ],
          correctOptionIndex: 1,
          explanation: 'This is the standard pattern for finding records in table A that do NOT have matching foreign keys in table B.',
        },
      ],
    });

    const dsaQuiz = await Quiz.create({
      userId: user._id,
      subjectId: dsaSub._id,
      topicId: bstTopic._id,
      title: 'Binary Search Trees & Traversal',
      description: 'Assess BST properties, search complexity, and tree balancing.',
      difficulty: 'medium',
      timeLimitMinutes: 8,
      questions: [
        {
          questionText: 'Which traversal of a Binary Search Tree produces values in strictly ascending sorted order?',
          options: ['Preorder', 'Inorder', 'Postorder', 'Level-order'],
          correctOptionIndex: 1,
          explanation: 'An Inorder traversal (Left, Root, Right) processes BST nodes in ascending sorted sequence.',
        },
        {
          questionText: 'What is the worst-case time complexity of searching in an unbalanced BST?',
          options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
          correctOptionIndex: 2,
          explanation: 'When a BST is completely skewed (like a degenerate linked list), search degrades to O(n).',
        },
      ],
    });

    console.log('Inserted sample quizzes.');

    // 7. Create Quiz Attempts to establish baseline accuracy
    await QuizAttempt.create({
      userId: user._id,
      quizId: sqlQuiz._id,
      subjectId: dbmsSub._id,
      topicId: sqlJoinsTopic._id,
      score: 1,
      totalQuestions: 3,
      percentage: 33, // Low score triggers the recommendation engine!
      answers: [
        { questionIndex: 0, questionText: 'Which SQL join returns all rows...', selectedOption: 1, correctOption: 1, isCorrect: true },
        { questionIndex: 1, questionText: 'What is the result of a CROSS JOIN...', selectedOption: 0, correctOption: 1, isCorrect: false },
        { questionIndex: 2, questionText: 'In a query with SELECT * FROM A LEFT JOIN...', selectedOption: 0, correctOption: 1, isCorrect: false },
      ],
      timeSpentSeconds: 180,
      attemptedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    });

    // 8. Create Academic Goals
    await Goal.create({
      userId: user._id,
      title: 'Complete 20 hours of focused study this week',
      category: 'study_hours',
      target: 20,
      progress: 14.5,
      unit: 'hours',
      deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      completed: false,
    });

    console.log(' Database seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error(' Seeding failed:', error);
    process.exit(1);
  }
};

seed();
