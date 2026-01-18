// functions/src/index.ts

import {onCall, HttpsError} from 'firebase-functions/v2/https';
import {onSchedule} from 'firebase-functions/v2/scheduler';
import {defineSecret} from 'firebase-functions/params';
import * as admin from 'firebase-admin';
import OpenAI from 'openai';

admin.initializeApp();

const openaiApiKey = defineSecret('OPENAI_API_KEY');

// ============== PADDY'S NOTIFICATION MESSAGES ==============

const REMINDER_MESSAGES = [
  "Oi {name}! Your {habitName} habit's waiting. Don't leave me hanging!",
  "Still got {habitName} to do today. Come on, let's see what you're made of!",
  "Your {streak} day streak on {habitName} is on the line. Get moving!",
  "Champions don't skip {habitName}. You're better than that, {name}!",
  "Nearly end of the day — {habitName} won't do itself, mate!",
  "Don't be a muppet, get {habitName} ticked off!",
  "Oi oi! {habitName} is calling your name. Answer it!",
  "No excuses today. Smash {habitName} and keep that streak alive!",
  "{name}, your {habitName} streak needs you. Don't let it down!",
  "Time's ticking! {habitName} won't wait forever, lad!",
  "You've got {habitName} left to do. Let's go, champion!",
  "Your {streak} day streak is counting on you. Do {habitName} now!",
  "Oi! {habitName} isn't gonna complete itself. Get on it!",
  "Don't let {habitName} slip today. You've come too far!",
  "Still waiting on {habitName}, {name}. Make me proud!",
];

const STREAK_WARNING_MESSAGES = [
  "⚠️ LAST CHANCE! Your {streak} day {habitName} streak dies at midnight!",
  "OI {name}! You're gonna lose your {habitName} streak if you don't move NOW!",
  "Two hours left! Don't throw away {streak} days of {habitName} progress!",
  "Streak emergency! {habitName} needs doing before midnight, lad!",
  "Your {streak} day streak is about to be GONE. Save it now!",
  "{name}, this is your final warning. {habitName} or lose the streak!",
  "Midnight's coming and so is streak death. Do {habitName} NOW!",
  "Don't let {streak} days of hard work go down the drain. {habitName}. NOW.",
];

function getRandomMessage(messages: string[]): string {
  return messages[Math.floor(Math.random() * messages.length)];
}

function fillTemplate(template: string, vars: Record<string, string | number>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`{${key}}`, 'g'), String(value));
  }
  return result;
}

// ============== TIMEZONE UTILITIES ==============

function getDateInTimezone(timezone: string): string {
  try {
    const now = new Date();
    const formatted = now.toLocaleDateString('en-CA', {timeZone: timezone});
    return formatted; // Returns YYYY-MM-DD format
  } catch {
    // Fallback to UTC if timezone is invalid
    return new Date().toISOString().split('T')[0];
  }
}

function getYesterdayInTimezone(timezone: string): string {
  try {
    const now = new Date();
    // Subtract 24 hours
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    return yesterday.toLocaleDateString('en-CA', {timeZone: timezone});
  } catch {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  }
}

function getCurrentHourInTimezone(timezone: string): number {
  try {
    const now = new Date();
    const hour = parseInt(
      now.toLocaleString('en-US', {timeZone: timezone, hour: 'numeric', hour12: false})
    );
    return hour;
  } catch {
    return new Date().getUTCHours();
  }
}


// ============== SEND EXPO PUSH NOTIFICATION ==============

async function sendExpoPushNotification(
  pushToken: string,
  title: string,
  body: string,
  userId?: string
): Promise<boolean> {
  const message = {
    to: pushToken,
    sound: 'default',
    title,
    body,
    data: {type: 'habit_reminder'},
  };

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();

    if (result.data?.status === 'error') {
      console.error('Expo push error:', result.data.message);

      // Handle invalid/stale tokens
      const errorMessage = result.data.message || '';
      if (
        errorMessage.includes('DeviceNotRegistered') ||
        errorMessage.includes('InvalidCredentials') ||
        errorMessage.includes('ExpoPushToken') ||
        result.data.details?.error === 'DeviceNotRegistered'
      ) {
        if (userId) {
          console.log(`Removing stale push token for user ${userId}`);
          await admin.firestore().collection('users').doc(userId).update({
            expoPushToken: admin.firestore.FieldValue.delete(),
            pushTokenStaleAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      }
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending push notification:', error);
    return false;
  }
}

// ============== TEST NOTIFICATION ENDPOINT ==============

export const sendTestNotification = onCall(
  {
    timeoutSeconds: 30,
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const userId = request.auth.uid;
    const {message} = request.data;

    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData?.expoPushToken) {
      throw new HttpsError(
        'failed-precondition',
        'No push token found. Make sure notifications are enabled in the app.'
      );
    }

    const testMessage = message || "🧪 Test notification from Apex Lad! If you see this, notifications are working!";

    const success = await sendExpoPushNotification(
      userData.expoPushToken,
      'Apex Lad Test',
      testMessage,
      userId
    );

    if (!success) {
      throw new HttpsError('internal', 'Failed to send notification');
    }

    return {
      success: true,
      message: 'Test notification sent!',
      token: userData.expoPushToken.substring(0, 30) + '...',
    };
  }
);

// ============== RATE LIMITING ==============

async function checkRateLimit(
  userId: string,
  limitType: string,
  maxCalls: number
): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const rateLimitRef = admin
    .firestore()
    .collection('rateLimits')
    .doc(`${userId}_${limitType}_${today}`);

  const rateLimitDoc = await rateLimitRef.get();
  const count = rateLimitDoc.data()?.count || 0;

  if (count >= maxCalls) {
    throw new HttpsError(
      'resource-exhausted',
      `Daily ${limitType} limit reached (${maxCalls} per day). Try again tomorrow.`
    );
  }

  await rateLimitRef.set(
    {
      count: count + 1,
      lastCall: admin.firestore.FieldValue.serverTimestamp(),
    },
    {merge: true}
  );
}

// ============== VERIFY HABIT PHOTO ==============

export const verifyHabitPhoto = onCall(
  {
    secrets: [openaiApiKey],
    timeoutSeconds: 60,
    memory: '256MiB',
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const userId = request.auth.uid;
    const {photoUrl, habitDescription, habitName} = request.data;

    await checkRateLimit(userId, 'verification', 20);

    if (!photoUrl || !habitDescription) {
      throw new HttpsError(
        'invalid-argument',
        'Missing required fields: photoUrl and habitDescription'
      );
    }

    try {
      const openai = new OpenAI({apiKey: openaiApiKey.value()});

      console.log(`[${userId}] Verifying photo for habit: ${habitName}`);

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        max_tokens: 300,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: photoUrl,
                },
              },
              {
                type: 'text',
                text: `You are verifying a habit tracking photo. The user claims they did this habit: "${habitDescription}"

Analyze the photo and determine:
1. Does this photo show evidence of the habit being done? (YES or NO)
2. Brief reason (1 sentence)

Respond in this format:
VERIFIED: YES/NO
REASON: [your reason]

Be reasonable - if the photo shows legitimate effort, verify it. Only reject if it's clearly fake or unrelated.`,
              },
            ],
          },
        ],
      });

      const responseText = response.choices[0]?.message?.content || '';

      const verified = responseText.includes('VERIFIED: YES');
      const reasonMatch = responseText.match(/REASON: (.+)/);
      const reason = reasonMatch ? reasonMatch[1].trim() : responseText;

      console.log(`[${userId}] Verification result:`, {verified, reason});

      await admin.firestore().collection('verificationLogs').add({
        userId,
        habitName,
        verified,
        reason,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      return {
        verified,
        reason,
        fullResponse: responseText,
      };
    } catch (error) {
      console.error(`[${userId}] Error verifying photo:`, error);
      throw new HttpsError('internal', 'Failed to verify photo with AI');
    }
  }
);

// ============== GENERATE ROAST ==============

export const generateRoast = onCall(
  {
    secrets: [openaiApiKey],
    timeoutSeconds: 30,
    memory: '256MiB',
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const userId = request.auth.uid;
    const {success, habitName, streak} = request.data;

    await checkRateLimit(userId, 'roast', 30);

    if (
      typeof success !== 'boolean' ||
      !habitName ||
      typeof streak !== 'number'
    ) {
      throw new HttpsError(
        'invalid-argument',
        'Missing required fields: success, habitName, streak'
      );
    }

    try {
      const openai = new OpenAI({apiKey: openaiApiKey.value()});

      const prompt = success
        ? `You're a cheeky British MMA fighter. The user just completed their habit "${habitName}" and is on a ${streak} day streak. Give them a 1-sentence motivational roast - hype them up but keep it playful. Be like a coach who's impressed but won't let them get a big head. Keep it under 20 words.`
        : `You're a cheeky British MMA fighter. The user failed their habit "${habitName}" and broke their ${streak} day streak. Give them a funny, brutal 1-sentence roast that motivates them to get back on track. Mock them like a friend would. Keep it under 20 words.`;

      console.log(
        `[${userId}] Generating roast for: ${habitName} (success: ${success})`
      );

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        max_tokens: 100,
        temperature: 1.0,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const roast =
        response.choices[0]?.message?.content?.trim() || 'Keep going, lad!';

      console.log(`[${userId}] Generated roast:`, roast);

      return {roast};
    } catch (error) {
      console.error(`[${userId}] Error generating roast:`, error);
      return {
        roast: success
          ? '🔥 Not bad, not bad! Keep stacking those wins!'
          : 'Mate, that was rough. Get back in there tomorrow!',
      };
    }
  }
);

// ============== CLEANUP RATE LIMITS ==============

export const cleanupRateLimits = onSchedule(
  {
    schedule: 'every 24 hours',
    timeZone: 'America/New_York',
  },
  async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 2);

    const oldDocs = await admin
      .firestore()
      .collection('rateLimits')
      .where('lastCall', '<', yesterday)
      .get();

    const batch = admin.firestore().batch();
    oldDocs.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`Cleaned up ${oldDocs.size} old rate limit documents`);
  }
);

// ============== MIDNIGHT STREAK RESET (HOURLY, TIMEZONE-AWARE) ==============

export const midnightStreakReset = onSchedule(
  {
    schedule: 'every 1 hours',
    timeZone: 'UTC',
  },
  async () => {
    console.log('Running hourly streak reset check...');

    const db = admin.firestore();
    const usersSnap = await db.collection('users').get();

    let processedCount = 0;
    let resetCount = 0;

    for (const userDoc of usersSnap.docs) {
      const userData = userDoc.data();
      const timezone = userData.timezone || 'UTC';
      const currentHour = getCurrentHourInTimezone(timezone);

      // Only process users where it's midnight (00:xx) in their timezone
      if (currentHour !== 0) continue;

      processedCount++;
      const userId = userDoc.id;
      const yesterdayStr = getYesterdayInTimezone(timezone);

      console.log(`Processing user ${userId} (timezone: ${timezone}, yesterday: ${yesterdayStr})`);

      const habitsSnapshot = await db
        .collection('users')
        .doc(userId)
        .collection('habits')
        .get();

      for (const habitDoc of habitsSnapshot.docs) {
        // Use transaction to prevent race condition with check-ins
        try {
          await db.runTransaction(async (transaction) => {
            const freshHabitDoc = await transaction.get(habitDoc.ref);
            const habit = freshHabitDoc.data();

            if (!habit) return;

            const lastCheckInLocal = habit.lastCheckInLocal || null;

            // Reset streak if they didn't check in yesterday (re-check within transaction)
            if (lastCheckInLocal !== yesterdayStr && habit.currentStreak > 0) {
              console.log(
                `Resetting streak for habit: ${habit.name} (last check-in: ${lastCheckInLocal}, expected: ${yesterdayStr})`
              );

              transaction.update(habitDoc.ref, {
                currentStreak: 0,
              });
              resetCount++;
            }
          });
        } catch (error) {
          console.error(`Transaction failed for habit ${habitDoc.id}:`, error);
        }
      }
    }

    console.log(`Midnight streak reset complete. Processed: ${processedCount} users, Reset: ${resetCount} streaks`);
  }
);

// ============== DAILY REMINDER NOTIFICATIONS (3 PM LOCAL, HOURLY) ==============

export const sendDailyReminders = onSchedule(
  {
    schedule: 'every 1 hours',
    timeZone: 'UTC',
  },
  async () => {
    console.log('Starting hourly reminder check (3 PM local)...');

    const db = admin.firestore();

    try {
      const usersSnap = await db
        .collection('users')
        .where('notificationsEnabled', '==', true)
        .get();

      let sentCount = 0;
      let skippedCount = 0;

      for (const userDoc of usersSnap.docs) {
        const userData = userDoc.data();
        const timezone = userData.timezone || 'UTC';
        const currentHour = getCurrentHourInTimezone(timezone);

        // Only process users where it's 3 PM (15:xx) in their timezone
        if (currentHour !== 15) continue;

        const pushToken = userData.expoPushToken;
        const userName = userData.name || userData.displayName || 'mate';

        if (!pushToken) {
          skippedCount++;
          continue;
        }

        const today = getDateInTimezone(timezone);

        // Get ALL incomplete habits
        const habitsSnap = await db
          .collection('users')
          .doc(userDoc.id)
          .collection('habits')
          .get();

        const incompleteHabits: Array<{name: string; streak: number}> = [];

        for (const habitDoc of habitsSnap.docs) {
          const habit = habitDoc.data();
          const lastCheckInLocal = habit.lastCheckInLocal;

          if (!lastCheckInLocal || lastCheckInLocal !== today) {
            incompleteHabits.push({
              name: habit.name,
              streak: habit.currentStreak || 0,
            });
          }
        }

        if (incompleteHabits.length === 0) {
          skippedCount++;
          continue;
        }

        // Build message for all incomplete habits
        let message: string;
        if (incompleteHabits.length === 1) {
          const messageTemplate = getRandomMessage(REMINDER_MESSAGES);
          message = fillTemplate(messageTemplate, {
            name: userName,
            habitName: incompleteHabits[0].name,
            streak: incompleteHabits[0].streak,
          });
        } else {
          const habitNames = incompleteHabits.map((h) => h.name).join(', ');
          message = `Oi ${userName}! You've got ${incompleteHabits.length} habits waiting: ${habitNames}. Get moving!`;
        }

        const success = await sendExpoPushNotification(
          pushToken,
          'Apex Lad',
          message,
          userDoc.id
        );

        if (success) {
          sentCount++;
          console.log(`Sent reminder to user ${userDoc.id} (${timezone})`);
        }
      }

      console.log(`Daily reminders complete. Sent: ${sentCount}, Skipped: ${skippedCount}`);
    } catch (error) {
      console.error('Error in sendDailyReminders:', error);
      throw error;
    }
  }
);

// ============== STREAK WARNING NOTIFICATIONS (8 PM LOCAL, HOURLY) ==============

export const sendStreakWarnings = onSchedule(
  {
    schedule: 'every 1 hours',
    timeZone: 'UTC',
  },
  async () => {
    console.log('Starting hourly streak warning check (8 PM local)...');

    const db = admin.firestore();

    try {
      const usersSnap = await db
        .collection('users')
        .where('notificationsEnabled', '==', true)
        .get();

      let sentCount = 0;

      for (const userDoc of usersSnap.docs) {
        const userData = userDoc.data();
        const timezone = userData.timezone || 'UTC';
        const currentHour = getCurrentHourInTimezone(timezone);

        // Only process users where it's 8 PM (20:xx) in their timezone
        if (currentHour !== 20) continue;

        const pushToken = userData.expoPushToken;
        const userName = userData.name || userData.displayName || 'mate';

        if (!pushToken) continue;

        const today = getDateInTimezone(timezone);

        // Check for ALL incomplete habits WITH active streaks
        const habitsSnap = await db
          .collection('users')
          .doc(userDoc.id)
          .collection('habits')
          .where('currentStreak', '>', 0)
          .get();

        const streaksAtRisk: Array<{name: string; streak: number}> = [];

        for (const habitDoc of habitsSnap.docs) {
          const habit = habitDoc.data();
          if (habit.lastCheckInLocal !== today && habit.currentStreak > 0) {
            streaksAtRisk.push({
              name: habit.name,
              streak: habit.currentStreak,
            });
          }
        }

        if (streaksAtRisk.length === 0) continue;

        // Build message for all at-risk streaks
        let message: string;
        if (streaksAtRisk.length === 1) {
          const messageTemplate = getRandomMessage(STREAK_WARNING_MESSAGES);
          message = fillTemplate(messageTemplate, {
            name: userName,
            habitName: streaksAtRisk[0].name,
            streak: streaksAtRisk[0].streak,
          });
        } else {
          const totalStreakDays = streaksAtRisk.reduce((sum, h) => sum + h.streak, 0);
          const habitNames = streaksAtRisk.map((h) => h.name).join(', ');
          message = `⚠️ ${userName}! ${streaksAtRisk.length} streaks at risk (${totalStreakDays} total days): ${habitNames}. Don't let them die!`;
        }

        const success = await sendExpoPushNotification(
          pushToken,
          '⚠️ STREAK WARNING',
          message,
          userDoc.id
        );

        if (success) {
          sentCount++;
          console.log(`Sent streak warning to user ${userDoc.id} (${timezone})`);
        }
      }

      console.log(`Streak warnings sent: ${sentCount}`);
    } catch (error) {
      console.error('Error in sendStreakWarnings:', error);
      throw error;
    }
  }
);
