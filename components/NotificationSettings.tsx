// components/NotificationSettings.tsx
// Push notification toggle for settings screen

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Switch,
  StyleSheet,
  Alert,
  Linking,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Colors, BorderRadius, Spacing } from '../constants/theme';
import { auth, db } from '../config/firebase';
import {
  enablePushNotifications,
  disablePushNotifications,
  areNotificationsEnabled,
} from '../utils/pushNotifications';

export default function NotificationSettings() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const hasPermission = await areNotificationsEnabled();
      
      const userId = auth.currentUser?.uid;
      if (userId) {
        const userDoc = await getDoc(doc(db, 'users', userId));
        const userData = userDoc.data();
        const firestoreEnabled = userData?.notificationsEnabled ?? false;
        
        setEnabled(hasPermission && firestoreEnabled);
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTestNotification = async () => {
    setTesting(true);
    try {
      const functions = getFunctions();
      const sendTest = httpsCallable(functions, 'sendTestNotification');
      await sendTest({ message: '🧪 Test notification! If you see this, notifications are working!' });
      Alert.alert('Sent!', 'Check your notification center.');
    } catch (error: any) {
      console.error('Test notification error:', error);
      Alert.alert('Error', error.message || 'Failed to send test notification');
    } finally {
      setTesting(false);
    }
  };

  const handleToggle = async (value: boolean) => {
    setToggling(true);
    
    try {
      if (value) {
        const success = await enablePushNotifications();
        
        if (success) {
          setEnabled(true);
        } else {
          Alert.alert(
            'Enable Notifications',
            'To receive habit reminders, please enable notifications in your device settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
            ]
          );
        }
      } else {
        await disablePushNotifications();
        setEnabled(false);
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
      Alert.alert('Error', 'Failed to update notification settings.');
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.sectionHeader}>
          <Ionicons name="notifications-outline" size={18} color={Colors.textMuted} />
          <Text style={styles.sectionTitle}>REMINDERS</Text>
        </View>
        <View style={[styles.row, styles.loadingRow]}>
          <ActivityIndicator color={Colors.gold} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Ionicons name="notifications-outline" size={18} color={Colors.textMuted} />
        <Text style={styles.sectionTitle}>REMINDERS</Text>
      </View>

      <View style={styles.row}>
        <View style={styles.rowLeft}>
          <Ionicons name="alarm-outline" size={22} color={Colors.textSecondary} />
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>Daily Reminders</Text>
            <Text style={styles.rowSubtitle}>Get nudged if habits aren't done</Text>
          </View>
        </View>
        {toggling ? (
          <ActivityIndicator color={Colors.gold} />
        ) : (
          <Switch
            value={enabled}
            onValueChange={handleToggle}
            trackColor={{ false: Colors.border, true: Colors.gold }}
            thumbColor={Colors.textPrimary}
            ios_backgroundColor={Colors.border}
          />
        )}
      </View>

      {enabled && (
        <>
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={16} color={Colors.textMuted} />
            <Text style={styles.infoText}>
              You'll get a reminder at 3 PM if you have incomplete habits, and a streak warning at 8 PM (in your local time).
            </Text>
          </View>

          <TouchableOpacity
            style={styles.testButton}
            onPress={handleTestNotification}
            disabled={testing}
          >
            {testing ? (
              <ActivityIndicator color={Colors.gold} size="small" />
            ) : (
              <>
                <Ionicons name="paper-plane-outline" size={18} color={Colors.gold} />
                <Text style={styles.testButtonText}>Send Test Notification</Text>
              </>
            )}
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 2,
    marginLeft: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  loadingRow: {
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rowText: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  rowSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoText: {
    fontSize: 12,
    color: Colors.textMuted,
    marginLeft: Spacing.sm,
    flex: 1,
    lineHeight: 18,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.gold,
    marginTop: Spacing.sm,
  },
  testButtonText: {
    fontSize: 14,
    color: Colors.gold,
    marginLeft: Spacing.sm,
    fontWeight: '600',
  },
});
