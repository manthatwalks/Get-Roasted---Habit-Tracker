// app/(tabs)/add.tsx
// Create Habit Screen - Clean & Simple

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { addDoc, collection } from 'firebase/firestore';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ApexModal from '../../components/ApexModal';
import { auth, db } from '../../config/firebase';
import { BorderRadius, Colors, Shadows, Spacing } from '../../constants/theme';

// ============== WARM INPUT COMPONENT ==============

interface WarmInputProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  multiline?: boolean;
  numberOfLines?: number;
  maxLength?: number;
  returnKeyType?: 'next' | 'done';
  onSubmitEditing?: () => void;
  blurOnSubmit?: boolean;
  helperText?: string;
}

function WarmInput({
  label,
  placeholder,
  value,
  onChangeText,
  multiline,
  numberOfLines,
  maxLength,
  returnKeyType,
  onSubmitEditing,
  blurOnSubmit,
  helperText,
}: WarmInputProps) {
  return (
    <View style={inputStyles.container}>
      <Text style={inputStyles.label}>{label}</Text>
      {helperText && <Text style={inputStyles.helperText}>{helperText}</Text>}
      <TextInput
        style={[
          inputStyles.input,
          multiline && inputStyles.inputMultiline,
        ]}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        numberOfLines={numberOfLines}
        maxLength={maxLength}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
        blurOnSubmit={blurOnSubmit}
      />
    </View>
  );
}

const inputStyles = StyleSheet.create({
  container: {
    marginBottom: Spacing.xl,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    letterSpacing: 1,
    marginBottom: Spacing.xs,
  },
  helperText: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
    lineHeight: 18,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md + 2,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  inputMultiline: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: Spacing.md,
  },
});

// ============== WARM BUTTON COMPONENT ==============

interface WarmButtonProps {
  title: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
}

function WarmButton({ title, onPress, icon, loading, disabled }: WarmButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        buttonStyles.button,
        pressed && buttonStyles.pressed,
        disabled && buttonStyles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={Colors.buttonPrimaryText} />
      ) : (
        <>
          {icon && (
            <Ionicons
              name={icon}
              size={20}
              color={Colors.buttonPrimaryText}
              style={buttonStyles.icon}
            />
          )}
          <Text style={buttonStyles.text}>{title}</Text>
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
    backgroundColor: Colors.buttonPrimary,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.button,
    ...Shadows.button,
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
    color: Colors.buttonPrimaryText,
    letterSpacing: 1,
  },
});

// ============== MAIN COMPONENT ==============

export default function AddHabitScreen() {
  const [habitName, setHabitName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [modal, setModal] = useState({
    visible: false,
    mood: 'pleased' as 'pleased' | 'talking',
    title: '',
    message: '',
    buttonText: 'OK',
    goBack: false,
  });

  const showModal = (
    mood: 'pleased' | 'talking',
    title: string,
    message: string,
    buttonText: string = 'OK',
    goBack: boolean = false
  ) => {
    setModal({ visible: true, mood, title, message, buttonText, goBack });
  };

  const handleModalClose = () => {
    const shouldGoBack = modal.goBack;
    setModal((prev) => ({ ...prev, visible: false }));
    if (shouldGoBack) {
      router.back();
    }
  };

  const createHabit = async () => {
    if (!habitName.trim()) {
      showModal('talking', 'HOLD UP', 'You need to give this habit a name!', 'GOT IT');
      return;
    }

    if (!description.trim()) {
      showModal(
        'talking',
        'ONE MORE THING',
        'Tell me how to verify this habit. What should I look for in your photo?',
        'ALRIGHT'
      );
      return;
    }

    setLoading(true);

    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error('Not authenticated');

      await addDoc(collection(db, 'users', userId, 'habits'), {
        name: habitName.trim(),
        description: description.trim(),
        currentStreak: 0,
        longestStreak: 0,
        totalCheckIns: 0,
        createdAt: new Date().toISOString(),
      });

      setHabitName('');
      setDescription('');

      showModal(
        'pleased',
        'SORTED!',
        "Your new habit is ready to go. Now let's see you stick to it!",
        "LET'S GO",
        true
      );
    } catch (error) {
      console.error('Error creating habit:', error);
      showModal('talking', 'ERROR', 'Something went wrong. Give it another go.', 'RETRY');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Simple Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <Text style={styles.headerTitle}>NEW HABIT</Text>
        <View style={styles.headerLine} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            automaticallyAdjustKeyboardInsets={true}
          >
            {/* Form */}
            <View style={styles.form}>
              <WarmInput
                label="HABIT NAME"
                placeholder="e.g., Morning Workout"
                value={habitName}
                onChangeText={setHabitName}
                returnKeyType="next"
                maxLength={50}
              />

              <WarmInput
                label="PHOTO VERIFICATION"
                helperText="Alright lad, tell me exactly what you're snapping for proof. Be clear—I'll hold you to it."
                placeholder="e.g., Gym selfie or running shoes on feet"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                returnKeyType="done"
                blurOnSubmit={true}
                onSubmitEditing={Keyboard.dismiss}
                maxLength={200}
              />
            </View>

            {/* Submit Button */}
            <WarmButton
              title="CREATE HABIT"
              onPress={createHabit}
              loading={loading}
              disabled={loading}
              icon="add-circle-outline"
            />
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      <ApexModal
        visible={modal.visible}
        mood={modal.mood}
        title={modal.title}
        message={modal.message}
        buttonText={modal.buttonText}
        onClose={handleModalClose}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.background,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.accent,
    letterSpacing: 3,
  },
  headerLine: {
    height: 2,
    backgroundColor: Colors.border,
    marginTop: Spacing.md,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl,
    paddingBottom: 20,
  },
  form: {
    marginBottom: Spacing.xl,
  },
});