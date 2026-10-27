import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, ArrowRight, Lock, Mail, User } from 'lucide-react';

export const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(name, email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-peach-100 flex items-center justify-center p-4">
      <div className="bg-white/95 rounded-4xl p-8 md:p-10 max-w-md w-full shadow-2xl border border-peach-200 animate-in zoom-in-95 duration-200">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-coral to-sidebarOrange text-white flex items-center justify-center mx-auto mb-3 shadow-soft-peach">
            <Sparkles className="w-7 h-7 text-softYellow" />
          </div>
          <h1 className="text-2xl md:text-3xl font-black font-display text-mainText tracking-tight">
            Join FocusMate
          </h1>
          <p className="text-xs md:text-sm text-mainText-muted mt-1 font-medium">
            Build consistent focus habits and master your syllabus
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 text-red-600 text-xs font-semibold mb-4 border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-mainText block mb-1">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-mainText-muted absolute left-3.5 top-3" />
              <input
                type="text"
                required
                placeholder="Taly"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-xs md:text-sm pl-10 pr-3.5 py-2.5 rounded-xl border border-peach-200 focus:outline-none focus:border-coral bg-peach-50/40"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-mainText block mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-mainText-muted absolute left-3.5 top-3" />
              <input
                type="email"
                required
                placeholder="student@university.edu"
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
                placeholder="At least 6 characters"
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
            <span>{loading ? 'Creating Account...' : 'Get Started'}</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </form>

        <p className="text-xs text-center text-mainText-muted mt-6">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-coral hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
