import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors } from '../../theme/colors';
import { BottomNavigation } from '../../navigation/BottomNavigation';
import { navigateToPath } from '../../navigation/webRouter';
import { useAuth } from '../../providers/AuthProvider';
import { MealLogForm } from './MealLogForm';

export function MealLogScreen() {
  const { user } = useAuth();

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container} style={styles.scroll}>
        <Pressable onPress={() => navigateToPath('/home')} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <Text style={styles.backButtonText}>‹ Back to today</Text>
        </Pressable>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>MEALS</Text>
          <Text style={styles.title}>Add a meal</Text>
          <Text style={styles.subtitle}>Capture the dish, portion, nutrition, and a photo if you have one.</Text>
        </View>
        <MealLogForm showHeader={false} userId={user?.id ?? ''} onSaved={() => navigateToPath('/home', true)} />
      </ScrollView>
      <BottomNavigation active="meals" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { flex: 1 },
  container: { flexGrow: 1, padding: 24, paddingBottom: 112 },
  backButton: { alignSelf: 'flex-start', paddingVertical: 6 },
  backButtonText: { color: colors.primaryDark, fontSize: 14, fontWeight: '800' },
  header: { marginTop: 22 },
  eyebrow: { color: colors.primary, fontSize: 12, fontWeight: '800', letterSpacing: 1.4 },
  title: { color: colors.ink, fontSize: 34, fontWeight: '800', marginTop: 8 },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: 6 },
  pressed: { opacity: 0.72 },
});
