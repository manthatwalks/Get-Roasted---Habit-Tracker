// app/(tabs)/index.tsx
// Visual Novel Style Home Screen - Paddy LARGER and prominent

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { collection, deleteDoc, doc, getDocs, limit, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ApexModal from '../../components/ApexModal';
import SwipeableHabitCard from '../../components/SwipeableHabitCard';
import { auth, db } from '../../config/firebase';
import { BorderRadius, Colors, Shadows, Spacing } from '../../constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CHARACTER_HEIGHT = 370; // BIGGER - takes up more screen

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

function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Morning';
  if (hour >= 12 && hour < 17) return 'Afternoon';
  if (hour >= 17 && hour < 22) return 'Evening';
  return 'Late night';
}

function getMotivationalMessage(completed: number, total: number): string {
  if (total === 0) return "Oi, you haven't set up any habits yet! Let's get you sorted, yeah?";
  
  const percentage = (completed / total) * 100;
  const timeGreeting = getTimeBasedGreeting();
  
  if (completed === total) {
    return `${timeGreeting}! You've smashed every single one today. Proper job, that is. Get some rest, champion.`;
  }
  
  if (completed === 0) {
    return `${timeGreeting}! Nothing done yet? Come on then, let's see what you're made of. Time to get moving!`;
  }
  
  if (percentage >= 75) {
    return `${timeGreeting}! ${completed} out of ${total} done - you're nearly there! Don't go soft on me now.`;
  }
  
  if (percentage >= 50) {
    return `${timeGreeting}! Halfway there with ${completed}/${total}. Keep that energy up, we're building momentum.`;
  }
  
  return `${timeGreeting}! ${completed}/${total} complete. Still got work to do - let's crack on!`;
}

// ============== INTERFACES ==============

interface Habit {
  id: string;
  name: string;
  description: string;
  currentStreak: number;
  longestStreak: number;
  totalCheckIns: number;
  createdAt: string;
  lastCheckIn?: string;
  lastCheckInLocal?: string;
}

interface HabitWithDisplayStreak extends Habit {
  displayStreak: number;
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

function getDisplayStreak(habit: Habit): number {
  if (isCompletedToday(habit)) return habit.currentStreak;
  if (isCompletedYesterday(habit)) return habit.currentStreak;
  return 0;
}

// ============== PROGRESS BAR COMPONENT ==============

function WarmProgressBar({ completed, total }: { completed: number; total: number }) {
  const percentage = total > 0 ? (completed / total) * 100 : 0;
  
  return (
    <View style={progressStyles.container}>
      <View style={progressStyles.labelRow}>
        <Text style={progressStyles.label}>DAILY PROGRESS</Text>
        <Text style={progressStyles.count}>
          <Text style={progressStyles.countHighlight}>{completed}</Text>/{total}
        </Text>
      </View>
      <View style={progressStyles.barBackground}>
        <View style={[progressStyles.barFill, { width: `${percentage}%` }]} />
        {total > 1 && Array.from({ length: total - 1 }).map((_, i) => (
          <View
            key={i}
            style={[
              progressStyles.segment,
              { left: `${((i + 1) / total) * 100}%` }
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const progressStyles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 2,
  },
  count: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textMuted,
  },
  countHighlight: {
    color: Colors.accent,
    fontWeight: '700',
  },
  barBackground: {
    height: 8,
    backgroundColor: Colors.incomplete,
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  barFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: Colors.accent,
    borderRadius: 4,
  },
  segment: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: Colors.background,
  },
});

// ============== DIALOGUE BOX COMPONENT ==============

function DialogueBox({ message, completed, total }: { message: string; completed: number; total: number }) {
  return (
    <View style={dialogueStyles.container}>
      <View style={dialogueStyles.nameplate}>
        <Text style={dialogueStyles.nameplateText}>APEX LAD</Text>
      </View>
      
      <View style={dialogueStyles.dialogueContent}>
        {total > 0 && (
          <View style={dialogueStyles.statsBadge}>
            <Ionicons name="flame" size={14} color={Colors.streak} />
            <Text style={dialogueStyles.statsText}>{completed}/{total}</Text>
          </View>
        )}
        
        <Text style={dialogueStyles.messageText}>{message}</Text>
      </View>
    </View>
  );
}

const dialogueStyles = StyleSheet.create({
  container: {
    marginBottom: Spacing.xl,
    ...Shadows.dialogue,
  },
  nameplate: {
    position: 'absolute',
    top: -12,
    left: Spacing.lg,
    backgroundColor: Colors.nameplateBackground,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.sm,
    zIndex: 10,
  },
  nameplateText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.nameplateText,
    letterSpacing: 2,
  },
  dialogueContent: {
    backgroundColor: Colors.dialogueBackground,
    borderWidth: 2,
    borderColor: Colors.dialogueBorder,
    borderRadius: BorderRadius.dialogue,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    minHeight: 90,
  },
  statsBadge: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accentDim,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  statsText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.streak,
    marginLeft: 4,
    fontVariant: ['tabular-nums'],
  },
  messageText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
    lineHeight: 24,
    paddingRight: 50,
  },
});

// ============== MAIN COMPONENT ==============

export default function HomeScreen() {
  const [habits, setHabits] = useState<HabitWithDisplayStreak[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [modal, setModal] = useState({
    visible: false,
    mood: 'talking' as 'pleased' | 'talking',
    title: '',
    message: '',
    buttonText: 'OK',
  });

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const habitsRef = collection(db, 'users', userId, 'habits');
    const q = query(habitsRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const habitsData: HabitWithDisplayStreak[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const habit = { id: docSnap.id, ...data } as Habit;
        const displayStreak = getDisplayStreak(habit);
        habitsData.push({ ...habit, displayStreak });
      });
      setHabits(habitsData);
      setLoading(false);
      setRefreshing(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const checkDailyRoast = async () => {
      try {
        const roastsRef = collection(db, 'users', userId, 'dailyRoasts');
        const q = query(roastsRef, where('read', '==', false), limit(1));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const roastDoc = snapshot.docs[0];
          const roastData = roastDoc.data();
          setModal({
            visible: true,
            mood: 'talking',
            title: 'INCOMING MESSAGE',
            message: roastData.message,
            buttonText: 'GOT IT',
          });
          await updateDoc(roastDoc.ref, { read: true });
        }
      } catch (error) {
        console.error('Error checking roast:', error);
      }
    };

    const timer = setTimeout(checkDailyRoast, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleCheckIn = useCallback((habitId: string) => {
    router.push(`/checkin/${habitId}`);
  }, [router]);

  const handleDeleteHabit = useCallback(async (habitId: string, habitName: string) => {
    setModal({
      visible: true,
      mood: 'talking',
      title: 'DELETE HABIT',
      message: `Remove "${habitName}"? All progress will be lost.`,
      buttonText: 'CANCEL',
      secondaryButtonText: 'DELETE',
      onSecondaryPress: async () => {
        try {
          const userId = auth.currentUser?.uid;
          if (!userId) return;
          await deleteDoc(doc(db, 'users', userId, 'habits', habitId));
        } catch (error) {
          console.error('Error deleting habit:', error);
        }
      },
    } as any);
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
  }, []);

  const completedCount = habits.filter(h => isCompletedToday(h)).length;
  const totalCount = habits.length;

  const characterTranslate = scrollY.interpolate({
    inputRange: [-100, 0, 200],
    outputRange: [-30, 0, 50],
    extrapolate: 'clamp',
  });

  const characterScale = scrollY.interpolate({
    inputRange: [-100, 0],
    outputRange: [1.15, 1],
    extrapolateRight: 'clamp',
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="hourglass-outline" size={32} color={Colors.accent} />
        <Text style={styles.loadingText}>LOADING...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Character Section - Image extends behind status bar for full effect */}
      <View style={styles.characterSection}>
        <Animated.Image
          source={require('../../assets/images/apex-home.jpg')}
          style={[
            styles.characterImage,
            {
              transform: [
                { translateY: characterTranslate },
                { scale: characterScale },
              ],
            },
          ]}
          resizeMode="cover"
        />
        
        {/* Gradient only at bottom to fade into content */}
        <LinearGradient
          colors={['transparent', 'rgba(26, 21, 18, 0.5)', Colors.background]}
          locations={[0.5, 0.75, 1]}
          style={styles.characterGradient}
        />
      </View>

      {/* Scrollable Content */}
      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.accent}
            progressViewOffset={CHARACTER_HEIGHT}
          />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
      >
        {/* Spacer for character - LARGER to show more of Paddy */}
        <View style={{ height: CHARACTER_HEIGHT - 60 }} />

        {/* Content with SOLID background */}
        <View style={styles.contentContainer}>
          {/* Dialogue Box */}
          <View style={styles.dialogueWrapper}>
            <DialogueBox
              message={getMotivationalMessage(completedCount, totalCount)}
              completed={completedCount}
              total={totalCount}
            />
          </View>

          {/* Progress Bar */}
          <WarmProgressBar completed={completedCount} total={totalCount} />

          {/* Habits Section */}
          <View style={styles.sectionHeader}>
            <Ionicons name="list-outline" size={18} color={Colors.textMuted} />
            <Text style={styles.sectionTitle}>TODAY'S HABITS</Text>
            <Text style={styles.sectionCount}>{totalCount}</Text>
          </View>

          {habits.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="add-circle-outline" size={48} color={Colors.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>NO HABITS YET</Text>
              <Text style={styles.emptyText}>
                Create your first habit to get started with The Apex Lad.
              </Text>
            </View>
          ) : (
            habits.map((habit) => (
              <SwipeableHabitCard
                key={habit.id}
                habit={habit}
                isCompleted={isCompletedToday(habit)}
                onCheckIn={() => handleCheckIn(habit.id)}
                onDelete={() => handleDeleteHabit(habit.id, habit.name)}
              />
            ))
          )}

          {/* Bottom Padding */}
          <View style={styles.bottomPadding} />
        </View>
      </Animated.ScrollView>

      {/* Modal */}
      <ApexModal
        visible={modal.visible}
        mood={modal.mood}
        title={modal.title}
        message={modal.message}
        buttonText={modal.buttonText}
        onClose={() => setModal(prev => ({ ...prev, visible: false }))}
        secondaryButtonText={(modal as any).secondaryButtonText}
        onSecondaryPress={(modal as any).onSecondaryPress}
      />
    </View>
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
  characterSection: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: CHARACTER_HEIGHT + 50,
    zIndex: 1,
  },
  characterImage: {
    width: SCREEN_WIDTH,
    height: CHARACTER_HEIGHT + 80,
    position: 'absolute',
    top: 0, // Image starts at very top, behind status bar
  },
  characterGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: CHARACTER_HEIGHT * 0.5,
  },
  scrollView: {
    flex: 1,
    zIndex: 10,
  },
  scrollContent: {
    paddingTop: 0,
  },
  contentContainer: {
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    minHeight: SCREEN_HEIGHT,
  },
  dialogueWrapper: {
    marginHorizontal: -Spacing.lg,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
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
    flex: 1,
  },
  sectionCount: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxxl * 2,
    paddingHorizontal: Spacing.xxl,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 2,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  bottomPadding: {
    height: 100,
  },
});