// ─── B12 Health App — API Service Layer ──────────────────────────────────────
// Central HTTP client for all backend API calls.
// Uses fetch (built into React Native) — no extra dependencies needed.

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Base URL Auto-Detection ─────────────────────────────────────────────────
// iOS Simulator → localhost works
// Android Emulator → 10.0.2.2 maps to host machine's localhost
// Physical device → must use your Mac's local IP
const getBaseUrl = () => {
  if (__DEV__) {
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:3000';
    }
    return 'http://localhost:3000';
  }
  // Production URL (update when deploying)
  return 'http://localhost:3000';
};

const API_BASE_URL = getBaseUrl();
const AUTH_TOKEN_KEY = '@b12_auth_token';

// ─── Token Management ────────────────────────────────────────────────────────
let _cachedToken = null;

export const setAuthToken = async (token) => {
  _cachedToken = token;
  if (token) {
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
  } else {
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
  }
};

export const getAuthToken = async () => {
  if (_cachedToken) return _cachedToken;
  _cachedToken = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  return _cachedToken;
};

export const clearAuthToken = async () => {
  _cachedToken = null;
  await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
};

// ─── Core HTTP Client ────────────────────────────────────────────────────────
const apiClient = async (endpoint, options = {}) => {
  const token = await getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      const error = new Error(data.error || `API Error: ${response.status}`);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    if (err.status) throw err; // Already formatted API error
    // Network error
    const networkErr = new Error('Cannot connect to server. Please check your connection.');
    networkErr.isNetworkError = true;
    throw networkErr;
  }
};

// ─── Auth API ────────────────────────────────────────────────────────────────
export const authAPI = {
  register: async (email, password, profile = {}) => {
    const body = { email, password, ...profile };
    const data = await apiClient('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    if (data.token) {
      await setAuthToken(data.token);
    }
    return data;
  },

  login: async (email, password) => {
    const data = await apiClient('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.token) {
      await setAuthToken(data.token);
    }
    return data;
  },

  refresh: async (token) => {
    const data = await apiClient('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
    if (data.token) {
      await setAuthToken(data.token);
    }
    return data;
  },
};

// ─── User API ────────────────────────────────────────────────────────────────
export const userAPI = {
  getProfile: () => apiClient('/api/users/profile'),

  saveProfile: (profileData) =>
    apiClient('/api/users/profile', {
      method: 'POST',
      body: JSON.stringify(profileData),
    }),

  changePassword: (currentPassword, newPassword) =>
    apiClient('/api/users/password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
};

// ─── Questionnaire API ──────────────────────────────────────────────────────
export const questionnaireAPI = {
  getQuestions: () => apiClient('/api/questionnaire/questions'),

  submit: (answers) =>
    apiClient('/api/questionnaire/submit', {
      method: 'POST',
      body: JSON.stringify({ answers }),
    }),

  getLatest: () => apiClient('/api/questionnaire/latest'),

  getHistory: () => apiClient('/api/questionnaire/history'),

  getById: (id) => apiClient(`/api/questionnaire/${id}`),
};

// ─── Check-in API ───────────────────────────────────────────────────────────
export const checkinAPI = {
  submitDaily: (scores) =>
    apiClient('/api/checkin/daily', {
      method: 'POST',
      body: JSON.stringify(scores),
    }),

  getHistory: (days = 7) =>
    apiClient(`/api/checkin/history?days=${days}`),
};

// ─── Insights API ───────────────────────────────────────────────────────────
export const insightsAPI = {
  get: () => apiClient('/api/insights'),
};

// ─── BMI API ─────────────────────────────────────────────────────────────────
export const bmiAPI = {
  save: (heightCm, weightKg) =>
    apiClient('/api/users/bmi', {
      method: 'POST',
      body: JSON.stringify({ heightCm, weightKg }),
    }),

  getLatest: () => apiClient('/api/users/bmi/latest'),

  getHistory: (limit = 10) => apiClient(`/api/users/bmi/history?limit=${limit}`),
};

export default apiClient;
