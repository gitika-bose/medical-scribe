import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { analyticsEvents } from '@/api/analytics';
import { Ionicons } from '@expo/vector-icons';
import { AlertModal } from '@/components/shared/AlertModal';
import { Colors } from '@/constants/Colors';

export default function LoginScreen() {
  const router = useRouter();
  const { signInWithGoogle, signInWithEmail, signInAsGuest, user, isGoogleSignInReady } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [showGuestConsent, setShowGuestConsent] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (user) {
      router.replace('/(tabs)');
    }
  }, [user]);

  const handleEmailLogin = async () => {
    try {
      setEmailLoading(true);
      setError(null);
      if (!email.trim()) { setError('Please enter your email address.'); return; }
      if (!password.trim()) { setError('Please enter your password.'); return; }
      await signInWithEmail(email.trim(), password);
      analyticsEvents.userLogin('email');
      router.replace('/(tabs)');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to sign in. Please try again.');
    } finally {
      setEmailLoading(false);
    }
  };

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

  const handleGuestClick = () => { setShowGuestConsent(true); };

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

  const handleGuestConsentCancel = () => { setShowGuestConsent(false); };

  const isAnyLoading = loading || emailLoading || guestLoading;

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

        {/* Email Input */}
        <View style={styles.inputContainer}>
          <Ionicons name="mail-outline" size={20} color={Colors.mutedForeground} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={Colors.gray[400]}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
          />
        </View>

        {/* Password Input */}
        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color={Colors.mutedForeground} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={Colors.gray[400]}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Forgot Password Link */}
        <TouchableOpacity
          style={styles.forgotPasswordContainer}
          onPress={() => router.push('/forgotPassword')}
          activeOpacity={0.7}
        >
          <Text style={styles.forgotPasswordText}>Forget password?</Text>
        </TouchableOpacity>

        {/* Login Button */}
        <TouchableOpacity
          style={[styles.loginButton, isAnyLoading && styles.buttonDisabled]}
          onPress={handleEmailLogin}
          disabled={isAnyLoading}
          activeOpacity={0.7}
        >
          {emailLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.loginButtonText}>Login</Text>
          )}
        </TouchableOpacity>

        {/* Register Link */}
        <View style={styles.registerAccountContainer}>
          <Text style={styles.registerAccountText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/register')} activeOpacity={0.7}>
            <Text style={styles.registerAccountLink}>Sign up.</Text>
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Or Continue with</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Social Login Buttons */}
        <View style={styles.socialButtonsContainer}>
          <TouchableOpacity
            style={[styles.socialButton, (isAnyLoading || !isGoogleSignInReady) && styles.buttonDisabled]}
            onPress={handleGmailLogin}
            disabled={isAnyLoading || !isGoogleSignInReady}
            activeOpacity={0.7}
          >
            {loading ? (
              <ActivityIndicator size="small" color={Colors.foreground} />
            ) : (
              <Ionicons name="logo-google" size={20} color="#DB4437" />
            )}
            <Text style={styles.socialButtonText}>Google</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.socialButton, isAnyLoading && styles.buttonDisabled]}
            onPress={handleGuestClick}
            disabled={isAnyLoading}
            activeOpacity={0.7}
          >
            {guestLoading ? (
              <ActivityIndicator size="small" color={Colors.foreground} />
            ) : (
              <Ionicons name="person-outline" size={20} color={Colors.primary} />
            )}
            <Text style={styles.socialButtonText}>Try it as a guest</Text>
          </TouchableOpacity>
        </View>
      </View>

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
    backgroundColor: Colors.lightBackground,
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
    color: Colors.primary,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.mutedForeground,
    textAlign: 'center',
  },
  errorContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: Colors.red[50],
    borderWidth: 1,
    borderColor: Colors.red[300],
    borderRadius: 12,
  },
  errorText: {
    fontSize: 14,
    color: Colors.red[700],
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceBackground,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.foreground,
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: Colors.primary,
  },
  registerAccountContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  registerAccountText: {
    fontSize: 14,
    color: Colors.foreground,
  },
  registerAccountLink: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  loginButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: Colors.mutedForeground,
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  socialButtonText: {
    fontSize: 14,
    color: Colors.foreground,
    fontWeight: '500',
  },
});
