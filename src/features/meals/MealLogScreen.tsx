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
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false} style={styles.scroll}>
        <Pressable
          accessibilityLabel="Back to meals"
          accessibilityRole="button"
          onPress={() => navigateToPath('/meals')}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <Text style={styles.backButtonText}>←</Text>
          <Text style={styles.backButtonLabel}>Back to meals</Text>
        </Pressable>

        <Text style={styles.eyebrow}>MEAL DETAILS</Text>
        <Text style={styles.title}>Add meal</Text>
        <Text style={styles.subtitle}>Start with a photo for a quick estimate, or enter the meal details yourself.</Text>

        <MealLogForm showHeader={false} userId={user?.id ?? ''} onSaved={() => navigateToPath('/meals', true)} />
      </ScrollView>
      <BottomNavigation active="meals" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background, flex: 1 },
  scroll: { flex: 1 },
  container: { alignSelf: 'center', flexGrow: 1, maxWidth: 640, padding: 24, paddingBottom: 112, width: '100%' },
  backButton: { alignItems: 'center', alignSelf: 'flex-start', flexDirection: 'row', gap: 8, paddingVertical: 6 },
  backButtonText: { color: colors.primaryDark, fontSize: 28, fontWeight: '400', lineHeight: 30 },
  backButtonLabel: { color: colors.primaryDark, fontSize: 14, fontWeight: '800' },
  eyebrow: { color: colors.primary, fontSize: 11, fontWeight: '800', letterSpacing: 1.2, marginTop: 22 },
  title: { color: colors.ink, fontSize: 32, fontWeight: '800', marginTop: 7 },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: 5 },
  pressed: { opacity: 0.72 },
});
