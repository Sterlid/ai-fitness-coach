import { createElement, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { setRememberMePreference, supabase } from '../../lib/supabase';
import { getAuthRedirectUrl } from '../../config/env';
import { colors } from '../../theme/colors';

export type AuthMode = 'sign-in' | 'sign-up' | 'forgot-password';

const minimumDateOfBirth = '1900-01-01';
const dateTooEarlyMessage = 'Unless you have a time machine, please choose a date from 1900 onward.';

type EmailAuthFormProps = {
  mode: AuthMode;
  onSwitchMode: (mode: AuthMode) => void;
};

export function EmailAuthForm({ mode, onSwitchMode }: EmailAuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);
  const passwordRules = [
    { label: 'At least 12 characters', met: password.length >= 12 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'One lowercase letter', met: /[a-z]/.test(password) },
    { label: 'One number or symbol', met: /[0-9]/.test(password) || /[^A-Za-z0-9\s]/.test(password) },
  ];
  const isStrongPassword = passwordRules.every((rule) => rule.met);
  const dateOfBirthIsTooEarly =
    mode === 'sign-up' && /^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth) && dateOfBirth < minimumDateOfBirth;

  const submit = async (mode: AuthMode) => {
    const normalizedEmail = email.trim();

    if (!supabase) {
      setFeedback({ kind: 'error', text: 'Supabase is not configured for this environment.' });
      return;
    }

    if (mode === 'forgot-password' && !normalizedEmail) {
      setFeedback({ kind: 'error', text: 'Enter your email address to request a reset link.' });
      return;
    }

    if (mode === 'sign-in' && (!normalizedEmail || !password)) {
      setFeedback({ kind: 'error', text: 'Enter both your email and password.' });
      return;
    }

    if (mode === 'sign-up' && (!fullName.trim() || !dateOfBirth || !normalizedEmail || !password)) {
      setFeedback({
        kind: 'error',
        text: 'Complete your name, date of birth, email, and password fields.',
      });
      return;
    }

    if (mode === 'sign-up' && !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
      setFeedback({ kind: 'error', text: 'Enter your date of birth as YYYY-MM-DD.' });
      return;
    }

    if (mode === 'sign-up' && dateOfBirth < '1900-01-01') {
      setFeedback({ kind: 'error', text: dateTooEarlyMessage });
      return;
    }

    if (mode === 'sign-up' && !isStrongPassword) {
      setFeedback({ kind: 'error', text: 'Choose a stronger password using all four requirements below.' });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);
    setRememberMePreference(mode === 'sign-in' ? rememberMe : true);

    try {
      if (mode === 'forgot-password') {
        const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
          redirectTo: getAuthRedirectUrl('/reset-password'),
        });

        if (error) {
          setFeedback({ kind: 'error', text: error.message });
          return;
        }

        setFeedback({ kind: 'success', text: 'Check your inbox for a secure password reset link.' });
        return;
      }

      const result =
        mode === 'sign-in'
          ? await supabase.auth.signInWithPassword({ email: normalizedEmail, password })
          : await supabase.auth.signUp({
              email: normalizedEmail,
              password,
              options: {
                emailRedirectTo: getAuthRedirectUrl(),
                data: {
                  display_name: fullName.trim(),
                  date_of_birth: dateOfBirth,
                  birth_year: Number(dateOfBirth.slice(0, 4)),
                },
              },
            });

      if (result.error) {
        const isDuplicateEmail =
          mode === 'sign-up' && result.error.message.toLowerCase().includes('already registered');
        const isInvalidCredentials =
          mode === 'sign-in' &&
          (result.error.code === 'invalid_credentials' || result.error.message.toLowerCase() === 'invalid login credentials');
        setFeedback({
          kind: 'error',
          text: isDuplicateEmail
            ? 'An account with this email already exists. Try signing in instead.'
            : isInvalidCredentials
            ? 'The email or password is incorrect.'
            : result.error.message,
        });
        return;
      }

      if (mode === 'sign-up' && result.data.user?.identities?.length === 0) {
        setFeedback({
          kind: 'error',
          text: 'An account with this email already exists. Try signing in instead.',
        });
        return;
      }

      if (mode === 'sign-up' && !result.data.session) {
        setFeedback({
          kind: 'success',
          text: 'Check your inbox to confirm your email address and finish creating your account.',
        });
      }
    } catch (error) {
      setFeedback({
        kind: 'error',
        text: error instanceof Error ? error.message : 'Something went wrong. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={mode === 'sign-up' ? [styles.container, styles.signUpContainer] : styles.container}>
      <Text style={mode === 'sign-up' ? [styles.eyebrow, styles.signUpEyebrow] : styles.eyebrow}>
        {mode === 'sign-in' ? 'AI FITNESS COACH' : mode === 'forgot-password' ? 'ACCOUNT RECOVERY' : 'YOUR STARTING POINT'}
      </Text>
      <Text style={styles.title}>
        {mode === 'sign-in' ? 'Welcome back.' : mode === 'forgot-password' ? 'Reset your password.' : 'Create your account.'}
      </Text>
      <Text style={styles.subtitle}>
        {mode === 'sign-in'
          ? 'Sign in to continue your fitness journey.'
          : mode === 'forgot-password'
            ? 'Enter your email and we’ll send you a secure reset link.'
            : 'Create an account to log meals and get workouts that adapt to you.'}
      </Text>
      <View style={styles.form}>
        {mode === 'sign-up' ? (
          <>
            <TextInput
              autoCapitalize="words"
              autoComplete="name"
              onChangeText={setFullName}
              placeholder="Full name"
              placeholderTextColor={colors.muted}
              style={styles.input}
              value={fullName}
            />
            <Text style={styles.fieldLabel}>Date of birth</Text>
            <DateOfBirthField invalid={dateOfBirthIsTooEarly} value={dateOfBirth} onChange={setDateOfBirth} />
            {dateOfBirthIsTooEarly ? <Text style={styles.fieldError}>{dateTooEarlyMessage}</Text> : null}
          </>
        ) : null}
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
        {mode !== 'forgot-password' ? (
          <TextInput
            autoComplete={mode === 'sign-up' ? 'new-password' : 'password'}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor={colors.muted}
            secureTextEntry
            style={styles.input}
            value={password}
          />
        ) : null}
        {mode === 'sign-up' ? (
          <View style={styles.passwordChecker}>
            <Text style={styles.passwordCheckerTitle}>
              Password strength: {isStrongPassword ? 'Strong' : password.length === 0 ? 'Not set' : 'Needs work'}
            </Text>
            {passwordRules.map((rule) => (
              <View
                key={rule.label}
                style={[styles.passwordRuleRow, rule.met ? styles.passwordRuleRowMet : styles.passwordRuleRowUnmet]}
              >
                <Text style={rule.met ? styles.passwordRuleMet : styles.passwordRule}>
                  {rule.met ? '✓' : '○'} {rule.label}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
        {mode === 'sign-in' ? (
          <View style={styles.signInOptions}>
            <Pressable onPress={() => setRememberMe((current) => !current)} style={styles.rememberRow}>
              <View style={[styles.checkbox, rememberMe && styles.checkboxSelected]}>
                {rememberMe ? <Text style={styles.checkboxMark}>✓</Text> : null}
              </View>
              <Text style={styles.rememberText}>Remember me on this device</Text>
            </Pressable>
            <Pressable onPress={() => onSwitchMode('forgot-password')}>
              <Text style={styles.forgotPassword}>Forgot password?</Text>
            </Pressable>
          </View>
        ) : null}
        {feedback ? (
          <Text style={feedback.kind === 'error' ? styles.errorText : styles.successText}>
            {feedback.text}
          </Text>
        ) : null}
        <Pressable
          disabled={isSubmitting}
          onPress={() => void submit(mode)}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.primaryButtonText}>
              {mode === 'sign-in' ? 'Sign in' : mode === 'forgot-password' ? 'Send reset link' : 'Create account'}
            </Text>
          )}
        </Pressable>
        <Pressable
          disabled={isSubmitting}
          onPress={() => onSwitchMode(mode === 'sign-up' ? 'sign-in' : 'sign-in')}
        >
          <Text style={styles.secondaryButtonText}>
            {mode === 'sign-in' ? 'Create an account' : 'Back to sign in'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

type DateOfBirthFieldProps = {
  invalid: boolean;
  value: string;
  onChange: (value: string) => void;
};

function DateOfBirthField({ invalid, value, onChange }: DateOfBirthFieldProps) {
  if (Platform.OS === 'web') {
    return createElement('input', {
      'aria-label': 'Date of birth',
      'aria-invalid': invalid,
      max: new Date().toISOString().slice(0, 10),
      min: minimumDateOfBirth,
      onChange: (event: { target: { value: string } }) => onChange(event.target.value),
      style: invalid ? { ...webDateInputStyle, ...webDateInputInvalidStyle } : webDateInputStyle,
      type: 'date',
      value,
    });
  }

  return (
    <TextInput
      autoCapitalize="none"
      autoComplete="birthdate-full"
      keyboardType="numbers-and-punctuation"
      onChangeText={onChange}
      placeholder="Date of birth (YYYY-MM-DD)"
      placeholderTextColor={colors.muted}
      style={[styles.input, invalid && styles.invalidInput]}
      value={value}
    />
  );
}

const webDateInputStyle = {
  appearance: 'auto',
  backgroundColor: colors.surface,
  borderColor: colors.border,
  borderRadius: 14,
  borderStyle: 'solid',
  borderWidth: 1,
  boxSizing: 'border-box',
  color: colors.ink,
  fontFamily: 'inherit',
  fontSize: 16,
  fontWeight: '400',
  height: 52,
  lineHeight: '20px',
  padding: '15px 16px',
  WebkitAppearance: 'auto',
  width: '100%',
};

const webDateInputInvalidStyle = {
  borderColor: colors.danger,
  borderWidth: 2,
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 28 },
  eyebrow: { color: colors.primary, fontSize: 12, fontWeight: '800', letterSpacing: 1.4 },
  signUpContainer: { backgroundColor: colors.surfaceMuted, borderRadius: 24, paddingVertical: 28 },
  signUpEyebrow: { color: colors.primaryDark },
  title: { color: colors.ink, fontSize: 36, fontWeight: '800', marginTop: 10 },
  subtitle: { color: colors.muted, fontSize: 17, lineHeight: 25, marginTop: 10 },
  form: { gap: 14, marginTop: 32 },
  fieldLabel: { color: colors.ink, fontSize: 14, fontWeight: '700', marginBottom: -6 },
  fieldError: { color: colors.danger, fontSize: 13, lineHeight: 19, marginTop: -8 },
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
  invalidInput: { borderColor: colors.danger, borderWidth: 2 },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 14,
    minHeight: 52,
    justifyContent: 'center',
  },
  primaryButtonText: { color: colors.white, fontSize: 16, fontWeight: '800' },
  secondaryButtonText: { color: colors.primaryDark, fontSize: 15, fontWeight: '700', textAlign: 'center' },
  errorText: { color: colors.danger, fontSize: 14, lineHeight: 20 },
  successText: { color: colors.primaryDark, fontSize: 14, lineHeight: 20 },
  rememberRow: { alignItems: 'center', flexDirection: 'row', gap: 10, paddingVertical: 2 },
  signInOptions: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  checkbox: { alignItems: 'center', borderColor: colors.border, borderRadius: 5, borderWidth: 1, height: 20, justifyContent: 'center', width: 20 },
  checkboxSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkboxMark: { color: colors.white, fontSize: 14, fontWeight: '800', lineHeight: 18 },
  rememberText: { color: colors.muted, fontSize: 14 },
  forgotPassword: { color: colors.primaryDark, fontSize: 14, fontWeight: '700' },
  passwordChecker: { backgroundColor: colors.surface, borderRadius: 12, padding: 14 },
  passwordCheckerTitle: { color: colors.ink, fontSize: 14, fontWeight: '800', marginBottom: 6 },
  passwordRuleRow: { borderRadius: 8, marginTop: 4, paddingHorizontal: 8, paddingVertical: 3 },
  passwordRuleRowMet: { backgroundColor: '#DCFCE7' },
  passwordRuleRowUnmet: { backgroundColor: '#F7FAF7' },
  passwordRule: { color: colors.muted, fontSize: 13, lineHeight: 21 },
  passwordRuleMet: { color: '#166534', fontSize: 13, fontWeight: '800', lineHeight: 21 },
  pressed: { opacity: 0.82 },
});
