import {onCall, HttpsError} from 'firebase-functions/v2/https';
import {onSchedule} from 'firebase-functions/v2/scheduler';
import {defineSecret} from 'firebase-functions/params';
import * as admin from 'firebase-admin';
import OpenAI from 'openai';

admin.initializeApp();

const openaiApiKey = defineSecret('OPENAI_API_KEY');

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
        ? `You're a cheeky British MMA fighter from Liverpool. The user just completed their habit "${habitName}" and is on a ${streak} day streak. Give them a 1-sentence motivational roast using Liverpool slang. Be supportive but cheeky. Use phrases like "lad", "boss", "sound". Keep it under 20 words.`
        : `You're a cheeky British MMA fighter from Liverpool. The user failed their habit "${habitName}" and broke their ${streak} day streak. Give them a brutal but funny 1-sentence roast in Liverpool slang. Call them "soft lad" or similar. Keep it under 20 words.`;

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
          ? '🔥 Proper effort, lad! Keep it up!'
          : 'Soft lad, do better tomorrow!',
      };
    }
  }
);

export const cleanupRateLimits = onSchedule(
  {
    schedule: 'every 24 hours',
    timeZone: 'America/New_York',
  },
  async (event) => {
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

export const midnightStreakReset = onSchedule(
  {
    schedule: 'every day 00:01',
    timeZone: 'America/New_York',
  },
  async (event) => {
    console.log('Running midnight streak reset...');

    const db = admin.firestore();
    const users = await db.collection('users').listDocuments();

    for (const userDoc of users) {
      const userId = userDoc.id;
      console.log(`Checking habits for user: ${userId}`);

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const habitsSnapshot = await db
        .collection('users')
        .doc(userId)
        .collection('habits')
        .get();

      for (const habitDoc of habitsSnapshot.docs) {
        const habit = habitDoc.data();
        const lastCheckIn = habit.lastCheckIn
          ? habit.lastCheckIn.split('T')[0]
          : null;

        if (lastCheckIn !== yesterdayStr) {
          console.log(
            `Resetting streak for habit: ${habit.name} (last check-in: ${lastCheckIn})`
          );

          await habitDoc.ref.update({
            currentStreak: 0,
          });
        }
      }
    }

    console.log('Midnight streak reset complete!');
  }
);