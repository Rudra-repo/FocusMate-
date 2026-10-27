import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, ArrowRight, Lock, Mail, UserCheck } from 'lucide-react';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setEmail('taly@mail.com');
    setPassword('focusmate123');
    setLoading(true);
    try {
      await login('taly@mail.com', 'focusmate123');
      navigate('/');
    } catch (err) {
      setError('Demo login failed. Make sure server is running and seeded.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-peach-100 flex items-center justify-center p-4">
      <div className="bg-white/95 rounded-4xl p-8 md:p-10 max-w-md w-full shadow-2xl border border-peach-200 animate-in zoom-in-95 duration-200">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-coral to-sidebarOrange text-white flex items-center justify-center mx-auto mb-3 shadow-soft-peach">
            <Sparkles className="w-7 h-7 text-softYellow" />
          </div>
          <h1 className="text-2xl md:text-3xl font-black font-display text-mainText tracking-tight">
            FocusMate
          </h1>
          <p className="text-xs md:text-sm text-mainText-muted mt-1 font-medium">
            Your personal academic productivity OS
          </p>
        </div>

        {/* 1-Click Demo Login Pill Banner */}
        <div className="mb-6 p-3.5 rounded-2xl bg-peach-50 border border-peach-200 flex items-center justify-between gap-3">
          <div className="text-left">
            <span className="text-xs font-bold text-coral-dark block">End-Term Viva Demo</span>
            <span className="text-[11px] text-mainText-muted">Instant login as Taly (Sample student)</span>
          </div>
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading}
            className="px-3.5 py-1.5 rounded-xl bg-coral hover:bg-coral-dark text-white text-xs font-bold shadow-sm transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
          >
            Demo Login
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 text-red-600 text-xs font-semibold mb-4 border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-mainText block mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-mainText-muted absolute left-3.5 top-3" />
              <input
                type="email"
                required
                placeholder="taly@mail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-xs md:text-sm pl-10 pr-3.5 py-2.5 rounded-xl border border-peach-200 focus:outline-none focus:border-coral bg-peach-50/40"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-mainText block mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-mainText-muted absolute left-3.5 top-3" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-xs md:text-sm pl-10 pr-3.5 py-2.5 rounded-xl border border-peach-200 focus:outline-none focus:border-coral bg-peach-50/40"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-2xl bg-coral hover:bg-coral-dark text-white font-extrabold text-sm shadow-soft-peach transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 mt-2"
          >
            <span>{loading ? 'Signing In...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </form>

        <p className="text-xs text-center text-mainText-muted mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="font-bold text-coral hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
