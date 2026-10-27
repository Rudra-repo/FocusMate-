import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('focusmate_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('focusmate_token') || null);
  const [loading, setLoading] = useState(true);
  const [focusMood, setFocusMood] = useState(false);

  useEffect(() => {
    const fetchMe = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('/auth/me');
        if (res.data.success) {
          setUser(res.data.user);
          setFocusMood(res.data.user?.preferences?.focusMoodActive || false);
          localStorage.setItem('focusmate_user', JSON.stringify(res.data.user));
        }
      } catch (err) {
        console.error('Failed to load user session:', err);
        setUser(null);
        setToken(null);
        localStorage.removeItem('focusmate_token');
        localStorage.removeItem('focusmate_user');
      } finally {
        setLoading(false);
      }
    };

    fetchMe();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      setUser(res.data.user);
      setToken(res.data.token);
      setFocusMood(res.data.user?.preferences?.focusMoodActive || false);
      localStorage.setItem('focusmate_token', res.data.token);
      localStorage.setItem('focusmate_user', JSON.stringify(res.data.user));
    }
    return res.data;
  };

  const register = async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password });
    if (res.data.success) {
      setUser(res.data.user);
      setToken(res.data.token);
      setFocusMood(res.data.user?.preferences?.focusMoodActive || false);
      localStorage.setItem('focusmate_token', res.data.token);
      localStorage.setItem('focusmate_user', JSON.stringify(res.data.user));
    }
    return res.data;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // ignore
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem('focusmate_token');
    localStorage.removeItem('focusmate_user');
  };

  const updatePreferences = async (newPrefs) => {
    const res = await api.patch('/auth/preferences', newPrefs);
    if (res.data.success) {
      setUser((prev) => {
        const updated = { ...prev, preferences: res.data.preferences };
        localStorage.setItem('focusmate_user', JSON.stringify(updated));
        return updated;
      });
    }
    return res.data;
  };

  const updateProfile = async (profileData) => {
    const res = await api.patch('/auth/profile', profileData);
    if (res.data.success) {
      setUser(res.data.user);
      localStorage.setItem('focusmate_user', JSON.stringify(res.data.user));
    }
    return res.data;
  };

  const toggleFocusMood = async () => {
    const nextState = !focusMood;
    setFocusMood(nextState);
    try {
      await updatePreferences({ focusMoodActive: nextState });
    } catch (e) {
      console.error('Failed to sync focus mood', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updatePreferences,
        updateProfile,
        focusMood,
        toggleFocusMood,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
