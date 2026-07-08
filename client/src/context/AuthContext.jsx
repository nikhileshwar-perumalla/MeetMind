import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, getToken, setToken, clearToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [workspace, setWorkspace] = useState(null); // active workspace
  const [workspaces, setWorkspaces] = useState([]); // all workspaces the user belongs to
  const [loading, setLoading] = useState(true);

  const refreshWorkspaces = useCallback(async (preferredId) => {
    const { data } = await api.get('/workspaces');
    setWorkspaces(data.workspaces);
    setWorkspace((current) => {
      const wanted = preferredId || current?._id;
      return (
        data.workspaces.find((w) => w._id === wanted) ||
        data.workspaces[0] ||
        null
      );
    });
    return data.workspaces;
  }, []);

  const loadSession = useCallback(async () => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
      await refreshWorkspaces(data.user.defaultWorkspace);
    } catch {
      clearToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [refreshWorkspaces]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    setToken(data.token);
    setUser(data.user);
    setWorkspace(data.defaultWorkspace);
    refreshWorkspaces(data.defaultWorkspace?._id).catch(() => {});
  };

  const register = async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    setToken(data.token);
    setUser(data.user);
    setWorkspace(data.defaultWorkspace);
    refreshWorkspaces(data.defaultWorkspace?._id).catch(() => {});
  };

  const switchWorkspace = (workspaceId) => {
    const next = workspaces.find((w) => w._id === workspaceId);
    if (next) setWorkspace(next);
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
    setWorkspaces([]);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        workspace,
        workspaces,
        switchWorkspace,
        refreshWorkspaces,
        loading,
        login,
        register,
        logout,
        acceptOAuthToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
