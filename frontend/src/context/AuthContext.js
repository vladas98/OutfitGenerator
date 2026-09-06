import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { setAuthToken } from '../api/client';
import { login as apiLogin, register as apiRegister, fetchMe } from '../api/auth';
import { getToken, setToken, clearToken } from '../utils/tokenStorage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // On app start, try to resume a previously saved session. A stored token
  // that's expired or was signed with an old secret is treated the same as
  // no session at all, rather than surfacing an error.
  useEffect(() => {
    (async () => {
      const stored = await getToken();
      if (stored) {
        setAuthToken(stored);
        try {
          setUser(await fetchMe());
        } catch (err) {
          await clearToken();
          setAuthToken(null);
        }
      }
      setIsLoading(false);
    })();
  }, []);

  const applySession = useCallback(async ({ token, user: nextUser }) => {
    await setToken(token);
    setAuthToken(token);
    setUser(nextUser);
  }, []);

  const login = useCallback(
    async (email, password) => {
      const result = await apiLogin(email, password);
      await applySession(result);
    },
    [applySession]
  );

  const register = useCallback(
    async (email, password, name) => {
      const result = await apiRegister(email, password, name);
      await applySession(result);
    },
    [applySession]
  );

  const logout = useCallback(async () => {
    await clearToken();
    setAuthToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, isAuthenticated: !!user, isLoading, login, register, logout }),
    [user, isLoading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
