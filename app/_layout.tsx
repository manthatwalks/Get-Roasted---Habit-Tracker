// app/_layout.tsx
import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { View, Text, ActivityIndicator } from 'react-native';
import * as Notifications from 'expo-notifications';
import { auth } from '../config/firebase';
import { signInAnonymously, User } from 'firebase/auth';
import { registerForPushNotifications, updateUserTimezone } from '../utils/pushNotifications';

// Configure how notifications should be displayed
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function RootLayout() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const signIn = async () => {
      try {
        const userCredential = await signInAnonymously(auth);
        setUser(userCredential.user);
        console.log('User signed in:', userCredential.user.uid);
      } catch (error) {
        console.error('Auth error:', error);
      } finally {
        setLoading(false);
      }
    };

    signIn();
  }, []);

  useEffect(() => {
    if (user) {
      registerForPushNotifications();
      updateUserTimezone();
    }
  }, [user]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 10 }}>Loading...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 18, textAlign: 'center' }}>
          Could not connect. Please check your internet and restart.
        </Text>
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}