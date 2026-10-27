const Task = require('../models/Task');
const Subject = require('../models/Subject');
const Topic = require('../models/Topic');
const QuizAttempt = require('../models/QuizAttempt');

class AdaptivePlannerService {
  /**
   * Generates prioritized adaptive learning recommendations
   * Formula: Priority Score = 0.35*D + 0.30*W + 0.20*P + 0.15*A
   */
  async getRecommendations(userId) {
    const now = new Date();

    // Fetch tasks, topics, and quiz attempts in parallel
    const [tasks, topics, attempts] = await Promise.all([
      Task.find({
        userId,
        status: { $in: ['pending', 'in_progress'] },
      })
        .populate('subjectId', 'name color code')
        .populate('topicId', 'name masteryLevel difficulty quizAccuracy')
        .sort({ dueAt: 1 })
        .lean(),
      Topic.find({ userId })
        .populate('subjectId', 'name color code')
        .lean(),
      QuizAttempt.find({ userId })
        .sort({ attemptedAt: -1 })
        .limit(50)
        .lean(),
    ]);

    // Create a topic-level accuracy lookup
    const topicAccuracyMap = {};
    attempts.forEach(att => {
      if (att.topicId) {
        const topId = att.topicId.toString();
        if (!topicAccuracyMap[topId]) {
          topicAccuracyMap[topId] = { totalPct: 0, count: 0 };
        }
        topicAccuracyMap[topId].totalPct += att.percentage;
        topicAccuracyMap[topId].count += 1;
      }
    });

    const recommendations = [];

    // Evaluate each pending task
    for (const task of tasks) {
      const subjectName = task.subjectId?.name || 'General';
      const subjectColor = task.subjectId?.color || '#FF8B76';
      const topicName = task.topicId?.name || task.title;

      // Factor D: Deadline urgency (0 - 100)
      let D = 15;
      const hoursToDue = (new Date(task.dueAt) - now) / (1000 * 60 * 60);
      if (hoursToDue <= 0) {
        D = 100; // already overdue
      } else if (hoursToDue <= 12) {
        D = 95;
      } else if (hoursToDue <= 24) {
        D = 90;
      } else if (hoursToDue <= 48) {
        D = 75;
      } else if (hoursToDue <= 120) {
        D = 55;
      } else if (hoursToDue <= 240) {
        D = 35;
      }

      // Factor W: Weakness in the topic (0 - 100)
      let W = 40;
      let accuracyFound = null;
      if (task.topicId) {
        const topId = task.topicId._id.toString();
        if (topicAccuracyMap[topId]) {
          const avgAcc = Math.round(topicAccuracyMap[topId].totalPct / topicAccuracyMap[topId].count);
          accuracyFound = avgAcc;
          W = Math.max(10, 100 - avgAcc);
        } else if (task.topicId.quizAccuracy !== null && task.topicId.quizAccuracy !== undefined) {
          accuracyFound = task.topicId.quizAccuracy;
          W = Math.max(10, 100 - task.topicId.quizAccuracy);
        } else {
          if (task.topicId.masteryLevel === 'revision') W = 80;
          else if (task.topicId.masteryLevel === 'learning') W = 60;
          else if (task.topicId.masteryLevel === 'not_started') W = 50;
          else if (task.topicId.masteryLevel === 'mastered') W = 15;

          if (task.topicId.difficulty === 'hard') W = Math.min(100, W + 15);
        }
      }

      // Factor P: Task importance (0 - 100)
      let priorityBase = 50;
      if (task.priority === 'high') priorityBase = 100;
      else if (task.priority === 'medium') priorityBase = 65;
      else priorityBase = 35;

      let typeBase = 50;
      if (task.taskType === 'exam') typeBase = 100;
      else if (task.taskType === 'assignment') typeBase = 85;
      else if (task.taskType === 'revision') typeBase = 75;
      else if (task.taskType === 'quiz') typeBase = 65;
      else typeBase = 45;

      const P = Math.round(0.6 * priorityBase + 0.4 * typeBase);

      // Factor A: Accumulated delay / Overdue status (0 - 100)
      let A = 0;
      const isOverdue = hoursToDue < 0;
      if (isOverdue) {
        const daysOverdue = Math.max(1, Math.ceil(Math.abs(hoursToDue) / 24));
        A = Math.min(100, 30 + daysOverdue * 18);
      } else if (task.status === 'in_progress') {
        A = 25;
      }

      // Calculate Priority Score: 0.35D + 0.30W + 0.20P + 0.15A
      const score = Math.round((0.35 * D + 0.30 * W + 0.20 * P + 0.15 * A) * 10) / 10;

      // Recommended focus duration in minutes (25 min default pomodoro)
      const recommendedMinutes = task.estimatedMinutes ? Math.min(60, Math.max(25, task.estimatedMinutes)) : 25;

      // Build transparent human-readable explanation
      let reason = '';
      if (isOverdue) {
        reason = `Overdue task for ${subjectName}. Immediate focus recommended to prevent backlog accumulation.`;
      } else if (hoursToDue <= 24) {
        reason = `Approaching deadline within 24 hours. High urgency (${task.priority} priority).`;
      } else if (accuracyFound !== null && accuracyFound < 60) {
        reason = `Recent quiz accuracy on "${topicName}" is ${accuracyFound}%. Reinforce concepts before your upcoming ${task.taskType}.`;
      } else if (task.taskType === 'revision') {
        reason = `Scheduled revision for ${subjectName} to boost long-term retention.`;
      } else {
        reason = `High-yield study target: ${task.priority} priority ${task.taskType} in ${subjectName}.`;
      }

      recommendations.push({
        id: `rec-task-${task._id}`,
        taskId: task._id,
        subjectId: task.subjectId?._id || null,
        subjectName,
        subjectColor,
        topicName,
        title: task.title,
        taskType: task.taskType,
        score,
        factors: {
          deadlineUrgency: Math.round(D),
          topicWeakness: Math.round(W),
          importance: Math.round(P),
          accumulatedDelay: Math.round(A),
        },
        weights: { D: 0.35, W: 0.30, P: 0.20, A: 0.15 },
        recommendedMinutes,
        dueAt: task.dueAt,
        hoursToDue: Math.round(hoursToDue),
        isOverdue,
        reason,
        actionType: accuracyFound !== null && accuracyFound < 50 ? 'quiz' : 'focus',
      });
    }

    // Also look for weak topics that don't have active tasks scheduled
    const weakTopics = topics.filter(t => {
      const topId = t._id.toString();
      const avgAcc = topicAccuracyMap[topId]?.count ? (topicAccuracyMap[topId].totalPct / topicAccuracyMap[topId].count) : t.quizAccuracy;
      return (avgAcc !== null && avgAcc < 60) || t.masteryLevel === 'revision';
    });

    for (const top of weakTopics.slice(0, 3)) {
      // Check if already covered by an existing task
      const alreadyCovered = recommendations.some(r => r.topicName === top.name);
      if (!alreadyCovered) {
        const topId = top._id.toString();
        const avgAcc = topicAccuracyMap[topId]?.count ? Math.round(topicAccuracyMap[topId].totalPct / topicAccuracyMap[topId].count) : top.quizAccuracy;
        const W = avgAcc ? (100 - avgAcc) : 80;
        const D = 45;
        const P = 70;
        const A = 20;
        const score = Math.round((0.35 * D + 0.30 * W + 0.20 * P + 0.15 * A) * 10) / 10;

        recommendations.push({
          id: `rec-topic-${top._id}`,
          taskId: null,
          subjectId: top.subjectId?._id || null,
          subjectName: top.subjectId?.name || 'Subject',
          subjectColor: top.subjectId?.color || '#FF8B76',
          topicName: top.name,
          title: `Revise ${top.name}`,
          taskType: 'revision',
          score,
          factors: {
            deadlineUrgency: D,
            topicWeakness: W,
            importance: P,
            accumulatedDelay: A,
          },
          weights: { D: 0.35, W: 0.30, P: 0.20, A: 0.15 },
          recommendedMinutes: 25,
          dueAt: null,
          hoursToDue: null,
          isOverdue: false,
          reason: avgAcc
            ? `${top.name} — revise for 25 minutes. Recent quiz accuracy is ${avgAcc}%, needing reinforcement.`
            : `${top.name} marked for revision in ${top.subjectId?.name || 'your course'}.`,
          actionType: 'quiz',
        });
      }
    }

    // Sort descending by score
    recommendations.sort((a, b) => b.score - a.score);

    return recommendations;
  }
}

module.exports = new AdaptivePlannerService();
