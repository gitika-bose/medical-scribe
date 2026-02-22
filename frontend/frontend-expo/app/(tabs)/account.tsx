import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { AlertModal } from '@/components/shared/AlertModal';
import { ReauthenticationModal } from '@/components/shared/ReauthenticationModal';
import { db } from '@/api/firebase';
import { Colors } from '@/constants/Colors';

export default function AccountScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
    // Determine authentication method based on user's provider data
    const isGoogleUser = user?.providerData.some(
      (provider) => provider.providerId === 'google.com'
    );
    setAuthMethod(isGoogleUser ? 'google' : 'email');
    setShowDeleteConfirm(true);
    setError(null);
  };

  const handleDeleteAccountConfirm = () => {
    // Show reauthentication modal before proceeding
    setShowDeleteConfirm(false);
    setShowReauthModal(true);
  };

  const handleDeleteAccountCancel = () => {
    setShowDeleteConfirm(false);
    setError(null);
  };

  const handleReauthConfirm = async (password?: string) => {
    try {
      // Reauthenticate based on auth method
      if (authMethod === 'email' && password) {
        await reauthenticateWithPassword(password);
      } else if (authMethod === 'google') {
        await reauthenticateWithGoogle();
      }

      // Close reauth modal
      setShowReauthModal(false);

      // Proceed with account deletion
      setIsDeleting(true);
      setError(null);

      await deleteAccount();

      // Navigate to login after successful deletion
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
      {/* Header */}
      <View style={[styles.header]}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('@/assets/images/icon.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.headerTitle}>Juno</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* User Info Card */}
        <TouchableOpacity style={styles.userInfoCard}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person-circle-outline" size={60} color={Colors.blue[600]} />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{displayName || 'User'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'No email'}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.gray[400]} />
        </TouchableOpacity>

        {/* Account Settings Section */}
        {/* <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          
          <View style={styles.menuGroup}>
            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <Ionicons name="person-outline" size={22} color={Colors.gray[600]} />
                <Text style={styles.menuItemText}>Edit Profile</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.gray[400]} />
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <Ionicons name="lock-closed-outline" size={22} color={Colors.gray[600]} />
                <Text style={styles.menuItemText}>Change Password</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.gray[400]} />
            </TouchableOpacity> */}

            {/* <View style={styles.menuDivider} />

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <Ionicons name="notifications-outline" size={22} color={Colors.gray[600]} />
                <Text style={styles.menuItemText}>Notifications</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.gray[400]} />
            </TouchableOpacity> */}
          {/* </View>
        </View> */}

        {/* App Settings Section */}
        <View style={styles.section}>
          {/* <Text style={styles.sectionTitle}>App Settings</Text> */}
          
          <View style={styles.menuGroup}>
            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <Ionicons name="shield-checkmark-outline" size={22} color={Colors.gray[600]} />
                <Text style={styles.menuItemText}>Privacy Policy</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.gray[400]} />
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <Ionicons name="document-text-outline" size={22} color={Colors.gray[600]} />
                <Text style={styles.menuItemText}>Terms of Service</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.gray[400]} />
            </TouchableOpacity>

            {/* <View style={styles.menuDivider} />

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <Ionicons name="help-circle-outline" size={22} color={Colors.gray[600]} />
                <Text style={styles.menuItemText}>Help & Support</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.gray[400]} />
            </TouchableOpacity> */}
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={22} color={Colors.red[600]} />
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>

        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Delete Account Button */}
        <TouchableOpacity 
          style={[styles.deleteAccountButton, isDeleting && styles.buttonDisabled]} 
          onPress={handleDeleteAccountClick}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <ActivityIndicator size="small" color={Colors.red[700]} />
          ) : (
            <>
              <Ionicons name="trash-outline" size={22} color={Colors.red[700]} />
              <Text style={styles.deleteAccountButtonText}>Delete Account</Text>
            </>
          )}
        </TouchableOpacity>

        {/* App Version */}
        <Text style={styles.versionText}>Version 1.0.0</Text>
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
    backgroundColor: Colors.gray[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logo: {
    width: 28,
    height: 28,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.blue[700],
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.foreground,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  userInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatarContainer: {
    marginRight: 12,
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
    color: Colors.gray[500],
  },
  menuGroup: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: Colors.background,
  },
  menuDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 54,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: Colors.foreground,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.background,
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  signOutButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.red[600],
  },
  deleteAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.background,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  deleteAccountButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.red[700],
  },
  buttonDisabled: {
    opacity: 0.5,
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
  versionText: {
    fontSize: 14,
    color: Colors.gray[400],
    textAlign: 'center',
  },
});
