import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { supabase } from '../../lib/supabase';
import { colors } from '../../theme/colors';

type MealLogFormProps = {
  userId: string;
  onSaved: () => void;
};

export function MealLogForm({ userId, onSaved }: MealLogFormProps) {
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const saveMeal = async () => {
    const calorieValue = Number(calories);
    const proteinValue = protein ? Number(protein) : null;

    if (!name.trim() || !Number.isFinite(calorieValue) || calorieValue < 0) {
      setFeedback('Add a meal name and a valid calorie amount.');
      return;
    }

    if (protein && (proteinValue === null || !Number.isFinite(proteinValue) || proteinValue < 0)) {
      setFeedback('Enter a valid protein amount.');
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    const { error } = await supabase?.from('meals').insert({
      user_id: userId,
      name: name.trim(),
      source: 'manual',
      estimated_calories: Math.round(calorieValue),
      protein_g: proteinValue,
      is_user_confirmed: true,
      analysis_metadata: {},
    }) ?? { error: new Error('Supabase is not configured.') };

    setIsSaving(false);

    if (error) {
      setFeedback(error.message);
      return;
    }

    setName('');
    setCalories('');
    setProtein('');
    setFeedback('Meal added to Today.');
    onSaved();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Log a meal</Text>
      <Text style={styles.subtitle}>Add what you ate and we’ll keep today’s totals up to date.</Text>
      <TextInput
        onChangeText={setName}
        placeholder="Meal name"
        placeholderTextColor={colors.muted}
        style={styles.input}
        value={name}
      />
      <View style={styles.row}>
        <TextInput
          keyboardType="decimal-pad"
          onChangeText={setCalories}
          placeholder="Calories"
          placeholderTextColor={colors.muted}
          style={[styles.input, styles.halfInput]}
          value={calories}
        />
        <TextInput
          keyboardType="decimal-pad"
          onChangeText={setProtein}
          placeholder="Protein (g)"
          placeholderTextColor={colors.muted}
          style={[styles.input, styles.halfInput]}
          value={protein}
        />
      </View>
      {feedback ? <Text style={feedback === 'Meal added to Today.' ? styles.success : styles.error}>{feedback}</Text> : null}
      <Pressable
        disabled={isSaving}
        onPress={() => void saveMeal()}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        {isSaving ? <ActivityIndicator color={colors.white} /> : <Text style={styles.buttonText}>Add meal</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.surfaceMuted, borderRadius: 18, marginTop: 24, padding: 18 },
  title: { color: colors.ink, fontSize: 20, fontWeight: '800' },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: 5 },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 15,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  row: { flexDirection: 'row', gap: 10 },
  halfInput: { flex: 1 },
  error: { color: colors.danger, fontSize: 13, lineHeight: 19, marginTop: 10 },
  success: { color: colors.primaryDark, fontSize: 13, lineHeight: 19, marginTop: 10 },
  button: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: 12, justifyContent: 'center', marginTop: 14, minHeight: 46 },
  buttonText: { color: colors.white, fontSize: 15, fontWeight: '800' },
  pressed: { opacity: 0.82 },
});
