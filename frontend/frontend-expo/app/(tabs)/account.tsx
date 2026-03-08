import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { AlertModal } from '@/components/shared/AlertModal';
import { Header } from '@/components/shared/Header';
import { ReauthenticationModal } from '@/components/shared/ReauthenticationModal';
import { db } from '@/api/firebase';
import { Colors } from '@/constants/Colors';

export default function AccountScreen() {
  const router = useRouter();
  const { isDesktop } = useResponsiveLayout();
  const { user, signOut, deleteAccount, reauthenticateWithPassword, reauthenticateWithGoogle, isGuestUser } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showReauthModal, setShowReauthModal] = useState(false);
  const [authMethod, setAuthMethod] = useState<'email' | 'google'>('email');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>('');

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/login' as any);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const handleDeleteAccountClick = () => {
    const isGoogleUser = user?.providerData.some(
      (provider) => provider.providerId === 'google.com'
    );
    setAuthMethod(isGoogleUser ? 'google' : 'email');
    setShowDeleteConfirm(true);
    setError(null);
  };

  const handleDeleteAccountConfirm = () => {
    setShowDeleteConfirm(false);
    setShowReauthModal(true);
  };

  const handleDeleteAccountCancel = () => {
    setShowDeleteConfirm(false);
    setError(null);
  };

  const handleReauthConfirm = async (password?: string) => {
    try {
      if (authMethod === 'email' && password) {
        await reauthenticateWithPassword(password);
      } else if (authMethod === 'google') {
        await reauthenticateWithGoogle();
      }

      setShowReauthModal(false);
      setIsDeleting(true);
      setError(null);

      await deleteAccount();
      router.replace('/login' as any);
    } catch (err: any) {
      console.error('Delete account error:', err);
      setError(err.message || 'Failed to delete account. Please try again.');
      setIsDeleting(false);
      setShowReauthModal(false);
    }
  };

  const handleReauthCancel = () => {
    setShowReauthModal(false);
    setError(null);
  };

  // Fetch display name from Firestore
  useEffect(() => {
    const fetchDisplayName = async () => {
      if (!user) return;

      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          setDisplayName(userData.displayName || user.email?.split('@')[0] || 'User');
        } else {
          setDisplayName(user.email?.split('@')[0] || 'User');
        }
      } catch (err) {
        console.error('Error fetching display name:', err);
        setDisplayName(user.email?.split('@')[0] || 'User');
      }
    };

    fetchDisplayName();
  }, [user]);

  return (
    <View style={styles.container}>
      <Header />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          isDesktop && styles.contentDesktop,
        ]}
      >
        <View style={[styles.innerContent, isDesktop && styles.innerContentDesktop]}>
          {/* User Info Card */}
          <View style={styles.userInfoCard}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarCircle}>
                <Ionicons name="person" size={28} color={Colors.primary} />
              </View>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{displayName || 'User'}</Text>
              <Text style={styles.userEmail}>{user?.email || 'No email'}</Text>
            </View>
          </View>

          {/* Settings Section */}
          <View style={styles.section}>
            <View style={styles.menuGroup}>
              <TouchableOpacity style={styles.menuItem}>
                <View style={styles.menuItemLeft}>
                  <View style={[styles.menuIconBg, { backgroundColor: Colors.green[100] }]}>
                    <Ionicons name="shield-checkmark-outline" size={18} color={Colors.green[600]} />
                  </View>
                  <Text style={styles.menuItemText}>Privacy Policy</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.gray[400]} />
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              <TouchableOpacity style={styles.menuItem}>
                <View style={styles.menuItemLeft}>
                  <View style={[styles.menuIconBg, { backgroundColor: Colors.blue[50] }]}>
                    <Ionicons name="document-text-outline" size={18} color={Colors.blue[600]} />
                  </View>
                  <Text style={styles.menuItemText}>Terms of Service</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.gray[400]} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Sign Out Button */}
          <TouchableOpacity
            style={[styles.actionButton, isGuestUser && styles.buttonDisabled]}
            onPress={() => {
              if (isGuestUser) {
                if (Platform.OS === 'web') {
                  window.alert('Refresh Page to Sign Out');
                } else {
                  Alert.alert('Sign Out', 'Refresh Page to Sign Out');
                }
                return;
              }
              handleSignOut();
            }}
          >
            <Ionicons name="log-out-outline" size={20} color={isGuestUser ? Colors.gray[400] : Colors.red[600]} />
            <Text style={[styles.actionButtonText, { color: isGuestUser ? Colors.gray[400] : Colors.red[600] }]}>Sign Out</Text>
          </TouchableOpacity>

          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Delete Account Button */}
          <TouchableOpacity
            style={[styles.actionButton, (isDeleting || isGuestUser) && styles.buttonDisabled]}
            onPress={isGuestUser ? undefined : handleDeleteAccountClick}
            disabled={isDeleting || isGuestUser}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color={Colors.red[700]} />
            ) : (
              <>
                <Ionicons name="trash-outline" size={20} color={isGuestUser ? Colors.gray[400] : Colors.red[700]} />
                <Text style={[styles.actionButtonText, { color: isGuestUser ? Colors.gray[400] : Colors.red[700] }]}>Delete Account</Text>
              </>
            )}
          </TouchableOpacity>

          {/* App Version */}
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>
      </ScrollView>

      {/* Delete Account Confirmation Modal */}
      <AlertModal
        visible={showDeleteConfirm}
        title="Delete Account?"
        description="This will permanently delete your account and all associated data including appointments. This action cannot be undone and data cannot be recovered."
        confirmLabel="Continue"
        cancelLabel="Cancel"
        onConfirm={handleDeleteAccountConfirm}
        onCancel={handleDeleteAccountCancel}
      />

      {/* Reauthentication Modal */}
      <ReauthenticationModal
        visible={showReauthModal}
        authMethod={authMethod}
        onConfirm={handleReauthConfirm}
        onCancel={handleReauthCancel}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.lightBackground,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  contentDesktop: {
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingTop: 28,
  },
  innerContent: {
    width: '100%',
  },
  innerContentDesktop: {
    maxWidth: 560,
    width: '100%',
  },

  // User info
  userInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatarContainer: {
    marginRight: 14,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.foreground,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: Colors.mutedForeground,
  },

  // Sections
  section: {
    marginBottom: 24,
  },
  menuGroup: {
    backgroundColor: Colors.background,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  menuDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 58,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuIconBg: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemText: {
    fontSize: 15,
    color: Colors.foreground,
  },

  // Action buttons (sign out, delete)
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.background,
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
  buttonDisabled: {
    opacity: 0.5,
  },

  // Error
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

  // Version
  versionText: {
    fontSize: 13,
    color: Colors.gray[400],
    textAlign: 'center',
    marginTop: 8,
  },
});
