import { useEffect, useCallback, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../store/store.tsx';
import {loginUser,registerUser,logoutUser, refreshTokenAsync,
  updateActivity,checkSession,initializeAuth,forceLogout,clearError} from '../store/slices/authSlice.ts';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const authState = useAppSelector((state) => state.auth);
  const lastActivityTime = useRef<number>(0);
  const activityTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const initAuth = useCallback(() => {
    if (!authState.isInitialized) {
      dispatch(initializeAuth());
    }
  }, [dispatch, authState.isInitialized]);

  useEffect(() => {
    initAuth();
  }, [initAuth]);
  const trackActivity = useCallback(() => {
    if (!authState.isAuthenticated) return;
    
    const now = Date.now();
    if (now - lastActivityTime.current < 30000) return;
    
    lastActivityTime.current = now;
    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current);
    }
    
    activityTimeoutRef.current = setTimeout(() => {
      dispatch(updateActivity());
    }, 100);
  }, [dispatch, authState.isAuthenticated]);


  useEffect(() => {
    if (!authState.isAuthenticated) return;
    
    const interval = setInterval(() => {
      dispatch(checkSession());
    }, 60000);
    
    return () => clearInterval(interval);
  }, [dispatch, authState.isAuthenticated]);

  useEffect(() => {
    if (!authState.isAuthenticated) return;
    let isThrottled = false;
    const throttleDelay = 1000;
    
    const handleActivity = () => {
      if (isThrottled) return;
      isThrottled = true;
      if (window.requestIdleCallback) {
        window.requestIdleCallback(() => {
          trackActivity();
        });
      } else {
        setTimeout(() => {
          trackActivity();
        }, 0);
      }
      
      setTimeout(() => {
        isThrottled = false;
      }, throttleDelay);
    };

    const events = [
      { name: 'mousedown', passive: false },
      { name: 'mousemove', passive: true },
      { name: 'keypress', passive: true },
      { name: 'scroll', passive: true },
      { name: 'touchstart', passive: true },
      { name: 'click', passive: false }
    ];
    
    events.forEach(({ name, passive }) => {
      document.addEventListener(name, handleActivity, { 
        passive,
        capture: false
      });
    });

    return () => {
      events.forEach(({ name }) => {
        document.removeEventListener(name, handleActivity);
      });
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
    };
  }, [trackActivity, authState.isAuthenticated]);

  useEffect(() => {
    if (!authState.isAuthenticated || !authState.tokenExpiry || !authState.token) {
      return;
    }
    
    const timeUntilExpiry = authState.tokenExpiry - Date.now();
    const refreshTime = Math.max(timeUntilExpiry - 5 * 60 * 1000, 0);
    
    if (refreshTime <= 0) {
      dispatch(refreshTokenAsync());
      return;
    }
    
    const timeout = setTimeout(() => {
      dispatch(refreshTokenAsync());
    }, refreshTime);
    
    return () => clearTimeout(timeout);
  }, [authState.tokenExpiry, authState.isAuthenticated, authState.token, dispatch]);

  const login = useCallback(async (credentials: { identifier: string; password: string }) => {
    return dispatch(loginUser(credentials));
  }, [dispatch]);

  const register = useCallback(async (userData: {
    username: string;
    email: string;
    password: string;
    mobile?: string;
    companyName?: string;
  }) => {
    return dispatch(registerUser(userData));
  }, [dispatch]);

  const logout = useCallback(() => {
    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current);
    }
    dispatch(logoutUser());
  }, [dispatch]);

  const refreshTokenAction = useCallback(() => {
    return dispatch(refreshTokenAsync());
  }, [dispatch]);

  const clearAuthError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  const forceSignOut = useCallback(() => {
    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current);
    }
    dispatch(forceLogout());
  }, [dispatch]);

  const checkSessionAction = useCallback(() => {
    dispatch(checkSession());
  }, [dispatch]);

  useEffect(() => {
    return () => {
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
    };
  }, []);

  return {
    user: authState.user,
    token: authState.token,
    refreshToken: authState.refreshToken,
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading,
    error: authState.error,
    tokenExpiry: authState.tokenExpiry,
    lastActivity: authState.lastActivity,
    sessionTimeout: authState.sessionTimeout,
    isInitialized: authState.isInitialized,
    loginEmail: authState.loginEmail,
    accessToken: authState.token,
    
    login,
    register,
    logout,
    refreshTokenAction,
    clearError: clearAuthError,
    forceSignOut,
    initializeAuth: initAuth,
    checkSession: checkSessionAction,
  };
};

export const useAuthState = () => {
  const authState = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  
  return {
    user: authState.user,
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading,
    error: authState.error,
    token: authState.token,
    
    logout: useCallback(() => dispatch(logoutUser()), [dispatch]),
    clearError: useCallback(() => dispatch(clearError()), [dispatch]),
  };
};