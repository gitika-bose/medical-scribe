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
import { AlertModal } from '@/components/shared/AlertModal';

export default function LoginScreen() {
  const router = useRouter();
  const { signInWithGoogle, signInAsGuest, user, isGoogleSignInReady } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [showGuestConsent, setShowGuestConsent] = useState(false);

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
    } catch (err) {
      console.error('Login error:', err);
      setError('Failed to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestClick = () => {
    setShowGuestConsent(true);
  };

  const handleGuestConsentAgree = async () => {
    setShowGuestConsent(false);
    try {
      setGuestLoading(true);
      setError(null);
      await signInAsGuest();
      analyticsEvents.tryAsGuest();
    } catch (err) {
      console.error('Guest login error:', err);
      setError('Failed to sign in as guest. Please try again.');
    } finally {
      setGuestLoading(false);
    }
  };

  const handleGuestConsentCancel = () => {
    setShowGuestConsent(false);
  };

  const isAnyLoading = loading || guestLoading;

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
          style={[styles.signInButton, (isAnyLoading || !isGoogleSignInReady) && styles.buttonDisabled]}
          onPress={handleGmailLogin}
          disabled={isAnyLoading || !isGoogleSignInReady}
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

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Try as guest button */}
        <TouchableOpacity
          style={[styles.guestButton, isAnyLoading && styles.buttonDisabled]}
          onPress={handleGuestClick}
          disabled={isAnyLoading}
          activeOpacity={0.7}
        >
          {guestLoading ? (
            <ActivityIndicator size="small" color="#2563EB" />
          ) : (
            <Ionicons name="person-outline" size={20} color="#2563EB" />
          )}
          <Text style={styles.guestButtonText}>
            {guestLoading ? 'Signing in as guest...' : 'Try as a Guest'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Guest consent popup */}
      <AlertModal
        visible={showGuestConsent}
        title="Guest Account Notice"
        description={'Guest account data is shared and public.\nPlease delete your data after use.'}
        confirmLabel="I Agree"
        cancelLabel="Cancel"
        onConfirm={handleGuestConsentAgree}
        onCancel={handleGuestConsentCancel}
      />
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
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  signInText: {
    fontSize: 16,
    color: '#111',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#9CA3AF',
  },
  guestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
    borderColor: '#BFDBFE',
    borderRadius: 999,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  guestButtonText: {
    fontSize: 16,
    color: '#2563EB',
    fontWeight: '500',
  },
});
