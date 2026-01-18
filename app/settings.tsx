// app/settings.tsx
// Settings Screen with Account Deletion and Notifications

import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { doc, deleteDoc, collection, getDocs, writeBatch } from 'firebase/firestore';
import { deleteUser } from 'firebase/auth';
import React, { useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth, db } from '../config/firebase';
import { Colors, Spacing, BorderRadius } from '../constants/theme';
import NotificationSettings from '../components/NotificationSettings';

// ============== SETTINGS ROW COMPONENT ==============

interface SettingsRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
  showChevron?: boolean;
}

function SettingsRow({ icon, label, value, onPress, destructive, showChevron = true }: SettingsRowProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.settingsRow,
        pressed && onPress && styles.settingsRowPressed,
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.iconContainer, destructive && styles.iconContainerDestructive]}>
        <Ionicons
          name={icon}
          size={20}
          color={destructive ? Colors.error : Colors.accent}
        />
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowLabel, destructive && styles.rowLabelDestructive]}>
          {label}
        </Text>
        {value && <Text style={styles.rowValue}>{value}</Text>}
      </View>
      {showChevron && onPress && (
        <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
      )}
    </Pressable>
  );
}

// ============== MAIN COMPONENT ==============

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isDeleting, setIsDeleting] = useState(false);

  const appVersion = Constants.expoConfig?.version || '1.0.0';
  const buildNumber = Constants.expoConfig?.ios?.buildNumber || 
                      Constants.expoConfig?.android?.versionCode?.toString() || '1';

  const handlePrivacyPolicy = () => {
    const privacyPolicyUrl = 'https://apexlad.netlify.app/privacy';
    Linking.openURL(privacyPolicyUrl).catch(() => {
      Alert.alert('Error', 'Could not open privacy policy');
    });
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This will permanently delete all your habits, progress, and data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete Account', style: 'destructive', onPress: confirmDeleteAccount },
      ]
    );
  };

  const confirmDeleteAccount = () => {
    Alert.alert(
      'Final Confirmation',
      'This is your last chance. All your data will be permanently deleted.',
      [
        { text: 'Keep My Account', style: 'cancel' },
        { text: 'Yes, Delete Everything', style: 'destructive', onPress: executeDeleteAccount },
      ]
    );
  };

  const executeDeleteAccount = async () => {
    setIsDeleting(true);
    
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'No user signed in');
        setIsDeleting(false);
        return;
      }

      const userId = user.uid;

      // Delete all subcollections
      const habitsRef = collection(db, 'users', userId, 'habits');
      const habitsSnapshot = await getDocs(habitsRef);
      
      const batch = writeBatch(db);
      habitsSnapshot.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });

      const roastsRef = collection(db, 'users', userId, 'dailyRoasts');
      const roastsSnapshot = await getDocs(roastsRef);
      roastsSnapshot.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });

      const checkInsRef = collection(db, 'users', userId, 'checkIns');
      const checkInsSnapshot = await getDocs(checkInsRef);
      checkInsSnapshot.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });

      await batch.commit();

      // Delete the user document
      await deleteDoc(doc(db, 'users', userId));

      // Delete Firebase Auth account
      await deleteUser(user);

      router.replace('/');
      
    } catch (error: any) {
      console.error('Error deleting account:', error);
      
      if (error.code === 'auth/requires-recent-login') {
        Alert.alert(
          'Re-authentication Required',
          'For security, please sign out and sign back in, then try deleting your account again.',
          [{ text: 'OK', style: 'default' }]
        );
      } else {
        Alert.alert('Error', 'Failed to delete account. Please try again or contact support.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  if (isDeleting) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color={Colors.accent} />
        <Text style={styles.loadingText}>DELETING ACCOUNT...</Text>
        <Text style={styles.loadingSubtext}>Please wait, this may take a moment</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <Pressable
          style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>SETTINGS</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Notification Settings */}
        <NotificationSettings />

        {/* Legal Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>LEGAL</Text>
          <View style={styles.sectionContent}>
            <SettingsRow
              icon="document-text-outline"
              label="Privacy Policy"
              onPress={handlePrivacyPolicy}
            />
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ABOUT</Text>
          <View style={styles.sectionContent}>
            <SettingsRow
              icon="information-circle-outline"
              label="App Version"
              value={`${appVersion} (${buildNumber})`}
              showChevron={false}
            />
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, styles.sectionTitleDanger]}>DANGER ZONE</Text>
          <View style={[styles.sectionContent, styles.sectionContentDanger]}>
            <SettingsRow
              icon="trash-outline"
              label="Delete Account"
              onPress={handleDeleteAccount}
              destructive
              showChevron={false}
            />
          </View>
          <Text style={styles.dangerDescription}>
            Permanently delete your account and all associated data including habits, streaks, and check-in history.
          </Text>
        </View>

        <View style={{ height: insets.bottom + 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
    marginTop: Spacing.lg,
  },
  loadingSubtext: {
    color: Colors.textMuted,
    fontSize: 13,
    marginTop: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonPressed: {
    backgroundColor: Colors.border,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 2,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 2,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  sectionTitleDanger: {
    color: Colors.error,
  },
  sectionContent: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  sectionContentDanger: {
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.surface,
  },
  settingsRowPressed: {
    backgroundColor: Colors.border,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: Colors.accentDim || 'rgba(212, 175, 55, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  iconContainerDestructive: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  rowContent: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  rowLabelDestructive: {
    color: Colors.error,
  },
  rowValue: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
  dangerDescription: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
    marginHorizontal: Spacing.xs,
    lineHeight: 18,
  },
});
