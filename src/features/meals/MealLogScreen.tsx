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
        <Pressable
          accessibilityLabel="Back to meals"
          accessibilityRole="button"
          onPress={() => navigateToPath('/meals')}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <Text style={styles.backButtonText}>←</Text>
          <Text style={styles.backButtonLabel}>Back to meals</Text>
        </Pressable>
        <MealLogForm showHeader={false} userId={user?.id ?? ''} onSaved={() => navigateToPath('/meals', true)} />
      </ScrollView>
      <BottomNavigation active="meals" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { flex: 1 },
  container: { flexGrow: 1, padding: 24, paddingBottom: 112 },
  backButton: { alignItems: 'center', alignSelf: 'flex-start', flexDirection: 'row', gap: 8, paddingVertical: 6 },
  backButtonText: { color: colors.primaryDark, fontSize: 28, fontWeight: '400', lineHeight: 30 },
  backButtonLabel: { color: colors.primaryDark, fontSize: 14, fontWeight: '800' },
  pressed: { opacity: 0.72 },
});
