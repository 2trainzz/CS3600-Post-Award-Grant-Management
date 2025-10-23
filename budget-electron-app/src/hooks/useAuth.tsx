//useAuth Hook - handles authentication state and actions

import { useState } from 'react';
import { login as apiLogin, logout as apiLogout } from '../services/api';
import type { User } from '../types';

export function useAuth() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string>('');

  //login user
  const login = async (username: string, password: string): Promise<boolean> => {
    setError('');

    try {
      const data = await apiLogin(username, password);
      
      setToken(data.token);
      setUser(data.user);
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to connect to server');
      return false;
    }
  };

  //logout user
  const logout = async () => {
    if (token) {
      try {
        await apiLogout(token);
      } catch (err) {
        //ignore logout errors
      }
    }
    setToken(null);
    setUser(null);
  };

  //clear err message
  const clearError = () => setError('');

  return {
    token,
    user,
    error,
    isAuthenticated: !!token,
    login,
    logout,
    clearError,
  };
}