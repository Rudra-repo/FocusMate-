import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Calendar, Clock, AlertCircle, CheckCircle, Trash2, Edit2, X } from 'lucide-react';
import api from '../services/api';

// In-memory module cache for instant tab switching
let cachedTasks = null;
let cachedTaskSubjects = null;

export const TasksPage = () => {
  const [tasks, setTasks] = useState(cachedTasks || []);
  const [subjects, setSubjects] = useState(cachedTaskSubjects || []);
  const [loading, setLoading] = useState(!cachedTasks);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subjectId: '',
    dueAt: '',
    priority: 'medium',
    taskType: 'study',
    estimatedMinutes: 30,
  });

  const fetchData = async () => {
    if (!cachedTasks) setLoading(true);
    try {
      const [tasksRes, subjectsRes] = await Promise.all([
        api.get('/tasks', {
          params: {
            search,
            status: statusFilter,
            priority: priorityFilter,
            subjectId: subjectFilter,
          },
        }),
        api.get('/subjects'),
      ]);

      if (tasksRes.data.success) {
        cachedTasks = tasksRes.data.tasks;
        setTasks(tasksRes.data.tasks);
      }
      if (subjectsRes.data.success) {
        cachedTaskSubjects = subjectsRes.data.subjects;
        setSubjects(subjectsRes.data.subjects);
      }
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, statusFilter, priorityFilter, subjectFilter]);

  const handleOpenCreate = () => {
    setEditingTask(null);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(17, 0, 0, 0);

    setFormData({
      title: '',
      description: '',
      subjectId: subjects[0]?._id || '',
      dueAt: tomorrow.toISOString().slice(0, 16),
      priority: 'medium',
      taskType: 'study',
      estimatedMinutes: 30,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      subjectId: task.subjectId?._id || task.subjectId || '',
      dueAt: task.dueAt ? new Date(task.dueAt).toISOString().slice(0, 16) : '',
      priority: task.priority,
      taskType: task.taskType || 'study',
      estimatedMinutes: task.estimatedMinutes || 30,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTask) {
        await api.patch(`/tasks/${editingTask._id}`, formData);
      } else {
        await api.post('/tasks', formData);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Failed to save task:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${id}`);
      fetchData();
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  const handleToggleStatus = async (task) => {
    const nextStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      await api.patch(`/tasks/${task._id}`, { status: nextStatus });
      fetchData();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const isOverdue = (dueAt, status) => {
    if (status === 'completed' || !dueAt) return false;
    return new Date(dueAt) < new Date();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Bar with Search & New Task Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-mainText-muted absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search assignments, exams, revision topics..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-2xl bg-white/90 border border-peach-200 text-xs md:text-sm text-mainText placeholder-mainText-muted focus:outline-none focus:border-coral"
          />
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-5 py-2.5 rounded-2xl bg-coral hover:bg-coral-dark text-white font-bold text-xs md:text-sm shadow-soft-peach flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>New Task</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-semibold">
        {['all', 'pending', 'in_progress', 'completed'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3.5 py-1.5 rounded-xl capitalize transition-all whitespace-nowrap ${
              statusFilter === st
                ? 'bg-coral text-white shadow-sm'
                : 'bg-white/80 text-mainText-muted hover:bg-white'
            }`}
          >
            {st.replace('_', ' ')}
          </button>
        ))}

        <div className="h-4 w-px bg-peach-300 mx-1" />

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-3 py-1.5 rounded-xl bg-white/80 border border-peach-200 text-mainText text-xs font-semibold focus:outline-none"
        >
          <option value="all">All Priorities</option>
          <option value="high">High Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="low">Low Priority</option>
        </select>

        <select
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          className="px-3 py-1.5 rounded-xl bg-white/80 border border-peach-200 text-mainText text-xs font-semibold focus:outline-none"
        >
          <option value="all">All Courses</option>
          {subjects.map((sub) => (
            <option key={sub._id} value={sub._id}>
              {sub.name}
            </option>
          ))}
        </select>
      </div>

      {/* Task List Table / Cards */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-12 text-center text-sm text-mainText-muted">Loading tasks...</div>
        ) : tasks.length === 0 ? (
          <div className="bg-white/80 rounded-3xl p-12 text-center border border-peach-200">
            <Calendar className="w-12 h-12 text-peach-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-mainText">No tasks found matching your filters</p>
            <p className="text-xs text-mainText-muted mt-1">Try switching filters or add a new task.</p>
          </div>
        ) : (
          tasks.map((task) => {
            const overdue = isOverdue(task.dueAt, task.status);
            const isCompleted = task.status === 'completed';

            return (
              <div
                key={task._id}
                className={`bg-white/95 rounded-2xl p-4 md:p-5 shadow-soft-card border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  overdue
                    ? 'border-red-300 bg-red-50/20'
                    : isCompleted
                    ? 'border-peach-100 bg-peach-50/30 opacity-75'
                    : 'border-[#FFE2D3]/60 hover:border-coral/50'
                }`}
              >
                {/* Left Side: Checkbox & Title */}
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <button
                    onClick={() => handleToggleStatus(task)}
                    className={`w-6 h-6 rounded-lg border mt-0.5 flex items-center justify-center shrink-0 transition-all ${
                      isCompleted
                        ? 'bg-successGreen border-successGreen text-white'
                        : 'border-peach-300 hover:border-coral bg-white'
                    }`}
                  >
                    {isCompleted && <CheckCircle className="w-4 h-4" />}
                  </button>

                  <div
                    className="min-w-0 flex-1 cursor-pointer group"
                    onClick={() => {
                      navigate('/subjects', {
                        state: {
                          selectedSubjectId: task.subjectId?._id || task.subjectId,
                          targetTopicName: task.title,
                          openTopicModal: true,
                        },
                      });
                    }}
                    title="Click to view syllabus topics & study plan"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                        style={{ backgroundColor: task.subjectId?.color || '#FF8B76' }}
                      >
                        {task.subjectId?.name || 'General'}
                      </span>
                      <span className="text-[11px] font-semibold text-mainText-muted capitalize px-2 py-0.5 rounded-full bg-peach-50 border border-peach-200">
                        {task.taskType}
                      </span>
                      <span className="text-[10px] font-bold text-coral group-hover:underline flex items-center gap-0.5">
                        → Syllabus & Plan
                      </span>
                      {overdue && (
                        <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Overdue
                        </span>
                      )}
                    </div>

                    <h4
                      className={`text-sm md:text-base font-bold text-mainText mt-1 group-hover:text-coral transition-colors ${
                        isCompleted ? 'line-through text-mainText-muted' : ''
                      }`}
                    >
                      {task.title}
                    </h4>

                    {task.description && (
                      <p className="text-xs text-mainText-muted mt-0.5 line-clamp-1">
                        {task.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Side: Due Date, Priority & Actions */}
                <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-peach-100">
                  <div className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1.5 text-mainText-muted font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{task.estimatedMinutes}m</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-mainText-muted font-medium">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>
                        {new Date(task.dueAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        task.priority === 'high'
                          ? 'bg-red-100 text-red-600'
                          : task.priority === 'medium'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {task.priority}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(task)}
                      className="p-1.5 rounded-lg text-mainText-muted hover:text-coral hover:bg-peach-50 transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(task._id)}
                      className="p-1.5 rounded-lg text-mainText-muted hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Task Creation & Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#342D2B]/35 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-peach-200 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-peach-100 mb-4">
              <h3 className="text-lg font-bold font-display text-mainText">
                {editingTask ? 'Edit Task' : 'Create New Task'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-peach-50 text-mainText-muted hover:text-coral flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-mainText block mb-1">Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DBMS Assignment 3 - SQL Joins"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full text-xs md:text-sm px-3.5 py-2 rounded-xl border border-peach-200 focus:outline-none focus:border-coral"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-mainText block mb-1">Description</label>
                <textarea
                  rows="2"
                  placeholder="Brief notes, assignment guidelines or criteria..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full text-xs md:text-sm px-3.5 py-2 rounded-xl border border-peach-200 focus:outline-none focus:border-coral"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-mainText block mb-1">Subject / Course</label>
                  <select
                    value={formData.subjectId}
                    onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-peach-200 focus:outline-none focus:border-coral"
                  >
                    <option value="">No Course (General)</option>
                    {subjects.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-mainText block mb-1">Task Type</label>
                  <select
                    value={formData.taskType}
                    onChange={(e) => setFormData({ ...formData, taskType: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-peach-200 focus:outline-none focus:border-coral"
                  >
                    <option value="assignment">Assignment</option>
                    <option value="revision">Revision</option>
                    <option value="quiz">Quiz Prep</option>
                    <option value="exam">Exam</option>
                    <option value="study">Study</option>
                    <option value="work">Work</option>
                    <option value="personal">Personal</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-mainText block mb-1">Due Date & Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.dueAt}
                    onChange={(e) => setFormData({ ...formData, dueAt: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-peach-200 focus:outline-none focus:border-coral"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-mainText block mb-1">Estimated Minutes</label>
                  <input
                    type="number"
                    min="5"
                    max="480"
                    value={formData.estimatedMinutes}
                    onChange={(e) => setFormData({ ...formData, estimatedMinutes: Number(e.target.value) })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-peach-200 focus:outline-none focus:border-coral"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-mainText block mb-1">Priority</label>
                <div className="grid grid-cols-3 gap-2">
                  {['low', 'medium', 'high'].map((p) => (
                    <button
                      type="button"
                      key={p}
                      onClick={() => setFormData({ ...formData, priority: p })}
                      className={`py-1.5 rounded-xl capitalize text-xs font-bold border transition-all ${
                        formData.priority === p
                          ? 'bg-coral text-white border-coral shadow-sm'
                          : 'bg-peach-50 text-mainText-muted border-peach-200'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-peach-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-mainText-muted hover:bg-peach-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-coral hover:bg-coral-dark text-white text-xs font-bold shadow-soft-peach"
                >
                  {editingTask ? 'Save Changes' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksPage;
