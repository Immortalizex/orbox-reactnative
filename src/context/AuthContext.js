import React, { createContext, useState, useContext, useEffect } from 'react';
import { api, setToken } from '../api/client';
import { appParams } from '../lib/appParams';
import { getStoredToken } from '../lib/appParams';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState(null);

  useEffect(() => {
    checkAppState();
  }, []);

  const checkAppState = async () => {
    try {
      setIsLoadingPublicSettings(true);
      setAuthError(null);
      const PUBLIC_SETTINGS_TIMEOUT = 5000;
      try {
        const publicSettings = await Promise.race([
          api.getPublicSettings(appParams.appId || 'default'),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('timeout')), PUBLIC_SETTINGS_TIMEOUT)
          ),
        ]);
        setAppPublicSettings(publicSettings);
      } catch (appError) {
        const is403 = appError.status === 403 && appError.data?.extra_data?.reason;
        if (is403) {
          const reason = appError.data.extra_data.reason;
          if (reason === 'auth_required') {
            setAuthError({ type: 'auth_required', message: 'Authentication required' });
          } else if (reason === 'user_not_registered') {
            setAuthError({ type: 'user_not_registered', message: 'User not registered for this app' });
          } else {
            setAuthError({ type: reason, message: appError.message });
          }
        }
        setAppPublicSettings(null);
      }
      const token = await getStoredToken();
      if (token && String(token).trim().length > 20) {
        await setToken(String(token).trim());
        await checkUserAuth();
      } else {
        setIsLoadingAuth(false);
        setIsAuthenticated(false);
      }
      setIsLoadingPublicSettings(false);
    } catch (error) {
      setAuthError({ type: 'unknown', message: error.message || 'An unexpected error occurred' });
      setIsLoadingPublicSettings(false);
      setIsLoadingAuth(false);
    }
  };

  const AUTH_ME_TIMEOUT_MS = 15000;

  const checkUserAuth = async () => {
    try {
      setIsLoadingAuth(true);
      const currentUser = await Promise.race([
        api.auth.me(),
        new Promise((_, reject) =>
          setTimeout(() => reject(Object.assign(new Error('auth_me_timeout'), { code: 'TIMEOUT' })), AUTH_ME_TIMEOUT_MS)
        ),
      ]);
      setUser(currentUser);
      setIsAuthenticated(true);
    } catch (error) {
      setIsAuthenticated(false);
      if (error?.code === 'TIMEOUT' || error?.message === 'auth_me_timeout') {
        // Do not block the app forever on a hanging /auth/me — show login again.
      } else if (error.status === 401 || error.status === 403) {
        await api.auth.logout();
        setAuthError({ type: 'auth_required', message: 'Authentication required' });
      }
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const logout = async (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    await api.auth.logout();
  };

  /** Call after login/signup success – use the user from the API response so we don't depend on /auth/me */
  const setUserFromAuth = (user) => {
    if (user) {
      setUser({
        ...user,
        full_name: user.full_name ?? user.name,
      });
      setIsAuthenticated(true);
    }
    setIsLoadingAuth(false);
  };

  const navigateToLogin = () => {};

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        isLoadingPublicSettings,
        authError,
        appPublicSettings,
        logout,
        navigateToLogin,
        checkAppState,
        checkUserAuth,
        setUserFromAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
