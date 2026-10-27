const FocusSession = require('../models/FocusSession');
const Task = require('../models/Task');
const Topic = require('../models/Topic');
const User = require('../models/User');

class TimerService {
  /**
   * Records a completed or stopped Pomodoro session
   * Verifies elapsed duration on server via timestamps
   */
  async recordSession(userId, { startedAt, endedAt, taskId, subjectId, sessionType = 'focus', targetMinutes = 25, notes = '' }) {
    const start = new Date(startedAt);
    const end = new Date(endedAt);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error('Invalid startedAt or endedAt timestamps');
    }

    if (end < start) {
      throw new Error('endedAt timestamp cannot be before startedAt');
    }

    // Calculate actual elapsed seconds on the server
    const rawElapsedSeconds = Math.round((end.getTime() - start.getTime()) / 1000);

    // Guard against unreasonable durations (max 4 hours for a single session)
    const MAX_ALLOWED_SECONDS = 4 * 60 * 60;
    const durationSeconds = Math.min(rawElapsedSeconds, MAX_ALLOWED_SECONDS);
    const elapsedMinutes = Math.round(durationSeconds / 60);

    // Completed if at least 70% of target duration elapsed or duration >= 15 mins for focus
    const targetSeconds = (targetMinutes || 25) * 60;
    const completed = durationSeconds >= Math.min(targetSeconds * 0.7, 10 * 60);

    // Create session record
    const session = await FocusSession.create({
      userId,
      taskId: taskId || null,
      subjectId: subjectId || null,
      sessionType,
      startedAt: start,
      endedAt: end,
      durationSeconds,
      elapsedMinutes,
      completed,
      targetMinutes,
      notes,
    });

    // If focus session and completed, update related task & topic
    if (sessionType === 'focus' && elapsedMinutes > 0) {
      if (taskId) {
        await Task.findByIdAndUpdate(taskId, {
          $inc: { actualMinutes: elapsedMinutes },
        });
      }

      // Update user streak
      await this.updateUserStreak(userId);
    }

    return session;
  }

  /**
   * Updates streak counter for student based on activity
   */
  async updateUserStreak(userId) {
    const user = await User.findById(userId);
    if (!user) return;

    const now = new Date();
    const lastActive = user.streak?.lastActiveDate ? new Date(user.streak.lastActiveDate) : null;

    if (!lastActive) {
      user.streak = { current: 1, longest: 1, lastActiveDate: now };
      await user.save();
      return user.streak;
    }

    const todayStr = now.toISOString().split('T')[0];
    const lastActiveStr = lastActive.toISOString().split('T')[0];

    if (todayStr === lastActiveStr) {
      // Already active today, streak remains intact
      return user.streak;
    }

    // Check if last active was yesterday
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (lastActiveStr === yesterdayStr) {
      // Consecutive day!
      const nextCurrent = (user.streak.current || 0) + 1;
      const nextLongest = Math.max(nextCurrent, user.streak.longest || 1);
      user.streak = {
        current: nextCurrent,
        longest: nextLongest,
        lastActiveDate: now,
      };
    } else {
      // Broken streak, reset to 1
      user.streak = {
        current: 1,
        longest: Math.max(user.streak.longest || 1, 1),
        lastActiveDate: now,
      };
    }

    await user.save();
    return user.streak;
  }
}

module.exports = new TimerService();
