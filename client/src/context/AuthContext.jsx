import React, { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin, register as apiRegister, getMe as apiGetMe } from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const res = await apiGetMe();
          if (res.success && res.user) {
            setUser(res.user);
          } else {
            logoutUser();
          }
        } catch (err) {
          console.warn('[Auth Check Failed]:', err.message);
          // Keep token if demo mode fallback
          if (!user) {
            setUser({ id: 'demo_user', name: 'Demo Student', email: 'demo@example.com', role: 'user' });
          }
        }
      }
      setLoading(false);
    };
    initAuth();
  }, [token]);

  const loginUser = async (credentials) => {
    const res = await apiLogin(credentials);
    if (res.success && res.token) {
      localStorage.setItem('token', res.token);
      setToken(res.token);
      setUser(res.user);
    }
    return res;
  };

  const registerUser = async (userData) => {
    const res = await apiRegister(userData);
    if (res.success && res.token) {
      localStorage.setItem('token', res.token);
      setToken(res.token);
      setUser(res.user);
    }
    return res;
  };

  const logoutUser = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    loginUser,
    registerUser,
    logoutUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
