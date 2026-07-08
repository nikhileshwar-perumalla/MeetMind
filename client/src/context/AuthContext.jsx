import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, getToken, setToken, clearToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [workspace, setWorkspace] = useState(null); // active workspace
  const [loading, setLoading] = useState(true);

  const loadSession = useCallback(async () => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
      const ws = await api.get('/workspaces');
      const preferred =
        ws.data.workspaces.find((w) => w._id === data.user.defaultWorkspace) ||
        ws.data.workspaces[0];
      setWorkspace(preferred || null);
    } catch {
      clearToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    setToken(data.token);
    setUser(data.user);
    setWorkspace(data.defaultWorkspace);
  };

  const register = async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    setToken(data.token);
    setUser(data.user);
    setWorkspace(data.defaultWorkspace);
  };

  const acceptOAuthToken = async (token) => {
    setToken(token);
    await loadSession();
  };

  const logout = async () => {
    await api.post('/auth/logout').catch(() => {});
    clearToken();
    setUser(null);
    setWorkspace(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, workspace, setWorkspace, loading, login, register, logout, acceptOAuthToken }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
