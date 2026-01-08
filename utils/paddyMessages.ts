// utils/paddyMessages.ts

interface Habit {
  id: string;
  name: string;
  currentStreak: number;
  longestStreak: number;
  totalCheckIns: number;
  lastCheckIn?: string;
}

// Helper: Get today's date in LOCAL timezone (YYYY-MM-DD)
function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper: Check if habit was completed today
function isCompletedToday(habit: Habit): boolean {
  if (!habit.lastCheckIn) return false;
  const today = getLocalDateString();
  const checkDate = habit.lastCheckIn.split('T')[0];
  return checkDate === today;
}

export function getPaddyGreeting(habits: Habit[]): string {
  const hour = new Date().getHours();
  
  // Calculate today's progress
  const completedToday = habits.filter(isCompletedToday).length;
  const totalHabits = habits.length;
  const remainingToday = totalHabits - completedToday;
  const allDoneToday = totalHabits > 0 && remainingToday === 0;
  
  // Calculate streak performance
  const totalStreaks = habits.reduce((sum, h) => sum + h.currentStreak, 0);
  const avgStreak = totalHabits > 0 ? totalStreaks / totalHabits : 0;
  const hasHighStreaks = habits.some(h => h.currentStreak >= 5);
  const hasBrokenStreaks = habits.some(h => h.currentStreak === 0 && h.totalCheckIns > 0);
  
  // Time-based opener
  let timeGreeting = '';
  if (hour >= 5 && hour < 12) {
    timeGreeting = 'Rise and shine';
  } else if (hour >= 12 && hour < 17) {
    timeGreeting = 'Afternoon';
  } else if (hour >= 17 && hour < 22) {
    timeGreeting = 'Evening';
  } else {
    timeGreeting = 'Late night';
  }

  // No habits yet
  if (totalHabits === 0) {
    return `${timeGreeting}, lad! No habits yet? Let's get you sorted with your first one.`;
  }

  // ALL DONE TODAY - Top priority message
  if (allDoneToday) {
    if (hasHighStreaks || avgStreak >= 5) {
      const phrases = [
        `${timeGreeting}, you absolute machine! All habits smashed and those streaks are looking mint! 🔥`,
        `${timeGreeting}, legend! Everything done and you're properly on fire right now!`,
        `${timeGreeting}, boss! All sorted with killer streaks. You're built different! 💪`,
      ];
      return phrases[Math.floor(Math.random() * phrases.length)];
    }
    const phrases = [
      `${timeGreeting}, lad! All habits done - proper job! Rest up, you've earned it.`,
      `${timeGreeting}! Everything's ticked off. Get some rest, champion!`,
      `${timeGreeting}, boss! All sorted for today. That's the mentality! ✅`,
    ];
    return phrases[Math.floor(Math.random() * phrases.length)];
  }

  // SOME DONE TODAY - Making progress
  if (completedToday > 0 && remainingToday > 0) {
    if (hasHighStreaks) {
      return `${timeGreeting}, lad! ${completedToday}/${totalHabits} done - keep that momentum going! Those streaks are fire! 🔥`;
    }
    const phrases = [
      `${timeGreeting}! ${completedToday} down, ${remainingToday} to go. Don't stop now, lad!`,
      `${timeGreeting}, boss! ${completedToday}/${totalHabits} complete. Finish strong!`,
      `${timeGreeting}! Making moves - ${remainingToday} habit${remainingToday > 1 ? 's' : ''} left. Let's have it!`,
    ];
    return phrases[Math.floor(Math.random() * phrases.length)];
  }

  // NOTHING DONE YET TODAY
  // High streaks at risk
  if (hasHighStreaks) {
    const phrases = [
      `${timeGreeting}, lad! You've got proper streaks going - don't let them slip today!`,
      `${timeGreeting}! Those streaks won't maintain themselves. Time to get moving!`,
      `${timeGreeting}, boss! Big streaks on the line today. Let's protect them! 🔥`,
    ];
    return phrases[Math.floor(Math.random() * phrases.length)];
  }

  // Broken streaks - needs motivation
  if (hasBrokenStreaks) {
    const phrases = [
      `${timeGreeting}, soft lad! You've let some streaks slip. Time to rebuild!`,
      `${timeGreeting}! Yesterday's gone. Fresh start today - no excuses!`,
      `${timeGreeting}, mate. Those broken streaks are waiting to be fixed. Get on it!`,
    ];
    return phrases[Math.floor(Math.random() * phrases.length)];
  }

  // Building momentum (low but growing streaks)
  if (avgStreak >= 2) {
    const phrases = [
      `${timeGreeting}, lad! Streaks are building. Keep pushing!`,
      `${timeGreeting}! Momentum's on your side. Let's go!`,
      `${timeGreeting}, boss! You're getting consistent. Don't stop now!`,
    ];
    return phrases[Math.floor(Math.random() * phrases.length)];
  }

  // Default - just starting out
  const phrases = [
    `${timeGreeting}, lad! ${totalHabits} habit${totalHabits > 1 ? 's' : ''} waiting. Time to get after it!`,
    `${timeGreeting}! Fresh day, fresh start. Let's build some streaks!`,
    `${timeGreeting}, mate! Every champion starts somewhere. Let's go!`,
  ];
  return phrases[Math.floor(Math.random() * phrases.length)];
}

export function getTodayStatus(habits: Habit[]): string {
  const completedToday = habits.filter(isCompletedToday).length;
  const totalHabits = habits.length;
  const remaining = totalHabits - completedToday;

  if (totalHabits === 0) {
    return "No habits to track yet.";
  }

  if (remaining === 0) {
    return "All sorted for today! Proper job. ✅";
  }

  if (completedToday === 0) {
    return `${totalHabits} habit${totalHabits > 1 ? 's' : ''} waiting. Get moving!`;
  }

  return `${completedToday}/${totalHabits} done. ${remaining} left to smash!`;
}

export function getTimeUntilMidnight(): string {
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  
  const diff = midnight.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours === 0) {
    return `${minutes}m left`;
  }
  
  return `${hours}h ${minutes}m left`;
}