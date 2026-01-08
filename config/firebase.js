// Import the functions you need from the SDKs you need
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from "firebase/app";
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';


// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCMHUblQxiDxzZKMcB1UAXc-Qfy-hBmjXA", 
  authDomain: "get-roasted-cf2aa.firebaseapp.com",
  projectId: "get-roasted-cf2aa",
  storageBucket: "get-roasted-cf2aa.firebasestorage.app",
  messagingSenderId: "11276683184",
  appId: "1:11276683184:web:1e7fb27f5f0bd0b8417875",
  measurementId: "G-LTNNKTXCBP"
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