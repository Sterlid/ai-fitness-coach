import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { supabase } from '../../lib/supabase';
import { useAuth } from '../../providers/AuthProvider';
import { colors } from '../../theme/colors';

type UnitsSystem = 'metric' | 'imperial';
type GoalType = 'general_wellness' | 'fat_loss' | 'maintenance' | 'muscle_gain' | 'performance';

const goals: Array<{ value: GoalType; label: string; note: string }> = [
  { value: 'general_wellness', label: 'General wellness', note: 'Build healthier daily habits' },
  { value: 'fat_loss', label: 'Fat loss', note: 'Reduce body fat sustainably' },
  { value: 'maintenance', label: 'Maintain weight', note: 'Stay steady and feel good' },
  { value: 'muscle_gain', label: 'Build muscle', note: 'Support strength and growth' },
  { value: 'performance', label: 'Improve performance', note: 'Train for better results' },
];

type OnboardingScreenProps = {
  onComplete: () => void;
};

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const { user } = useAuth();
  const [fullName, setFullName] = useState(String(user?.user_metadata?.display_name ?? ''));
  const [units, setUnits] = useState<UnitsSystem>('metric');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [goal, setGoal] = useState<GoalType>('general_wellness');
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const selectedGoal = useMemo(() => goals.find((item) => item.value === goal), [goal]);

  const saveProfile = async () => {
    if (!supabase || !user) return;

    const heightValue = Number(height);
    const weightValue = Number(weight);

    if (!fullName.trim() || !Number.isFinite(heightValue) || heightValue <= 0 || !Number.isFinite(weightValue) || weightValue <= 0) {
      setFeedback('Add your name, height, and current weight to continue.');
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    const heightCm = units === 'metric' ? heightValue : heightValue * 2.54;
    const currentWeightKg = units === 'metric' ? weightValue : weightValue * 0.453592;
    const birthYear = Number(user.user_metadata?.birth_year) || null;

    try {
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: user.id,
        display_name: fullName.trim(),
        units_system: units,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        birth_year: birthYear,
        height_cm: Number(heightCm.toFixed(2)),
        current_weight_kg: Number(currentWeightKg.toFixed(2)),
        onboarding_completed: true,
      });

      if (profileError) throw profileError;

      const { error: preferencesError } = await supabase.from('food_preferences').upsert(
        { user_id: user.id },
        { onConflict: 'user_id' },
      );

      if (preferencesError) throw preferencesError;

      const { data: existingGoal, error: existingGoalError } = await supabase
        .from('user_goals')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (existingGoalError) throw existingGoalError;

      const goalResult = existingGoal
        ? await supabase.from('user_goals').update({ goal_type: goal, is_active: true }).eq('id', existingGoal.id)
        : await supabase.from('user_goals').insert({ user_id: user.id, goal_type: goal, is_active: true });

      if (goalResult.error) throw goalResult.error;
      onComplete();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Unable to save your profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      <View style={styles.panel}>
        <Text style={styles.eyebrow}>YOUR STARTING POINT</Text>
        <Text style={styles.title}>Let’s make this yours.</Text>
        <Text style={styles.subtitle}>
          A few details help us shape your calorie targets and recommendations.
        </Text>

        <View style={styles.form}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            autoCapitalize="words"
            onChangeText={setFullName}
            placeholder="Your name"
            placeholderTextColor={colors.muted}
            style={styles.input}
            value={fullName}
          />

          <Text style={styles.label}>Preferred units</Text>
          <View style={styles.choiceRow}>
            {(['metric', 'imperial'] as const).map((option) => (
              <Pressable
                key={option}
                onPress={() => setUnits(option)}
                style={[styles.choice, units === option && styles.choiceSelected]}
              >
                <Text style={[styles.choiceText, units === option && styles.choiceTextSelected]}>
                  {option === 'metric' ? 'Metric (cm / kg)' : 'Imperial (in / lb)'}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.twoColumnRow}>
            <View style={styles.column}>
              <Text style={styles.label}>Height ({units === 'metric' ? 'cm' : 'in'})</Text>
              <TextInput
                keyboardType="decimal-pad"
                onChangeText={setHeight}
                placeholder={units === 'metric' ? 'e.g. 175' : 'e.g. 69'}
                placeholderTextColor={colors.muted}
                style={styles.input}
                value={height}
              />
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Weight ({units === 'metric' ? 'kg' : 'lb'})</Text>
              <TextInput
                keyboardType="decimal-pad"
                onChangeText={setWeight}
                placeholder={units === 'metric' ? 'e.g. 75' : 'e.g. 165'}
                placeholderTextColor={colors.muted}
                style={styles.input}
                value={weight}
              />
            </View>
          </View>

          <Text style={styles.label}>What are you working toward?</Text>
          <View style={styles.goalList}>
            {goals.map((item) => (
              <Pressable
                key={item.value}
                onPress={() => setGoal(item.value)}
                style={[styles.goal, goal === item.value && styles.goalSelected]}
              >
                <Text style={[styles.goalLabel, goal === item.value && styles.goalLabelSelected]}>
                  {item.label}
                </Text>
                <Text style={styles.goalNote}>{item.note}</Text>
              </Pressable>
            ))}
          </View>

          {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}

          <Pressable
            disabled={isSaving}
            onPress={() => void saveProfile()}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
          >
            {isSaving ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.primaryButtonText}>Continue to Today</Text>
            )}
          </Pressable>
          <Text style={styles.selectedGoal}>Selected: {selectedGoal?.label}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, padding: 24 },
  panel: { alignSelf: 'center', maxWidth: 720, width: '100%' },
  eyebrow: { color: colors.primary, fontSize: 12, fontWeight: '800', letterSpacing: 1.4, marginTop: 16 },
  title: { color: colors.ink, fontSize: 34, fontWeight: '800', marginTop: 8 },
  subtitle: { color: colors.muted, fontSize: 17, lineHeight: 25, marginTop: 10, maxWidth: 580 },
  form: { gap: 12, marginTop: 28 },
  label: { color: colors.ink, fontSize: 14, fontWeight: '800', marginTop: 6 },
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
  choiceRow: { flexDirection: 'row', gap: 10 },
  choice: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 12, borderWidth: 1, flex: 1, padding: 14 },
  choiceSelected: { backgroundColor: colors.surfaceMuted, borderColor: colors.primary },
  choiceText: { color: colors.muted, fontSize: 14, fontWeight: '700', textAlign: 'center' },
  choiceTextSelected: { color: colors.primaryDark },
  twoColumnRow: { flexDirection: 'row', gap: 12 },
  column: { flex: 1, gap: 8 },
  goalList: { gap: 8 },
  goal: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 14, borderWidth: 1, padding: 14 },
  goalSelected: { backgroundColor: colors.surfaceMuted, borderColor: colors.primary },
  goalLabel: { color: colors.ink, fontSize: 15, fontWeight: '800' },
  goalLabelSelected: { color: colors.primaryDark },
  goalNote: { color: colors.muted, fontSize: 13, marginTop: 3 },
  feedback: { color: colors.danger, fontSize: 14, lineHeight: 20 },
  primaryButton: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: 14, justifyContent: 'center', minHeight: 54, marginTop: 8 },
  primaryButtonText: { color: colors.white, fontSize: 16, fontWeight: '800' },
  selectedGoal: { color: colors.muted, fontSize: 13, textAlign: 'center' },
  pressed: { opacity: 0.82 },
});
