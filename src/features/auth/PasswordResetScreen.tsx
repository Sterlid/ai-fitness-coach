import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { supabase } from '../../lib/supabase';
import { useAuth } from '../../providers/AuthProvider';
import { navigateToPath } from '../../navigation/webRouter';
import { colors } from '../../theme/colors';

const passwordRules = [
  { label: 'At least 12 characters', met: (value: string) => value.length >= 12 },
  { label: 'One uppercase letter', met: (value: string) => /[A-Z]/.test(value) },
  { label: 'One lowercase letter', met: (value: string) => /[a-z]/.test(value) },
  { label: 'One number or symbol', met: (value: string) => /[0-9]/.test(value) || /[^A-Za-z0-9\s]/.test(value) },
];

export function PasswordResetScreen() {
  const { isLoading, session } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);
  const isStrongPassword = passwordRules.every((rule) => rule.met(password));

  useEffect(() => {
    if (isLoading || Platform.OS !== 'web' || typeof window === 'undefined') return;

    // Supabase has already exchanged the one-time recovery token for a session.
    // Remove the token from the visible address bar without reloading the page.
    window.history.replaceState({}, '', '/reset-password');
  }, [isLoading]);

  const savePassword = async () => {
    if (!supabase || !session) {
      setFeedback({ kind: 'error', text: 'This reset link is invalid or has expired. Request a new one.' });
      return;
    }

    if (!isStrongPassword) {
      setFeedback({ kind: 'error', text: 'Choose a stronger password using all four requirements below.' });
      return;
    }

    if (password !== confirmation) {
      setFeedback({ kind: 'error', text: 'The passwords do not match.' });
      return;
    }

    setIsSaving(true);
    setFeedback(null);
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setFeedback({ kind: 'error', text: error.message });
      setIsSaving(false);
      return;
    }

    setFeedback({ kind: 'success', text: 'Password updated. Returning you to sign in…' });
    await supabase.auth.signOut();
    navigateToPath('/login', true);
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!session) {
    return (
      <View style={styles.centered}>
        <Text style={styles.eyebrow}>ACCOUNT RECOVERY</Text>
        <Text style={styles.title}>Reset link expired.</Text>
        <Text style={styles.subtitle}>Request a new password reset link from the sign-in page.</Text>
        <Pressable onPress={() => navigateToPath('/login', true)} style={styles.button}>
          <Text style={styles.buttonText}>Back to sign in</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>ACCOUNT RECOVERY</Text>
      <Text style={styles.title}>Choose a new password.</Text>
      <Text style={styles.subtitle}>Use a strong password you have not used elsewhere.</Text>

      <TextInput
        autoComplete="new-password"
        onChangeText={setPassword}
        placeholder="New password"
        placeholderTextColor={colors.muted}
        secureTextEntry
        style={styles.input}
        value={password}
      />
      <TextInput
        autoComplete="new-password"
        onChangeText={setConfirmation}
        placeholder="Confirm new password"
        placeholderTextColor={colors.muted}
        secureTextEntry
        style={styles.input}
        value={confirmation}
      />

      <View style={styles.passwordChecker}>
        <Text style={styles.passwordCheckerTitle}>Password requirements</Text>
        {passwordRules.map((rule) => {
          const met = rule.met(password);
          return (
            <View key={rule.label} style={[styles.ruleRow, met ? styles.ruleRowMet : styles.ruleRowUnmet]}>
              <Text style={met ? styles.ruleMet : styles.rule}>{met ? '✓' : '○'} {rule.label}</Text>
            </View>
          );
        })}
      </View>

      {feedback ? <Text style={feedback.kind === 'error' ? styles.error : styles.success}>{feedback.text}</Text> : null}
      <Pressable disabled={isSaving} onPress={() => void savePassword()} style={styles.button}>
        {isSaving ? <ActivityIndicator color={colors.white} /> : <Text style={styles.buttonText}>Update password</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', maxWidth: 560, paddingHorizontal: 28, width: '100%' },
  centered: { alignItems: 'flex-start', flex: 1, justifyContent: 'center', paddingHorizontal: 28 },
  eyebrow: { color: colors.primary, fontSize: 12, fontWeight: '800', letterSpacing: 1.4 },
  title: { color: colors.ink, fontSize: 34, fontWeight: '800', marginTop: 10 },
  subtitle: { color: colors.muted, fontSize: 17, lineHeight: 25, marginTop: 10 },
  input: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 14, borderWidth: 1, color: colors.ink, fontSize: 16, marginTop: 14, paddingHorizontal: 16, paddingVertical: 15 },
  passwordChecker: { backgroundColor: colors.surfaceMuted, borderRadius: 12, marginTop: 16, padding: 14 },
  passwordCheckerTitle: { color: colors.ink, fontSize: 14, fontWeight: '800', marginBottom: 6 },
  ruleRow: { borderRadius: 8, marginTop: 4, paddingHorizontal: 8, paddingVertical: 3 },
  ruleRowMet: { backgroundColor: '#DCFCE7' },
  ruleRowUnmet: { backgroundColor: colors.surface },
  rule: { color: colors.muted, fontSize: 13, lineHeight: 21 },
  ruleMet: { color: '#166534', fontSize: 13, fontWeight: '800', lineHeight: 21 },
  error: { color: colors.danger, fontSize: 14, lineHeight: 20, marginTop: 12 },
  success: { color: colors.primaryDark, fontSize: 14, lineHeight: 20, marginTop: 12 },
  button: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: 14, justifyContent: 'center', marginTop: 18, minHeight: 52, paddingHorizontal: 18 },
  buttonText: { color: colors.white, fontSize: 16, fontWeight: '800' },
});
