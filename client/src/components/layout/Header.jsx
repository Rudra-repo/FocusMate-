import React, { useState } from 'react';
import { Bell, Sparkles, Check, Flame } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const Header = ({ title = 'Overview' }) => {
  const { user, focusMood, toggleFocusMood } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="bg-white/90 backdrop-blur-md rounded-2xl px-6 py-3.5 shadow-soft-card flex items-center justify-between border border-[#FFE2D3]/60 mb-6 transition-all">
      {/* Title */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold font-display text-mainText tracking-tight">
          {title}
        </h1>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-4 md:gap-6">
        {/* Focus Mood Pill Toggle */}
        <div
          onClick={toggleFocusMood}
          className={`cursor-pointer flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border transition-all select-none ${
            focusMood
              ? 'bg-[#EAFBF2] border-successGreen text-successGreen-dark shadow-sm'
              : 'bg-[#FFF7F2] border-[#FFD1BB] text-mainText-muted hover:border-coral'
          }`}
          title="Toggle Distraction-Free Focus Mood"
        >
          <span className="text-xs md:text-sm font-semibold tracking-wide">Focus Mood</span>
          <div
            className={`w-9 h-5 rounded-full flex items-center p-0.5 transition-colors ${
              focusMood ? 'bg-successGreen justify-end' : 'bg-gray-300 justify-start'
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-white shadow-sm transition-transform" />
          </div>
        </div>

        {/* Streak Pill */}
        {user?.streak && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-amber-700 text-xs font-semibold">
            <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            <span>{user.streak.current || 1}d Streak</span>
          </div>
        )}

        {/* Notifications Icon with Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-10 h-10 rounded-full bg-[#FFF5EE] border border-[#FFE2D3] flex items-center justify-center text-mainText-muted hover:text-coral hover:border-coral transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-coral animate-pulse" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-peach-200 p-4 z-40 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <span className="text-sm font-bold text-mainText">Notifications</span>
                <span className="text-[11px] text-coral font-medium">3 unread</span>
              </div>
              <div className="space-y-2.5 mt-2.5 max-h-60 overflow-y-auto">
                <div className="p-2 rounded-xl bg-peach-50 border border-peach-200/70 text-xs">
                  <p className="font-semibold text-mainText">Adaptive Recommendation</p>
                  <p className="text-mainText-muted text-[11px] mt-0.5">
                    SQL Joins quiz accuracy is low (45%). Revision is advised before DBMS assessment!
                  </p>
                </div>
                <div className="p-2 rounded-xl bg-white border border-gray-100 text-xs">
                  <p className="font-semibold text-mainText">Upcoming Deadline</p>
                  <p className="text-mainText-muted text-[11px] mt-0.5">
                    "Meeting" scheduled for today at 8:00 AM.
                  </p>
                </div>
                <div className="p-2 rounded-xl bg-white border border-gray-100 text-xs">
                  <p className="font-semibold text-mainText">Streak Milestone</p>
                  <p className="text-mainText-muted text-[11px] mt-0.5">
                    You hit 5 consecutive days of productive study. Keep it going!
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Card */}
        <div
          onClick={() => navigate('/settings')}
          className="flex items-center gap-3 pl-2 cursor-pointer group"
          title="Profile & Settings"
        >
          <img
            src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80'}
            alt={user?.name || 'User Avatar'}
            className="w-10 h-10 rounded-full object-cover border-2 border-coral group-hover:scale-105 transition-transform shadow-sm"
          />
          <div className="hidden lg:flex flex-col text-left">
            <span className="text-xs font-bold text-mainText group-hover:text-coral transition-colors">
              {user?.name || 'Taly'}
            </span>
            <span className="text-[11px] text-mainText-muted">
              {user?.email || 'Taly@mail.com'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
