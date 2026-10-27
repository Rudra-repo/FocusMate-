import React, { useState, useEffect, useRef } from 'react';
import { Bell, Sparkles, Check, Flame, AlertCircle, Clock, Calendar, X, ArrowRight, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export const Header = ({ title = 'Overview', onToggleMobileMenu }) => {
  const { user, focusMood, toggleFocusMood } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  // Fetch real alerts for upcoming deadlines and exams
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await api.post('/ai/arrange-schedule');
        if (res.data.success && res.data.data?.alerts) {
          setAlerts(res.data.data.alerts);
        }
      } catch (e) {
        // Fallback demo notifications
        setAlerts([
          {
            id: '1',
            level: 'CRITICAL_EXAM',
            title: '🚨 DBMS Midterm Exam in 2 Days',
            subtitle: 'Relational Joins & Indexing • Review weak topics to boost score',
            link: '/plan',
          },
          {
            id: '2',
            level: 'HIGH_ALERT',
            title: '⏰ Python Assignment due at 2:00 PM',
            subtitle: 'Web Development • 2 hours remaining',
            link: '/tasks',
          },
          {
            id: '3',
            level: 'UPCOMING',
            title: '🔥 5-Day Study Streak Active',
            subtitle: 'You are on track for your 20h weekly academic goal!',
            link: '/analytics',
          },
        ]);
      }
    };

    fetchAlerts();
  }, []);

  // Close dropdown on Escape key or outside click
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setShowNotifications(false);
    };
    if (showNotifications) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showNotifications]);

  return (
    <header className="relative z-30 bg-white/95 backdrop-blur-md rounded-2xl px-3 sm:px-6 py-2.5 sm:py-3 shadow-soft-card flex items-center justify-between border border-[#FFE2D3]/60 mb-4 sm:mb-6 transition-all min-w-0 max-w-full gap-2">
      {/* Title & Mobile Menu Hamburger */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-peach-50 text-mainText hover:text-coral flex items-center justify-center border border-peach-200 shrink-0"
            title="Open Menu"
          >
            <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        )}
        <h1 className="text-sm sm:text-xl md:text-2xl font-bold font-display text-mainText tracking-tight truncate">
          {title}
        </h1>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-1.5 sm:gap-4 md:gap-6 shrink-0">
        {/* Focus Mode Pill Toggle */}
        <div
          onClick={toggleFocusMood}
          className={`cursor-pointer flex items-center gap-1.5 sm:gap-2.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full border transition-all select-none shrink-0 ${
            focusMood
              ? 'bg-[#EAFBF2] border-successGreen text-successGreen-dark shadow-sm'
              : 'bg-[#FFF7F2] border-[#FFD1BB] text-mainText-muted hover:border-coral'
          }`}
          title="Toggle Full Focus Mode & Distraction Shield"
        >
          <span className="text-[11px] sm:text-sm font-semibold tracking-wide whitespace-nowrap">
            Focus Mode
          </span>
          <div
            className={`w-7 sm:w-9 h-3.5 sm:h-5 rounded-full flex items-center p-0.5 transition-colors ${
              focusMood ? 'bg-successGreen justify-end' : 'bg-gray-300 justify-start'
            }`}
          >
            <div className="w-2.5 sm:w-4 h-2.5 sm:h-4 rounded-full bg-white shadow-sm transition-transform" />
          </div>
        </div>

        {/* Streak Pill */}
        {user?.streak && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-amber-700 text-xs font-semibold">
            <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            <span>{user.streak.current || 5}d Streak</span>
          </div>
        )}

        {/* Notifications Icon with Solid, High-Z-Index Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#FFF5EE] border border-[#FFE2D3] flex items-center justify-center text-mainText-muted hover:text-coral hover:border-coral transition-colors relative"
            title="Notifications & Exam Alerts"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-coral animate-pulse" />
          </button>

          {/* Click-outside backdrop */}
          {showNotifications && (
            <div
              className="fixed inset-0 z-40 bg-transparent"
              onClick={() => setShowNotifications(false)}
            />
          )}

          {/* Fully opaque notification modal with clean borders and responsive width */}
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-[calc(100vw-32px)] sm:w-96 max-w-sm bg-white rounded-3xl shadow-2xl border-2 border-peach-200 p-4 sm:p-5 z-50 animate-in fade-in zoom-in-95 duration-150 text-left">
              <div className="flex items-center justify-between pb-3 border-b border-peach-100">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-mainText">Alerts & Deadlines</span>
                  <span className="text-[11px] bg-coral-100 text-coral-600 font-bold px-2 py-0.5 rounded-full">
                    {alerts.length} active
                  </span>
                </div>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="w-6 h-6 rounded-full hover:bg-peach-100 text-mainText-muted flex items-center justify-center"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Alerts List */}
              <div className="space-y-3 mt-3.5 max-h-80 overflow-y-auto pr-1">
                {alerts.map((al) => (
                  <div
                    key={al.id}
                    onClick={() => {
                      setShowNotifications(false);
                      navigate(al.link || '/plan');
                    }}
                    className="p-3.5 rounded-2xl bg-peach-50/70 border border-peach-200 hover:border-coral/50 hover:bg-peach-100/60 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-bold text-mainText group-hover:text-coral transition-colors">
                        {al.title}
                      </p>
                      <ArrowRight className="w-3.5 h-3.5 text-mainText-muted group-hover:text-coral shrink-0 mt-0.5" />
                    </div>
                    <p className="text-[11px] text-mainText-muted mt-1">
                      {al.subtitle}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-3 border-t border-peach-100 text-center">
                <button
                  onClick={() => {
                    setShowNotifications(false);
                    navigate('/plan');
                  }}
                  className="text-xs font-bold text-coral hover:underline"
                >
                  Open Adaptive Study Planner →
                </button>
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
              {user?.email || 'taly@mail.com'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
