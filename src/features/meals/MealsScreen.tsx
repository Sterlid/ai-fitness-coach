import { useCallback, useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { supabase } from '../../lib/supabase';
import { BottomNavigation } from '../../navigation/BottomNavigation';
import { navigateToPath } from '../../navigation/webRouter';
import { useAuth } from '../../providers/AuthProvider';
import { colors } from '../../theme/colors';
import type { Database } from '../../types/database';

type Meal = Database['public']['Tables']['meals']['Row'];
type MealMetadata = { meal_type?: string; serving?: string | null };

function mealMetadata(value: Meal['analysis_metadata']): MealMetadata {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return {};
  return value as MealMetadata;
}

export function MealsScreen() {
  const { user } = useAuth();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [mealImageUrls, setMealImageUrls] = useState<Record<string, string>>({});
  const [isLoadingMeals, setIsLoadingMeals] = useState(true);
  const today = new Date();
  const dateLabel = today.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
    year: 'numeric',
  });

  const loadMeals = useCallback(async () => {
    if (!supabase || !user) return;
    const client = supabase;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const { data } = await client
      .from('meals')
      .select('*')
      .eq('user_id', user.id)
      .gte('eaten_at', start.toISOString())
      .lt('eaten_at', end.toISOString())
      .order('eaten_at', { ascending: false });

    const loadedMeals = data ?? [];
    setMeals(loadedMeals);
    const imageEntries = await Promise.all(
      loadedMeals
        .filter((meal) => meal.image_path)
        .map(async (meal) => {
          const { data: imageData } = await client.storage.from('meal-images').createSignedUrl(meal.image_path!, 3600);
          return [meal.id, imageData?.signedUrl] as const;
        }),
    );
    setMealImageUrls(
      Object.fromEntries(imageEntries.filter((entry): entry is [string, string] => Boolean(entry[1]))),
    );
    setIsLoadingMeals(false);
  }, [user]);

  useEffect(() => {
    void loadMeals();
  }, [loadMeals]);

  const calories = meals.reduce((total, meal) => total + (meal.estimated_calories ?? 0), 0);
  const protein = meals.reduce((total, meal) => total + Number(meal.protein_g ?? 0), 0);

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container} style={styles.scroll}>
        <Text style={styles.title}>Meals</Text>
        <View style={styles.summaryCard}>
          <View>
            <Text style={styles.summaryLabel}>Today’s nutrition</Text>
            <Text style={styles.summaryValue}>{calories} kcal</Text>
          </View>
          <View style={styles.summaryMeta}>
            <Text style={styles.summaryMetaValue}>{meals.length}</Text>
            <Text style={styles.summaryMetaLabel}>{meals.length === 1 ? 'meal' : 'meals'}</Text>
          </View>
          <View style={styles.summaryMeta}>
            <Text style={styles.summaryMetaValue}>{protein.toFixed(1)} g</Text>
            <Text style={styles.summaryMetaLabel}>protein</Text>
          </View>
        </View>

        {isLoadingMeals ? <Text style={styles.empty}>Loading meals…</Text> : null}
        {!isLoadingMeals && !meals.length ? <Text style={styles.empty}>No meals logged yet. Add your first meal to get started.</Text> : null}
        <Pressable
          onPress={() => navigateToPath('/log-meal')}
          style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
        >
          <Text style={styles.addButtonText}>+ Add a meal</Text>
        </Pressable>
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
      </ScrollView>
      <BottomNavigation active="meals" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { flex: 1 },
  container: { padding: 24, paddingBottom: 112 },
  eyebrow: { color: colors.primary, fontSize: 12, fontWeight: '800', letterSpacing: 1.4, marginTop: 16 },
  title: { color: colors.ink, fontSize: 34, fontWeight: '800', marginTop: 8, marginBottom: 8},
  subtitle: { color: colors.muted, fontSize: 15, marginTop: 6 },
  addButton: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: 14, justifyContent: 'center', marginTop: 24, minHeight: 50 },
  addButtonText: { color: colors.white, fontSize: 15, fontWeight: '800' },
  summaryCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, padding: 18 },
  summaryLabel: { color: colors.primaryDark, fontSize: 13, fontWeight: '800' },
  summaryValue: { color: colors.ink, fontSize: 25, fontWeight: '800', marginTop: 7 },
  summaryMeta: { alignItems: 'flex-end', justifyContent: 'center', marginLeft: 12 },
  summaryMetaValue: { color: colors.ink, fontSize: 17, fontWeight: '800' },
  summaryMetaLabel: { color: colors.muted, fontSize: 12, marginTop: 3 },
  sectionTitle: { color: colors.ink, fontSize: 20, fontWeight: '800', marginTop: 30 },
  empty: { color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: 10 },
  mealRow: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 14, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, padding: 15 },
  mealImage: { borderRadius: 10, height: 54, marginRight: 11, width: 54 },
  mealInfo: { flex: 1 },
  mealName: { color: colors.ink, fontSize: 15, fontWeight: '800' },
  mealMeta: { color: colors.muted, fontSize: 13, marginTop: 4 },
  mealDescription: { color: colors.muted, fontSize: 12, marginTop: 4 },
  mealCalories: { color: colors.primaryDark, fontSize: 14, fontWeight: '800' },
  pressed: { opacity: 0.82 },
});
