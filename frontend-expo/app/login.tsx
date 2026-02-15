import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { analyticsEvents } from '@/api/analytics';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const router = useRouter();
  const { signInWithGoogle, user, isGoogleSignInReady } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.replace('/(tabs)');
    }
  }, [user]);

  const handleGmailLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      await signInWithGoogle();
      analyticsEvents.userLogin('google');
      // Navigation happens via useEffect when user state updates
    } catch (err) {
      console.error('Login error:', err);
      setError('Failed to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Logo and Header */}
        <View style={styles.header}>
          <Image
            source={require('../assets/images/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Welcome to Juno</Text>
          <Text style={styles.subtitle}>
            Sign in to get started or try it out as a guest
          </Text>
        </View>

        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Sign in button */}
        <TouchableOpacity
          style={[styles.signInButton, (loading || !isGoogleSignInReady) && styles.signInButtonDisabled]}
          onPress={handleGmailLogin}
          disabled={loading || !isGoogleSignInReady}
          activeOpacity={0.7}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#111" />
          ) : (
            <Ionicons name="mail-outline" size={20} color="#EF4444" />
          )}
          <Text style={styles.signInText}>
            {loading ? 'Signing in...' : 'Sign in with Gmail'}
          </Text>
        </TouchableOpacity>

        {/* Try as guest */}
        <View style={styles.guestContainer}>
          <TouchableOpacity
            onPress={() => {
              analyticsEvents.tryAsGuest();
              // TODO: Navigate to guest home when implemented
              // router.push('/guest/home');
            }}
          >
            <Text style={styles.guestText}>Try as a guest?</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    width: '100%',
    maxWidth: 380,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 128,
    height: 128,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  errorContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#B91C1C',
  },
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 999,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  signInButtonDisabled: {
    opacity: 0.5,
  },
  signInText: {
    fontSize: 16,
    color: '#111',
  },
  guestContainer: {
    alignItems: 'center',
    marginTop: 32,
  },
  guestText: {
    fontSize: 16,
    color: '#2563EB',
  },
});
