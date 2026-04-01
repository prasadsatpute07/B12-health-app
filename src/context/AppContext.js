import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { userAPI, questionnaireAPI, checkinAPI, insightsAPI, bmiAPI } from '../services/api';
import { useAuth } from './AuthContext';

// ─── Initial State ────────────────────────────────────────────────────────────
const initialState = {
  user: null,           // { name, age, gender, dietType }
  guestName: '',        // name entered before login
  onboardingDone: false,
  questionnaireDone: false,
  riskResult: null,     // { score, level, percentage, breakdown, suggestions }
  dailyLogs: [],        // [{ date, answers, score }]
  streak: 0,
  lastCheckinDate: null,
  // Server-synced data
  serverInsights: [],
  serverCheckinHistory: [],
  serverStreak: null,   // { current_streak, longest_streak, total_checkins }
  bmiData: null,        // { bmi, bmiCategory, heightCm, weightKg, measuredAt }
  isSyncing: false,
};

// ─── Reducer ──────────────────────────────────────────────────────────────────
const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_GUEST_NAME':
      return { ...state, guestName: action.payload };
    case 'COMPLETE_ONBOARDING':
      return { ...state, onboardingDone: true };
    case 'SET_RISK_RESULT':
      return { ...state, riskResult: action.payload, questionnaireDone: true };
    case 'ADD_DAILY_LOG': {
      const logs = [...state.dailyLogs, action.payload];
      return {
        ...state,
        dailyLogs: logs,
        lastCheckinDate: action.payload.date,
      };
    }
    case 'SET_STREAK':
      return { ...state, streak: action.payload };
    case 'RESTORE':
      return { ...state, ...action.payload };
    // ── Server-synced actions ──
    case 'SET_SERVER_INSIGHTS':
      return { ...state, serverInsights: action.payload };
    case 'SET_SERVER_CHECKIN_HISTORY':
      return { ...state, serverCheckinHistory: action.payload };
    case 'SET_SERVER_STREAK':
      return { ...state, serverStreak: action.payload, streak: action.payload?.current_streak || state.streak };
    case 'SET_BMI_DATA':
      return { ...state, bmiData: action.payload };
    case 'SET_SYNCING':
      return { ...state, isSyncing: action.payload };
    case 'LOGOUT':
      return { ...initialState };
    default:
      return state;
  }
};

// ─── Context ──────────────────────────────────────────────────────────────────
const AppContext = createContext(null);

// Old shared key (will be cleaned up on first boot)
const LEGACY_STORAGE_KEY = '@b12_app_state';

// Per-user storage key
const getUserStorageKey = (userId) => `@b12_app_state_user_${userId}`;

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const auth = useAuth();

  // Track the previous auth state to detect logout
  const prevAuthRef = useRef({ isAuthenticated: false, userId: null });
  // Track whether we've restored state for the current user
  const restoredForUserRef = useRef(null);
  // Track whether state should be persisted (prevent persisting during reset)
  const shouldPersistRef = useRef(false);

  // Guest storage key (used in multiple effects)
  const GUEST_STORAGE_KEY = '@b12_guest_state';

  // ── Handle auth state changes (login / logout) ──
  useEffect(() => {
    const prev = prevAuthRef.current;
    const currentUserId = auth.user?.id || null;

    // Skip while auth is still loading
    if (auth.isLoading) return;

    // ── LOGOUT detected ──
    if (prev.isAuthenticated && !auth.isAuthenticated) {
      shouldPersistRef.current = false;
      restoredForUserRef.current = null;
      dispatch({ type: 'LOGOUT' });

      // Clean up the old user's storage key if we know who they were
      if (prev.userId) {
        AsyncStorage.removeItem(getUserStorageKey(prev.userId)).catch(() => {});
      }
      // Also clean up legacy key
      AsyncStorage.removeItem(LEGACY_STORAGE_KEY).catch(() => {});
    }

    // ── LOGIN detected — sync with server FIRST, then fill gaps with guest data ──
    if (auth.isAuthenticated && currentUserId && restoredForUserRef.current !== currentUserId) {
      restoredForUserRef.current = currentUserId;

      // Capture guest data before it gets overwritten
      const guestRiskResult = state.riskResult;
      const guestUser = state.user;
      const guestName = state.guestName;
      const guestOnboardingDone = state.onboardingDone;

      (async () => {
        // 1. Reset state to avoid showing stale data from a previous user
        dispatch({ type: 'LOGOUT' });

        // 2. Sync with server FIRST — server data is authoritative for existing users
        let serverHasProfile = false;
        let serverHasAssessment = false;

        dispatch({ type: 'SET_SYNCING', payload: true });
        try {
          // Fetch profile
          const profileData = await userAPI.getProfile().catch(() => null);
          if (profileData?.profile) {
            const p = profileData.profile;
            if (p.name || p.age || p.gender || p.diet_type) {
              serverHasProfile = true;
              dispatch({
                type: 'SET_USER',
                payload: {
                  name: p.name || 'Friend',
                  age: p.age_group || '25-40',
                  gender: p.gender || 'male',
                  dietType: p.diet_type || 'omnivore',
                },
              });
              dispatch({ type: 'COMPLETE_ONBOARDING' });
            }
          }

          // Fetch latest assessment
          const latestData = await questionnaireAPI.getLatest().catch(() => null);
          if (latestData?.assessment) {
            serverHasAssessment = true;
            const a = latestData.assessment;
            dispatch({
              type: 'SET_RISK_RESULT',
              payload: {
                score: a.raw_score,
                maxPossible: a.max_possible_score,
                percentage: Math.round(a.risk_percentage || a.normalized_score || 0),
                level: (a.risk_level || 'low').toUpperCase(),
                breakdown: a.category_breakdown || {},
                suggestions: a.suggestions || [],
              },
            });
          }

          // Fetch check-in history
          const checkinData = await checkinAPI.getHistory(30).catch(() => null);
          if (checkinData?.logs) {
            dispatch({ type: 'SET_SERVER_CHECKIN_HISTORY', payload: checkinData.logs });
            if (checkinData.streak) {
              dispatch({ type: 'SET_SERVER_STREAK', payload: checkinData.streak });
            }
          }

          // Fetch insights
          const insightsData = await insightsAPI.get().catch(() => null);
          if (insightsData?.insights) {
            dispatch({ type: 'SET_SERVER_INSIGHTS', payload: insightsData.insights });
          }

          // Fetch latest BMI
          const bmiData = await bmiAPI.getLatest().catch(() => null);
          if (bmiData?.bmi) {
            const b = bmiData.bmi;
            dispatch({
              type: 'SET_BMI_DATA',
              payload: {
                bmi: b.bmi,
                bmiCategory: b.bmi_category,
                heightCm: b.height_cm,
                weightKg: b.weight_kg,
                measuredAt: b.measured_at,
              },
            });
          }
        } catch (err) {
          console.warn('[AppContext] Server sync on login failed:', err.message);
        } finally {
          dispatch({ type: 'SET_SYNCING', payload: false });
        }

        // 3. Only merge guest data for fields the server didn't have
        if (!serverHasAssessment && guestRiskResult) {
          dispatch({ type: 'SET_RISK_RESULT', payload: guestRiskResult });
        }
        if (!serverHasProfile && guestUser) {
          dispatch({
            type: 'SET_USER',
            payload: {
              ...guestUser,
              name: guestName || guestUser.name || 'Friend',
            },
          });
          dispatch({ type: 'COMPLETE_ONBOARDING' });
        } else if (!serverHasProfile && guestOnboardingDone) {
          dispatch({ type: 'COMPLETE_ONBOARDING' });
        }

        // 4. Clean up guest storage now that data has been merged
        AsyncStorage.removeItem(GUEST_STORAGE_KEY).catch(() => {});

        shouldPersistRef.current = true;
      })();
    }

    // Update ref
    prevAuthRef.current = { isAuthenticated: auth.isAuthenticated, userId: currentUserId };
  }, [auth.isAuthenticated, auth.isLoading, auth.user?.id]);

  // ── Persist state on change (per-user key) ──
  useEffect(() => {
    if (!shouldPersistRef.current) return;
    const userId = auth.user?.id;
    if (!userId || !auth.isAuthenticated) return;

    const { serverInsights, serverCheckinHistory, serverStreak, isSyncing, ...persistable } = state;
    AsyncStorage.setItem(getUserStorageKey(userId), JSON.stringify(persistable)).catch(() => {});
  }, [state, auth.user?.id, auth.isAuthenticated]);

  // ── Persist guest state (pre-auth) ──

  useEffect(() => {
    if (auth.isAuthenticated || auth.isLoading) return;
    // Only persist if there's meaningful guest data
    if (!state.guestName && !state.riskResult && !state.onboardingDone) return;

    const guestData = {
      guestName: state.guestName,
      user: state.user,
      onboardingDone: state.onboardingDone,
      riskResult: state.riskResult,
      questionnaireDone: state.questionnaireDone,
    };
    AsyncStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(guestData)).catch(() => {});
  }, [state.guestName, state.user, state.riskResult, state.onboardingDone, auth.isAuthenticated, auth.isLoading]);

  // ── Restore guest state on boot (if not authenticated) ──
  useEffect(() => {
    if (auth.isLoading) return;
    if (auth.isAuthenticated) return;

    (async () => {
      try {
        const saved = await AsyncStorage.getItem(GUEST_STORAGE_KEY);
        if (saved) {
          const guestData = JSON.parse(saved);
          if (guestData.guestName) dispatch({ type: 'SET_GUEST_NAME', payload: guestData.guestName });
          if (guestData.user) dispatch({ type: 'SET_USER', payload: guestData.user });
          if (guestData.onboardingDone) dispatch({ type: 'COMPLETE_ONBOARDING' });
          if (guestData.riskResult) dispatch({ type: 'SET_RISK_RESULT', payload: guestData.riskResult });
        }
      } catch (_) {}
    })();
  }, [auth.isLoading, auth.isAuthenticated]);

  // ─── Server Sync ─────────────────────────────────────────────────────────
  const syncWithServer = async () => {
    dispatch({ type: 'SET_SYNCING', payload: true });
    try {
      // Fetch profile
      const profileData = await userAPI.getProfile().catch(() => null);
      if (profileData?.profile) {
        const p = profileData.profile;
        dispatch({
          type: 'SET_USER',
          payload: {
            name: p.name || state.user?.name || 'Friend',
            age: p.age_group || state.user?.age,
            gender: p.gender || state.user?.gender,
            dietType: p.diet_type || state.user?.dietType,
          },
        });
        if (p.name || p.age || p.gender || p.diet_type) {
          dispatch({ type: 'COMPLETE_ONBOARDING' });
        }
      }

      // Fetch latest assessment
      const latestData = await questionnaireAPI.getLatest().catch(() => null);
      if (latestData?.assessment) {
        const a = latestData.assessment;
        dispatch({
          type: 'SET_RISK_RESULT',
          payload: {
            score: a.raw_score,
            maxPossible: a.max_possible_score,
            percentage: Math.round(a.risk_percentage || a.normalized_score || 0),
            level: (a.risk_level || 'low').toUpperCase(),
            breakdown: a.category_breakdown || {},
            suggestions: a.suggestions || [],
          },
        });
      }

      // Fetch check-in history
      const checkinData = await checkinAPI.getHistory(30).catch(() => null);
      if (checkinData?.logs) {
        dispatch({ type: 'SET_SERVER_CHECKIN_HISTORY', payload: checkinData.logs });
        if (checkinData.streak) {
          dispatch({ type: 'SET_SERVER_STREAK', payload: checkinData.streak });
        }
      }

      // Fetch insights
      const insightsData = await insightsAPI.get().catch(() => null);
      if (insightsData?.insights) {
        dispatch({ type: 'SET_SERVER_INSIGHTS', payload: insightsData.insights });
      }

      // Fetch latest BMI
      const bmiResp = await bmiAPI.getLatest().catch(() => null);
      if (bmiResp?.bmi) {
        const b = bmiResp.bmi;
        dispatch({
          type: 'SET_BMI_DATA',
          payload: {
            bmi: b.bmi,
            bmiCategory: b.bmi_category,
            heightCm: b.height_cm,
            weightKg: b.weight_kg,
            measuredAt: b.measured_at,
          },
        });
      }
    } catch (err) {
      console.warn('[AppContext] Server sync failed:', err.message);
    } finally {
      dispatch({ type: 'SET_SYNCING', payload: false });
    }
  };

  return (
    <AppContext.Provider value={{ state, dispatch, syncWithServer }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};

// ─── Action Creators ─────────────────────────────────────────────────────────
export const setUser             = (user)   => ({ type: 'SET_USER',             payload: user   });
export const setGuestName        = (name)   => ({ type: 'SET_GUEST_NAME',       payload: name   });
export const completeOnboarding  = ()       => ({ type: 'COMPLETE_ONBOARDING'                   });
export const setRiskResult       = (result) => ({ type: 'SET_RISK_RESULT',      payload: result });
export const addDailyLog         = (log)    => ({ type: 'ADD_DAILY_LOG',        payload: log    });
export const setStreak           = (n)      => ({ type: 'SET_STREAK',           payload: n      });
export const setBmiData          = (data)   => ({ type: 'SET_BMI_DATA',         payload: data   });
