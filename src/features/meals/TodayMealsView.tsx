import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { navigateToMeal, navigateToPath } from '../../navigation/webRouter';
import { colors } from '../../theme/colors';
import { useTodayNutrition } from './hooks/useTodayNutrition';
import { mealMetadata } from './mealUtils';

const defaultCalorieTarget = 2000;
const defaultProteinTarget = 100;

export function TodayMealsView() {
  const {
    isLoading,
    loadError,
    mealImageUrls,
    meals,
    targets,
    totals,
  } = useTodayNutrition();

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
            onPress={() => navigateToPath('/profile')}
            style={({ pressed }) => [styles.profileHint, pressed && styles.pressed]}
          >
            <Text style={styles.profileHintText}>Targets in Profile</Text>
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
        <Pressable
          accessibilityLabel={`Edit ${meal.name || 'meal'}`}
          accessibilityRole="button"
          key={meal.id}
          onPress={() => navigateToMeal(meal.id)}
          style={({ pressed }) => [styles.mealRow, pressed && styles.pressed]}
        >
          {mealImageUrls[meal.id] ? <Image source={{ uri: mealImageUrls[meal.id] }} style={styles.mealImage} /> : null}
          <View style={styles.mealInfo}>
            <Text style={styles.mealName}>{meal.name || 'Unnamed meal'}</Text>
            <Text style={styles.mealMeta}>
              {mealMetadata(meal.analysis_metadata).meal_type || 'Meal'} · {new Date(meal.eaten_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
            </Text>
            {meal.description ? <Text numberOfLines={1} style={styles.mealDescription}>{meal.description}</Text> : null}
          </View>
          <Text style={styles.mealCalories}>{meal.estimated_calories === null ? '—' : `${meal.estimated_calories} kcal`}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  progressCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: 1, marginTop: 16, padding: 18 },
  progressHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  progressEyebrow: { color: colors.primary, fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  progressTitle: { color: colors.ink, fontSize: 20, fontWeight: '800', marginTop: 4 },
  profileHint: { backgroundColor: colors.surfaceMuted, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  profileHintText: { color: colors.muted, fontSize: 10, fontWeight: '800' },
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
  mealRow: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 14, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, padding: 15 },
  mealImage: { borderRadius: 10, height: 54, marginRight: 11, width: 54 },
  mealInfo: { flex: 1 },
  mealName: { color: colors.ink, fontSize: 15, fontWeight: '800' },
  mealMeta: { color: colors.muted, fontSize: 13, marginTop: 4 },
  mealDescription: { color: colors.muted, fontSize: 12, marginTop: 4 },
  mealCalories: { color: colors.primaryDark, fontSize: 14, fontWeight: '800' },
  pressed: { opacity: 0.82 },
});
