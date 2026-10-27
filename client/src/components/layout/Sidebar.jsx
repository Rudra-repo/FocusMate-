import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  CheckSquare,
  BookOpen,
  HelpCircle,
  Timer,
  BarChart3,
  Settings,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { path: '/', label: 'Overview', icon: LayoutDashboard },
  { path: '/plan', label: 'My Plan', icon: CalendarDays },
  { path: '/tasks', label: 'Tasks', icon: CheckSquare },
  { path: '/subjects', label: 'Subjects', icon: BookOpen },
  { path: '/focus', label: 'Focus Room', icon: Timer },
  { path: '/quizzes', label: 'Quizzes', icon: HelpCircle },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export const Sidebar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className="w-20 md:w-24 bg-gradient-to-b from-[#FF9856] via-[#FF8B76] to-[#FF7B60] text-white flex flex-col items-center py-6 px-2 rounded-3xl shadow-xl z-20 transition-all select-none">
      {/* Brand Icon / Logo */}
      <div className="mb-8 flex flex-col items-center group cursor-pointer" onClick={() => navigate('/')}>
        <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
          <div className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center relative">
            <div className="w-2 h-0.5 bg-white absolute top-3 left-3 rotate-45 origin-left"></div>
            <Sparkles className="w-3.5 h-3.5 text-softYellow" />
          </div>
        </div>
        <span className="text-[10px] font-bold tracking-wider mt-1 opacity-90">FM</span>
      </div>

      {/* Main Navigation Links */}
      <nav className="flex-1 flex flex-col gap-3 w-full items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              title={item.label}
              className={({ isActive }) =>
                `w-12 h-12 rounded-2xl flex flex-col items-center justify-center transition-all duration-200 relative group ${
                  isActive
                    ? 'bg-white text-coral shadow-lg scale-105 font-medium'
                    : 'text-white/80 hover:bg-white/15 hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'stroke-[2.5]' : ''}`} />
                  {/* Tooltip on hover */}
                  <span className="absolute left-16 bg-[#342D2B] text-white text-xs px-2.5 py-1 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-md z-30">
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Logout Button */}
      <div className="mt-auto pt-4 border-t border-white/20 w-full flex justify-center">
        <button
          onClick={handleLogout}
          title="Sign Out"
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-white/75 hover:bg-white/20 hover:text-white transition-all group relative"
        >
          <LogOut className="w-5 h-5 transition-transform group-hover:-translate-x-0.5" />
          <span className="absolute left-16 bg-[#342D2B] text-white text-xs px-2.5 py-1 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-md z-30">
            Sign Out
          </span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
