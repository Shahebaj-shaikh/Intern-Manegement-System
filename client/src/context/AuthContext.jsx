import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authApi } from '../api/endpoints';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await authApi.me();
      setUser(data.data);
    } catch {
      localStorage.removeItem('accessToken');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // Supports both login({ email, password }) AND login(email, password)
  const login = async (credentialsOrEmail, passwordParam) => {
    let credentials;
    
    if (typeof credentialsOrEmail === 'object' && credentialsOrEmail !== null) {
      credentials = credentialsOrEmail;
    } else {
      credentials = { email: credentialsOrEmail, password: passwordParam };
    }

    const { data } = await authApi.login(credentials);
    
    // Unwraps response based on your backend's ApiResponse structure
    const payload = data.data || data;
    
    localStorage.setItem('accessToken', payload.accessToken);
    setUser(payload.user);
    return payload.user;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      localStorage.removeItem('accessToken');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, logout, refetch: loadUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};