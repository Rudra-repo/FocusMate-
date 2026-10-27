import React, { useState, useEffect, useRef } from 'react';
import { Clock, Send, Check, Plus, ChevronDown, Mic, MicOff, Sparkles } from 'lucide-react';
import api from '../../services/api';

export const TodaysTasksCard = ({ tasks = [], subjects = [], onTasksUpdated }) => {
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
    <div className="bg-white/95 rounded-3xl p-5 md:p-6 shadow-soft-card border border-[#FFE2D3]/60 flex flex-col justify-between h-full transition-all">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-base md:text-lg font-bold text-mainText font-display">
              Today's Tasks
            </h3>
            {isListening && (
              <span className="flex items-center gap-1 text-[11px] text-red-500 font-bold bg-red-50 px-2 py-0.5 rounded-full border border-red-200 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                Listening...
              </span>
            )}
          </div>
          <span className="text-xs font-semibold text-mainText-muted bg-peach-50 px-2.5 py-1 rounded-full border border-peach-200">
            {tasks.filter((t) => t.status === 'completed').length}/{tasks.length} Done
          </span>
        </div>

        {/* Task Items List matching reference image */}
        <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
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
                  className={`flex items-center justify-between py-2 px-3 rounded-2xl transition-all duration-200 group ${
                    isCompleted ? 'bg-peach-50/50 opacity-60' : 'hover:bg-peach-50/70'
                  }`}
                >
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    <button
                      onClick={() => handleToggleComplete(task)}
                      className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                        isCompleted
                          ? 'bg-successGreen border-successGreen text-white'
                          : 'border-peach-300 hover:border-coral bg-white'
                      }`}
                    >
                      {isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>

                    <div className="flex flex-col truncate">
                      <span
                        className={`text-sm font-bold text-mainText truncate ${
                          isCompleted ? 'line-through text-mainText-muted' : ''
                        }`}
                      >
                        {task.title}
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: dotColor }}
                        />
                        <span className="text-[11px] font-semibold text-mainText-muted capitalize">
                          {subjectName}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span className="text-xs font-semibold text-mainText-muted ml-2 whitespace-nowrap">
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
        <div className="my-2 p-2 rounded-xl bg-peach-100 text-coral-dark text-xs font-medium text-center animate-in fade-in duration-150">
          🎙️ {speechFeedback}
        </div>
      )}

      {/* Quick Add Bar with "Speak to Add Task" Button */}
      <form
        onSubmit={handleQuickAdd}
        className="mt-4 pt-3 border-t border-peach-100 flex items-center gap-2"
      >
        <div className="relative flex-1">
          <input
            type="text"
            placeholder={isListening ? 'Listening to voice...' : '+ Add New Task for Today'}
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className={`w-full text-xs md:text-sm pl-3 pr-2 py-2 rounded-2xl border transition-all text-mainText placeholder-mainText-muted focus:outline-none ${
              isListening
                ? 'border-red-400 bg-red-50/40 ring-2 ring-red-200'
                : 'border-peach-200 bg-peach-50/60 focus:bg-white focus:border-coral'
            }`}
          />
        </div>

        {/* Speak to Add Task Microphone Button */}
        <button
          type="button"
          onClick={handleToggleVoice}
          className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all ${
            isListening
              ? 'bg-red-500 text-white shadow-md scale-105 animate-pulse'
              : 'bg-peach-100 text-coral hover:bg-coral hover:text-white border border-peach-200 shadow-sm'
          }`}
          title={isListening ? 'Stop listening' : 'Speak to Add Task (Voice Recognition)'}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        {/* Category Pill Dropdown */}
        <div className="relative">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs font-semibold py-2 px-2.5 rounded-2xl border border-peach-200 bg-peach-50/60 text-mainText appearance-none pr-6 cursor-pointer focus:outline-none focus:border-coral"
          >
            <option value="Work">Work</option>
            <option value="Study">Study</option>
            {subjects.map((s) => (
              <option key={s._id} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3 h-3 text-mainText-muted absolute right-2 top-3 pointer-events-none" />
        </div>

        {/* Submit Arrow Button */}
        <button
          type="submit"
          disabled={!newTitle.trim() || isSubmitting}
          className="w-9 h-9 rounded-2xl bg-coral hover:bg-coral-dark text-white flex items-center justify-center shadow-sm disabled:opacity-40 transition-all hover:scale-105 active:scale-95"
          title="Add Task"
        >
          <Send className="w-4 h-4 stroke-[2.5]" />
        </button>
      </form>
    </div>
  );
};

export default TodaysTasksCard;
