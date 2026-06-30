// Import the functions you need from the SDKs you need
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from "firebase/app";
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';


// Your web app's Firebase configuration.
// A Firebase web API key is a public client identifier, not a secret —
// protect your data with Firestore Security Rules and API key restrictions,
// not by hiding this value. The hardcoded fallback ensures cloud (EAS) builds
// always have the key, since the gitignored .env is not uploaded to EAS.
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyA46mShRAIA5aVxzoHTSvlL4Eve8jOO3F8",
  authDomain: "get-roasted-1.firebaseapp.com",
  projectId: "get-roasted-1",
  storageBucket: "get-roasted-1.firebasestorage.app",
  messagingSenderId: "76344258138",
  appId: "1:76344258138:web:b0a3e26a57f4af82393263",
  measurementId: "G-4WXY9J06XX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize and export other services
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
