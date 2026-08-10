import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { navigateToPath } from '../../navigation/webRouter';
import { colors } from '../../theme/colors';
import { useTodayNutrition } from './hooks/useTodayNutrition';
import { mealMetadata } from './mealUtils';

const defaultCalorieTarget = 2000;
const defaultProteinTarget = 100;

export function TodayMealsView() {
  const {
    isLoading,
    isSavingTargets,
    loadError,
    mealImageUrls,
    meals,
    targets,
    totals,
    updateTargets,
  } = useTodayNutrition();
  const [isEditingTargets, setIsEditingTargets] = useState(false);
  const [calorieInput, setCalorieInput] = useState(String(defaultCalorieTarget));
  const [proteinInput, setProteinInput] = useState(String(defaultProteinTarget));
  const [targetFeedback, setTargetFeedback] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);

  useEffect(() => {
    setCalorieInput(String(targets.calories ?? defaultCalorieTarget));
    setProteinInput(String(targets.protein ?? defaultProteinTarget));
  }, [targets.calories, targets.protein]);

  const calorieTarget = targets.calories ?? defaultCalorieTarget;
  const proteinTarget = targets.protein ?? defaultProteinTarget;
  const calorieProgress = Math.min(100, Math.round((totals.calories / calorieTarget) * 100));
  const proteinProgress = Math.min(100, Math.round((totals.protein / proteinTarget) * 100));
  const remainingCalories = calorieTarget - totals.calories;
  const dateLabel = new Date().toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
    year: 'numeric',
  });

  const saveTargets = async () => {
    const calories = Number(calorieInput);
    const protein = Number(proteinInput);
    if (!Number.isFinite(calories) || calories <= 0 || !Number.isFinite(protein) || protein <= 0) {
      setTargetFeedback({ kind: 'error', text: 'Enter calorie and protein targets greater than zero.' });
      return;
    }

    setTargetFeedback(null);
    try {
      await updateTargets(calories, protein);
      setIsEditingTargets(false);
      setTargetFeedback({ kind: 'success', text: 'Daily targets updated.' });
    } catch (error) {
      setTargetFeedback({
        kind: 'error',
        text: error instanceof Error ? error.message : 'Targets could not be saved.',
      });
    }
  };

  return (
    <View>
      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <View>
            <Text style={styles.progressEyebrow}>DAILY INTAKE</Text>
            <Text style={styles.progressTitle}>Calories</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              if (isEditingTargets) {
                setCalorieInput(String(targets.calories ?? defaultCalorieTarget));
                setProteinInput(String(targets.protein ?? defaultProteinTarget));
              }
              setIsEditingTargets((current) => !current);
              setTargetFeedback(null);
            }}
            style={({ pressed }) => [styles.settingsButton, pressed && styles.pressed]}
          >
            <Text style={styles.settingsButtonText}>
              {isEditingTargets ? 'Cancel' : targets.calories && targets.protein ? 'Edit targets' : 'Set targets'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.calorieNumbers}>
          <Text style={styles.calorieValue}>{totals.calories}</Text>
          <Text style={styles.calorieTarget}> / {calorieTarget} kcal</Text>
        </View>
        <View
          accessibilityRole="progressbar"
          accessibilityValue={{ max: calorieTarget, min: 0, now: Math.min(totals.calories, calorieTarget) }}
          style={styles.progressTrack}
        >
          <View style={[styles.calorieProgressFill, { width: `${calorieProgress}%` as `${number}%` }]} />
        </View>
        <Text style={[styles.remainingText, remainingCalories < 0 && styles.overTargetText]}>
          {remainingCalories >= 0
            ? `${remainingCalories} kcal remaining today`
            : `${Math.abs(remainingCalories)} kcal over your target`}
        </Text>

        <View style={styles.proteinHeader}>
          <Text style={styles.proteinLabel}>Protein</Text>
          <Text style={styles.proteinValue}>{totals.protein.toFixed(1)} / {proteinTarget} g</Text>
        </View>
        <View
          accessibilityRole="progressbar"
          accessibilityValue={{ max: proteinTarget, min: 0, now: Math.min(totals.protein, proteinTarget) }}
          style={styles.proteinTrack}
        >
          <View style={[styles.proteinProgressFill, { width: `${proteinProgress}%` as `${number}%` }]} />
        </View>

        {isEditingTargets ? (
          <View style={styles.settingsPanel}>
            <Text style={styles.settingsTitle}>Daily targets</Text>
            <View style={styles.settingsFields}>
              <View style={styles.settingsField}>
                <Text style={styles.inputLabel}>Calories</Text>
                <TextInput
                  keyboardType="number-pad"
                  onChangeText={setCalorieInput}
                  placeholder="2000"
                  placeholderTextColor={colors.muted}
                  style={styles.input}
                  value={calorieInput}
                />
              </View>
              <View style={styles.settingsField}>
                <Text style={styles.inputLabel}>Protein (g)</Text>
                <TextInput
                  keyboardType="decimal-pad"
                  onChangeText={setProteinInput}
                  placeholder="100"
                  placeholderTextColor={colors.muted}
                  style={styles.input}
                  value={proteinInput}
                />
              </View>
            </View>
            <Pressable
              disabled={isSavingTargets}
              onPress={() => void saveTargets()}
              style={({ pressed }) => [styles.saveTargetsButton, pressed && styles.pressed]}
            >
              {isSavingTargets
                ? <ActivityIndicator color={colors.white} size="small" />
                : <Text style={styles.saveTargetsButtonText}>Save targets</Text>}
            </Pressable>
          </View>
        ) : null}
        {targetFeedback ? (
          <Text style={targetFeedback.kind === 'error' ? styles.error : styles.success}>{targetFeedback.text}</Text>
        ) : null}
      </View>

      <View style={styles.dayHeader}>
        <View style={styles.dayHeadingText}>
          <Text style={styles.dayTitle}>Today’s meals</Text>
          <Text style={styles.dayDate}>{dateLabel}</Text>
        </View>
        <Pressable
          onPress={() => navigateToPath('/log-meal')}
          style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
        >
          <Text style={styles.addButtonText}>+ Add meal</Text>
        </Pressable>
      </View>

      <View style={styles.macroCard}>
        <View style={styles.macroItem}>
          <Text style={styles.macroValue}>{meals.length}</Text>
          <Text style={styles.macroLabel}>{meals.length === 1 ? 'Meal' : 'Meals'}</Text>
        </View>
        <View style={styles.macroItem}>
          <Text style={styles.macroValue}>{totals.carbs.toFixed(1)} g</Text>
          <Text style={styles.macroLabel}>Carbs</Text>
        </View>
        <View style={styles.macroItem}>
          <Text style={styles.macroValue}>{totals.fat.toFixed(1)} g</Text>
          <Text style={styles.macroLabel}>Fat</Text>
        </View>
      </View>

      {isLoading ? <Text style={styles.empty}>Loading today’s meals…</Text> : null}
      {loadError ? <Text style={styles.error}>Today’s meals could not be loaded: {loadError}</Text> : null}
      {!isLoading && !loadError && !meals.length ? (
        <Text style={styles.empty}>No meals logged yet. Add your first meal to get started.</Text>
      ) : null}

      {meals.map((meal) => (
        <View key={meal.id} style={styles.mealRow}>
          {mealImageUrls[meal.id] ? <Image source={{ uri: mealImageUrls[meal.id] }} style={styles.mealImage} /> : null}
          <View style={styles.mealInfo}>
            <Text style={styles.mealName}>{meal.name || 'Unnamed meal'}</Text>
            <Text style={styles.mealMeta}>
              {mealMetadata(meal.analysis_metadata).meal_type || 'Meal'} · {new Date(meal.eaten_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
            </Text>
            {meal.description ? <Text numberOfLines={1} style={styles.mealDescription}>{meal.description}</Text> : null}
          </View>
          <Text style={styles.mealCalories}>{meal.estimated_calories === null ? '—' : `${meal.estimated_calories} kcal`}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  progressCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: 1, marginTop: 16, padding: 18 },
  progressHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  progressEyebrow: { color: colors.primary, fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  progressTitle: { color: colors.ink, fontSize: 20, fontWeight: '800', marginTop: 4 },
  settingsButton: { backgroundColor: colors.surfaceMuted, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9 },
  settingsButtonText: { color: colors.primaryDark, fontSize: 12, fontWeight: '800' },
  calorieNumbers: { alignItems: 'baseline', flexDirection: 'row', marginTop: 20 },
  calorieValue: { color: colors.ink, fontSize: 34, fontWeight: '800' },
  calorieTarget: { color: colors.muted, fontSize: 15, fontWeight: '700' },
  progressTrack: { backgroundColor: colors.surfaceMuted, borderRadius: 7, height: 14, marginTop: 12, overflow: 'hidden' },
  calorieProgressFill: { backgroundColor: colors.primary, borderRadius: 7, height: '100%' },
  remainingText: { color: colors.muted, fontSize: 12, marginTop: 8 },
  overTargetText: { color: colors.danger },
  proteinHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  proteinLabel: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  proteinValue: { color: colors.muted, fontSize: 13, fontWeight: '700' },
  proteinTrack: { backgroundColor: colors.surfaceMuted, borderRadius: 5, height: 9, marginTop: 8, overflow: 'hidden' },
  proteinProgressFill: { backgroundColor: colors.primaryDark, borderRadius: 5, height: '100%' },
  settingsPanel: { borderColor: colors.border, borderTopWidth: 1, marginTop: 20, paddingTop: 16 },
  settingsTitle: { color: colors.ink, fontSize: 15, fontWeight: '800' },
  settingsFields: { flexDirection: 'row', gap: 10, marginTop: 12 },
  settingsField: { flex: 1 },
  inputLabel: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  input: { backgroundColor: colors.surfaceMuted, borderColor: colors.border, borderRadius: 10, borderWidth: 1, color: colors.ink, fontSize: 15, marginTop: 6, paddingHorizontal: 12, paddingVertical: 11 },
  saveTargetsButton: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: 11, justifyContent: 'center', marginTop: 12, minHeight: 44 },
  saveTargetsButtonText: { color: colors.white, fontSize: 14, fontWeight: '800' },
  dayHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 24 },
  dayHeadingText: { flex: 1, paddingRight: 12 },
  dayTitle: { color: colors.ink, fontSize: 21, fontWeight: '800' },
  dayDate: { color: colors.muted, fontSize: 13, marginTop: 4 },
  addButton: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: 12, justifyContent: 'center', minHeight: 42, paddingHorizontal: 14 },
  addButtonText: { color: colors.white, fontSize: 13, fontWeight: '800' },
  macroCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 14, borderWidth: 1, flexDirection: 'row', marginTop: 14, padding: 15 },
  macroItem: { flex: 1 },
  macroValue: { color: colors.ink, fontSize: 15, fontWeight: '800' },
  macroLabel: { color: colors.muted, fontSize: 11, marginTop: 3 },
  empty: { color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: 14 },
  error: { color: colors.danger, fontSize: 13, lineHeight: 19, marginTop: 12 },
  success: { color: colors.primaryDark, fontSize: 13, lineHeight: 19, marginTop: 12 },
  mealRow: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 14, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, padding: 15 },
  mealImage: { borderRadius: 10, height: 54, marginRight: 11, width: 54 },
  mealInfo: { flex: 1 },
  mealName: { color: colors.ink, fontSize: 15, fontWeight: '800' },
  mealMeta: { color: colors.muted, fontSize: 13, marginTop: 4 },
  mealDescription: { color: colors.muted, fontSize: 12, marginTop: 4 },
  mealCalories: { color: colors.primaryDark, fontSize: 14, fontWeight: '800' },
  pressed: { opacity: 0.82 },
});
