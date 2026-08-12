import { createElement } from 'react';
import { ActivityIndicator, Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { mealMetadata } from '../meals/mealUtils';
import { BottomNavigation } from '../../navigation/BottomNavigation';
import { navigateToMeal, navigateToPath } from '../../navigation/webRouter';
import { useAuth } from '../../providers/AuthProvider';
import { colors } from '../../theme/colors';
import { useDashboardNutrition } from './hooks/useDashboardNutrition';

const defaultCalorieTarget = 2000;
const defaultProteinTarget = 100;

function timeOfDay(hour: number) {
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

function firstNameFor(user: ReturnType<typeof useAuth>['user']) {
  const displayName = typeof user?.user_metadata?.display_name === 'string'
    ? user.user_metadata.display_name.trim()
    : '';
  if (displayName) return displayName.split(/\s+/)[0];

  const emailName = user?.email?.split('@')[0]?.split(/[._-]/)[0]?.trim();
  return emailName ? emailName.charAt(0).toUpperCase() + emailName.slice(1) : 'there';
}

function avatarUrlFor(user: ReturnType<typeof useAuth>['user']) {
  const value = user?.user_metadata?.avatar_url;
  return typeof value === 'string' && value.trim() ? value : null;
}

function initialsFor(user: ReturnType<typeof useAuth>['user']) {
  const displayName = typeof user?.user_metadata?.display_name === 'string'
    ? user.user_metadata.display_name.trim()
    : '';
  if (displayName) {
    return displayName
      .split(/\s+/)
      .slice(0, 2)
      .map((part: string) => part.charAt(0).toUpperCase())
      .join('');
  }
  return user?.email?.charAt(0).toUpperCase() || '?';
}

type ProgressRingProps = {
  color: string;
  percentage: number;
};

function ProgressRing({ color, percentage }: ProgressRingProps) {
  const value = Math.max(0, Math.min(100, Math.round(percentage)));

  if (Platform.OS === 'web') {
    return createElement(
      'div',
      {
        'aria-valuemax': 100,
        'aria-valuemin': 0,
        'aria-valuenow': value,
        role: 'progressbar',
        style: webProgressRingStyle(value, color),
      },
      createElement(
        'div',
        { style: webProgressRingInnerStyle },
        createElement('span', { style: webProgressRingValueStyle }, `${value}%`),
      ),
    );
  }

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ max: 100, min: 0, now: value }}
      style={[styles.nativeRing, { borderColor: color }]}
    >
      <Text style={styles.nativeRingValue}>{value}%</Text>
    </View>
  );
}

export function HomeScreen() {
  const { user } = useAuth();
  const {
    days,
    isLoading,
    loadError,
    maximumCalories,
    mealImageUrls,
    meals,
    refresh,
    targets,
    totals,
  } = useDashboardNutrition();
  const now = new Date();
  const firstName = firstNameFor(user);
  const avatarUrl = avatarUrlFor(user);
  const calorieTarget = targets.calories ?? defaultCalorieTarget;
  const proteinTarget = targets.protein ?? defaultProteinTarget;
  const remainingCalories = calorieTarget - totals.calories;
  const calorieProgress = (totals.calories / calorieTarget) * 100;
  const proteinProgress = (totals.protein / proteinTarget) * 100;
  const weekTotal = days.reduce((total, day) => total + day.calories, 0);
  const elapsedWeekDays = Math.max(1, Math.min(7, ((now.getDay() + 6) % 7) + 1));
  const dailyAverage = Math.round(weekTotal / elapsedWeekDays);
  const dateLabel = now.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    weekday: 'short',
  });

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false} style={styles.scroll}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>TODAY · {dateLabel.toUpperCase()}</Text>
            <Text style={styles.title}>Good {timeOfDay(now.getHours())}, {firstName}</Text>
            <Text style={styles.headerNote}>Here’s your nutrition at a glance.</Text>
          </View>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitials}>{initialsFor(user)}</Text>
            </View>
          )}
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View style={styles.summaryHeaderCopy}>
              <Text style={styles.summaryEyebrow}>DAILY NUTRITION</Text>
              <Text style={styles.summaryTitle}>
                {remainingCalories >= 0 ? 'Stay on track' : 'Target reached'}
              </Text>
              <Text style={styles.summaryNote}>
                {remainingCalories >= 0
                  ? `${remainingCalories.toLocaleString()} kcal remaining today`
                  : `${Math.abs(remainingCalories).toLocaleString()} kcal over today’s target`}
              </Text>
            </View>
            <View style={[styles.statusBadge, remainingCalories < 0 && styles.statusBadgeOver]}>
              <Text style={[styles.statusBadgeText, remainingCalories < 0 && styles.statusBadgeTextOver]}>
                {remainingCalories < 0 ? 'Over' : 'On track'}
              </Text>
            </View>
          </View>

          <View style={styles.ringsRow}>
            <View style={styles.ringMetric}>
              <ProgressRing color={colors.primary} percentage={calorieProgress} />
              <Text style={styles.ringLabel}>Calories</Text>
              <Text style={styles.ringDetail}>{totals.calories.toLocaleString()} / {calorieTarget.toLocaleString()} kcal</Text>
            </View>
            <View style={styles.ringDivider} />
            <View style={styles.ringMetric}>
              <ProgressRing color="#36A89A" percentage={proteinProgress} />
              <Text style={styles.ringLabel}>Protein</Text>
              <Text style={styles.ringDetail}>{totals.protein.toFixed(1)} / {proteinTarget} g</Text>
            </View>
          </View>
        </View>

        <View style={styles.metricRow}>
          <View style={styles.metricCard}>
            <View style={styles.metricIconGreen}>
              <Text style={styles.metricIconText}>M</Text>
            </View>
            <Text style={styles.metricLabel}>MEALS LOGGED</Text>
            <Text style={styles.metricValue}>{meals.length}</Text>
            <Text style={styles.metricNote}>{meals.length === 1 ? 'meal today' : 'meals today'}</Text>
          </View>
          <View style={styles.metricCard}>
            <View style={styles.metricIconMint}>
              <Text style={styles.metricIconText}>K</Text>
            </View>
            <Text style={styles.metricLabel}>CALORIES LEFT</Text>
            <Text style={[styles.metricValue, remainingCalories < 0 && styles.metricValueOver]}>
              {remainingCalories >= 0 ? remainingCalories.toLocaleString() : 0}
            </Text>
            <Text style={styles.metricNote}>{remainingCalories < 0 ? 'target exceeded' : 'kcal remaining'}</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Today’s meals</Text>
            <Text style={styles.sectionSubtitle}>Your latest food entries</Text>
          </View>
          <Pressable
            onPress={() => navigateToPath('/log-meal')}
            style={({ pressed }) => [styles.addMealButton, pressed && styles.pressed]}
          >
            <Text style={styles.addMealButtonText}>+ Add meal</Text>
          </Pressable>
        </View>

        {isLoading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.stateText}>Loading your dashboard…</Text>
          </View>
        ) : null}
        {!isLoading && loadError ? (
          <View style={styles.stateCard}>
            <Text style={styles.errorText}>{loadError}</Text>
            <Pressable onPress={() => void refresh()} style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}>
              <Text style={styles.retryButtonText}>Try again</Text>
            </Pressable>
          </View>
        ) : null}
        {!isLoading && !loadError && !meals.length ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Text style={styles.emptyIconText}>+</Text>
            </View>
            <Text style={styles.emptyTitle}>No meals logged yet</Text>
            <Text style={styles.emptyText}>Add your first meal to start tracking today’s nutrition.</Text>
            <Pressable onPress={() => navigateToPath('/log-meal')} style={({ pressed }) => [styles.emptyButton, pressed && styles.pressed]}>
              <Text style={styles.emptyButtonText}>Add your first meal</Text>
            </Pressable>
          </View>
        ) : null}

        {!isLoading && !loadError ? meals.slice(0, 3).map((meal) => (
          <Pressable
            accessibilityLabel={`Edit ${meal.name || 'meal'}`}
            accessibilityRole="button"
            key={meal.id}
            onPress={() => navigateToMeal(meal.id, '/home')}
            style={({ pressed }) => [styles.mealRow, pressed && styles.pressed]}
          >
            {mealImageUrls[meal.id] ? (
              <Image source={{ uri: mealImageUrls[meal.id] }} style={styles.mealImage} />
            ) : (
              <View style={styles.mealImageFallback}>
                <Text style={styles.mealImageFallbackText}>{(meal.name || 'M').charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <View style={styles.mealInfo}>
              <Text numberOfLines={1} style={styles.mealName}>{meal.name || 'Unnamed meal'}</Text>
              <Text style={styles.mealMeta}>
                {mealMetadata(meal.analysis_metadata).meal_type || 'Meal'} · {new Date(meal.eaten_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
              </Text>
            </View>
            <View style={styles.mealNutrition}>
              <Text style={styles.mealCalories}>{meal.estimated_calories === null ? '—' : meal.estimated_calories}</Text>
              <Text style={styles.mealCaloriesUnit}>kcal</Text>
            </View>
          </Pressable>
        )) : null}

        {!isLoading && !loadError && meals.length ? (
          <Pressable onPress={() => navigateToPath('/meals')} style={({ pressed }) => [styles.viewAllButton, pressed && styles.pressed]}>
            <Text style={styles.viewAllButtonText}>View all meals →</Text>
          </Pressable>
        ) : null}

        <View style={styles.weekCard}>
          <View style={styles.weekHeader}>
            <View>
              <Text style={styles.weekEyebrow}>THIS WEEK</Text>
              <Text style={styles.weekTitle}>Calorie trend</Text>
            </View>
            <View style={styles.weekSummary}>
              <Text style={styles.weekTotal}>{weekTotal.toLocaleString()} kcal</Text>
              <Text style={styles.weekAverage}>{dailyAverage.toLocaleString()} daily avg.</Text>
            </View>
          </View>
          <View style={styles.chart}>
            {days.map((day) => {
              const barHeight = Math.max(8, Math.round((day.calories / maximumCalories) * 84));
              return (
                <View key={day.key} style={styles.chartColumn}>
                  <View style={styles.chartBarTrack}>
                    <View
                      style={[
                        styles.chartBar,
                        day.isToday && styles.chartBarToday,
                        { height: barHeight },
                      ]}
                    />
                  </View>
                  <Text style={[styles.chartLabel, day.isToday && styles.chartLabelToday]}>
                    {day.date.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 2)}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

      </ScrollView>
      <BottomNavigation active="home" />
    </View>
  );
}

const webProgressRingStyle = (value: number, color: string) => ({
  alignItems: 'center',
  backgroundImage: `conic-gradient(${color} ${value * 3.6}deg, #DCE9DF ${value * 3.6}deg 360deg)`,
  borderRadius: '50%',
  display: 'flex',
  height: 92,
  justifyContent: 'center',
  width: 92,
});

const webProgressRingInnerStyle = {
  alignItems: 'center',
  backgroundColor: '#F7FCF8',
  borderRadius: '50%',
  display: 'flex',
  height: 70,
  justifyContent: 'center',
  width: 70,
};

const webProgressRingValueStyle = {
  color: colors.ink,
  fontFamily: 'system-ui, -apple-system, sans-serif',
  fontSize: 20,
  fontWeight: '800',
};

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background, flex: 1 },
  scroll: { flex: 1 },
  container: { alignSelf: 'center', maxWidth: 640, padding: 22, paddingBottom: 116, width: '100%' },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  headerCopy: { flex: 1, paddingRight: 16 },
  eyebrow: { color: colors.primary, fontSize: 11, fontWeight: '800', letterSpacing: 1.25 },
  title: { color: colors.ink, fontSize: 30, fontWeight: '800', marginTop: 7 },
  headerNote: { color: colors.muted, fontSize: 14, marginTop: 5 },
  avatar: { borderColor: colors.white, borderRadius: 28, borderWidth: 3, height: 56, width: 56 },
  avatarFallback: { alignItems: 'center', backgroundColor: '#DDEFE2', borderRadius: 28, height: 56, justifyContent: 'center', width: 56 },
  avatarInitials: { color: colors.primaryDark, fontSize: 17, fontWeight: '800' },
  summaryCard: { backgroundColor: '#E8F6EC', borderColor: '#C8E5D0', borderRadius: 24, borderWidth: 1, marginTop: 24, padding: 20 },
  summaryHeader: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between' },
  summaryHeaderCopy: { flex: 1, paddingRight: 12 },
  summaryEyebrow: { color: colors.primary, fontSize: 11, fontWeight: '800', letterSpacing: 1.15 },
  summaryTitle: { color: colors.ink, fontSize: 22, fontWeight: '800', marginTop: 6 },
  summaryNote: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 4 },
  statusBadge: { backgroundColor: '#D3EFD9', borderRadius: 14, paddingHorizontal: 11, paddingVertical: 7 },
  statusBadgeOver: { backgroundColor: '#FDE5E1' },
  statusBadgeText: { color: colors.primaryDark, fontSize: 11, fontWeight: '800' },
  statusBadgeTextOver: { color: colors.danger },
  ringsRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-around', marginTop: 22 },
  ringMetric: { alignItems: 'center', flex: 1 },
  ringDivider: { backgroundColor: '#C8E5D0', height: 92, width: 1 },
  nativeRing: { alignItems: 'center', borderRadius: 46, borderWidth: 11, height: 92, justifyContent: 'center', width: 92 },
  nativeRingValue: { color: colors.ink, fontSize: 20, fontWeight: '800' },
  ringLabel: { color: colors.ink, fontSize: 14, fontWeight: '800', marginTop: 10 },
  ringDetail: { color: colors.muted, fontSize: 11, marginTop: 3, textAlign: 'center' },
  metricRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  metricCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: 1, flex: 1, padding: 16 },
  metricIconGreen: { alignItems: 'center', backgroundColor: '#DDF0E2', borderRadius: 15, height: 30, justifyContent: 'center', width: 30 },
  metricIconMint: { alignItems: 'center', backgroundColor: '#DDF4F1', borderRadius: 15, height: 30, justifyContent: 'center', width: 30 },
  metricIconText: { color: colors.primaryDark, fontSize: 11, fontWeight: '900' },
  metricLabel: { color: colors.muted, fontSize: 10, fontWeight: '800', letterSpacing: 0.8, marginTop: 13 },
  metricValue: { color: colors.ink, fontSize: 26, fontWeight: '800', marginTop: 5 },
  metricValueOver: { color: colors.danger },
  metricNote: { color: colors.muted, fontSize: 12, marginTop: 2 },
  sectionHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 28 },
  sectionTitle: { color: colors.ink, fontSize: 21, fontWeight: '800' },
  sectionSubtitle: { color: colors.muted, fontSize: 12, marginTop: 3 },
  addMealButton: { backgroundColor: colors.primary, borderRadius: 13, minHeight: 42, paddingHorizontal: 14, justifyContent: 'center' },
  addMealButtonText: { color: colors.white, fontSize: 13, fontWeight: '800' },
  stateCard: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 16, borderWidth: 1, gap: 10, marginTop: 13, padding: 22 },
  stateText: { color: colors.muted, fontSize: 13 },
  errorText: { color: colors.danger, fontSize: 13, lineHeight: 19, textAlign: 'center' },
  retryButton: { backgroundColor: colors.surfaceMuted, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9 },
  retryButtonText: { color: colors.primaryDark, fontSize: 12, fontWeight: '800' },
  emptyCard: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: 1, marginTop: 13, padding: 22 },
  emptyIcon: { alignItems: 'center', backgroundColor: colors.surfaceMuted, borderRadius: 22, height: 44, justifyContent: 'center', width: 44 },
  emptyIconText: { color: colors.primary, fontSize: 24, fontWeight: '700' },
  emptyTitle: { color: colors.ink, fontSize: 16, fontWeight: '800', marginTop: 12 },
  emptyText: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 5, textAlign: 'center' },
  emptyButton: { backgroundColor: colors.primary, borderRadius: 12, marginTop: 14, paddingHorizontal: 16, paddingVertical: 11 },
  emptyButtonText: { color: colors.white, fontSize: 13, fontWeight: '800' },
  mealRow: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 16, borderWidth: 1, flexDirection: 'row', marginTop: 10, padding: 12 },
  mealImage: { borderRadius: 12, height: 54, marginRight: 12, width: 54 },
  mealImageFallback: { alignItems: 'center', backgroundColor: colors.surfaceMuted, borderRadius: 12, height: 54, justifyContent: 'center', marginRight: 12, width: 54 },
  mealImageFallbackText: { color: colors.primaryDark, fontSize: 18, fontWeight: '800' },
  mealInfo: { flex: 1, paddingRight: 8 },
  mealName: { color: colors.ink, fontSize: 15, fontWeight: '800' },
  mealMeta: { color: colors.muted, fontSize: 12, marginTop: 5 },
  mealNutrition: { alignItems: 'flex-end' },
  mealCalories: { color: colors.ink, fontSize: 15, fontWeight: '800' },
  mealCaloriesUnit: { color: colors.muted, fontSize: 10, marginTop: 2 },
  viewAllButton: { alignItems: 'center', marginTop: 13, paddingVertical: 6 },
  viewAllButtonText: { color: colors.primaryDark, fontSize: 13, fontWeight: '800' },
  weekCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 20, borderWidth: 1, marginTop: 28, padding: 18 },
  weekHeader: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between' },
  weekEyebrow: { color: colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 1.1 },
  weekTitle: { color: colors.ink, fontSize: 19, fontWeight: '800', marginTop: 5 },
  weekSummary: { alignItems: 'flex-end' },
  weekTotal: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  weekAverage: { color: colors.muted, fontSize: 10, marginTop: 4 },
  chart: { alignItems: 'flex-end', flexDirection: 'row', height: 116, justifyContent: 'space-between', marginTop: 18 },
  chartColumn: { alignItems: 'center', flex: 1 },
  chartBarTrack: { alignItems: 'center', height: 88, justifyContent: 'flex-end', width: '100%' },
  chartBar: { backgroundColor: '#B6DCC0', borderRadius: 6, maxWidth: 24, width: '48%' },
  chartBarToday: { backgroundColor: colors.primary },
  chartLabel: { color: colors.muted, fontSize: 10, marginTop: 7 },
  chartLabelToday: { color: colors.primaryDark, fontWeight: '800' },
  pressed: { opacity: 0.8 },
});
