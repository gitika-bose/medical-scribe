import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';

/**
 * An inline card banner shown under the header of screens when the user
 * is signed in with the shared guest / test account.
 * Styled similar to the error banner on the recording screen.
 */
export function GuestDisclaimer() {
  const { isGuestUser } = useAuth();

  if (!isGuestUser) return null;

  return (
    <View style={styles.banner}>
      <Ionicons name="warning-outline" size={16} color="#92400E" />
      <Text style={styles.text}>
        Guest account data is public. Delete after use.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    width: 'auto',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
  },
  text: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#92400E',
  },
});
