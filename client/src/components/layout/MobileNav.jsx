import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  CheckSquare,
  BookOpen,
  Timer,
  HelpCircle,
  BarChart3,
  Settings,
  LogOut,
  Sparkles,
  X,
  Flame,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const allNavItems = [
  { path: '/', label: 'Overview', icon: LayoutDashboard },
  { path: '/plan', label: 'My Plan', icon: CalendarDays },
  { path: '/tasks', label: 'Tasks', icon: CheckSquare },
  { path: '/subjects', label: 'Subjects', icon: BookOpen },
  { path: '/focus', label: 'Focus Room', icon: Timer },
  { path: '/quizzes', label: 'Quizzes', icon: HelpCircle },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export const MobileNav = ({ isDrawerOpen, onCloseDrawer }) => {
  const { user, logout, focusMood, toggleFocusMood } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    onCloseDrawer();
    await logout();
    navigate('/login');
  };

  const primaryBottomTabs = [
    { path: '/', label: 'Overview', icon: LayoutDashboard },
    { path: '/plan', label: 'Plan', icon: CalendarDays },
    { path: '/focus', label: 'Focus', icon: Timer, isCenter: true },
    { path: '/tasks', label: 'Tasks', icon: CheckSquare },
    { path: '/subjects', label: 'Syllabus', icon: BookOpen },
  ];

  return (
    <>
      {/* 1. Mobile Bottom Navigation Bar (Visible on phones & small tablets < md) */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-peach-200/80 px-2 py-1.5 flex items-center justify-around shadow-2xl safe-area-bottom"
      >
        {primaryBottomTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location.pathname === tab.path;

          if (tab.isCenter) {
            return (
              <NavLink
                key={tab.path}
                to={tab.path}
                className="flex flex-col items-center -mt-5 group"
                title={tab.label}
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 ${
                    isActive
                      ? 'bg-coral text-white ring-4 ring-peach-100 shadow-glow-coral'
                      : 'bg-gradient-to-tr from-coral to-sidebarOrange text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span
                  className={`text-[10px] font-bold mt-1 ${
                    isActive ? 'text-coral' : 'text-mainText-muted'
                  }`}
                >
                  {tab.label}
                </span>
              </NavLink>
            );
          }

          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
                isActive
                  ? 'text-coral font-bold'
                  : 'text-mainText-muted hover:text-mainText'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
              <span className="text-[10px] mt-0.5 tracking-tight font-medium">
                {tab.label}
              </span>
            </NavLink>
          );
        })}
      </nav>

      {/* 2. Mobile Slide-Over Drawer (Opens from Hamburger menu) */}
      {isDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onCloseDrawer}
          />

          {/* Drawer Menu Panel */}
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-2xl flex flex-col p-5 animate-in slide-in-from-left duration-200 z-50 border-r border-peach-200">
            {/* Header: Logo, App Name, Close Button */}
            <div className="flex items-center justify-between pb-4 border-b border-peach-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-coral to-sidebarOrange flex items-center justify-center text-white shadow-soft-peach">
                  <Sparkles className="w-5 h-5 text-softYellow" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-display text-mainText leading-tight">
                    FocusMate
                  </h3>
                  <span className="text-[11px] text-mainText-muted">Academic OS</span>
                </div>
              </div>

              <button
                onClick={onCloseDrawer}
                className="w-8 h-8 rounded-full bg-peach-50 text-mainText-muted hover:text-coral flex items-center justify-center transition-colors"
                title="Close Navigation"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* User Profile Mini Banner */}
            <div
              onClick={() => {
                onCloseDrawer();
                navigate('/settings');
              }}
              className="p-3 rounded-2xl bg-peach-50/80 border border-peach-200/80 mb-4 flex items-center gap-3 cursor-pointer hover:bg-peach-100/70 transition-colors"
            >
              <img
                src={
                  user?.avatar ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80'
                }
                alt={user?.name || 'User'}
                className="w-10 h-10 rounded-full object-cover border-2 border-coral shadow-sm"
              />
              <div className="overflow-hidden flex-1">
                <h4 className="text-xs font-bold text-mainText truncate">
                  {user?.name || 'Student'}
                </h4>
                <div className="flex items-center gap-1.5 text-[11px] text-amber-700 font-semibold mt-0.5">
                  <Flame className="w-3 h-3 fill-amber-500 text-amber-500" />
                  <span>{user?.streak?.current || 5} Day Streak</span>
                </div>
              </div>
            </div>

            {/* Focus Mood Toggle Row */}
            <div
              onClick={() => {
                toggleFocusMood();
                onCloseDrawer();
              }}
              className={`p-3 rounded-2xl border transition-all mb-4 flex items-center justify-between cursor-pointer ${
                focusMood
                  ? 'bg-green-50 border-successGreen text-successGreen-dark shadow-sm'
                  : 'bg-peach-50/50 border-peach-200 text-mainText'
              }`}
            >
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-coral" />
                <span className="text-xs font-bold">Focus Mode Lock</span>
              </div>
              <div
                className={`w-9 h-5 rounded-full flex items-center p-0.5 transition-colors ${
                  focusMood ? 'bg-successGreen justify-end' : 'bg-gray-300 justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="space-y-1.5 flex-1 overflow-y-auto pr-1">
              {allNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onCloseDrawer}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-coral text-white shadow-soft-peach'
                        : 'text-mainText hover:bg-peach-50 hover:text-coral'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>

            {/* Drawer Footer: Logout */}
            <div className="pt-4 border-t border-peach-100 mt-2">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MobileNav;
