import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/hooks/useAuth';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { oobCode, mode } = useLocalSearchParams<{ oobCode?: string; mode?: string }>();
  const { verifyPasswordResetCode, resetPassword } = useAuth();
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [email, setEmail] = useState<string>('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Verify the reset code when component mounts
  useEffect(() => {
    const verifyCode = async () => {
      if (!oobCode || mode !== 'resetPassword') {
        setError('Invalid password reset link. Please request a new one.');
        setVerifying(false);
        return;
      }

      try {
        const userEmail = await verifyPasswordResetCode(oobCode);
        setEmail(userEmail);
        setVerifying(false);
      } catch (err: any) {
        console.error('Error verifying reset code:', err);
        setError(err.message || 'Invalid or expired reset link. Please request a new one.');
        setVerifying(false);
      }
    };

    verifyCode();
  }, [oobCode, mode]);

  const handleResetPassword = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Validate inputs
      if (!newPassword.trim()) {
        setError('Please enter a new password.');
        return;
      }

      if (newPassword.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }

      if (newPassword !== confirmPassword) {
        setError('Passwords do not match. Please try again.');
        return;
      }

      if (!oobCode) {
        setError('Invalid reset code. Please request a new reset link.');
        return;
      }

      // Reset the password
      await resetPassword(oobCode, newPassword);
      
      setSuccess('Password reset successful! Redirecting to login...');
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.replace('/login');
      }, 2000);
    } catch (err: any) {
      console.error('Reset password error:', err);
      setError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.blue[700]} />
        <Text style={styles.verifyingText}>Verifying reset link...</Text>
      </View>
    );
  }

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
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            Enter your new password for{'\n'}{email}
          </Text>
        </View>

        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Success Message */}
        {success && (
          <View style={styles.successContainer}>
            <Text style={styles.successText}>{success}</Text>
          </View>
        )}

        {/* New Password Input */}
        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color="#6B7280" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="New password"
            placeholderTextColor="#9CA3AF"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Confirm Password Input */}
        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color="#6B7280" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Confirm new password"
            placeholderTextColor="#9CA3AF"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Reset Password Button */}
        <TouchableOpacity
          style={[styles.resetButton, (loading || success) && styles.buttonDisabled]}
          onPress={handleResetPassword}
          disabled={loading || !!success}
          activeOpacity={0.7}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.resetButtonText}>Reset Password</Text>
          )}
        </TouchableOpacity>

        {/* Sign In Link */}
        <View style={styles.signInContainer}>
          <Text style={styles.signInText}>Remember your password? </Text>
          <TouchableOpacity onPress={() => router.push('/login')} activeOpacity={0.7}>
            <Text style={styles.signInLink}>Sign in</Text>
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
    lineHeight: 24,
  },
  verifyingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
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
  successContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
  },
  successText: {
    fontSize: 14,
    color: '#15803D',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
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
    color: '#111',
  },
  resetButton: {
    backgroundColor: Colors.blue[700],
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  resetButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInText: {
    fontSize: 14,
    color: '#111',
  },
  signInLink: {
    fontSize: 14,
    color: Colors.blue[700],
  },
});
