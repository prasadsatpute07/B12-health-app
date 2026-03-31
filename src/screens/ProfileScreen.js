import React, { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fontSizes, fontWeights, spacing, radius, shadow } from '../theme';
import { PrimaryButton } from '../components/UI';
import { success } from '../components/Feedback';
import { useApp, setUser } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { DIET_TYPES } from '../data/questions';
import { userAPI } from '../services/api';

const AGE_OPTIONS = ['15-24', '25-40', '41-60', '60+'];
const GENDERS = [
  { id: 'female', label: 'Female' },
  { id: 'male', label: 'Male' },
  { id: 'other', label: 'Other' },
];

function ageRangeToApiInt(ageRange) {
  const m = { '15-24': 20, '25-40': 32, '41-60': 50, '60+': 65 };
  return m[ageRange] ?? 32;
}

export default function ProfileScreen({ navigation }) {
  const { state, dispatch, syncWithServer } = useApp();
  const { logout, user: authUser } = useAuth();
  const { user, guestName, streak, dailyLogs } = state;

  const [name, setName] = useState(user?.name || guestName || '');
  const [age, setAge] = useState(user?.age || '25-40');
  const [gender, setGender] = useState(user?.gender || 'male');
  const [dietType, setDietType] = useState(user?.dietType || 'omnivore');
  const [saving, setSaving] = useState(false);

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [notice, setNotice] = useState(null); // { type: 'success'|'error', text: string }

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 2600);
    return () => clearTimeout(t);
  }, [notice]);

  useEffect(() => {
    setName(user?.name || guestName || '');
    setAge(user?.age || '25-40');
    setGender(user?.gender || 'male');
    setDietType(user?.dietType || 'omnivore');
  }, [user, guestName]);

  const numLogs = dailyLogs?.length ?? 0;
  const isLoggedIn = !!authUser?.email;

  const saveProfile = async () => {
    if (!name.trim()) {
      Alert.alert('Name', 'Please enter a display name.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        age: ageRangeToApiInt(age),
        gender,
        dietType,
      };
      if (isLoggedIn) {
        await userAPI.saveProfile(payload);
        await syncWithServer?.();
      }
      dispatch(
        setUser({
          ...user,
          name: name.trim(),
          age,
          gender,
          dietType,
        })
      );
      setNotice({
        type: 'success',
        text: isLoggedIn ? 'Profile saved successfully.' : 'Saved on this device.',
      });
      success();
    } catch (e) {
      Alert.alert('Could not save', e.message || 'Try again.');
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (!currentPw || !newPw) {
      Alert.alert('Password', 'Fill in current and new password.');
      return;
    }
    if (newPw.length < 6) {
      Alert.alert('Password', 'New password must be at least 6 characters.');
      return;
    }
    if (newPw !== confirmPw) {
      Alert.alert('Password', 'New passwords do not match.');
      return;
    }
    setPwLoading(true);
    try {
      await userAPI.changePassword(currentPw, newPw);
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
      setNotice({ type: 'success', text: 'Password updated.' });
      success();
    } catch (e) {
      Alert.alert('Could not update', e.message || 'Check your current password.');
    } finally {
      setPwLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          navigation.reset({ index: 0, routes: [{ name: 'Onboarding' }] });
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* prof-hdr */}
      <LinearGradient
        colors={['rgba(34, 211, 238, 0.12)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarTxt}>
            {(name || 'U').trim().charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerName}>{name || 'User'}</Text>
          <Text style={styles.email}>{authUser?.email || 'Guest · local only'}</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.editBtn}>
          <Text style={styles.editBtnTxt}>Edit</Text>
        </TouchableOpacity>
      </LinearGradient>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {notice && (
            <View style={[styles.notice, notice.type === 'success' ? styles.noticeOk : styles.noticeErr]}>
              <Text style={styles.noticeIcon}>{notice.type === 'success' ? '✓' : '!'}</Text>
              <Text style={styles.noticeText}>{notice.text}</Text>
            </View>
          )}

          <Text style={styles.section}>Personal</Text>
          <View style={styles.card}>
            <Text style={styles.label}>Display name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={colors.textMuted}
            />
            <Text style={styles.label}>Age range</Text>
            <View style={styles.row}>
              {AGE_OPTIONS.map((a) => (
                <TouchableOpacity
                  key={a}
                  style={[styles.chip, age === a && styles.chipOn]}
                  onPress={() => setAge(a)}
                >
                  <Text style={[styles.chipTxt, age === a && styles.chipTxtOn]}>{a}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.label}>Gender</Text>
            <View style={styles.col}>
              {GENDERS.map((g) => (
                <TouchableOpacity
                  key={g.id}
                  style={[styles.rowChip, gender === g.id && styles.chipOn]}
                  onPress={() => setGender(g.id)}
                >
                  <Text style={[styles.chipTxt, gender === g.id && styles.chipTxtOn]}>{g.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.label}>Diet</Text>
            {DIET_TYPES.map((d) => (
              <TouchableOpacity
                key={d.id}
                style={[styles.dietRow, dietType === d.id && styles.dietOn]}
                onPress={() => setDietType(d.id)}
              >
                <Text style={styles.dietEmoji}>{d.icon}</Text>
                <Text style={[styles.dietLabel, dietType === d.id && styles.dietLabelOn]}>
                  {d.label}
                </Text>
                {dietType === d.id ? <Text style={styles.check}>✓</Text> : null}
              </TouchableOpacity>
            ))}
            <PrimaryButton
              label={saving ? 'Saving…' : 'Save profile'}
              onPress={saveProfile}
              disabled={saving}
              loading={saving}
              style={{ marginTop: spacing.md }}
            />
          </View>

          {isLoggedIn && (
            <>
              <Text style={styles.section}>Security</Text>
              <View style={styles.card}>
                <Text style={styles.hint}>
                  Use a strong password. You’ll need your current password to change it.
                </Text>
                <Text style={styles.label}>Current password</Text>
                <TextInput
                  style={styles.input}
                  value={currentPw}
                  onChangeText={setCurrentPw}
                  secureTextEntry
                  placeholder="••••••••"
                  placeholderTextColor={colors.textMuted}
                />
                <Text style={styles.label}>New password</Text>
                <TextInput
                  style={styles.input}
                  value={newPw}
                  onChangeText={setNewPw}
                  secureTextEntry
                  placeholder="At least 6 characters"
                  placeholderTextColor={colors.textMuted}
                />
                <Text style={styles.label}>Confirm new password</Text>
                <TextInput
                  style={styles.input}
                  value={confirmPw}
                  onChangeText={setConfirmPw}
                  secureTextEntry
                  placeholder="Repeat new password"
                  placeholderTextColor={colors.textMuted}
                />
                <TouchableOpacity
                  style={[styles.secondaryBtn, pwLoading && { opacity: 0.7 }]}
                  onPress={changePassword}
                  disabled={pwLoading}
                >
                  {pwLoading ? (
                    <ActivityIndicator color={colors.primary} />
                  ) : (
                    <Text style={styles.secondaryBtnTxt}>Update password</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}

          <Text style={styles.section}>Activity</Text>
          <View style={styles.card}>
            <View style={styles.statLine}>
              <Text style={styles.statLab}>Day streak</Text>
              <Text style={styles.statVal}>{streak}</Text>
            </View>
            <View style={[styles.statLine, { borderBottomWidth: 0 }]}>
              <Text style={styles.statLab}>Check-ins logged</Text>
              <Text style={styles.statVal}>{numLogs}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.logout} onPress={handleLogout}>
            <Text style={styles.logoutTxt}>Log out</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgMid },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 201, 167, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 201, 167, 0.3)',
  },
  avatarTxt: { fontSize: 24, fontWeight: fontWeights.bold, color: colors.textPrimary },
  headerName: { fontSize: 17, fontWeight: fontWeights.bold, color: colors.textPrimary },
  email: { fontSize: fontSizes.xs, color: colors.textMuted, marginTop: 2 },
  editBtn: {
    paddingHorizontal: 13,
    paddingVertical: 5,
    borderRadius: radius.full,
    backgroundColor: 'rgba(0, 201, 167, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(0, 201, 167, 0.24)',
  },
  editBtnTxt: { fontSize: 11, fontWeight: fontWeights.semibold, color: colors.primaryLight },

  container: { padding: 14, paddingBottom: spacing.xxl },

  section: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    color: colors.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.subtle,
  },
  label: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  hint: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: fontSizes.base,
    color: colors.textPrimary,
    backgroundColor: colors.bgMuted,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgMuted,
  },
  chipOn: {
    backgroundColor: colors.tintPrimaryStrong,
    borderColor: colors.primary,
  },
  chipTxt: { fontSize: fontSizes.sm, color: colors.textSecondary },
  chipTxtOn: { color: colors.textPrimary, fontWeight: fontWeights.semibold },
  col: { gap: spacing.sm },
  rowChip: {
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgMuted,
  },
  dietRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    backgroundColor: colors.bgMuted,
  },
  dietOn: {
    borderColor: colors.primary,
    backgroundColor: colors.tintPrimary,
  },
  dietEmoji: { fontSize: 22, marginRight: spacing.sm },
  dietLabel: { flex: 1, fontSize: fontSizes.base, color: colors.textPrimary },
  dietLabelOn: { fontWeight: fontWeights.semibold },
  check: { color: colors.primary, fontWeight: fontWeights.bold, fontSize: fontSizes.lg },

  secondaryBtn: {
    marginTop: spacing.md,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  secondaryBtnTxt: { color: colors.primary, fontWeight: fontWeights.bold, fontSize: fontSizes.base },

  statLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statLab: { fontSize: fontSizes.base, color: colors.textSecondary },
  statVal: { fontSize: fontSizes.base, fontWeight: fontWeights.bold, color: colors.textPrimary },

  logout: {
    alignItems: 'center',
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  logoutTxt: { color: colors.riskHigh, fontWeight: fontWeights.bold, fontSize: fontSizes.base },

  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.tintAccent,
    borderColor: colors.tintAccentBorder,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  noticeOk: {},
  noticeErr: {
    backgroundColor: colors.tintDanger,
    borderColor: colors.tintDangerBorder,
  },
  noticeIcon: {
    fontSize: 18,
    fontWeight: fontWeights.bold,
    color: colors.primary,
  },
  noticeText: {
    flex: 1,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontWeight: fontWeights.medium,
    lineHeight: 20,
  },
});
