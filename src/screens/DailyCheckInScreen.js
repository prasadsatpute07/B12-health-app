import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fontSizes, fontWeights, spacing, radius, shadow } from '../theme';
import { ProgressBar, PrimaryButton } from '../components/UI';
import { useApp, addDailyLog, setStreak } from '../context/AppContext';
import { DAILY_CHECKIN } from '../data/questions';
import { calculateStreak } from '../utils/riskCalculator';
import { checkinAPI } from '../services/api';
import { select, success } from '../components/Feedback';

export default function DailyCheckInScreen({ navigation }) {
  const { state, dispatch } = useApp();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers,    setAnswers]    = useState({});
  const [done,       setDone]       = useState(false);
  const [serverStreak, setServerStreak] = useState(null);

  const fadeAnim  = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const q = DAILY_CHECKIN[currentIdx];
  const isLast = currentIdx === DAILY_CHECKIN.length - 1;

  const animateNext = (cb) => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -20, duration: 180, useNativeDriver: true }),
    ]).start(() => {
      cb();
      slideAnim.setValue(20);
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start();
    });
  };

  // Map local scores to backend format
  // Local scores are inverted (4=worst, 0=best) but backend expects 0-4 where 4=best
  const mapToServerScores = (allAnswers) => {
    const energy  = allAnswers.daily_energy;
    const fatigue = allAnswers.daily_fatigue;
    const mood    = allAnswers.daily_mood;
    const sleep   = allAnswers.daily_sleep;
    const dizzy   = allAnswers.daily_dizziness;

    return {
      energyScore:  energy  ? (4 - energy.score)  : 2,
      fatigueScore: fatigue ? (4 - fatigue.score) : 2,
      moodScore:    mood    ? (4 - mood.score)    : 2,
      sleepScore:   sleep   ? (4 - sleep.score)   : 2,
      focusScore:   dizzy   ? (dizzy.score === 3 ? 0 : 4) : 2,
    };
  };

  const selectOption = async (opt) => {
    select();
    const updated = { ...answers, [q.id]: opt };
    setAnswers(updated);

    if (isLast) {
      // Save log locally
      const log = {
        date: new Date().toISOString(),
        answers: updated,
        score: Object.values(updated).reduce((s, a) => s + a.score, 0),
      };
      dispatch(addDailyLog(log));
      const newStreak = calculateStreak([...state.dailyLogs, log]);
      dispatch(setStreak(newStreak));

      // Submit to backend
      try {
        const serverScores = mapToServerScores(updated);
        const data = await checkinAPI.submitDaily(serverScores);
        if (data?.streak) {
          setServerStreak(data.streak);
          // Update both streak sources so ALL screens stay in sync:
          // - state.streak (number) used by ProfileScreen
          // - state.serverStreak (object) used by Dashboard & WeeklyProgress
          dispatch(setStreak(data.streak.current_streak));
          dispatch({ type: 'SET_SERVER_STREAK', payload: data.streak });
        }
      } catch (err) {
        console.warn('[DailyCheckIn] Failed to submit to server:', err.message);
      }

      success();
      setDone(true);
    } else {
      animateNext(() => setCurrentIdx((i) => i + 1));
    }
  };

  if (done) {
    const displayStreak = serverStreak?.current_streak || state.streak + 1;
    return <CompletionScreen navigation={navigation} streak={displayStreak} />;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Daily check-in</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.progressWrap}>
        <ProgressBar
          progress={currentIdx + 1}
          total={DAILY_CHECKIN.length}
          color={colors.accent}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <View style={styles.questionIconWrap}>
            <Text style={styles.questionIcon}>{q.icon}</Text>
          </View>

          <Text style={styles.stepLabel}>
            Step {currentIdx + 1} of {DAILY_CHECKIN.length}
          </Text>
          <Text style={styles.questionText}>{q.question}</Text>

          <View style={styles.optionsGrid}>
            {q.options.map((opt) => {
              const picked = answers[q.id]?.id === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[styles.optionCard, picked && styles.optionSelected]}
                  onPress={() => selectOption(opt)}
                  activeOpacity={0.85}
                >
                  {opt.emoji ? (
                    <View style={styles.optionEmojiWrap}>
                      <Text style={styles.optionEmoji}>{opt.emoji}</Text>
                    </View>
                  ) : (
                    <View style={styles.optionEmojiWrap} />
                  )}
                  <Text style={[styles.optionLabel, picked && styles.optionLabelSelected]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

function CompletionScreen({ navigation, streak }) {
  const msgs = [
    { range: [1, 3],  emoji: '🌱', msg: 'Great start! Keep the habit going!' },
    { range: [4, 7],  emoji: '🔥', msg: 'One week strong! You\'re building a healthy habit!' },
    { range: [8, 14], emoji: '⭐', msg: 'Two weeks in — you\'re on a roll!' },
    { range: [15, 999],emoji: '🏆', msg: 'Incredible consistency! You\'re a health champion!' },
  ];
  const config = msgs.find((m) => streak >= m.range[0] && streak <= m.range[1]) || msgs[0];

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.completionContainer}>
        <Text style={styles.completionEmoji}>{config.emoji}</Text>
        <Text style={styles.completionTitle}>Check-in Complete!</Text>
        <Text style={styles.completionMsg}>{config.msg}</Text>

        <View style={styles.streakDisplay}>
          <Text style={styles.streakFire}>🔥</Text>
          <Text style={styles.streakNum}>{streak}</Text>
          <Text style={styles.streakLabel}>Day Streak</Text>
        </View>

        <View style={styles.completionStats}>
          <Text style={styles.completionStatsLabel}>Your responses have been saved to the server.</Text>
          <Text style={styles.completionStatsLabel}>Check back tomorrow to continue your streak!</Text>
        </View>

        <PrimaryButton
          label="View My Progress →"
          onPress={() => navigation.navigate('Progress')}
          style={{ marginTop: spacing.xl }}
        />
        <TouchableOpacity
          onPress={() => navigation.navigate('Dashboard')}
          style={styles.homeBtn}
        >
          <Text style={styles.homeBtnText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.bgCard,
  },
  closeBtn:    { padding: spacing.sm },
  closeText:   { fontSize: fontSizes.lg, color: colors.textSecondary },
  headerTitle: { fontSize: fontSizes.md, fontWeight: fontWeights.semibold, color: colors.textPrimary },

  progressWrap: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.bg,
  },

  container: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: 48,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  questionIconWrap: {
    width: 88,
    height: 88,
    borderRadius: radius.full,
    backgroundColor: colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignSelf: 'center',
    ...shadow.subtle,
  },
  questionIcon:  { fontSize: 36 },
  stepLabel: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
    color: colors.textMuted,
    marginBottom: spacing.sm,
    alignSelf: 'center',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  questionText: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: spacing.xl,
  },

  optionsGrid: { gap: spacing.md, width: '100%' },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: 16,
    paddingHorizontal: spacing.md,
    minHeight: 72,
    width: '100%',
    ...shadow.subtle,
  },
  optionSelected: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
    borderWidth: 2,
  },
  optionEmojiWrap: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  optionEmoji: { fontSize: 26 },
  optionLabel: {
    flex: 1,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
    fontWeight: fontWeights.medium,
    textAlign: 'left',
    lineHeight: 24,
  },
  optionLabelSelected: {
    color: colors.textPrimary,
    fontWeight: fontWeights.semibold,
  },

  // Completion
  completionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  completionEmoji: { fontSize: 64, marginBottom: spacing.md },
  completionTitle: {
    fontSize: fontSizes.xxl,
    fontWeight: fontWeights.extrabold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  completionMsg: {
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  streakDisplay: {
    alignItems: 'center',
    backgroundColor: colors.tintStreak,
    borderRadius: radius.xxl,
    padding: spacing.xl,
    borderWidth: 1.5,
    borderColor: colors.tintWarningBorder,
    marginBottom: spacing.xl,
    minWidth: 150,
  },
  streakFire:  { fontSize: 40, marginBottom: 4 },
  streakNum: {
    fontSize: fontSizes.hero,
    fontWeight: fontWeights.extrabold,
    color: colors.riskMedium,
    lineHeight: fontSizes.hero + 4,
  },
  streakLabel: { fontSize: fontSizes.sm, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  completionStats:      { alignItems: 'center', gap: 4, marginBottom: spacing.md },
  completionStatsLabel: { fontSize: fontSizes.sm, color: colors.textMuted, textAlign: 'center' },
  homeBtn:     { marginTop: spacing.md, padding: spacing.sm },
  homeBtnText: { color: colors.textMuted, fontSize: fontSizes.sm },
});
