import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { MealLogForm } from '../meals/MealLogForm';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../providers/AuthProvider';
import { colors } from '../../theme/colors';
import type { Database } from '../../types/database';

type Meal = Database['public']['Tables']['meals']['Row'];

export function HomeScreen() {
  const { user } = useAuth();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [isLoadingMeals, setIsLoadingMeals] = useState(true);

  const loadMeals = useCallback(async () => {
    if (!supabase || !user) return;

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const { data } = await supabase
      .from('meals')
      .select('*')
      .eq('user_id', user.id)
      .gte('eaten_at', start.toISOString())
      .lt('eaten_at', end.toISOString())
      .order('eaten_at', { ascending: false });

    setMeals(data ?? []);
    setIsLoadingMeals(false);
  }, [user]);

  useEffect(() => {
    void loadMeals();
  }, [loadMeals]);

  const calories = meals.reduce((total, meal) => total + (meal.estimated_calories ?? 0), 0);
  const protein = meals.reduce((total, meal) => total + Number(meal.protein_g ?? 0), 0);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.eyebrow}>TODAY</Text>
      <Text style={styles.title}>Good to see you.</Text>
      <Text style={styles.email}>{user?.user_metadata?.display_name || user?.email}</Text>
      <View style={styles.cardList}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Nutrition</Text>
          <Text style={styles.cardValue}>{calories} kcal</Text>
          <Text style={styles.cardNote}>{meals.length ? `${meals.length} meal${meals.length === 1 ? '' : 's'} logged today` : 'Log your first meal'}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Protein</Text>
          <Text style={styles.cardValue}>{protein.toFixed(1)} g</Text>
          <Text style={styles.cardNote}>Your target will appear after coaching setup</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Today’s workout</Text>
          <Text style={styles.cardValue}>Not planned</Text>
          <Text style={styles.cardNote}>A daily recommendation will appear here</Text>
        </View>
      </View>
      <MealLogForm userId={user?.id ?? ''} onSaved={() => void loadMeals()} />
      <Text style={styles.sectionTitle}>Today’s meals</Text>
      {isLoadingMeals ? <Text style={styles.empty}>Loading meals…</Text> : null}
      {!isLoadingMeals && !meals.length ? <Text style={styles.empty}>Your logged meals will appear here.</Text> : null}
      {meals.map((meal) => (
        <View key={meal.id} style={styles.mealRow}>
          <View style={styles.mealInfo}>
            <Text style={styles.mealName}>{meal.name || 'Unnamed meal'}</Text>
            <Text style={styles.mealMeta}>{new Date(meal.eaten_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</Text>
          </View>
          <Text style={styles.mealCalories}>{meal.estimated_calories ?? 0} kcal</Text>
        </View>
      ))}
      <Pressable onPress={() => void supabase?.auth.signOut()}>
        <Text style={styles.signOut}>Sign out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingBottom: 48 },
  eyebrow: { color: colors.primary, fontSize: 12, fontWeight: '800', letterSpacing: 1.4, marginTop: 16 },
  title: { color: colors.ink, fontSize: 34, fontWeight: '800', marginTop: 8 },
  email: { color: colors.muted, fontSize: 14, marginTop: 4 },
  cardList: { gap: 14, marginTop: 28 },
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: 1, padding: 20 },
  cardLabel: { color: colors.primaryDark, fontSize: 13, fontWeight: '800' },
  cardValue: { color: colors.ink, fontSize: 25, fontWeight: '800', marginTop: 8 },
  cardNote: { color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: 6 },
  sectionTitle: { color: colors.ink, fontSize: 20, fontWeight: '800', marginTop: 30 },
  empty: { color: colors.muted, fontSize: 14, marginTop: 10 },
  mealRow: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 14, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, padding: 15 },
  mealInfo: { flex: 1 },
  mealName: { color: colors.ink, fontSize: 15, fontWeight: '800' },
  mealMeta: { color: colors.muted, fontSize: 13, marginTop: 4 },
  mealCalories: { color: colors.primaryDark, fontSize: 14, fontWeight: '800' },
  signOut: { color: colors.danger, fontSize: 15, fontWeight: '700', marginTop: 28, textAlign: 'center' },
});
