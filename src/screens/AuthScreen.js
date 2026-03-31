import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fontSizes, fontWeights, spacing, radius, shadow } from '../theme';
import { PrimaryButton } from '../components/UI';
import { useAuth } from '../context/AuthContext';

export default function AuthScreen({ navigation }) {
  const { register, login, isLoading, error, clearError } = useAuth();

  const [mode, setMode]       = useState('login'); // 'login' | 'register'
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [localError, setLocalError] = useState('');

  const toggleMode = () => {
    setMode((m) => (m === 'login' ? 'register' : 'login'));
    setLocalError('');
    clearError();
  };

  const validate = () => {
    if (!email.trim()) return 'Email is required';
    if (!/\S+@\S+\.\S+/.test(email.trim())) return 'Enter a valid email';
    if (password.length < 6) return 'Password must be at least 6 characters';
    if (mode === 'register' && password !== confirmPw) return 'Passwords do not match';
    return null;
  };

  const handleSubmit = async () => {
    setLocalError('');
    clearError();

    const validationError = validate();
    if (validationError) {
      setLocalError(validationError);
      return;
    }

    let result;
    if (mode === 'register') {
      result = await register(email.trim().toLowerCase(), password);
    } else {
      result = await login(email.trim().toLowerCase(), password);
    }

    // Navigate to Main dashboard on success
    if (result?.success && navigation) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    }
  };

  const handleGoogleLogin = () => {
    Alert.alert(
      '🚀 Coming Soon!',
      'Google Login will be available in the next update. Stay tuned!',
      [{ text: 'OK', style: 'default' }]
    );
  };

  const displayError = localError || error;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo / Branding */}
          <View style={styles.brandSection}>
            <View style={styles.logoWrap}>
              <Text style={styles.logoEmoji}>🧬</Text>
            </View>
            <Text style={styles.appName}>B12 Health</Text>
            <Text style={styles.tagline}>Track your Vitamin B12 health</Text>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>
              {mode === 'login' ? 'Welcome Back' : 'Create Account'}
            </Text>
            <Text style={styles.formSubtitle}>
              {mode === 'login'
                ? 'Sign in to continue tracking your health'
                : 'Start your B12 health journey today'}
            </Text>

            {/* Error */}
            {displayError ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>⚠️ {displayError}</Text>
              </View>
            ) : null}

            {/* Email */}
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
            />

            {/* Password */}
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Min 6 characters"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            {/* Confirm Password (register only) */}
            {mode === 'register' && (
              <>
                <Text style={styles.inputLabel}>Confirm Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Re-enter password"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry
                  value={confirmPw}
                  onChangeText={setConfirmPw}
                />
              </>
            )}

            <PrimaryButton
              label={mode === 'login' ? 'Sign In' : 'Create Account'}
              onPress={handleSubmit}
              disabled={isLoading}
              loading={isLoading}
              style={{ marginTop: spacing.lg }}
            />

            {/* Toggle */}
            <TouchableOpacity onPress={toggleMode} style={styles.toggleBtn}>
              <Text style={styles.toggleText}>
                {mode === 'login'
                  ? "Don't have an account? "
                  : 'Already have an account? '}
                <Text style={styles.toggleHighlight}>
                  {mode === 'login' ? 'Sign Up' : 'Sign In'}
                </Text>
              </Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Login — Coming Soon */}
            <TouchableOpacity
              style={styles.googleBtn}
              onPress={handleGoogleLogin}
              activeOpacity={0.85}
            >
              <Text style={styles.googleBtnIcon}>G</Text>
              <Text style={styles.googleBtnText}>Continue with Google</Text>
              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonText}>Coming Soon</Text>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },

  brandSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.tintPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 201, 167, 0.25)',
  },
  logoEmoji: { fontSize: 40 },
  appName: {
    fontSize: fontSizes.xxl,
    fontWeight: fontWeights.extrabold,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  tagline: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
  },

  formCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xxl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  formTitle: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },

  errorBanner: {
    backgroundColor: colors.tintDanger,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.tintDangerBorder,
  },
  errorText: {
    fontSize: fontSizes.sm,
    color: colors.riskHigh,
    textAlign: 'center',
  },

  inputLabel: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    fontWeight: fontWeights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
    marginTop: spacing.sm,
  },
  input: {
    backgroundColor: colors.bgElevated || colors.bg,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: fontSizes.base,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },

  toggleBtn: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  toggleText: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
  },
  toggleHighlight: {
    color: colors.primary,
    fontWeight: fontWeights.bold,
  },

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated || colors.bg,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    gap: spacing.md,
  },
  googleBtnIcon: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.extrabold,
    color: '#4285F4',
  },
  googleBtnText: {
    flex: 1,
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    fontWeight: fontWeights.medium,
  },
  comingSoonBadge: {
    backgroundColor: colors.tintWarning,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.tintWarningBorder,
  },
  comingSoonText: {
    fontSize: fontSizes.xs,
    color: colors.riskMedium,
    fontWeight: fontWeights.semibold,
  },
});
