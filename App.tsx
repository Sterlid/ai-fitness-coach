import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { AuthScreen } from './src/features/auth/AuthScreen';
import { PasswordResetScreen } from './src/features/auth/PasswordResetScreen';
import { HomeScreen } from './src/features/home/HomeScreen';
import { OnboardingScreen } from './src/features/onboarding/OnboardingScreen';
import { AuthProvider, useAuth } from './src/providers/AuthProvider';
import { supabase } from './src/lib/supabase';
import { colors } from './src/theme/colors';
import { isSupabaseConfigured } from './src/lib/supabase';
import { navigateToPath, useAppPath } from './src/navigation/webRouter';

function AppContent() {
  const { clearPasswordRecovery, isLoading, isPasswordRecovery, session } = useAuth();
  const path = useAppPath();

  useEffect(() => {
    if (isLoading) return;

    if (path === '/reset-password') {
      if (!isPasswordRecovery || !session) navigateToPath('/login', true);
      return;
    }

    if (isPasswordRecovery) clearPasswordRecovery();

    if (!isSupabaseConfigured) {
      navigateToPath('/setup', true);
      return;
    }

    if (!session) navigateToPath('/login', true);
  }, [clearPasswordRecovery, isLoading, isPasswordRecovery, path, session]);

  if (!isSupabaseConfigured) {
    return (
      <View style={styles.centered}>
        <Text style={styles.eyebrow}>SETUP REQUIRED</Text>
        <Text style={styles.title}>Connect Supabase</Text>
        <Text style={styles.body}>
          Copy .env.example to .env, then add your project URL and publishable key.
        </Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (path === '/reset-password') return <PasswordResetScreen />;

  return session ? <AuthenticatedApp /> : <AuthScreen />;
}

function AuthenticatedApp() {
  const { user } = useAuth();
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  useEffect(() => {
    if (!user || !supabase) return;

    let isMounted = true;
    void supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!isMounted) return;
        setOnboardingComplete(data?.onboarding_completed === true);
        setIsCheckingProfile(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user]);

  useEffect(() => {
    if (!isCheckingProfile) navigateToPath(onboardingComplete ? '/home' : '/setup', true);
  }, [isCheckingProfile, onboardingComplete]);

  if (isCheckingProfile) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return onboardingComplete ? (
    <HomeScreen />
  ) : (
    <OnboardingScreen onComplete={() => setOnboardingComplete(true)} />
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <AppContent />
      </SafeAreaView>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  centered: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    backgroundColor: colors.background,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginBottom: 10,
  },
  title: { color: colors.ink, fontSize: 34, fontWeight: '800', marginBottom: 12 },
  body: { color: colors.muted, fontSize: 17, lineHeight: 25 },
});
