import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { BottomNavigation } from '../../navigation/BottomNavigation';
import { colors } from '../../theme/colors';
import { useProfileSettings } from './hooks/useProfileSettings';
import type { GoalType, ProfileSettings, UnitsSystem } from './profileTypes';
import { signOut } from './services/profileService';

const kilogramsToPounds = 2.2046226218;
const centimetersToInches = 0.3937007874;
const defaultCalorieTarget = 2000;
const defaultProteinTarget = 100;

const goals: Array<{ label: string; note: string; value: GoalType }> = [
  { label: 'General wellness', note: 'Build healthier daily habits', value: 'general_wellness' },
  { label: 'Fat loss', note: 'Reduce body fat sustainably', value: 'fat_loss' },
  { label: 'Maintain weight', note: 'Keep your current weight steady', value: 'maintenance' },
  { label: 'Build muscle', note: 'Support strength and growth', value: 'muscle_gain' },
  { label: 'Performance', note: 'Fuel training and recovery', value: 'performance' },
];

function displayNumber(value: number | null, multiplier = 1) {
  if (value === null) return '';
  const converted = value * multiplier;
  return String(Math.round(converted * 10) / 10);
}

function optionalPositiveNumber(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function initialsFor(name: string, email: string) {
  if (name.trim()) {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  }
  return email.charAt(0).toUpperCase() || '?';
}

export function ProfileScreen() {
  const { email, isLoading, isSaving, loadError, refresh, save, settings } = useProfileSettings();
  const [displayName, setDisplayName] = useState('');
  const [units, setUnits] = useState<UnitsSystem>('metric');
  const [height, setHeight] = useState('');
  const [currentWeight, setCurrentWeight] = useState('');
  const [targetWeight, setTargetWeight] = useState('');
  const [goalType, setGoalType] = useState<GoalType>('general_wellness');
  const [calorieTarget, setCalorieTarget] = useState(String(defaultCalorieTarget));
  const [proteinTarget, setProteinTarget] = useState(String(defaultProteinTarget));
  const [feedback, setFeedback] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);

  useEffect(() => {
    if (!settings) return;
    const weightMultiplier = settings.units === 'imperial' ? kilogramsToPounds : 1;
    const heightMultiplier = settings.units === 'imperial' ? centimetersToInches : 1;
    setDisplayName(settings.displayName);
    setUnits(settings.units);
    setHeight(displayNumber(settings.heightCm, heightMultiplier));
    setCurrentWeight(displayNumber(settings.currentWeightKg, weightMultiplier));
    setTargetWeight(displayNumber(settings.targetWeightKg, weightMultiplier));
    setGoalType(settings.goalType);
    setCalorieTarget(String(settings.calorieTarget ?? defaultCalorieTarget));
    setProteinTarget(String(settings.proteinTarget ?? defaultProteinTarget));
    setFeedback(null);
  }, [settings]);

  const changeUnits = (nextUnits: UnitsSystem) => {
    if (nextUnits === units) return;
    const weightFactor = nextUnits === 'imperial' ? kilogramsToPounds : 1 / kilogramsToPounds;
    const heightFactor = nextUnits === 'imperial' ? centimetersToInches : 1 / centimetersToInches;
    const convert = (value: string, factor: number) => {
      const parsed = Number(value);
      return value.trim() && Number.isFinite(parsed) ? String(Math.round(parsed * factor * 10) / 10) : value;
    };
    setHeight((value) => convert(value, heightFactor));
    setCurrentWeight((value) => convert(value, weightFactor));
    setTargetWeight((value) => convert(value, weightFactor));
    setUnits(nextUnits);
  };

  const saveSettings = async () => {
    const heightValue = optionalPositiveNumber(height);
    const currentWeightValue = optionalPositiveNumber(currentWeight);
    const targetWeightValue = optionalPositiveNumber(targetWeight);
    const calories = optionalPositiveNumber(calorieTarget);
    const protein = optionalPositiveNumber(proteinTarget);

    if (!displayName.trim()) {
      setFeedback({ kind: 'error', text: 'Enter your display name.' });
      return;
    }
    if (
      heightValue === undefined ||
      currentWeightValue === undefined ||
      targetWeightValue === undefined ||
      calories === undefined ||
      protein === undefined
    ) {
      setFeedback({ kind: 'error', text: 'Enter positive numbers for your measurements and targets.' });
      return;
    }
    if (calories === null || protein === null) {
      setFeedback({ kind: 'error', text: 'Calorie and protein targets are required.' });
      return;
    }

    const weightDivisor = units === 'imperial' ? kilogramsToPounds : 1;
    const heightDivisor = units === 'imperial' ? centimetersToInches : 1;
    const nextSettings: ProfileSettings = {
      calorieTarget: Math.round(calories),
      currentWeightKg: currentWeightValue === null ? null : Math.round((currentWeightValue / weightDivisor) * 100) / 100,
      displayName: displayName.trim(),
      goalType,
      heightCm: heightValue === null ? null : Math.round((heightValue / heightDivisor) * 100) / 100,
      proteinTarget: Math.round(protein * 10) / 10,
      targetWeightKg: targetWeightValue === null ? null : Math.round((targetWeightValue / weightDivisor) * 100) / 100,
      units,
    };

    setFeedback(null);
    try {
      await save(nextSettings);
      setFeedback({ kind: 'success', text: 'Profile and targets updated.' });
    } catch (error) {
      setFeedback({
        kind: 'error',
        text: error instanceof Error ? error.message : 'Your settings could not be saved.',
      });
    }
  };

  const signOutUser = async () => {
    setFeedback(null);
    try {
      await signOut();
    } catch (error) {
      setFeedback({
        kind: 'error',
        text: error instanceof Error ? error.message : 'You could not be signed out.',
      });
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        <Text style={styles.pageEyebrow}>ACCOUNT</Text>
        <Text style={styles.pageTitle}>Profile & settings</Text>
        <Text style={styles.pageSubtitle}>Manage your personal details and daily nutrition goals.</Text>

        {isLoading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.stateText}>Loading your profile…</Text>
          </View>
        ) : null}

        {!isLoading && loadError ? (
          <View style={styles.stateCard}>
            <Text style={styles.errorText}>{loadError}</Text>
            <Pressable onPress={() => void refresh()} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Try again</Text>
            </Pressable>
          </View>
        ) : null}

        {!isLoading && !loadError && settings ? (
          <>
            <View style={styles.identityCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initialsFor(displayName, email)}</Text>
              </View>
              <View style={styles.identityCopy}>
                <Text style={styles.identityName}>{displayName || 'Your profile'}</Text>
                <Text style={styles.identityEmail}>{email}</Text>
              </View>
            </View>

            <SettingsSection title="Personal details" subtitle="How your name and measurements appear in the app.">
              <Field label="Display name">
                <TextInput
                  autoCapitalize="words"
                  onChangeText={setDisplayName}
                  placeholder="Your name"
                  placeholderTextColor={colors.muted}
                  style={styles.input}
                  value={displayName}
                />
              </Field>
              <Field label="Email address">
                <View style={styles.readOnlyInput}>
                  <Text numberOfLines={1} style={styles.readOnlyText}>{email}</Text>
                  <Text style={styles.readOnlyBadge}>READ ONLY</Text>
                </View>
              </Field>
              <Field label="Preferred units">
                <View style={styles.segmentedControl}>
                  {(['metric', 'imperial'] as const).map((option) => (
                    <Pressable
                      accessibilityRole="radio"
                      accessibilityState={{ checked: units === option }}
                      key={option}
                      onPress={() => changeUnits(option)}
                      style={[styles.segment, units === option && styles.activeSegment]}
                    >
                      <Text style={[styles.segmentText, units === option && styles.activeSegmentText]}>
                        {option === 'metric' ? 'Metric' : 'Imperial'}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </Field>
              <View style={styles.twoColumnRow}>
                <View style={styles.column}>
                  <Field label={`Height (${units === 'metric' ? 'cm' : 'in'})`}>
                    <TextInput
                      keyboardType="decimal-pad"
                      onChangeText={setHeight}
                      placeholder={units === 'metric' ? '175' : '69'}
                      placeholderTextColor={colors.muted}
                      style={styles.input}
                      value={height}
                    />
                  </Field>
                </View>
                <View style={styles.column}>
                  <Field label={`Current weight (${units === 'metric' ? 'kg' : 'lb'})`}>
                    <TextInput
                      keyboardType="decimal-pad"
                      onChangeText={setCurrentWeight}
                      placeholder={units === 'metric' ? '75' : '165'}
                      placeholderTextColor={colors.muted}
                      style={styles.input}
                      value={currentWeight}
                    />
                  </Field>
                </View>
              </View>
            </SettingsSection>

            <SettingsSection title="Fitness goal" subtitle="This helps frame future recommendations.">
              <View style={styles.goalList}>
                {goals.map((goal) => (
                  <Pressable
                    accessibilityRole="radio"
                    accessibilityState={{ checked: goalType === goal.value }}
                    key={goal.value}
                    onPress={() => setGoalType(goal.value)}
                    style={[styles.goalCard, goalType === goal.value && styles.activeGoalCard]}
                  >
                    <View style={[styles.radio, goalType === goal.value && styles.activeRadio]}>
                      {goalType === goal.value ? <View style={styles.radioDot} /> : null}
                    </View>
                    <View style={styles.goalCopy}>
                      <Text style={[styles.goalLabel, goalType === goal.value && styles.activeGoalLabel]}>{goal.label}</Text>
                      <Text style={styles.goalNote}>{goal.note}</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
              <Field label={`Target weight (${units === 'metric' ? 'kg' : 'lb'})`}>
                <TextInput
                  keyboardType="decimal-pad"
                  onChangeText={setTargetWeight}
                  placeholder={units === 'metric' ? 'Optional' : 'Optional'}
                  placeholderTextColor={colors.muted}
                  style={styles.input}
                  value={targetWeight}
                />
              </Field>
            </SettingsSection>

            <SettingsSection title="Daily nutrition targets" subtitle="Used by your dashboard and Meals progress bars.">
              <View style={styles.targetRow}>
                <View style={styles.targetField}>
                  <Text style={styles.targetIcon}>C</Text>
                  <View style={styles.targetInputCopy}>
                    <Text style={styles.fieldLabel}>Calories</Text>
                    <View style={styles.unitInput}>
                      <TextInput
                        keyboardType="number-pad"
                        onChangeText={setCalorieTarget}
                        placeholder="2000"
                        placeholderTextColor={colors.muted}
                        style={styles.unitTextInput}
                        value={calorieTarget}
                      />
                      <Text style={styles.inputUnit}>kcal</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.targetField}>
                  <Text style={[styles.targetIcon, styles.proteinIcon]}>P</Text>
                  <View style={styles.targetInputCopy}>
                    <Text style={styles.fieldLabel}>Protein</Text>
                    <View style={styles.unitInput}>
                      <TextInput
                        keyboardType="decimal-pad"
                        onChangeText={setProteinTarget}
                        placeholder="100"
                        placeholderTextColor={colors.muted}
                        style={styles.unitTextInput}
                        value={proteinTarget}
                      />
                      <Text style={styles.inputUnit}>g</Text>
                    </View>
                  </View>
                </View>
              </View>
            </SettingsSection>

            {feedback ? <Text style={feedback.kind === 'error' ? styles.errorText : styles.successText}>{feedback.text}</Text> : null}

            <Pressable
              disabled={isSaving}
              onPress={() => void saveSettings()}
              style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]}
            >
              {isSaving ? <ActivityIndicator color={colors.white} /> : <Text style={styles.saveButtonText}>Save settings</Text>}
            </Pressable>

            <View style={styles.accountSection}>
              <Text style={styles.accountSectionTitle}>Account</Text>
              <Pressable onPress={() => void signOutUser()} style={({ pressed }) => [styles.signOutButton, pressed && styles.pressed]}>
                <Text style={styles.signOutText}>Sign out</Text>
              </Pressable>
            </View>
          </>
        ) : null}
      </ScrollView>
      <BottomNavigation active="profile" />
    </View>
  );
}

type SettingsSectionProps = React.PropsWithChildren<{
  subtitle: string;
  title: string;
}>;

function SettingsSection({ children, subtitle, title }: SettingsSectionProps) {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionSubtitle}>{subtitle}</Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
}

type FieldProps = React.PropsWithChildren<{ label: string }>;

function Field({ children, label }: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background, flex: 1 },
  scroll: { flex: 1 },
  container: { alignSelf: 'center', maxWidth: 680, padding: 22, paddingBottom: 116, width: '100%' },
  pageEyebrow: { color: colors.primary, fontSize: 11, fontWeight: '800', letterSpacing: 1.2, marginTop: 10 },
  pageTitle: { color: colors.ink, fontSize: 30, fontWeight: '800', marginTop: 7 },
  pageSubtitle: { color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: 5 },
  stateCard: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: 1, gap: 12, marginTop: 24, padding: 28 },
  stateText: { color: colors.muted, fontSize: 14 },
  retryButton: { backgroundColor: colors.surfaceMuted, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9 },
  retryButtonText: { color: colors.primaryDark, fontSize: 13, fontWeight: '800' },
  identityCard: { alignItems: 'center', backgroundColor: '#E8F6EC', borderColor: '#C8E5D0', borderRadius: 22, borderWidth: 1, flexDirection: 'row', marginTop: 22, padding: 18 },
  avatar: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: 30, height: 60, justifyContent: 'center', width: 60 },
  avatarText: { color: colors.white, fontSize: 18, fontWeight: '800' },
  identityCopy: { flex: 1, marginLeft: 14 },
  identityName: { color: colors.ink, fontSize: 19, fontWeight: '800' },
  identityEmail: { color: colors.muted, fontSize: 13, marginTop: 4 },
  sectionCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 20, borderWidth: 1, marginTop: 16, padding: 18 },
  sectionTitle: { color: colors.ink, fontSize: 18, fontWeight: '800' },
  sectionSubtitle: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 4 },
  sectionContent: { gap: 16, marginTop: 18 },
  field: { gap: 7 },
  fieldLabel: { color: colors.ink, fontSize: 12, fontWeight: '800' },
  input: { backgroundColor: colors.background, borderColor: colors.border, borderRadius: 12, borderWidth: 1, color: colors.ink, fontSize: 15, minHeight: 50, paddingHorizontal: 14, paddingVertical: 13 },
  readOnlyInput: { alignItems: 'center', backgroundColor: colors.surfaceMuted, borderColor: colors.border, borderRadius: 12, borderWidth: 1, flexDirection: 'row', minHeight: 50, paddingHorizontal: 14 },
  readOnlyText: { color: colors.muted, flex: 1, fontSize: 14 },
  readOnlyBadge: { color: colors.muted, fontSize: 9, fontWeight: '800', letterSpacing: 0.7, marginLeft: 8 },
  segmentedControl: { backgroundColor: colors.surfaceMuted, borderRadius: 12, flexDirection: 'row', padding: 4 },
  segment: { alignItems: 'center', borderRadius: 9, flex: 1, justifyContent: 'center', minHeight: 40 },
  activeSegment: { backgroundColor: colors.primary },
  segmentText: { color: colors.muted, fontSize: 13, fontWeight: '800' },
  activeSegmentText: { color: colors.white },
  twoColumnRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  column: { flexBasis: 160, flexGrow: 1 },
  goalList: { gap: 8 },
  goalCard: { alignItems: 'center', backgroundColor: colors.background, borderColor: colors.border, borderRadius: 13, borderWidth: 1, flexDirection: 'row', padding: 13 },
  activeGoalCard: { backgroundColor: '#EFF8F1', borderColor: colors.primary },
  radio: { alignItems: 'center', borderColor: colors.border, borderRadius: 10, borderWidth: 2, height: 20, justifyContent: 'center', width: 20 },
  activeRadio: { borderColor: colors.primary },
  radioDot: { backgroundColor: colors.primary, borderRadius: 5, height: 10, width: 10 },
  goalCopy: { flex: 1, marginLeft: 11 },
  goalLabel: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  activeGoalLabel: { color: colors.primaryDark },
  goalNote: { color: colors.muted, fontSize: 11, marginTop: 3 },
  targetRow: { gap: 12 },
  targetField: { alignItems: 'center', backgroundColor: colors.background, borderColor: colors.border, borderRadius: 14, borderWidth: 1, flexDirection: 'row', padding: 12 },
  targetIcon: { backgroundColor: '#DDF0E2', borderRadius: 18, color: colors.primaryDark, fontSize: 12, fontWeight: '900', height: 36, lineHeight: 36, textAlign: 'center', width: 36 },
  proteinIcon: { backgroundColor: '#DDF4F1', color: '#237B70' },
  targetInputCopy: { flex: 1, marginLeft: 12 },
  unitInput: { alignItems: 'center', flexDirection: 'row', marginTop: 4 },
  unitTextInput: { color: colors.ink, flex: 1, fontSize: 21, fontWeight: '800', paddingVertical: 3 },
  inputUnit: { color: colors.muted, fontSize: 12, marginLeft: 8 },
  errorText: { color: colors.danger, fontSize: 13, lineHeight: 19, marginTop: 14, textAlign: 'center' },
  successText: { color: colors.primaryDark, fontSize: 13, lineHeight: 19, marginTop: 14, textAlign: 'center' },
  saveButton: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: 14, justifyContent: 'center', marginTop: 16, minHeight: 54 },
  saveButtonText: { color: colors.white, fontSize: 15, fontWeight: '800' },
  accountSection: { marginTop: 28 },
  accountSectionTitle: { color: colors.ink, fontSize: 16, fontWeight: '800' },
  signOutButton: { alignItems: 'center', borderColor: '#F2C7C1', borderRadius: 13, borderWidth: 1, justifyContent: 'center', marginTop: 10, minHeight: 50 },
  signOutText: { color: colors.danger, fontSize: 14, fontWeight: '800' },
  pressed: { opacity: 0.8 },
});
