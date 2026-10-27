import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Clock, Shield, Download, Check, Save } from 'lucide-react';
import api from '../services/api';

export const SettingsPage = () => {
  const { user, updateProfile, updatePreferences } = useAuth();

  const [name, setName] = useState(user?.name || 'Taly');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState(user?.dailyGoalMinutes || 120);

  const [focusDuration, setFocusDuration] = useState(user?.preferences?.focusDuration || 25);
  const [breakDuration, setBreakDuration] = useState(user?.preferences?.breakDuration || 5);
  const [longBreakDuration, setLongBreakDuration] = useState(user?.preferences?.longBreakDuration || 15);

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const presetAvatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=250&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=250&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
  ];

  const handleSaveAll = async (e) => {
    e.preventDefault();
    try {
      await updateProfile({ name, avatar, dailyGoalMinutes: Number(dailyGoalMinutes) });
      await updatePreferences({
        focusDuration: Number(focusDuration),
        breakDuration: Number(breakDuration),
        longBreakDuration: Number(longBreakDuration),
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update settings:', err);
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const [tasksRes, subjectsRes, analyticsRes] = await Promise.all([
        api.get('/tasks'),
        api.get('/subjects'),
        api.get('/analytics/overview'),
      ]);

      const exportPayload = {
        user,
        exportedAt: new Date().toISOString(),
        tasks: tasksRes.data.tasks,
        subjects: subjectsRes.data.subjects,
        analytics: analyticsRes.data.data,
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `focusmate_backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      console.error('Data export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      <div>
        <h2 className="text-xl md:text-2xl font-bold font-display text-mainText">
          Account & Study Preferences
        </h2>
        <p className="text-xs md:text-sm text-mainText-muted mt-0.5">
          Customize your student profile, Pomodoro parameters, and personal targets.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-3.5 rounded-2xl bg-green-100 text-green-800 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
          <Check className="w-4 h-4 stroke-[3]" />
          <span>Preferences successfully saved and synchronized!</span>
        </div>
      )}

      <form onSubmit={handleSaveAll} className="space-y-6">
        {/* Profile Card */}
        <div className="bg-white/95 rounded-3xl p-6 shadow-soft-card border border-[#FFE2D3]/60 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-peach-100">
            <User className="w-5 h-5 text-coral" />
            <h3 className="text-base font-bold text-mainText font-display">Student Profile</h3>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            <img
              src={avatar || user?.avatar}
              alt="Avatar Preview"
              className="w-20 h-20 rounded-full object-cover border-4 border-coral shadow-md"
            />
            <div className="space-y-2 flex-1">
              <span className="text-xs font-bold text-mainText block">Choose Avatar Preset</span>
              <div className="flex items-center gap-3">
                {presetAvatars.map((url, idx) => (
                  <img
                    key={idx}
                    src={url}
                    onClick={() => setAvatar(url)}
                    alt="Preset"
                    className={`w-10 h-10 rounded-full object-cover cursor-pointer transition-all ${
                      avatar === url ? 'ring-2 ring-coral scale-110' : 'opacity-70 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="text-xs font-bold text-mainText block mb-1">Display Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-xs md:text-sm px-3.5 py-2 rounded-xl border border-peach-200 focus:outline-none focus:border-coral"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-mainText block mb-1">Daily Study Target (Minutes)</label>
              <input
                type="number"
                min="15"
                max="720"
                step="15"
                value={dailyGoalMinutes}
                onChange={(e) => setDailyGoalMinutes(e.target.value)}
                className="w-full text-xs md:text-sm px-3.5 py-2 rounded-xl border border-peach-200 focus:outline-none focus:border-coral"
              />
              <span className="text-[11px] text-mainText-muted mt-1 block">
                Equals {Math.round((dailyGoalMinutes / 60) * 10) / 10} hours of focused Pomodoro work per day.
              </span>
            </div>
          </div>
        </div>

        {/* Pomodoro Timer Preferences */}
        <div className="bg-white/95 rounded-3xl p-6 shadow-soft-card border border-[#FFE2D3]/60 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-peach-100">
            <Clock className="w-5 h-5 text-coral" />
            <h3 className="text-base font-bold text-mainText font-display">Pomodoro Timer Durations</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-mainText block mb-1">Focus Block (Minutes)</label>
              <input
                type="number"
                min="5"
                max="90"
                value={focusDuration}
                onChange={(e) => setFocusDuration(e.target.value)}
                className="w-full text-xs md:text-sm px-3.5 py-2 rounded-xl border border-peach-200 focus:outline-none focus:border-coral"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-mainText block mb-1">Short Break (Minutes)</label>
              <input
                type="number"
                min="1"
                max="30"
                value={breakDuration}
                onChange={(e) => setBreakDuration(e.target.value)}
                className="w-full text-xs md:text-sm px-3.5 py-2 rounded-xl border border-peach-200 focus:outline-none focus:border-coral"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-mainText block mb-1">Long Break (Minutes)</label>
              <input
                type="number"
                min="5"
                max="60"
                value={longBreakDuration}
                onChange={(e) => setLongBreakDuration(e.target.value)}
                className="w-full text-xs md:text-sm px-3.5 py-2 rounded-xl border border-peach-200 focus:outline-none focus:border-coral"
              />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleExportData}
            disabled={isExporting}
            className="px-5 py-2.5 rounded-2xl bg-white border border-peach-300 text-mainText font-bold text-xs shadow-sm hover:border-coral flex items-center gap-2 transition-all"
          >
            <Download className="w-4 h-4 text-coral" />
            <span>{isExporting ? 'Exporting...' : 'Export Academic Data (JSON)'}</span>
          </button>

          <button
            type="submit"
            className="px-6 py-2.5 rounded-2xl bg-coral hover:bg-coral-dark text-white font-bold text-xs md:text-sm shadow-soft-peach flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Save Preferences</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default SettingsPage;
