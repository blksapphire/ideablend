import React, { createContext, useContext, useEffect, useState } from 'react';
import { post } from '../lib/api';
import { disconnectSocket } from '../lib/socket';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('ib_user');
    return raw ? JSON.parse(raw) : null;
  });

  function persist(token, user) {
    localStorage.setItem('ib_token', token);
    localStorage.setItem('ib_user', JSON.stringify(user));
    setUser(user);
  }

  function logout() {
    localStorage.removeItem('ib_token');
    localStorage.removeItem('ib_user');
    disconnectSocket();
    setUser(null);
  }

  // api.js clears localStorage and fires this the moment any request comes
  // back 401 (expired/invalid token) - without this, the UI would keep
  // showing the user as logged in while every request silently fails
  useEffect(() => {
    function handleExpired() {
      disconnectSocket();
      setUser(null);
    }
    window.addEventListener('ib:session-expired', handleExpired);
    return () => window.removeEventListener('ib:session-expired', handleExpired);
  }, []);

  async function login(email, password) {
    const data = await post('/auth/login', { email, password });
    persist(data.token, data.user);
    return data.user;
  }

  async function register(fields) {
    const data = await post('/auth/register', fields);
    persist(data.token, data.user);
    return data.user;
  }

  function updateUser(updated) {
    localStorage.setItem('ib_user', JSON.stringify(updated));
    setUser(updated);
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
