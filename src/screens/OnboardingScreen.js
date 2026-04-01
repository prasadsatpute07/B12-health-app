import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fontSizes, fontWeights, spacing, radius, shadow } from '../theme';
import { PrimaryButton } from '../components/UI';
import { success } from '../components/Feedback';
import { useApp, setUser, setGuestName, completeOnboarding } from '../context/AppContext';
import { DIET_TYPES } from '../data/questions';

const { width } = Dimensions.get('window');

/** Shown first — app story, vision, trust (before product feature slides). */
const INTRO_SLIDES = [
  {
    kicker: 'Welcome',
    emoji: '🌿',
    title: 'Your calm space for\nB12 wellness',
    subtitle:
      'B12 Health helps you understand vitamin B12 in everyday language — with a guided assessment and quick daily check-ins you can complete in moments.',
  },
  {
    kicker: 'How it works',
    emoji: '✨',
    title: 'Simple steps,\nmeaningful clarity',
    subtitle:
      'Take a one-time questionnaire tailored to your age, diet, and lifestyle. Then log energy, mood, and sleep in seconds. We surface patterns so you can spot trends over time.',
  },
  {
    kicker: 'Our vision',
    emoji: '🎯',
    title: 'Awareness that\nempowers — not alarms',
    subtitle:
      'We believe preventive health should feel supportive and professional. Our goal is to help you prepare for informed conversations with your clinician — never to replace medical advice.',
  },
  {
    kicker: 'Privacy',
    emoji: '🔐',
    title: 'You stay in control',
    subtitle:
      'Your responses are stored securely on your account. We design every screen to respect your data and keep the experience transparent and easy to understand.',
  },
];

const FEATURE_SLIDES = [
  {
    kicker: 'Inside the app',
    emoji: '🩺',
    title: 'Know your\nvitamin B12 picture',
    subtitle: 'Surface early signs that may warrant attention — before they heavily impact how you feel day to day.',
  },
  {
    kicker: 'Inside the app',
    emoji: '📊',
    title: 'Track gentle\ndaily patterns',
    subtitle: 'Log energy, mood, and fatigue in about ten seconds to see how your week unfolds.',
  },
  {
    kicker: 'Inside the app',
    emoji: '💡',
    title: 'Personalized\ninsights',
    subtitle: 'Recommendations adapt to your profile so guidance feels relevant, not generic.',
  },
];

const ALL_SLIDES = [...INTRO_SLIDES, ...FEATURE_SLIDES];

export default function OnboardingScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { dispatch } = useApp();
  const scrollRef = useRef(null);
  const [slide, setSlide] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [dietType, setDietType] = useState('');
  const [saving, setSaving] = useState(false);

  const totalSlides = ALL_SLIDES.length;
  const progressPct = ((slide + 1) / totalSlides) * 100;

  const goNext = () => {
    if (slide < totalSlides - 1) {
      scrollRef.current?.scrollTo({ x: (slide + 1) * width, animated: true });
      setSlide(slide + 1);
    } else {
      setShowForm(true);
    }
  };

  const handleStart = async () => {
    if (!age || !gender || !dietType) return;
    setSaving(true);

    const user = { name: name || 'Friend', age, gender, dietType };
    dispatch(setUser(user));
    dispatch(setGuestName(name || 'Friend'));
    dispatch(completeOnboarding());

    setSaving(false);
    success();
    navigation.replace('Questionnaire');
  };

  if (showForm) {
    const canSubmit = age && gender && dietType && !saving;

    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <KeyboardAvoidingView
          style={styles.formKeyboard}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 2 : 0}
        >
          <ScrollView
            contentContainerStyle={[
              styles.formScrollContent,
              { paddingBottom: Math.max(insets.bottom, spacing.lg) + spacing.xl },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Top bar */}
            <View style={styles.formTopBar}>
              <TouchableOpacity
                onPress={() => setShowForm(false)}
                style={styles.formBackBtn}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityRole="button"
                accessibilityLabel="Back to introduction"
              >
                <Text style={styles.formBackArrow}>←</Text>
              </TouchableOpacity>
              <Text style={styles.formBrand}>B12 Health</Text>
              <View style={styles.formTopBarSpacer} />
            </View>

            {/* Intro copy */}
            <View style={styles.formHero}>
              <Text style={styles.formStepPill}>Step 2 of 2 · Your profile</Text>
              <Text style={styles.formTitle}>A few details to personalize your plan</Text>
              <Text style={styles.formSubtitle}>
                We ask for age, gender, and diet so questions and tips match your situation. You can change this anytime in Profile.
              </Text>
            </View>

            {/* Card: identity */}
            <View style={styles.formCard}>
              <Text style={styles.formCardTitle}>About you</Text>

              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>
                  Name <Text style={styles.fieldOptional}>(optional)</Text>
                </Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Alex"
                  placeholderTextColor={colors.textMuted}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  autoCorrect={false}
                  returnKeyType="next"
                />
              </View>

              <View style={styles.formDivider} />

              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>
                  Age range <Text style={styles.fieldRequired}>*</Text>
                </Text>
                <View style={styles.inputRow}>
                  {['15-24', '25-40', '41-60', '60+'].map((a) => (
                    <TouchableOpacity
                      key={a}
                      style={[styles.pill, age === a && styles.pillActive]}
                      onPress={() => setAge(a)}
                      activeOpacity={0.85}
                    >
                      <Text style={[styles.pillText, age === a && styles.pillTextActive]}>{a}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formDivider} />

              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>
                  Gender <Text style={styles.fieldRequired}>*</Text>
                </Text>
                <View style={styles.genderRow}>
                  {[
                    { id: 'female', label: 'Female' },
                    { id: 'male', label: 'Male' },
                    { id: 'other', label: 'Other' },
                  ].map((g) => (
                    <TouchableOpacity
                      key={g.id}
                      style={[styles.pillWide, gender === g.id && styles.pillActive]}
                      onPress={() => setGender(g.id)}
                      activeOpacity={0.85}
                    >
                      <Text style={[styles.pillText, gender === g.id && styles.pillTextActive]}>
                        {g.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Card: diet */}
            <View style={styles.formCard}>
              <Text style={styles.formCardTitle}>Typical eating pattern</Text>
              <Text style={styles.formCardHint}>
                This helps estimate B12 intake from food. Choose what fits best most days.
              </Text>

              {DIET_TYPES.map((d) => (
                <TouchableOpacity
                  key={d.id}
                  style={[styles.dietCard, dietType === d.id && styles.dietCardActive]}
                  onPress={() => setDietType(d.id)}
                  activeOpacity={0.88}
                >
                  <View style={styles.dietEmojiWrap}>
                    <Text style={styles.dietEmoji}>{d.icon}</Text>
                  </View>
                  <View style={styles.dietTextCol}>
                    <Text style={[styles.dietLabel, dietType === d.id && styles.dietLabelActive]}>
                      {d.label}
                    </Text>
                    {d.weight > 0 && (
                      <Text style={styles.dietRisk}>
                        {d.weight >= 3
                          ? 'Often higher need for B12 awareness'
                          : d.weight === 2
                            ? 'Moderate attention to B12 sources'
                            : 'Generally more B12 from diet'}
                      </Text>
                    )}
                  </View>
                  {dietType === d.id ? (
                    <View style={styles.dietCheck}>
                      <Text style={styles.checkmark}>✓</Text>
                    </View>
                  ) : (
                    <View style={styles.dietRadio} />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <PrimaryButton
              label={saving ? 'Saving…' : 'Continue to assessment'}
              onPress={handleStart}
              disabled={!canSubmit}
              loading={saving}
              style={styles.formPrimaryBtn}
            />

            <TouchableOpacity onPress={() => navigation.navigate('Auth')} style={styles.loginLink}>
              <Text style={styles.loginLinkText}>
                Already have an account?{' '}
                <Text style={styles.loginLinkHighlight}>Log in</Text>
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.slideTopBar}>
        <Text style={styles.brandMark}>B12 Health</Text>
        <Text style={styles.slideStep}>
          {slide + 1} / {totalSlides}
        </Text>
      </View>

      <View style={styles.progressBarOuter}>
        <View style={[styles.progressBarFill, { width: `${progressPct}%` }]} />
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        style={{ flex: 1 }}
      >
        {ALL_SLIDES.map((s, i) => (
          <View key={i} style={styles.slide}>
            <Text style={styles.slideKicker}>{s.kicker}</Text>
            <View style={styles.emojiWrap}>
              <Text style={styles.slideEmoji}>{s.emoji}</Text>
            </View>
            <Text style={styles.slideTitle}>{s.title}</Text>
            <Text style={styles.slideSubtitle}>{s.subtitle}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.bottomBar}>
        <PrimaryButton
          label={slide < totalSlides - 1 ? 'Next' : 'Continue'}
          onPress={goNext}
          style={{ width: '100%' }}
        />
        <TouchableOpacity onPress={() => navigation.navigate('Auth')} style={styles.loginLink}>
          <Text style={styles.loginLinkText}>
            Already have an account?{' '}
            <Text style={styles.loginLinkHighlight}>Log in</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },

  slideTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  brandMark: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colors.textMuted,
    letterSpacing: 0.8,
  },
  slideStep: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium,
    color: colors.textMuted,
  },
  progressBarOuter: {
    height: 4,
    marginHorizontal: spacing.xl,
    backgroundColor: colors.border,
    borderRadius: radius.full,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: radius.full,
  },

  slide: {
    width,
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideKicker: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
    color: colors.primaryDark,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
  },
  emojiWrap: {
    width: 112,
    height: 112,
    borderRadius: radius.full,
    backgroundColor: colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.subtle,
  },
  slideEmoji: { fontSize: 48 },
  slideTitle: {
    fontSize: fontSizes.hero,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 40,
    marginBottom: spacing.md,
    letterSpacing: -0.3,
  },
  slideSubtitle: {
    fontSize: fontSizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 25,
    maxWidth: 320,
    fontWeight: fontWeights.regular,
  },

  bottomBar: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },

  loginLink: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginBottom: spacing.xs,
  },
  loginLinkText: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
  },
  loginLinkHighlight: {
    color: colors.primaryDark,
    fontWeight: fontWeights.semibold,
  },

  formKeyboard: { flex: 1 },
  formScrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
  },

  formTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  formBackBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  formBackArrow: {
    fontSize: fontSizes.xl,
    color: colors.textPrimary,
    fontWeight: fontWeights.semibold,
  },
  formBrand: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colors.textMuted,
    letterSpacing: 0.6,
  },
  formTopBarSpacer: { width: 44 },

  formHero: {
    marginBottom: spacing.xl,
  },
  formStepPill: {
    alignSelf: 'flex-start',
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
    color: colors.primaryDark,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    backgroundColor: colors.tintPrimary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  formTitle: {
    fontSize: fontSizes.xxl,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    lineHeight: 32,
    letterSpacing: -0.3,
  },
  formSubtitle: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    lineHeight: 22,
  },

  formCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.subtle,
  },
  formCardTitle: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  formCardHint: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    lineHeight: 18,
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
  },
  formDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.lg,
  },
  formField: {
    marginBottom: 0,
  },
  fieldLabel: {
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
    fontWeight: fontWeights.semibold,
    marginBottom: spacing.sm,
  },
  fieldOptional: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium,
    color: colors.textMuted,
  },
  fieldRequired: {
    color: colors.primary,
    fontWeight: fontWeights.bold,
  },

  textInput: {
    backgroundColor: colors.bgMuted,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 16,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
    minHeight: 52,
  },
  inputRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  genderRow: {
    flexDirection: 'column',
    gap: spacing.sm,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 46,
    justifyContent: 'center',
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.bgMuted,
  },
  pillWide: {
    width: '100%',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    minHeight: 48,
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.bgMuted,
  },
  pillActive: {
    backgroundColor: colors.tintPrimaryStrong,
    borderColor: colors.primary,
  },
  pillText: { color: colors.textSecondary, fontSize: fontSizes.sm, fontWeight: fontWeights.medium },
  pillTextActive: { color: colors.textPrimary, fontWeight: fontWeights.semibold },

  dietCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgMuted,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  dietCardActive: {
    backgroundColor: colors.tintPrimary,
    borderColor: colors.primary,
    borderWidth: 2,
  },
  dietEmojiWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  dietEmoji: { fontSize: 22 },
  dietTextCol: { flex: 1 },
  dietLabel: {
    fontSize: fontSizes.base,
    color: colors.textPrimary,
    fontWeight: fontWeights.medium,
    lineHeight: 22,
  },
  dietLabelActive: { fontWeight: fontWeights.semibold },
  dietRisk: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    marginTop: 4,
    lineHeight: 18,
  },
  dietCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dietRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: fontWeights.bold,
  },

  formPrimaryBtn: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
});
