import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BottomNavigation } from '../../navigation/BottomNavigation';
import { getMealsView, navigateToMeals, type MealsView } from '../../navigation/webRouter';
import { colors } from '../../theme/colors';
import { MealHistoryView } from './MealHistoryView';
import { TodayMealsView } from './TodayMealsView';

export function MealsScreen() {
  const [activeView, setActiveView] = useState<MealsView>(getMealsView);

  const selectView = (view: MealsView) => {
    setActiveView(view);
    navigateToMeals(view, true);
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container} style={styles.scroll}>
        <Text style={styles.title}>Meals</Text>
        <View style={styles.viewToggle}>
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: activeView === 'today' }}
            onPress={() => selectView('today')}
            style={[styles.viewToggleItem, activeView === 'today' && styles.activeViewToggleItem]}
          >
            <Text style={[styles.viewToggleText, activeView === 'today' && styles.activeViewToggleText]}>Today</Text>
          </Pressable>
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: activeView === 'history' }}
            onPress={() => selectView('history')}
            style={[styles.viewToggleItem, activeView === 'history' && styles.activeViewToggleItem]}
          >
            <Text style={[styles.viewToggleText, activeView === 'history' && styles.activeViewToggleText]}>History</Text>
          </Pressable>
        </View>
        {activeView === 'today' ? <TodayMealsView /> : <MealHistoryView />}
      </ScrollView>
      <BottomNavigation active="meals" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { flex: 1 },
  container: { padding: 24, paddingBottom: 112 },
  title: { color: colors.ink, fontSize: 34, fontWeight: '800', marginBottom: 14, marginTop: 8, textAlign: 'center' },
  viewToggle: { backgroundColor: colors.surfaceMuted, borderRadius: 14, flexDirection: 'row', padding: 4 },
  viewToggleItem: { alignItems: 'center', borderRadius: 11, flex: 1, justifyContent: 'center', minHeight: 42 },
  activeViewToggleItem: { backgroundColor: colors.primary },
  viewToggleText: { color: colors.muted, fontSize: 14, fontWeight: '800' },
  activeViewToggleText: { color: colors.white },
});
