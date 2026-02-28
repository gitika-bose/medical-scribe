import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GuestDisclaimer } from '@/components/shared/GuestDisclaimer';
import { Header } from '@/components/shared/Header';
import { Colors } from '@/constants/Colors';

export default function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isPhone = width < 600;

  return (
    <View style={styles.container}>
      <Header />

      <GuestDisclaimer />

      <ScrollView style={styles.scrollView} contentContainerStyle={[styles.scrollContent, isPhone && styles.scrollContentPhone]} showsVerticalScrollIndicator={false}>
        {/* Option Cards – side by side */}
        <View style={[styles.cardsContainer, isPhone && styles.cardsContainerPhone]}>
          {/* Notetaker Card */}
          <TouchableOpacity
            style={[styles.optionCard, styles.optionCardLeft, isPhone && styles.optionCardPhone]}
            onPress={() => router.push('/notetaker' as any)}
            activeOpacity={0.85}
          >
            <View style={[styles.cardIconBox, isPhone && styles.cardIconBoxPhone]}>
              <Ionicons name="mic" size={isPhone ? 18 : 22} color={Colors.primary} />
            </View>
            <Text style={[styles.cardTitle, styles.cardTitleDark, isPhone && styles.cardTitlePhone]}>Appointment{'\n'}Notetaker</Text>
          </TouchableOpacity>

          {/* Explain Card */}
          <TouchableOpacity
            style={[styles.optionCard, styles.optionCardRight, isPhone && styles.optionCardPhone]}
            onPress={() => router.push('/explain-my-appointment' as any)}
            activeOpacity={0.85}
          >
            <View style={[styles.cardIconBox, isPhone && styles.cardIconBoxPhone]}>
              <Ionicons name="cloud-upload" size={isPhone ? 18 : 22} color={Colors.primary} />
            </View>
            <Text style={[styles.cardTitle, styles.cardTitleLight, isPhone && styles.cardTitlePhone]}>Explain My{'\n'}Appointment</Text>
          </TouchableOpacity>
        </View>

        {/* Info pills */}
        <View style={styles.infoPills}>
          <View style={[styles.pill, isPhone && styles.pillPhone]}>
            <Ionicons name="shield-checkmark" size={isPhone ? 12 : 14} color={Colors.accent} />
            <Text style={[styles.pillText, isPhone && styles.pillTextPhone]}>Privacy first</Text>
          </View>
          <View style={[styles.pill, isPhone && styles.pillPhone]}>
            <Ionicons name="flash" size={isPhone ? 12 : 14} color={Colors.accent3} />
            <Text style={[styles.pillText, isPhone && styles.pillTextPhone]}>Instant results</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.lightBackground },

  // Scroll content
  scrollView: { flex: 1 },
  scrollContent: { padding: 28, paddingBottom: 48 },

  // Cards container – side by side
  cardsContainer: { flexDirection: 'row', gap: 24, marginTop: 8, marginBottom: 36, justifyContent: 'center' },

  // Option card – base
  optionCard: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 20,
    padding: 16,
    justifyContent: 'space-between',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.10,
    shadowRadius: 10,
    maxWidth: 300,
    maxHeight: 300,
  },
  // Left card – light purple
  optionCardLeft: {
    backgroundColor: Colors.purple[200],
  },
  // Right card – dark
  optionCardRight: {
    backgroundColor: Colors.primary,
  },
  // White icon box in top-right
  cardIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  // Card title at bottom-left
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 23,
  },
  cardTitleDark: {
    color: Colors.foreground,
  },
  cardTitleLight: {
    color: '#fff',
  },

  // Info pills
  infoPills: { flexDirection: 'row', gap: 12, justifyContent: 'center' },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.background, paddingVertical: 8, paddingHorizontal: 14,
    borderRadius: 999, borderWidth: 1, borderColor: Colors.border,
  },
  pillText: { fontSize: 13, fontWeight: '500', color: Colors.mutedForeground },

  // Phone-specific responsive overrides (width < 600)
  scrollContentPhone: { padding: 16, paddingBottom: 36 },
  cardsContainerPhone: { gap: 14, marginBottom: 24 },
  optionCardPhone: { padding: 12, borderRadius: 16 },
  cardIconBoxPhone: { width: 34, height: 34, borderRadius: 10 },
  cardTitlePhone: { fontSize: 14, lineHeight: 19 },
  pillPhone: { paddingVertical: 6, paddingHorizontal: 10 },
  pillTextPhone: { fontSize: 11 },
});
