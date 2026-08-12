import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { navigateToMeal, navigateToPath } from '../../navigation/webRouter';
import { colors } from '../../theme/colors';
import { useMealHistory } from './hooks/useMealHistory';
import { mealMetadata } from './mealUtils';

const chartHeight = 112;

export function MealHistoryView() {
  const {
    days,
    isCurrentWeek,
    isLoadingMeals,
    loadError,
    maximumCalories,
    mealImageUrls,
    nextWeek,
    previousWeek,
    selectDate,
    selectedDateLabel,
    selectedMeals,
    totals,
    weekLabel,
  } = useMealHistory();

  return (
    <View>
      <View style={styles.chartCard}>
        <View style={styles.weekControls}>
          <Pressable
            accessibilityLabel="Previous week"
            accessibilityRole="button"
            onPress={previousWeek}
            style={({ pressed }) => [styles.weekButton, pressed && styles.pressed]}
          >
            <Text style={styles.weekButtonText}>‹</Text>
          </Pressable>
          <View style={styles.weekHeading}>
            <Text style={styles.chartTitle}>Weekly calories</Text>
            <Text style={styles.weekLabel}>{weekLabel}</Text>
          </View>
          <Pressable
            accessibilityLabel="Next week"
            accessibilityRole="button"
            accessibilityState={{ disabled: isCurrentWeek }}
            disabled={isCurrentWeek}
            onPress={nextWeek}
            style={({ pressed }) => [styles.weekButton, isCurrentWeek && styles.disabledWeekButton, pressed && styles.pressed]}
          >
            <Text style={styles.weekButtonText}>›</Text>
          </Pressable>
        </View>

        <View style={styles.chart}>
          {days.map((day) => {
            const barHeight = day.calories === 0
              ? 4
              : Math.max(10, Math.round((day.calories / maximumCalories) * chartHeight));

            return (
              <Pressable
                accessibilityLabel={`${day.date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}, ${day.calories} calories`}
                accessibilityRole="button"
                accessibilityState={{ selected: day.isSelected }}
                key={day.key}
                onPress={() => selectDate(day.date)}
                style={styles.chartColumn}
              >
                <Text style={[styles.chartCalories, day.isSelected && styles.selectedChartText]}>
                  {day.calories >= 1000 ? `${(day.calories / 1000).toFixed(1)}k` : day.calories}
                </Text>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.bar,
                      { height: barHeight },
                      day.calories === 0 && styles.emptyBar,
                      day.isSelected && styles.selectedBar,
                    ]}
                  />
                </View>
                <Text style={[styles.chartDay, day.isSelected && styles.selectedChartText]}>
                  {day.date.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 2)}
                </Text>
                <Text style={[styles.chartDate, day.isSelected && styles.selectedChartDate]}>{day.date.getDate()}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.dayHeader}>
        <View style={styles.dayHeadingText}>
          <Text style={styles.dayTitle}>Meals for this day</Text>
          <Text style={styles.dayDate}>{selectedDateLabel}</Text>
        </View>
        <Pressable
          onPress={() => navigateToPath('/log-meal')}
          style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
        >
          <Text style={styles.addButtonText}>+ Add meal</Text>
        </Pressable>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryTopRow}>
          <View>
            <Text style={styles.summaryLabel}>Total intake</Text>
            <Text style={styles.summaryValue}>{totals.calories} kcal</Text>
          </View>
          <View style={styles.mealCountBadge}>
            <Text style={styles.mealCountValue}>{selectedMeals.length}</Text>
            <Text style={styles.mealCountLabel}>{selectedMeals.length === 1 ? 'meal' : 'meals'}</Text>
          </View>
        </View>
        <View style={styles.macroRow}>
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>{totals.protein.toFixed(1)} g</Text>
            <Text style={styles.macroLabel}>Protein</Text>
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
      </View>

      {isLoadingMeals ? <Text style={styles.empty}>Loading meals…</Text> : null}
      {loadError ? <Text style={styles.error}>Meals could not be loaded: {loadError}</Text> : null}
      {!isLoadingMeals && !loadError && !selectedMeals.length ? (
        <Text style={styles.empty}>No meals were logged on this day.</Text>
      ) : null}

      {selectedMeals.map((meal) => (
        <Pressable
          accessibilityLabel={`Edit ${meal.name || 'meal'}`}
          accessibilityRole="button"
          key={meal.id}
          onPress={() => navigateToMeal(meal.id, '/meals', 'history')}
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
  chartCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: 1, marginTop: 16, padding: 16 },
  weekControls: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  weekButton: { alignItems: 'center', borderColor: colors.border, borderRadius: 18, borderWidth: 1, height: 36, justifyContent: 'center', width: 36 },
  disabledWeekButton: { opacity: 0.3 },
  weekButtonText: { color: colors.ink, fontSize: 26, lineHeight: 28 },
  weekHeading: { alignItems: 'center', flex: 1 },
  chartTitle: { color: colors.ink, fontSize: 16, fontWeight: '800' },
  weekLabel: { color: colors.muted, fontSize: 12, marginTop: 3 },
  chart: { flexDirection: 'row', gap: 5, marginTop: 18 },
  chartColumn: { alignItems: 'center', flex: 1 },
  chartCalories: { color: colors.muted, fontSize: 9, fontWeight: '700', marginBottom: 5 },
  barTrack: { backgroundColor: colors.surfaceMuted, borderRadius: 7, height: chartHeight, justifyContent: 'flex-end', overflow: 'hidden', width: '68%' },
  bar: { backgroundColor: colors.primary, borderRadius: 7, width: '100%' },
  emptyBar: { backgroundColor: colors.border },
  selectedBar: { backgroundColor: colors.primaryDark },
  chartDay: { color: colors.muted, fontSize: 10, fontWeight: '800', marginTop: 7 },
  chartDate: { color: colors.ink, fontSize: 12, fontWeight: '800', marginTop: 2 },
  selectedChartText: { color: colors.primaryDark },
  selectedChartDate: { backgroundColor: colors.primaryDark, borderRadius: 11, color: colors.white, minWidth: 22, paddingVertical: 3, textAlign: 'center' },
  dayHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 24 },
  dayHeadingText: { flex: 1, paddingRight: 12 },
  dayTitle: { color: colors.ink, fontSize: 21, fontWeight: '800' },
  dayDate: { color: colors.muted, fontSize: 13, marginTop: 4 },
  addButton: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: 12, justifyContent: 'center', minHeight: 42, paddingHorizontal: 14 },
  addButtonText: { color: colors.white, fontSize: 13, fontWeight: '800' },
  summaryCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: 1, marginTop: 14, padding: 18 },
  summaryTopRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { color: colors.primaryDark, fontSize: 13, fontWeight: '800' },
  summaryValue: { color: colors.ink, fontSize: 27, fontWeight: '800', marginTop: 6 },
  mealCountBadge: { alignItems: 'center', backgroundColor: colors.surfaceMuted, borderRadius: 13, minWidth: 64, paddingHorizontal: 12, paddingVertical: 9 },
  mealCountValue: { color: colors.ink, fontSize: 17, fontWeight: '800' },
  mealCountLabel: { color: colors.muted, fontSize: 11, marginTop: 2 },
  macroRow: { borderColor: colors.border, borderTopWidth: 1, flexDirection: 'row', marginTop: 16, paddingTop: 14 },
  macroItem: { flex: 1 },
  macroValue: { color: colors.ink, fontSize: 15, fontWeight: '800' },
  macroLabel: { color: colors.muted, fontSize: 11, marginTop: 3 },
  empty: { color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: 14 },
  error: { color: colors.danger, fontSize: 13, lineHeight: 19, marginTop: 14 },
  mealRow: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 14, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, padding: 15 },
  mealImage: { borderRadius: 10, height: 54, marginRight: 11, width: 54 },
  mealInfo: { flex: 1 },
  mealName: { color: colors.ink, fontSize: 15, fontWeight: '800' },
  mealMeta: { color: colors.muted, fontSize: 13, marginTop: 4 },
  mealDescription: { color: colors.muted, fontSize: 12, marginTop: 4 },
  mealCalories: { color: colors.primaryDark, fontSize: 14, fontWeight: '800' },
  pressed: { opacity: 0.82 },
});
