import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Animated, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fontSizes, fontWeights, spacing, radius, shadow } from '../theme';
import { ProgressBar, CategoryBadge, InsightCard, PrimaryButton, SecondaryButton } from '../components/UI';
import { select, success } from '../components/Feedback';
import { useApp, setRiskResult } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { buildQuestionSet } from '../data/questions';
import { buildInterstitialContent } from '../data/questionnaireInterstitials';
import { calculateRisk } from '../utils/riskCalculator';
import { questionnaireAPI } from '../services/api';

export default function QuestionnaireScreen({ navigation }) {
  const { state, dispatch } = useApp();
  const { isAuthenticated } = useAuth();
  const { user } = state;

  const questions = buildQuestionSet(user?.age || '25-40', user?.gender || 'male');

  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selected, setSelected] = useState(null);
  const [showInsight, setShowInsight] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showInterstitial, setShowInterstitial] = useState(false);
  const [interstitialEnd, setInterstitialEnd] = useState(0);
  const interstitialShownRef = useRef(new Set());
  const [serverQuestions, setServerQuestions] = useState([]);

  useEffect(() => {
    questionnaireAPI.getQuestions()
      .then((data) => {
        if (data?.questions) setServerQuestions(data.questions);
      })
      .catch(() => {});
  }, []);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const q = questions[currentIdx];
  const isLast = currentIdx === questions.length - 1;

  const interstitialPayload = useMemo(() => {
    if (!showInterstitial || !interstitialEnd) return null;
    return buildInterstitialContent(interstitialEnd, questions);
  }, [showInterstitial, interstitialEnd, questions]);

  const animateTransition = (cb) => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -24, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      cb();
      slideAnim.setValue(24);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 260, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 260, useNativeDriver: true }),
      ]).start();
    });
  };

  const selectOption = (option) => {
    select();
    setSelected(option);
    setShowInsight(true);
    setTimeout(() => advanceToNext(option), 750);
  };

  const mapToServerAnswers = (localAnswers) => {
    if (!serverQuestions.length) return null;
    return Object.entries(localAnswers).map(([localId, option]) => {
      const localQ = questions.find((qq) => qq.id === localId);
      const serverQ = serverQuestions.find((sq) => sq.question_text === localQ?.question);
      return { questionId: serverQ?.id || 0, answerValue: option.id };
    }).filter((a) => a.questionId > 0);
  };

  const submitToServer = async (allAnswers) => {
    const serverAnswers = mapToServerAnswers(allAnswers);
    if (!serverAnswers || serverAnswers.length === 0) return null;
    try {
      const data = await questionnaireAPI.submit(serverAnswers);
      return {
        score: 0,
        maxPossible: 0,
        percentage: Math.round(data.percentage || 0),
        level: (data.risk_level || 'low').toUpperCase(),
        breakdown: data.breakdown || {},
        suggestions: data.suggestions || [],
      };
    } catch (err) {
      console.warn('[Questionnaire] Server submission failed:', err.message);
      return null;
    }
  };

  const advanceToNext = async (chosenOption) => {
    const updated = { ...answers, [q.id]: chosenOption };
    setAnswers(updated);

    if (currentIdx === questions.length - 1) {
      setSubmitting(true);
      let result = await submitToServer(updated);
      if (!result) {
        result = calculateRisk(updated, questions, user?.dietType || 'omnivore');
      }
      dispatch(setRiskResult(result));
      setSubmitting(false);
      navigation.replace(isAuthenticated ? 'Results' : 'ScorePreview');
      return;
    }

    const completedCount = currentIdx + 1;
    const shouldInterstitial =
      completedCount % 3 === 0 &&
      completedCount < questions.length &&
      !interstitialShownRef.current.has(completedCount);

    if (shouldInterstitial) {
      interstitialShownRef.current.add(completedCount);
      animateTransition(() => {
        setInterstitialEnd(completedCount);
        setShowInterstitial(true);
        setSelected(null);
        setShowInsight(false);
      });
      return;
    }

    animateTransition(() => {
      setCurrentIdx((i) => i + 1);
      setSelected(null);
      setShowInsight(false);
    });
  };

  const continueInterstitial = () => {
    success();
    animateTransition(() => {
      setShowInterstitial(false);
      setCurrentIdx(interstitialEnd);
      setSelected(null);
      setShowInsight(false);
    });
  };

  const goBack = () => {
    if (showInterstitial) {
      interstitialShownRef.current.delete(interstitialEnd);
      animateTransition(() => {
        setShowInterstitial(false);
        const backIdx = interstitialEnd - 1;
        setCurrentIdx(backIdx);
        const prevId = questions[backIdx]?.id;
        setSelected(prevId ? answers[prevId] || null : null);
        setShowInsight(!!(prevId && answers[prevId]));
      });
      return;
    }
    if (currentIdx === 0) {
      navigation.goBack();
      return;
    }
    animateTransition(() => {
      const prevId = questions[currentIdx - 1].id;
      setCurrentIdx((i) => i - 1);
      setSelected(answers[prevId] || null);
      setShowInsight(!!answers[prevId]);
    });
  };

  const skipQuestion = async () => {
    if (showInterstitial) {
      continueInterstitial();
      return;
    }
    if (isLast) {
      setSubmitting(true);
      let result = await submitToServer(answers);
      if (!result) {
        result = calculateRisk(answers, questions, user?.dietType || 'omnivore');
      }
      dispatch(setRiskResult(result));
      setSubmitting(false);
      navigation.replace(isAuthenticated ? 'Results' : 'ScorePreview');
    } else {
      const nextIdx = currentIdx + 1;
      if (nextIdx % 3 === 0 && nextIdx < questions.length) {
        interstitialShownRef.current.add(nextIdx);
      }
      animateTransition(() => {
        setCurrentIdx(nextIdx);
        setSelected(null);
        setShowInsight(false);
      });
    }
  };

  if (submitting) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Analyzing your responses…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (showInterstitial && interstitialPayload) {
    const p = interstitialPayload;
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={goBack} style={styles.backBtn}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <View style={styles.progressSection}>
            <ProgressBar progress={interstitialEnd} total={questions.length} />
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.interstitialScroll}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.interstitialLead}>Short insight • then continue</Text>
          <LinearGradient
            colors={[colors.gradientHeroStart || '#091520', colors.bgCard]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.interstitialHero}
          >
            <Text style={styles.interstitialTag}>{p.heroTag}</Text>
            <View style={styles.interstitialEmojiRing}>
              <Text style={styles.interstitialEmoji}>{p.heroEmoji}</Text>
            </View>
            <Text style={styles.interstitialTitle}>{p.title}</Text>
            <Text style={styles.interstitialSubtitle}>{p.subtitle}</Text>
          </LinearGradient>

          {p.items.map((item, i) => (
            <View key={i} style={styles.insightBlock}>
              <View style={styles.insightBlockHeader}>
                <Text style={styles.insightCategory}>{item.category}</Text>
                <View style={styles.insightLine} />
              </View>
              <Text style={styles.insightQ}>{item.questionPreview}</Text>
              <Text style={styles.insightWhyLabel}>Why we ask</Text>
              <Text style={styles.insightSig}>{item.significance}</Text>
            </View>
          ))}

          <View style={styles.closingCard}>
            <Text style={styles.closingText}>{p.closing}</Text>
          </View>

          <PrimaryButton label="Continue" onPress={continueInterstitial} style={styles.interstitialBtn} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={styles.progressSection}>
          <ProgressBar progress={currentIdx + 1} total={questions.length} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <CategoryBadge icon={q.categoryIcon} label={q.category} />
          <Text style={styles.questionNumber}>
            Question {currentIdx + 1} of {questions.length}
          </Text>
          <Text style={styles.metaLine}>
            {Math.max(0, questions.length - (currentIdx + 1)) === 0
              ? 'Last question'
              : `${questions.length - (currentIdx + 1)} questions left`} · ~
            {Math.max(1, Math.ceil((questions.length - currentIdx) / 12))} min
          </Text>
          <Text style={styles.questionText}>{q.question}</Text>

          <View style={styles.optionsContainer}>
            {q.options.map((opt) => {
              const isSelected = selected?.id === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                  onPress={() => selectOption(opt)}
                  activeOpacity={0.85}
                >
                  {opt.emoji ? <Text style={styles.optionEmoji}>{opt.emoji}</Text> : null}
                  <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                    {opt.label}
                  </Text>
                  {isSelected && (
                    <View style={styles.checkCircle}>
                      <Text style={styles.checkMark}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {showInsight && q.insight ? <InsightCard text={q.insight} /> : null}

          {currentIdx > 0 && currentIdx < questions.length - 1 && (
            <Text style={styles.motivational}>
              {currentIdx < questions.length / 2
                ? "You're doing great — steady progress."
                : 'Almost there — a few more to go.'}
            </Text>
          )}
        </Animated.View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <SecondaryButton
          label={isLast ? 'Skip and see results' : 'Skip question'}
          onPress={skipQuestion}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.bgCard,
  },
  backBtn: { padding: spacing.sm },
  backArrow: { fontSize: fontSizes.xl, color: colors.textSecondary },
  progressSection: { flex: 1 },

  interstitialScroll: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  interstitialHero: {
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    ...shadow.subtle,
  },
  interstitialTag: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    color: colors.primaryDark,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
  },
  interstitialEmojiRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.tintPrimaryStrong,
  },
  interstitialEmoji: { fontSize: 44 },
  interstitialLead: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
    marginTop: spacing.sm,
    lineHeight: 18,
  },
  interstitialTitle: {
    fontSize: fontSizes.xxl,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
    letterSpacing: -0.5,
  },
  interstitialSubtitle: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  insightBlock: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.subtle,
  },
  insightBlockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  insightCategory: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  insightLine: { flex: 1, height: 1, backgroundColor: colors.border },
  insightQ: {
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
    fontWeight: fontWeights.semibold,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  insightWhyLabel: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  insightSig: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    lineHeight: 21,
  },
  closingCard: {
    backgroundColor: colors.tintAccent,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.tintAccentBorder,
  },
  closingText: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  interstitialBtn: { marginBottom: spacing.md },

  container: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: 100,
  },
  questionNumber: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    fontWeight: fontWeights.medium,
  },
  questionText: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    lineHeight: 28,
    marginBottom: spacing.xl,
  },
  optionsContainer: { gap: spacing.md },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: 16,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
    minHeight: 56,
    ...shadow.subtle,
  },
  optionCardSelected: {
    backgroundColor: colors.tintPrimaryStrong,
    borderColor: colors.primary,
    borderWidth: 2,
  },
  optionEmoji: { fontSize: 22 },
  optionLabel: {
    flex: 1,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
    fontWeight: fontWeights.medium,
    lineHeight: 22,
  },
  optionLabelSelected: { fontWeight: fontWeights.semibold },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: { color: '#fff', fontSize: 14, fontWeight: fontWeights.bold },
  motivational: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: fontSizes.sm,
    marginTop: spacing.xl,
    lineHeight: 20,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    backgroundColor: colors.bgCard,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    ...shadow.tabBar,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  loadingText: { fontSize: fontSizes.base, color: colors.textMuted },
  metaLine: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    fontWeight: fontWeights.medium,
  },
});
