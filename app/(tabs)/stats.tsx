// app/(tabs)/stats.tsx
// Stats Dashboard with Calendar View

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';

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

interface CheckIn {
  id: string;
  habitId: string;
  habitName: string;
  localDate: string; // YYYY-MM-DD
  timestamp: string;
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

// ============== CALENDAR COMPONENT ==============

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

interface CalendarProps {
  checkIns: CheckIn[];
  habits: Habit[];
  selectedHabitId: string | null;
  onSelectHabit: (habitId: string | null) => void;
}

function Calendar({ checkIns, habits, selectedHabitId, onSelectHabit }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  // Get first day of month and total days
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Build set of completed dates for quick lookup
  const completedDates = new Set<string>();
  const dateHabitMap = new Map<string, Set<string>>(); // date -> set of habitIds

  checkIns.forEach((checkIn) => {
    if (!selectedHabitId || checkIn.habitId === selectedHabitId) {
      completedDates.add(checkIn.localDate);
    }
    // Track which habits were completed on each date
    if (!dateHabitMap.has(checkIn.localDate)) {
      dateHabitMap.set(checkIn.localDate, new Set());
    }
    dateHabitMap.get(checkIn.localDate)!.add(checkIn.habitId);
  });

  // App launch date - no data before this
  const MIN_DATE = new Date(2026, 0, 1); // January 2026
  const today = new Date();

  const canGoPrev = year > MIN_DATE.getFullYear() ||
    (year === MIN_DATE.getFullYear() && month > MIN_DATE.getMonth());
  const canGoNext = year < today.getFullYear() ||
    (year === today.getFullYear() && month < today.getMonth());

  const goToPrevMonth = () => {
    if (canGoPrev) {
      setCurrentMonth(new Date(year, month - 1, 1));
    }
  };

  const goToNextMonth = () => {
    if (canGoNext) {
      setCurrentMonth(new Date(year, month + 1, 1));
    }
  };

  const isToday = (day: number) => {
    return day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  };

  const isFuture = (day: number) => {
    const checkDate = new Date(year, month, day);
    return checkDate > today;
  };

  const getDateString = (day: number) => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  const getCompletionLevel = (day: number): 'none' | 'partial' | 'full' => {
    const dateStr = getDateString(day);
    if (!dateHabitMap.has(dateStr)) return 'none';

    const habitsCompletedOnDate = dateHabitMap.get(dateStr)!;

    if (selectedHabitId) {
      return habitsCompletedOnDate.has(selectedHabitId) ? 'full' : 'none';
    }

    // For "All Habits" view, check if all habits were completed
    if (habits.length === 0) return 'none';
    const allCompleted = habits.every(h => habitsCompletedOnDate.has(h.id));
    const someCompleted = habits.some(h => habitsCompletedOnDate.has(h.id));

    if (allCompleted) return 'full';
    if (someCompleted) return 'partial';
    return 'none';
  };

  // Build calendar grid
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  // Calculate month stats
  const daysWithCheckIns = new Set<string>();
  checkIns.forEach((c) => {
    if (c.localDate.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)) {
      if (!selectedHabitId || c.habitId === selectedHabitId) {
        daysWithCheckIns.add(c.localDate);
      }
    }
  });

  const daysPassedInMonth = (year === today.getFullYear() && month === today.getMonth())
    ? today.getDate()
    : daysInMonth;

  const consistencyPercent = daysPassedInMonth > 0
    ? Math.round((daysWithCheckIns.size / daysPassedInMonth) * 100)
    : 0;

  return (
    <View style={calendarStyles.container}>
      {/* Habit Filter Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={calendarStyles.filterScroll}
        contentContainerStyle={calendarStyles.filterContainer}
      >
        <Pressable
          style={[
            calendarStyles.filterPill,
            selectedHabitId === null && calendarStyles.filterPillActive
          ]}
          onPress={() => onSelectHabit(null)}
        >
          <Text style={[
            calendarStyles.filterText,
            selectedHabitId === null && calendarStyles.filterTextActive
          ]}>
            All Habits
          </Text>
        </Pressable>
        {habits.map((habit) => (
          <Pressable
            key={habit.id}
            style={[
              calendarStyles.filterPill,
              selectedHabitId === habit.id && calendarStyles.filterPillActive
            ]}
            onPress={() => onSelectHabit(habit.id)}
          >
            <Text
              style={[
                calendarStyles.filterText,
                selectedHabitId === habit.id && calendarStyles.filterTextActive
              ]}
              numberOfLines={1}
            >
              {habit.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Month Header */}
      <View style={calendarStyles.header}>
        <Pressable
          onPress={goToPrevMonth}
          style={[calendarStyles.navButton, !canGoPrev && calendarStyles.navButtonDisabled]}
          disabled={!canGoPrev}
        >
          <Ionicons name="chevron-back" size={20} color={canGoPrev ? Colors.textSecondary : Colors.border} />
        </Pressable>
        <Text style={calendarStyles.monthTitle}>
          {MONTH_NAMES[month]} {year}
        </Text>
        <Pressable
          onPress={goToNextMonth}
          style={[calendarStyles.navButton, !canGoNext && calendarStyles.navButtonDisabled]}
          disabled={!canGoNext}
        >
          <Ionicons name="chevron-forward" size={20} color={canGoNext ? Colors.textSecondary : Colors.border} />
        </Pressable>
      </View>

      {/* Day Labels */}
      <View style={calendarStyles.dayLabels}>
        {DAYS_OF_WEEK.map((day) => (
          <Text key={day} style={calendarStyles.dayLabel}>{day}</Text>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={calendarStyles.grid}>
        {calendarDays.map((day, index) => {
          if (day === null) {
            return <View key={`empty-${index}`} style={calendarStyles.dayCell} />;
          }

          const completionLevel = getCompletionLevel(day);
          const future = isFuture(day);
          const todayFlag = isToday(day);

          return (
            <View key={day} style={calendarStyles.dayCell}>
              <View
                style={[
                  calendarStyles.dayCellInner,
                  completionLevel === 'full' && calendarStyles.dayCellFull,
                  completionLevel === 'partial' && calendarStyles.dayCellPartial,
                  todayFlag && calendarStyles.dayCellToday,
                ]}
              >
                <Text
                  style={[
                    calendarStyles.dayText,
                    future && calendarStyles.dayTextFuture,
                    completionLevel !== 'none' && calendarStyles.dayTextCompleted,
                    todayFlag && completionLevel === 'none' && calendarStyles.dayTextToday,
                  ]}
                >
                  {day}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Month Summary */}
      <View style={calendarStyles.summary}>
        <View style={calendarStyles.summaryItem}>
          <Text style={calendarStyles.summaryValue}>{daysWithCheckIns.size}</Text>
          <Text style={calendarStyles.summaryLabel}>Days Active</Text>
        </View>
        <View style={calendarStyles.summaryDivider} />
        <View style={calendarStyles.summaryItem}>
          <Text style={calendarStyles.summaryValue}>{consistencyPercent}%</Text>
          <Text style={calendarStyles.summaryLabel}>Consistency</Text>
        </View>
      </View>
    </View>
  );
}

const calendarStyles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  filterScroll: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  filterPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    maxWidth: 120,
  },
  filterPillActive: {
    backgroundColor: Colors.accentDim,
    borderColor: Colors.accent,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  filterTextActive: {
    color: Colors.accent,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  navButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: Colors.background,
  },
  navButtonDisabled: {
    opacity: 0.4,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  dayLabels: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  dayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.xs,
    paddingBottom: Spacing.md,
  },
  dayCell: {
    width: '14.28%',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
  },
  dayCellInner: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellFull: {
    backgroundColor: Colors.success,
  },
  dayCellPartial: {
    backgroundColor: Colors.accentDim,
  },
  dayCellToday: {
    borderWidth: 2,
    borderColor: Colors.accent,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  dayTextFuture: {
    color: Colors.textMuted,
    opacity: 0.5,
  },
  dayTextCompleted: {
    color: Colors.background,
    fontWeight: '700',
  },
  dayTextToday: {
    color: Colors.accent,
    fontWeight: '700',
  },
  summary: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingVertical: Spacing.lg,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: Colors.border,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.accent,
    fontVariant: ['tabular-nums'],
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 1,
    marginTop: 2,
  },
});

// ============== MAIN COMPONENT ==============

export default function StatsScreen() {
  const [habits, setHabits] = useState<(Habit & { displayStreak: number })[]>([]);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
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
    },
    (error) => {
      console.error('Error loading habits:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch check-ins for calendar
  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const checkInsRef = collection(db, 'users', userId, 'checkins');
    const q = query(checkInsRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const checkInsData: CheckIn[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        checkInsData.push({
          id: docSnap.id,
          habitId: data.habitId,
          habitName: data.habitName,
          localDate: data.localDate,
          timestamp: data.timestamp,
        });
      });
      setCheckIns(checkInsData);
    },
    (error) => {
      console.error('Error loading check-ins:', error);
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

        {/* Calendar Section */}
        <View style={styles.calendarSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar-outline" size={18} color={Colors.textMuted} />
            <Text style={styles.sectionTitle}>ACTIVITY CALENDAR</Text>
          </View>

          {habits.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No habits to display</Text>
            </View>
          ) : (
            <Calendar
              checkIns={checkIns}
              habits={habits}
              selectedHabitId={selectedHabitId}
              onSelectHabit={setSelectedHabitId}
            />
          )}
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
  calendarSection: {
    paddingHorizontal: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 2,
    marginLeft: Spacing.sm,
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Colors.border,
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