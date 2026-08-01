import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { supabase } from '../../lib/supabase';
import { useAuth } from '../../providers/AuthProvider';
import { colors } from '../../theme/colors';

const cards = [
  { label: 'Nutrition', value: '0 / — kcal', note: 'Log your first meal' },
  { label: 'Protein', value: '0 / — g', note: 'Your target appears after onboarding' },
  { label: 'Today’s workout', value: 'Not planned', note: 'A daily recommendation will appear here' },
];

export function HomeScreen() {
  const { user } = useAuth();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.eyebrow}>TODAY</Text>
      <Text style={styles.title}>Good to see you.</Text>
      <Text style={styles.email}>{user?.email}</Text>
      <View style={styles.cardList}>
        {cards.map((card) => (
          <View key={card.label} style={styles.card}>
            <Text style={styles.cardLabel}>{card.label}</Text>
            <Text style={styles.cardValue}>{card.value}</Text>
            <Text style={styles.cardNote}>{card.note}</Text>
          </View>
        ))}
      </View>
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
  signOut: { color: colors.danger, fontSize: 15, fontWeight: '700', marginTop: 28, textAlign: 'center' },
});

