import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { supabase } from '../../lib/supabase';
import { colors } from '../../theme/colors';

export function EmailAuthForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (mode: 'sign-in' | 'sign-up') => {
    if (!supabase || !email || password.length < 8) {
      Alert.alert('Check your details', 'Enter an email and a password of at least 8 characters.');
      return;
    }

    setIsSubmitting(true);
    const result =
      mode === 'sign-in'
        ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
        : await supabase.auth.signUp({ email: email.trim(), password });
    setIsSubmitting(false);

    if (result.error) {
      Alert.alert('Authentication failed', result.error.message);
      return;
    }

    if (mode === 'sign-up' && !result.data.session) {
      Alert.alert('Check your inbox', 'Confirm your email address to finish creating your account.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>AI FITNESS COACH</Text>
      <Text style={styles.title}>Build a better day.</Text>
      <Text style={styles.subtitle}>Log meals quickly and get a workout that adapts to you.</Text>
      <View style={styles.form}>
        <TextInput
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor={colors.muted}
          style={styles.input}
          value={email}
        />
        <TextInput
          autoComplete="password"
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor={colors.muted}
          secureTextEntry
          style={styles.input}
          value={password}
        />
        <Pressable
          disabled={isSubmitting}
          onPress={() => void submit('sign-in')}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.primaryButtonText}>Sign in</Text>
          )}
        </Pressable>
        <Pressable disabled={isSubmitting} onPress={() => void submit('sign-up')}>
          <Text style={styles.secondaryButtonText}>Create an account</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 28 },
  eyebrow: { color: colors.primary, fontSize: 12, fontWeight: '800', letterSpacing: 1.4 },
  title: { color: colors.ink, fontSize: 36, fontWeight: '800', marginTop: 10 },
  subtitle: { color: colors.muted, fontSize: 17, lineHeight: 25, marginTop: 10 },
  form: { gap: 14, marginTop: 32 },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 14,
    minHeight: 52,
    justifyContent: 'center',
  },
  primaryButtonText: { color: colors.white, fontSize: 16, fontWeight: '800' },
  secondaryButtonText: { color: colors.primaryDark, fontSize: 15, fontWeight: '700', textAlign: 'center' },
  pressed: { opacity: 0.82 },
});

