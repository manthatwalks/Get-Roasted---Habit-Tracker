// app/checkin/[id].tsx
// Check-In Screen - NO Paddy, clean header

import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { addDoc, collection, doc, getDoc, updateDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
  StatusBar,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth, db, storage } from '../../config/firebase';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import ApexModal from '../../components/ApexModal';
import ApexSuccessScreen from '../../components/ApexSuccessScreen';

// ============== HELPERS ==============

function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getYesterdayDateString(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return getLocalDateString(yesterday);
}

// ============== INTERFACES ==============

interface Habit {
  id: string;
  name: string;
  description: string;
  currentStreak: number;
  longestStreak: number;
  totalCheckIns: number;
  lastCheckIn?: string;
  lastCheckInLocal?: string;
}

interface ModalState {
  visible: boolean;
  mood: 'pleased' | 'talking';
  title: string;
  message: string;
  buttonText: string;
  onCloseAction: 'stay' | 'goBack';
}

interface SuccessState {
  visible: boolean;
  streak: number;
  habitName: string;
  roastMessage: string;
}

// ============== STREAK LOGIC ==============

function isCompletedToday(habit: Habit): boolean {
  const today = getLocalDateString();
  if (habit.lastCheckInLocal) return habit.lastCheckInLocal === today;
  if (habit.lastCheckIn) return habit.lastCheckIn.split('T')[0] === today;
  return false;
}

function isCompletedYesterday(habit: Habit): boolean {
  const yesterday = getYesterdayDateString();
  if (habit.lastCheckInLocal) return habit.lastCheckInLocal === yesterday;
  if (habit.lastCheckIn) return habit.lastCheckIn.split('T')[0] === yesterday;
  return false;
}

function calculateNewStreak(habit: Habit): number {
  if (!habit.lastCheckIn && !habit.lastCheckInLocal) return 1;
  if (isCompletedToday(habit)) return Math.max(habit.currentStreak, 1);
  if (isCompletedYesterday(habit)) return habit.currentStreak + 1;
  return 1;
}

// ============== WARM BUTTON COMPONENT ==============

interface WarmButtonProps {
  title: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: 'primary' | 'secondary';
  loading?: boolean;
  disabled?: boolean;
}

function WarmButton({ title, onPress, icon, variant = 'primary', loading, disabled }: WarmButtonProps) {
  const isPrimary = variant === 'primary';
  
  return (
    <Pressable
      style={({ pressed }) => [
        buttonStyles.button,
        isPrimary ? buttonStyles.primary : buttonStyles.secondary,
        pressed && buttonStyles.pressed,
        disabled && buttonStyles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? Colors.buttonPrimaryText : Colors.buttonSecondaryText} />
      ) : (
        <>
          {icon && (
            <Ionicons 
              name={icon} 
              size={20} 
              color={isPrimary ? Colors.buttonPrimaryText : Colors.buttonSecondaryText} 
              style={buttonStyles.icon}
            />
          )}
          <Text style={[
            buttonStyles.text,
            isPrimary ? buttonStyles.primaryText : buttonStyles.secondaryText
          ]}>
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const buttonStyles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.button,
    ...Shadows.button,
  },
  primary: {
    backgroundColor: Colors.buttonPrimary,
  },
  secondary: {
    backgroundColor: Colors.buttonSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.5,
  },
  icon: {
    marginRight: Spacing.sm,
  },
  text: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  primaryText: {
    color: Colors.buttonPrimaryText,
  },
  secondaryText: {
    color: Colors.buttonSecondaryText,
  },
});

// ============== MAIN COMPONENT ==============

export default function CheckInScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const functions = getFunctions();
  const insets = useSafeAreaInsets();

  const [habit, setHabit] = useState<Habit | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  const [modal, setModal] = useState<ModalState>({
    visible: false,
    mood: 'pleased',
    title: '',
    message: '',
    buttonText: 'OK',
    onCloseAction: 'stay',
  });

  const [success, setSuccess] = useState<SuccessState>({
    visible: false,
    streak: 0,
    habitName: '',
    roastMessage: '',
  });

  useEffect(() => {
    loadHabit();
  }, [id]);

  const loadHabit = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const habitRef = doc(db, 'users', userId, 'habits', id);
      const habitSnap = await getDoc(habitRef);

      if (habitSnap.exists()) {
        setHabit({ id: habitSnap.id, ...habitSnap.data() } as Habit);
      } else {
        showModal('talking', 'ERROR', 'Habit not found.', 'GO BACK', 'goBack');
      }
    } catch (error) {
      console.error('Error loading habit:', error);
      showModal('talking', 'ERROR', 'Could not load habit data.', 'GO BACK', 'goBack');
    } finally {
      setLoading(false);
    }
  };

  const showModal = (
    mood: 'pleased' | 'talking',
    title: string,
    message: string,
    buttonText: string = 'OK',
    onCloseAction: 'stay' | 'goBack' = 'stay'
  ) => {
    setModal({ visible: true, mood, title, message, buttonText, onCloseAction });
  };

  const handleModalClose = () => {
    const action = modal.onCloseAction;
    setModal((prev) => ({ ...prev, visible: false }));
    if (action === 'goBack') router.back();
  };

  const handleSuccessClose = () => {
    setSuccess((prev) => ({ ...prev, visible: false }));
    router.back();
  };

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
      showModal(
        'talking',
        'PERMISSION NEEDED',
        'Camera and photo access required for verification.',
        'GOT IT'
      );
      return false;
    }
    return true;
  };

  const takePhoto = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const submitCheckIn = async () => {
    if (!imageUri) {
      showModal('talking', 'NO PHOTO', 'Take a photo first to verify your check-in.', 'ALRIGHT');
      return;
    }

    if (!habit) return;

    if (isCompletedToday(habit)) {
      showModal(
        'pleased',
        'ALREADY DONE',
        "You've already completed this today! Come back tomorrow.",
        'NICE ONE',
        'goBack'
      );
      return;
    }

    setUploading(true);

    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error('Not authenticated');

      setUploadProgress('Uploading photo...');
      const photoUrl = await uploadPhoto(imageUri, userId, id);

      setUploadProgress('Checking your proof...');
      const verifyFunction = httpsCallable(functions, 'verifyHabitPhoto');
      const verifyResult = await verifyFunction({
        photoUrl,
        habitName: habit.name,
        habitDescription: habit.description,
      });

      const { verified, reason } = verifyResult.data as { verified: boolean; reason: string };

      if (!verified) {
        setUploading(false);
        setUploadProgress('');
        showModal(
          'talking',
          'NOT QUITE',
          `${reason}\n\nTry again with clearer proof.`,
          'RETRY'
        );
        return;
      }

      const newStreak = calculateNewStreak(habit);

      setUploadProgress('Getting your feedback...');
      const roastFunction = httpsCallable(functions, 'generateRoast');
      const roastResult = await roastFunction({
        success: true,
        habitName: habit.name,
        streak: newStreak,
      });

      const { roast } = roastResult.data as { roast: string };

      const now = new Date();
      const localDateString = getLocalDateString(now);

      setUploadProgress('Saving your progress...');
      await addDoc(collection(db, 'users', userId, 'checkins'), {
        habitId: id,
        habitName: habit.name,
        photoUrl,
        timestamp: now.toISOString(),
        localDate: localDateString,
        verified,
        aiReason: reason,
        roast,
      });

      await updateDoc(doc(db, 'users', userId, 'habits', id), {
        currentStreak: newStreak,
        longestStreak: Math.max(newStreak, habit.longestStreak),
        totalCheckIns: habit.totalCheckIns + 1,
        lastCheckIn: now.toISOString(),
        lastCheckInLocal: localDateString,
      });

      setUploading(false);
      setUploadProgress('');

      setSuccess({
        visible: true,
        streak: newStreak,
        habitName: habit.name,
        roastMessage: roast,
      });
    } catch (error: any) {
      console.error('Error submitting check-in:', error);
      setUploading(false);
      setUploadProgress('');
      showModal('talking', 'ERROR', error.message || 'Something went wrong. Try again.', 'RETRY');
    }
  };

  const uploadPhoto = async (uri: string, userId: string, habitId: string): Promise<string> => {
    const timestamp = Date.now();
    const filename = `${userId}/${habitId}/${timestamp}.jpg`;

    const response = await fetch(uri);
    const blob = await response.blob();

    const storageRef = ref(storage, `checkins/${filename}`);
    await uploadBytes(storageRef, blob);

    return await getDownloadURL(storageRef);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="hourglass-outline" size={32} color={Colors.accent} />
        <Text style={styles.loadingText}>LOADING...</Text>
      </View>
    );
  }

  if (!habit) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="alert-circle-outline" size={32} color={Colors.danger} />
        <Text style={styles.loadingText}>HABIT NOT FOUND</Text>
      </View>
    );
  }

  const alreadyDoneToday = isCompletedToday(habit);

  return (
    <>
      {/* Hide the default header */}
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />

        {/* Custom Header */}
        <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
          </Pressable>
          
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerLabel}>CHECK-IN</Text>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {habit.name}
            </Text>
          </View>
          
          <View style={styles.streakBadge}>
            <Ionicons name="flame" size={16} color={Colors.streak} />
            <Text style={styles.streakText}>{habit.currentStreak}</Text>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Criteria Card */}
          <View style={styles.criteriaCard}>
            <View style={styles.criteriaHeader}>
              <Ionicons name="document-text-outline" size={18} color={Colors.textMuted} />
              <Text style={styles.criteriaLabel}>VERIFICATION CRITERIA</Text>
            </View>
            <Text style={styles.criteriaText}>{habit.description}</Text>
          </View>

          {alreadyDoneToday ? (
            <View style={styles.completedState}>
              <View style={styles.completedIcon}>
                <Ionicons name="checkmark-circle" size={64} color={Colors.success} />
              </View>
              <Text style={styles.completedTitle}>DONE FOR TODAY</Text>
              <Text style={styles.completedText}>
                You've already completed this habit today. Come back tomorrow!
              </Text>
              <WarmButton
                title="BACK TO HOME"
                onPress={() => router.back()}
                variant="secondary"
              />
            </View>
          ) : (
            <>
              {/* Image Section */}
              {imageUri ? (
                <View style={styles.imageSection}>
                  <Image source={{ uri: imageUri }} style={styles.previewImage} />
                  <Pressable style={styles.retakeButton} onPress={() => setImageUri(null)}>
                    <Ionicons name="refresh-outline" size={18} color={Colors.textSecondary} />
                    <Text style={styles.retakeText}>RETAKE</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.captureSection}>
                  <Pressable style={styles.captureButton} onPress={takePhoto}>
                    <View style={styles.captureIconContainer}>
                      <Ionicons name="camera-outline" size={32} color={Colors.accent} />
                    </View>
                    <Text style={styles.captureTitle}>TAKE A PHOTO</Text>
                    <Text style={styles.captureSubtitle}>Snap your proof</Text>
                  </Pressable>

                  <Pressable style={styles.galleryButton} onPress={pickImage}>
                    <Ionicons name="images-outline" size={20} color={Colors.textSecondary} />
                    <Text style={styles.galleryText}>CHOOSE FROM GALLERY</Text>
                  </Pressable>
                </View>
              )}

              {/* Submit Button */}
              {imageUri && (
                <View style={styles.submitSection}>
                  {uploading ? (
                    <View style={styles.uploadingState}>
                      <ActivityIndicator color={Colors.accent} size="small" />
                      <Text style={styles.uploadingText}>{uploadProgress}</Text>
                    </View>
                  ) : (
                    <WarmButton
                      title="SUBMIT CHECK-IN"
                      onPress={submitCheckIn}
                      icon="shield-checkmark-outline"
                    />
                  )}
                </View>
              )}
            </>
          )}

          <View style={styles.bottomPadding} />
        </ScrollView>

        <ApexModal
          visible={modal.visible}
          mood={modal.mood}
          title={modal.title}
          message={modal.message}
          buttonText={modal.buttonText}
          onClose={handleModalClose}
        />

        <ApexSuccessScreen
          visible={success.visible}
          streak={success.streak}
          habitName={success.habitName}
          roastMessage={success.roastMessage}
          onClose={handleSuccessClose}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 2,
    marginTop: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 1.5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accentDim,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderAccent,
  },
  streakText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.streak,
    marginLeft: 4,
    fontVariant: ['tabular-nums'],
  },
  content: {
    flex: 1,
    paddingTop: Spacing.lg,
  },
  criteriaCard: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  criteriaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  criteriaLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 1,
    marginLeft: Spacing.sm,
  },
  criteriaText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  completedState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl * 2,
    paddingHorizontal: Spacing.xxl,
  },
  completedIcon: {
    marginBottom: Spacing.lg,
  },
  completedTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.success,
    letterSpacing: 2,
    marginBottom: Spacing.sm,
  },
  completedText: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.xxl,
  },
  imageSection: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  previewImage: {
    width: '100%',
    height: 280,
    borderRadius: BorderRadius.card,
    borderWidth: 2,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
  },
  retakeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    letterSpacing: 1,
    marginLeft: Spacing.sm,
  },
  captureSection: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  captureButton: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.card,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
    marginBottom: Spacing.md,
  },
  captureIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  captureTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 1,
    marginBottom: 4,
  },
  captureSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  galleryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  galleryText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    letterSpacing: 1,
    marginLeft: Spacing.sm,
  },
  submitSection: {
    paddingHorizontal: Spacing.lg,
  },
  uploadingState: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.button,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  uploadingText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 1,
    marginLeft: Spacing.md,
  },
  bottomPadding: {
    height: 40,
  },
});