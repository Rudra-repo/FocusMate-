import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Send, Check, Plus, ChevronDown, Mic, MicOff, Sparkles, BookOpen, Tag } from 'lucide-react';
import api from '../../services/api';

export const TodaysTasksCard = ({ tasks = [], subjects = [], onTasksUpdated }) => {
  const navigate = useNavigate();
  const [newTitle, setNewTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Work');
  const [selectedTime, setSelectedTime] = useState('02:00 PM');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechFeedback, setSpeechFeedback] = useState('');

  const recognitionRef = useRef(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechFeedback('Listening... Speak your task now!');
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setNewTitle(transcript);
          setSpeechFeedback(`Heard: "${transcript}"`);
          setTimeout(() => setSpeechFeedback(''), 3000);
        }
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        setSpeechFeedback('Voice input error. Please try again.');
        setTimeout(() => setSpeechFeedback(''), 3000);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const handleToggleVoice = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        recognitionRef.current.stop();
        setTimeout(() => recognitionRef.current.start(), 200);
      }
    }
  };

  // Format time display helper
  const formatDueTime = (dueAt) => {
    if (!dueAt) return 'Today';
    try {
      const date = new Date(dueAt);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return 'Today';
    }
  };

  const handleToggleComplete = async (task) => {
    const nextStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      await api.patch(`/tasks/${task._id}`, { status: nextStatus });
      if (onTasksUpdated) onTasksUpdated();
    } catch (err) {
      console.error('Failed to toggle task:', err);
    }
  };

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsSubmitting(true);
    try {
      const matchedSubject = subjects.find(
        (s) => s.name.toLowerCase() === selectedCategory.toLowerCase()
      );

      const now = new Date();
      const [time, modifier] = selectedTime.split(' ');
      let [hours, minutes] = time.split(':');
      hours = parseInt(hours, 10);
      if (modifier === 'PM' && hours < 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;

      const dueAt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, parseInt(minutes || 0, 10));

      await api.post('/tasks', {
        title: newTitle.trim(),
        subjectId: matchedSubject ? matchedSubject._id : null,
        taskType: selectedCategory.toLowerCase() === 'work' ? 'work' : 'study',
        dueAt,
        priority: 'medium',
      });

      setNewTitle('');
      setSpeechFeedback('');
      if (onTasksUpdated) onTasksUpdated();
    } catch (err) {
      console.error('Failed to create quick task:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white/95 rounded-3xl p-4 sm:p-5 md:p-6 shadow-soft-card border border-[#FFE2D3]/60 flex flex-col justify-between h-full transition-all min-w-0">
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex items-center justify-between mb-3 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="text-base md:text-lg font-bold text-mainText font-display truncate">
              Today's Tasks
            </h3>
            {isListening && (
              <span className="flex items-center gap-1 text-[11px] text-red-500 font-bold bg-red-50 px-2 py-0.5 rounded-full border border-red-200 animate-pulse shrink-0">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                Listening...
              </span>
            )}
          </div>
          <span className="text-xs font-semibold text-mainText-muted bg-peach-50 px-2.5 py-1 rounded-full border border-peach-200 shrink-0 ml-2">
            {tasks.filter((t) => t.status === 'completed').length}/{tasks.length} Done
          </span>
        </div>

        {/* Task Items List matching reference image */}
        <div className="space-y-2.5 max-h-[290px] sm:max-h-[320px] overflow-y-auto pr-1 pb-2 scroll-smooth">
          {tasks.length === 0 ? (
            <div className="py-8 text-center text-mainText-muted text-xs">
              Your day is clear — use voice or type to plan a 25-minute focus session!
            </div>
          ) : (
            tasks.map((task) => {
              const isCompleted = task.status === 'completed';
              const subjectName = task.subject?.name || task.subjectName || (task.taskType === 'work' ? 'Work' : 'Study');
              const dotColor = task.subject?.color || (subjectName === 'Work' ? '#FF8B76' : '#74C99A');

              return (
                <div
                  key={task._id}
                  className={`flex items-center justify-between py-2 px-2.5 sm:px-3 rounded-2xl transition-all duration-200 group ${
                    isCompleted ? 'bg-peach-50/50 opacity-60' : 'hover:bg-peach-50/70'
                  }`}
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
                    <button
                      onClick={() => handleToggleComplete(task)}
                      className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all shrink-0 ${
                        isCompleted
                          ? 'bg-successGreen border-successGreen text-white'
                          : 'border-peach-300 hover:border-coral bg-white'
                      }`}
                    >
                      {isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>

                    <div
                      className="flex flex-col min-w-0 flex-1 cursor-pointer group-hover:translate-x-0.5 transition-transform"
                      onClick={() => {
                        navigate('/subjects', {
                          state: {
                            selectedSubjectId: task.subjectId?._id || task.subjectId || null,
                            targetTopicName: task.title,
                            openTopicModal: true,
                          },
                        });
                      }}
                      title="Click to view syllabus topics & study recommendations for this task"
                    >
                      <span
                        className={`text-xs sm:text-sm font-bold text-mainText truncate hover:text-coral transition-colors ${
                          isCompleted ? 'line-through text-mainText-muted' : ''
                        }`}
                      >
                        {task.title}
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: dotColor }}
                        />
                        <span className="text-[11px] font-semibold text-mainText-muted capitalize flex items-center gap-1 min-w-0 truncate">
                          <span className="truncate">{subjectName}</span>
                          <span className="text-coral text-[10px] font-bold shrink-0">→ View Syllabus</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <span className="text-[11px] sm:text-xs font-semibold text-mainText-muted ml-2 whitespace-nowrap shrink-0">
                    {formatDueTime(task.dueAt)}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Voice Status Pill */}
      {speechFeedback && (
        <div className="my-2 p-1.5 px-3 rounded-xl bg-peach-100 text-coral-dark text-xs font-medium text-center animate-in fade-in duration-150 flex items-center justify-center gap-1.5 shrink-0">
          <span>🎙️</span>
          <span className="truncate">{speechFeedback}</span>
        </div>
      )}

      {/* Quick Add Bar with "Speak to Add Task" Button - Space Managed Responsively */}
      <form
        onSubmit={handleQuickAdd}
        className="mt-3 pt-3 border-t border-peach-100 flex flex-col gap-2 shrink-0 w-full min-w-0"
      >
        {/* Full-width text input with embedded Mic and Submit buttons */}
        <div className="relative flex items-center w-full min-w-0">
          <input
            type="text"
            placeholder={isListening ? 'Listening... speak task' : 'Add new task for today...'}
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className={`w-full text-xs sm:text-sm pl-3.5 pr-[72px] py-2 sm:py-2.5 rounded-2xl border transition-all text-mainText placeholder-mainText-muted/80 focus:outline-none shadow-xs ${
              isListening
                ? 'border-red-400 bg-red-50/50 ring-2 ring-red-200'
                : 'border-peach-200 bg-peach-50/60 focus:bg-white focus:border-coral focus:ring-2 focus:ring-coral/20'
            }`}
          />

          {/* Embedded Right Controls inside the input box */}
          <div className="absolute right-1.5 flex items-center gap-1">
            {/* Speak to Add Task Microphone Button */}
            <button
              type="button"
              onClick={handleToggleVoice}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center transition-all ${
                isListening
                  ? 'bg-red-500 text-white shadow-sm scale-105 animate-pulse'
                  : 'text-coral hover:bg-peach-100/90 active:scale-95'
              }`}
              title={isListening ? 'Stop listening' : 'Speak to Add Task (Voice Recognition)'}
            >
              {isListening ? <MicOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Mic className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            </button>

            {/* Submit Arrow Button */}
            <button
              type="submit"
              disabled={!newTitle.trim() || isSubmitting}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-coral hover:bg-coral-dark text-white flex items-center justify-center shadow-xs disabled:opacity-30 disabled:pointer-events-none transition-all hover:scale-105 active:scale-95"
              title="Add Task (Enter)"
            >
              <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Category & Helper Sub-bar */}
        <div className="flex items-center justify-between gap-2 px-1 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <span className="text-[11px] font-medium text-mainText-muted/75 shrink-0 flex items-center gap-1">
              <Tag className="w-3 h-3 text-coral/80" /> Tag:
            </span>
            <div className="relative inline-block max-w-[180px] sm:max-w-[210px] min-w-0">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-[11px] font-semibold py-1 pl-2 pr-5 rounded-lg border border-peach-200/80 bg-peach-50/70 hover:bg-peach-100/60 text-mainText appearance-none cursor-pointer focus:outline-none focus:border-coral truncate max-w-full"
              >
                <option value="Work">💼 Work</option>
                <option value="Study">📚 Study</option>
                {subjects.map((s) => (
                  <option key={s._id} value={s.name}>
                    📖 {s.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-mainText-muted absolute right-1.5 top-2 pointer-events-none" />
            </div>
          </div>

          <span className="text-[10px] text-mainText-muted/60 shrink-0 font-medium hidden xs:inline">
            ↵ Enter
          </span>
        </div>
      </form>
    </div>
  );
};

export default TodaysTasksCard;
