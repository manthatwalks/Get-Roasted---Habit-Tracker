// utils/pushNotifications.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { doc, setDoc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import Constants from 'expo-constants';

export function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permission denied');
      return null;
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    const token = tokenData.data;

    console.log('Expo Push Token:', token);
    await savePushToken(token);

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#D4AF37',
      });
    }

    return token;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
}

async function savePushToken(token: string): Promise<void> {
  const userId = auth.currentUser?.uid;
  if (!userId) {
    console.log('No user logged in');
    return;
  }

  try {
    const timezone = getUserTimezone();
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      expoPushToken: token,
      pushTokenUpdatedAt: new Date().toISOString(),
      notificationsEnabled: true,
      timezone,
    }, { merge: true });
    console.log('Push token and timezone saved to Firestore:', timezone);
  } catch (error) {
    console.error('Error saving push token:', error);
  }
}

export async function disablePushNotifications(): Promise<void> {
  const userId = auth.currentUser?.uid;
  if (!userId) return;

  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, { notificationsEnabled: false }, { merge: true });
    console.log('Push notifications disabled');
  } catch (error) {
    console.error('Error disabling push notifications:', error);
  }
}

export async function enablePushNotifications(): Promise<boolean> {
  const token = await registerForPushNotifications();
  return token !== null;
}

export async function areNotificationsEnabled(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

export async function updateUserTimezone(): Promise<void> {
  const userId = auth.currentUser?.uid;
  if (!userId) return;

  try {
    const timezone = getUserTimezone();
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, { timezone }, { merge: true });
    console.log('User timezone updated:', timezone);
  } catch (error) {
    console.error('Error updating timezone:', error);
  }
}