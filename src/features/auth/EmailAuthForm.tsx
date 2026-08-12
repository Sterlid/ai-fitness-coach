import { createElement, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
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
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screen}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={styles.screen}
      >
        <View style={styles.authStack}>
          {mode === 'sign-in' ? (
            <View style={styles.logoSlot}>
              <Image
                accessibilityLabel="Slacks or Stacks logo"
                resizeMode="contain"
                source={require('../../../assets/images/logo.png')}
                style={styles.logo}
              />
            </View>
          ) : null}

          <View style={styles.authContent}>
            {mode === 'forgot-password' ? <Text style={styles.eyebrow}>ACCOUNT RECOVERY</Text> : null}
            <Text style={styles.title}>
              {mode === 'sign-up'
                ? 'Create Your Account'
                : mode === 'sign-in'
                  ? 'Welcome Back!'
                  : 'Reset Your Password'}
            </Text>
            <Text style={styles.subtitle}>
              {mode === 'sign-in'
                ? 'Your smarter way to manage fitness.'
                : mode === 'forgot-password'
                  ? 'Enter the email used for registration to reset your password.'
                  : 'Create an account to log meals and get workouts that adapt to you.'}
            </Text>

            <View style={styles.form}>
              {mode === 'sign-up' ? (
                <>
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Full name</Text>
                    <TextInput
                      autoCapitalize="words"
                      autoComplete="name"
                      onChangeText={setFullName}
                      placeholder="Enter your full name"
                      placeholderTextColor={colors.muted}
                      style={styles.input}
                      value={fullName}
                    />
                  </View>
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Date of birth</Text>
                    <DateOfBirthField
                      invalid={dateOfBirthIsTooEarly}
                      onChange={setDateOfBirth}
                      value={dateOfBirth}
                    />
                    {dateOfBirthIsTooEarly ? <Text style={styles.fieldError}>{dateTooEarlyMessage}</Text> : null}
                  </View>
                </>
              ) : null}

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Email address</Text>
                <TextInput
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  placeholderTextColor={colors.muted}
                  style={styles.input}
                  value={email}
                />
              </View>

              {mode !== 'forgot-password' ? (
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Password</Text>
                  <View style={styles.passwordInputWrap}>
                    <TextInput
                      autoComplete={mode === 'sign-up' ? 'new-password' : 'password'}
                      onChangeText={setPassword}
                      placeholder="Enter your password"
                      placeholderTextColor={colors.muted}
                      secureTextEntry={!isPasswordVisible}
                      style={[styles.input, styles.passwordInput]}
                      value={password}
                    />
                    <Pressable
                      accessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'}
                      accessibilityRole="button"
                      hitSlop={10}
                      onPress={() => setIsPasswordVisible((current) => !current)}
                      style={styles.passwordVisibilityButton}
                    >
                      <View style={styles.eyeIcon}>
                        <View style={styles.eyePupil} />
                        {!isPasswordVisible ? <View style={styles.eyeSlash} /> : null}
                      </View>
                    </Pressable>
                  </View>
                </View>
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
                    <Text style={styles.rememberText}>Remember me</Text>
                  </Pressable>
                  <Pressable onPress={() => onSwitchMode('forgot-password')}>
                    <Text style={styles.forgotPassword}>Forgot Password?</Text>
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
                    {mode === 'sign-in' ? 'Log In' : mode === 'forgot-password' ? 'Send reset link' : 'Create account'}
                  </Text>
                )}
              </Pressable>

              <Pressable
                disabled={isSubmitting}
                onPress={() => onSwitchMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')}
                style={styles.secondaryButton}
              >
                {mode === 'sign-in' ? (
                  <Text style={styles.secondaryPrompt}>
                    Don't have an account? <Text style={styles.secondaryLink}>Sign up</Text>
                  </Text>
                ) : (
                  <Text style={styles.secondaryLink}>Back to sign in</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

type DateOfBirthFieldProps = {
  invalid: boolean;
  value: string;
  onChange: (value: string) => void;
};

function DateOfBirthField({ invalid, value, onChange }: DateOfBirthFieldProps) {
  if (Platform.OS === 'web') {
    return (
      <View style={invalid ? [webDateFieldStyle, webDateFieldInvalidStyle] : webDateFieldStyle}>
        <Text style={value ? webDateValueStyle : webDatePlaceholderStyle}>
          {formatDateForDisplay(value)}
        </Text>
        <View pointerEvents="none" style={webCalendarIcon}>
          <View style={webCalendarIconTop} />
          <View style={webCalendarIconRingLeft} />
          <View style={webCalendarIconRingRight} />
        </View>
        {createElement('input', {
          'aria-label': 'Date of birth',
          'aria-invalid': invalid,
          max: new Date().toISOString().slice(0, 10),
          min: minimumDateOfBirth,
          onChange: (event: { target: { value: string } }) => onChange(event.target.value),
          onClick: openWebDatePicker,
          style: webDatePickerInputStyle,
          type: 'date',
          value,
        })}
      </View>
    );
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

function openWebDatePicker(event: { currentTarget: { focus: () => void; showPicker?: () => void } }) {
  event.currentTarget.focus();

  try {
    event.currentTarget.showPicker?.();
  } catch {
    // Browsers without showPicker still retain the native calendar-icon behavior.
  }
}

function formatDateForDisplay(value: string) {
  if (!value) return 'dd/mm/yyyy';
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

const webDateFieldStyle = {
  backgroundColor: '#FFFFFF',
  borderColor: '#E0DEE6',
  borderRadius: 14,
  borderStyle: 'solid' as const,
  borderWidth: 1,
  boxSizing: 'border-box' as const,
  flexDirection: 'row' as const,
  height: 54,
  alignItems: 'center' as const,
  justifyContent: 'space-between' as const,
  paddingHorizontal: 16,
  position: 'relative' as const,
  width: '100%' as const,
};

const webDateFieldInvalidStyle = {
  borderColor: colors.danger,
  borderWidth: 2,
};

const webDateValueStyle = {
  color: colors.ink,
  fontFamily: 'inherit',
  fontSize: 16,
  fontWeight: '400' as const,
};

const webDatePlaceholderStyle = {
  ...webDateValueStyle,
  color: colors.muted,
};

const webDatePickerInputStyle = {
  bottom: 0,
  cursor: 'pointer',
  height: '100%',
  left: 0,
  opacity: 0,
  position: 'absolute' as const,
  right: 0,
  top: 0,
  width: '100%' as const,
};

const webCalendarIcon = {
  borderColor: colors.ink,
  borderRadius: 3,
  borderWidth: 2,
  height: 19,
  position: 'relative' as const,
  width: 20,
};

const webCalendarIconTop = {
  backgroundColor: colors.ink,
  height: 2,
  left: 0,
  position: 'absolute' as const,
  right: 0,
  top: 4,
};

const webCalendarIconRingLeft = {
  backgroundColor: colors.ink,
  borderRadius: 2,
  height: 5,
  position: 'absolute' as const,
  right: 11,
  top: -4,
  width: 3,
};

const webCalendarIconRingRight = {
  backgroundColor: colors.ink,
  borderRadius: 2,
  height: 5,
  position: 'absolute' as const,
  right: 3,
  top: -4,
  width: 3,
};

const styles = StyleSheet.create({
  screen: { backgroundColor: '#F5F4FA', flex: 1 },
  container: {
    alignItems: 'center',
    backgroundColor: '#F5F4FA',
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 32,
  },
  authStack: { maxWidth: 420, transform: [{ translateY: -24 }], width: '100%' },
  logoSlot: {
    alignItems: 'center',
    alignSelf: 'center',
    height: 112,
    justifyContent: 'center',
    marginBottom: 28,
    overflow: 'hidden',
    width: 180,
  },
  authContent: { width: '100%' },
  logo: {
    height: 250,
    width: 250,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginBottom: 10,
    textAlign: 'center',
  },
  title: { color: '#101010', fontSize: 32, fontWeight: '700', textAlign: 'center' },
  subtitle: { color: '#77727E', fontSize: 14, lineHeight: 19, marginTop: 6, textAlign: 'center' },
  form: { gap: 16, marginTop: 28 },
  fieldGroup: { gap: 8 },
  fieldLabel: { color: '#181818', fontSize: 14, fontWeight: '600' },
  fieldError: { color: colors.danger, fontSize: 13, lineHeight: 19 },
  input: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E0DEE6',
    borderRadius: 14,
    borderWidth: 1,
    color: '#252329',
    fontSize: 16,
    minHeight: 54,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  passwordInputWrap: { position: 'relative' },
  passwordInput: { paddingRight: 52, width: '100%' },
  passwordVisibilityButton: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    position: 'absolute',
    right: 10,
    top: 0,
    width: 38,
  },
  eyeIcon: {
    alignItems: 'center',
    borderColor: colors.muted,
    borderRadius: 10,
    borderWidth: 1.5,
    height: 12,
    justifyContent: 'center',
    width: 19,
  },
  eyePupil: { backgroundColor: colors.muted, borderRadius: 3, height: 5, width: 5 },
  eyeSlash: {
    backgroundColor: colors.muted,
    height: 1.5,
    position: 'absolute',
    transform: [{ rotate: '-40deg' }],
    width: 24,
  },
  invalidInput: { borderColor: colors.danger, borderWidth: 2 },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 28,
    justifyContent: 'center',
    minHeight: 54,
  },
  primaryButtonText: { color: colors.white, fontSize: 16, fontWeight: '800' },
  secondaryButton: { alignItems: 'center', marginTop: 8 },
  secondaryPrompt: { color: '#6D6872', fontSize: 14, textAlign: 'center' },
  secondaryLink: { color: colors.primaryDark, fontSize: 14, fontWeight: '800', textAlign: 'center' },
  errorText: { color: colors.danger, fontSize: 14, lineHeight: 20 },
  successText: { color: colors.primaryDark, fontSize: 14, lineHeight: 20 },
  rememberRow: { alignItems: 'center', flexDirection: 'row', gap: 10, paddingVertical: 2 },
  signInOptions: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  checkbox: { alignItems: 'center', borderColor: colors.border, borderRadius: 5, borderWidth: 1, height: 20, justifyContent: 'center', width: 20 },
  checkboxSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkboxMark: { color: colors.white, fontSize: 14, fontWeight: '800', lineHeight: 18 },
  rememberText: { color: '#6D6872', fontSize: 14 },
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
