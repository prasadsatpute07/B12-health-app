import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authAPI, getAuthToken, clearAuthToken, userAPI } from '../services/api';

// ─── State ───────────────────────────────────────────────────────────────────
const initialState = {
  isAuthenticated: false,
  isLoading: true,       // true while checking stored token on boot
  user: null,            // { id, email }
  error: null,
};

// ─── Reducer ─────────────────────────────────────────────────────────────────
const reducer = (state, action) => {
  switch (action.type) {
    case 'AUTH_LOADING':
      return { ...state, isLoading: true, error: null };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        isLoading: false,
        user: action.payload,
        error: null,
      };
    case 'AUTH_FAIL':
      return {
        ...state,
        isAuthenticated: false,
        isLoading: false,
        user: null,
        error: action.payload,
      };
    case 'AUTH_LOGOUT':
      return { ...initialState, isLoading: false };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

// ─── Context ─────────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Check stored token on app launch
  useEffect(() => {
    const bootstrap = async () => {
      try {
        const token = await getAuthToken();
        if (token) {
          // Verify token is still valid by fetching profile
          const data = await userAPI.getProfile();
          if (data.user) {
            dispatch({
              type: 'AUTH_SUCCESS',
              payload: { id: data.user.id, email: data.user.email },
            });
            return;
          }
        }
      } catch (err) {
        // Token expired or invalid — clear it
        await clearAuthToken();
      }
      dispatch({ type: 'AUTH_FAIL', payload: null });
    };
    bootstrap();
  }, []);

  // ─── Actions ─────────────────────────────────────────────────────────────
  const register = async (email, password, profile = {}) => {
    dispatch({ type: 'AUTH_LOADING' });
    try {
      const data = await authAPI.register(email, password, profile);
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: data.user,
      });
      return { success: true, user: data.user };
    } catch (err) {
      const msg = err.message || 'Registration failed';
      dispatch({ type: 'AUTH_FAIL', payload: msg });
      return { success: false, error: msg };
    }
  };

  const login = async (email, password) => {
    dispatch({ type: 'AUTH_LOADING' });
    try {
      const data = await authAPI.login(email, password);
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: data.user,
      });
      return { success: true, user: data.user };
    } catch (err) {
      const msg = err.message || 'Login failed';
      dispatch({ type: 'AUTH_FAIL', payload: msg });
      return { success: false, error: msg };
    }
  };

  const logout = async () => {
    await clearAuthToken();
    dispatch({ type: 'AUTH_LOGOUT' });
  };

  const clearError = () => dispatch({ type: 'CLEAR_ERROR' });

  return (
    <AuthContext.Provider
      value={{
        ...state,
        register,
        login,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
