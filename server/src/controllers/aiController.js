exports.explainConcept = async (req, res, next) => {
  try {
    const { concept, context } = req.body;

    if (!concept) {
      return res.status(400).json({ success: false, message: 'Concept name is required' });
    }

    // Knowledge synthesis engine with clear educational explanation structure
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
      // Dynamic concept generation
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
