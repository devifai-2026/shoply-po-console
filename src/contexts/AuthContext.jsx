import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth as authApi } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [owner, setOwner] = useState(() => {
    if (!localStorage.getItem('owner_token')) return null;
    try { return JSON.parse(localStorage.getItem('owner_user')); } catch { return null; }
  });

  const logout = useCallback(() => {
    localStorage.removeItem('owner_token');
    localStorage.removeItem('owner_user');
    setOwner(null);
  }, []);

  useEffect(() => {
    const handle = () => logout();
    window.addEventListener('auth:logout', handle);
    return () => window.removeEventListener('auth:logout', handle);
  }, [logout]);

  const login = async (credentials) => {
    const res = await authApi.login(credentials);
    const token = res.token;
    const user = res.data || {};
    localStorage.setItem('owner_token', token);
    localStorage.setItem('owner_user', JSON.stringify(user));
    setOwner(user);
    return res;
  };

  return (
    <AuthContext.Provider value={{ owner, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
