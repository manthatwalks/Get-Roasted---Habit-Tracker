// app/(tabs)/stats.tsx
// Stats Dashboard - NO Paddy image

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';

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

// ============== PROGRESS RING COMPONENT ==============

function ProgressRing({ percentage }: { percentage: number }) {
  return (
    <View style={ringStyles.container}>
      <View style={ringStyles.ringWrapper}>
        <View style={ringStyles.ringBackground} />
        <View style={ringStyles.centerContent}>
          <Text style={ringStyles.percentageText}>{Math.round(percentage)}</Text>
          <Text style={ringStyles.percentageSymbol}>%</Text>
        </View>
        {/* Progress indicator */}
        <View style={[
          ringStyles.progressArc,
          {
            borderTopColor: percentage > 0 ? Colors.accent : Colors.border,
            borderRightColor: percentage > 25 ? Colors.accent : Colors.border,
            borderBottomColor: percentage > 50 ? Colors.accent : Colors.border,
            borderLeftColor: percentage > 75 ? Colors.accent : Colors.border,
          }
        ]} />
      </View>
      <Text style={ringStyles.label}>TODAY'S COMPLETION</Text>
    </View>
  );
}

const ringStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  ringWrapper: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringBackground: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: Colors.surface,
    borderWidth: 12,
    borderColor: Colors.border,
  },
  progressArc: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 12,
    transform: [{ rotate: '-45deg' }],
  },
  centerContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  percentageText: {
    fontSize: 48,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  percentageSymbol: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: 8,
    marginLeft: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 2,
    marginTop: Spacing.lg,
  },
});

// ============== STAT CARD COMPONENT ==============

interface StatCardProps {
  label: string;
  value: number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

function StatCard({ label, value, icon, color }: StatCardProps) {
  return (
    <View style={statStyles.card}>
      <View style={[statStyles.iconContainer, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={[statStyles.value, { color }]}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  value: {
    fontSize: 28,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    marginBottom: 2,
  },
  label: {
    fontSize: 9,
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 1,
    textAlign: 'center',
  },
});

// ============== HABIT BREAKDOWN ITEM ==============

function HabitBreakdownItem({ habit }: { habit: Habit & { displayStreak: number } }) {
  return (
    <View style={breakdownStyles.item}>
      <View style={breakdownStyles.left}>
        <Text style={breakdownStyles.name}>{habit.name}</Text>
        <Text style={breakdownStyles.stats}>
          {habit.totalCheckIns} check-ins · Best: {habit.longestStreak} days
        </Text>
      </View>
      <View style={[
        breakdownStyles.streak,
        habit.displayStreak > 0 && breakdownStyles.streakActive
      ]}>
        <Ionicons 
          name="flame" 
          size={16} 
          color={habit.displayStreak > 0 ? Colors.streak : Colors.textMuted} 
        />
        <Text style={[
          breakdownStyles.streakText,
          habit.displayStreak > 0 && breakdownStyles.streakTextActive
        ]}>
          {habit.displayStreak}
        </Text>
      </View>
    </View>
  );
}

const breakdownStyles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
  },
  left: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  stats: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  streakActive: {
    backgroundColor: Colors.accentDim,
    borderColor: Colors.borderAccent,
  },
  streakText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textMuted,
    marginLeft: 4,
    fontVariant: ['tabular-nums'],
  },
  streakTextActive: {
    color: Colors.streak,
  },
});

// ============== MAIN COMPONENT ==============

export default function StatsScreen() {
  const [habits, setHabits] = useState<(Habit & { displayStreak: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const habitsRef = collection(db, 'users', userId, 'habits');
    const q = query(habitsRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const habitsData: (Habit & { displayStreak: number })[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const habit: Habit = { 
          id: docSnap.id, 
          name: data.name,
          description: data.description,
          currentStreak: data.currentStreak,
          longestStreak: data.longestStreak,
          totalCheckIns: data.totalCheckIns,
          lastCheckIn: data.lastCheckIn,
          lastCheckInLocal: data.lastCheckInLocal,
        };
        habitsData.push({
          ...habit,
          displayStreak: getDisplayStreak(habit),
        });
      });
      setHabits(habitsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const completedToday = habits.filter(h => isCompletedToday(h)).length;
  const totalHabits = habits.length;
  const completionPercentage = totalHabits > 0 ? (completedToday / totalHabits) * 100 : 0;
  const longestStreak = habits.reduce((max, h) => Math.max(max, h.longestStreak), 0);
  const totalCheckIns = habits.reduce((sum, h) => sum + h.totalCheckIns, 0);

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
      <StatusBar barStyle="light-content" />
      
      {/* Simple Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <Text style={styles.headerTitle}>STATISTICS</Text>
        <View style={styles.headerLine} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Ring */}
        <ProgressRing percentage={completionPercentage} />

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            label="LONGEST STREAK"
            value={longestStreak}
            icon="flame"
            color={Colors.streak}
          />
          <StatCard
            label="TOTAL CHECK-INS"
            value={totalCheckIns}
            icon="checkmark-circle"
            color={Colors.success}
          />
          <StatCard
            label="ACTIVE HABITS"
            value={totalHabits}
            icon="list"
            color={Colors.active}
          />
        </View>

        {/* Habits Breakdown */}
        <View style={styles.breakdownSection}>
          <View style={styles.breakdownHeader}>
            <Ionicons name="analytics-outline" size={18} color={Colors.textMuted} />
            <Text style={styles.breakdownTitle}>HABIT BREAKDOWN</Text>
          </View>

          <View style={styles.breakdownCard}>
            {habits.length === 0 ? (
              <View style={styles.emptyBreakdown}>
                <Text style={styles.emptyText}>No habits to display</Text>
              </View>
            ) : (
              habits.map((habit, index) => (
                <React.Fragment key={habit.id}>
                  <HabitBreakdownItem habit={habit} />
                  {index < habits.length - 1 && <View style={styles.divider} />}
                </React.Fragment>
              ))
            )}
          </View>
        </View>

        <View style={styles.bottomPadding} />
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    marginBottom: Spacing.xxl,
  },
  breakdownSection: {
    paddingHorizontal: Spacing.lg,
  },
  breakdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  breakdownTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 2,
    marginLeft: Spacing.sm,
  },
  breakdownCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.lg,
  },
  emptyBreakdown: {
    padding: Spacing.xxl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  bottomPadding: {
    height: 100,
  },
});