import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fontSizes, fontWeights, spacing, radius, shadow } from '../theme';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

import AuthScreen           from '../screens/AuthScreen';
import OnboardingScreen     from '../screens/OnboardingScreen';
import QuestionnaireScreen  from '../screens/QuestionnaireScreen';
import ResultsScreen        from '../screens/ResultsScreen';
import ScorePreviewScreen   from '../screens/ScorePreviewScreen';
import DashboardScreen      from '../screens/DashboardScreen';
import DailyCheckInScreen   from '../screens/DailyCheckInScreen';
import WeeklyProgressScreen from '../screens/WeeklyProgressScreen';
import B12FoodsScreen       from '../screens/B12FoodsScreen';
import ProfileScreen        from '../screens/ProfileScreen';
import BMIScreen            from '../screens/BMIScreen';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

// ─── Tab Bar ─────────────────────────────────────────────────────────────────
function TabBar({ state, navigation }) {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 12);

  const TABS = [
    { name: 'Dashboard',  icon: '🏠', label: 'Home' },
    { name: 'DailyCheckIn', icon: '📝', label: 'Check-in' },
    { name: 'Progress',   icon: '📊', label: 'Progress' },
    { name: 'B12Foods',   icon: '🥗', label: 'Foods' },
  ];

  return (
    <View style={[tabStyles.outer, { paddingBottom: bottomPad }]}>
      <View style={[tabStyles.bar, shadow.tabBar]}>
        {state.routes.map((route, i) => {
          const focused = state.index === i;
          const tab = TABS.find((t) => t.name === route.name) || {};
          return (
            <TouchableOpacity
              key={route.key}
              onPress={() => navigation.navigate(route.name)}
              style={tabStyles.tab}
              activeOpacity={0.85}
            >
              <View style={[tabStyles.tabInner, focused && tabStyles.tabInnerFocused]}>
                <Text style={[tabStyles.icon, focused && tabStyles.iconFocused]}>
                  {tab.icon}
                </Text>
                <Text style={[tabStyles.label, focused && tabStyles.labelFocused]}>
                  {tab.label}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Main Tab Navigator ───────────────────────────────────────────────────────
function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Dashboard"    component={DashboardScreen} />
      <Tab.Screen name="DailyCheckIn" component={DailyCheckInScreen} />
      <Tab.Screen name="Progress"     component={WeeklyProgressScreen} />
      <Tab.Screen name="B12Foods"     component={B12FoodsScreen} />
    </Tab.Navigator>
  );
}

// ─── Loading Screen ──────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <View style={loadingStyles.container}>
      <Text style={loadingStyles.emoji}>🧬</Text>
      <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 16 }} />
      <Text style={loadingStyles.text}>Loading...</Text>
    </View>
  );
}

// ─── Root Stack ───────────────────────────────────────────────────────────────
export default function AppNavigator() {
  const { state } = useApp();
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  let initialRoute;
  if (isAuthenticated) {
    initialRoute = 'Main';
  } else if (state.riskResult) {
    initialRoute = 'ScorePreview';
  } else if (state.onboardingDone) {
    initialRoute = 'Questionnaire';
  } else {
    initialRoute = 'Onboarding';
  }

  const navTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      primary: colors.primary,
      background: colors.bg,
      card: colors.bgMid,
      text: colors.textPrimary,
      border: colors.border,
      notification: colors.primary,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
      >
        <Stack.Screen name="Onboarding"     component={OnboardingScreen} />
        <Stack.Screen name="Questionnaire"  component={QuestionnaireScreen} />
        <Stack.Screen name="ScorePreview"   component={ScorePreviewScreen} />
        <Stack.Screen
          name="Auth"
          component={AuthScreen}
          initialParams={{ initialMode: state.onboardingDone ? 'register' : 'login' }}
        />

        <Stack.Screen name="Main"           component={MainTabs} />
        <Stack.Screen name="Results"        component={ResultsScreen} />
        <Stack.Screen name="B12Foods"       component={B12FoodsScreen} />
        <Stack.Screen name="Profile"        component={ProfileScreen} />
        <Stack.Screen name="BMI"            component={BMIScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const loadingStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 48 },
  text: {
    marginTop: 12,
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    fontWeight: '500',
  },
});

const tabStyles = StyleSheet.create({
  outer: {
    backgroundColor: colors.bgMid,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingTop: 6,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabInner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.full,
    minWidth: 72,
  },
  tabInnerFocused: {
    backgroundColor: colors.tintPrimaryStrong,
    borderWidth: 1,
    borderColor: 'rgba(0, 201, 167, 0.32)',
  },
  icon:        { fontSize: 18, opacity: 0.4 },
  iconFocused: { opacity: 1, transform: [{ scale: 1.05 }] },
  label: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 3,
    fontWeight: fontWeights.semibold,
  },
  labelFocused: {
    color: colors.primary,
    fontWeight: fontWeights.bold,
  },
});
