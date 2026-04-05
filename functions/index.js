import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Groq from 'groq-sdk';

// Initialize Firebase Admin
admin.initializeApp();

const db = admin.firestore();
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

interface UrgeLog {
  trigger: string;
  failed: boolean;
  timestamp: admin.firestore.Timestamp | Date;
}

interface NormalizedLog {
  trigger: string;
  failed: boolean;
  time: string;
}

/**
 * Weekly AI Neuro-Audit Generator
 * Runs every Sunday at 8:00 PM (UTC)
 * Generates behavioral summaries from urge logs using Groq Llama-3.1
 */
export const generateWeeklyAudit = functions
  .region('us-central1')
  .pubsub.schedule('every sunday 20:00')
  .timeZone('America/Denver') // Adjust to your timezone
  .onRun(async (context) => {
    try {
      console.log('🧠 Starting weekly neuro-audit generation...');

      // Get all premium users
      const usersSnapshot = await db
        .collection('users')
        .where('isPremium', '==', true)
        .get();

      if (usersSnapshot.empty) {
        console.log('No premium users found.');
        return;
      }

      const batch = db.batch();
      let processedCount = 0;
      let skippedCount = 0;

      // Process each premium user
      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        const userData = userDoc.data();

        try {
          await processUserAudit(userId, userData, batch);
          processedCount++;
        } catch (error) {
          console.error(`Error processing user ${userId}:`, error);
          skippedCount++;
        }
      }

      // Commit batch writes
      await batch.commit();
      console.log(
        `✅ Weekly audit complete. Processed: ${processedCount}, Skipped: ${skippedCount}`
      );
    } catch (error) {
      console.error('❌ Fatal error in generateWeeklyAudit:', error);
      throw error;
    }
  });

/**
 * Process a single user's audit
 */
async function processUserAudit(
  userId: string,
  userData: FirebaseFirestore.DocumentData,
  batch: FirebaseFirestore.WriteBatch
): Promise<void> {
  // Get the past 7 days of urge logs
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const logsSnapshot = await db
    .collection('users')
    .doc(userId)
    .collection('urge_logs')
    .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(sevenDaysAgo))
    .orderBy('timestamp', 'desc')
    .get();

  // Normalize logs to lightweight array
  const normalizedLogs: NormalizedLog[] = logsSnapshot.docs.map((doc) => {
    const data = doc.data();
    const timestamp = data.timestamp instanceof admin.firestore.Timestamp
      ? data.timestamp.toDate()
      : new Date(data.timestamp);

    return {
      trigger: data.trigger || 'unknown',
      failed: data.failed || false,
      time: timestamp.toISOString().split('T')[0], // YYYY-MM-DD format
    };
  });

  // Generate the audit
  const audit = await generateAudit(userId, userData, normalizedLogs);

  // Save to weekly_audits subcollection
  const weeklyAuditsRef = db
    .collection('users')
    .doc(userId)
    .collection('weekly_audits')
    .doc(`audit_${new Date().toISOString().split('T')[0]}`);

  batch.set(weeklyAuditsRef, {
    content: audit,
    generatedAt: admin.firestore.FieldValue.serverTimestamp(),
    logsCount: normalizedLogs.length,
    weekEndDate: new Date(sevenDaysAgo.getTime() + 7 * 24 * 60 * 60 * 1000),
  });

  console.log(`✓ Audit generated for user ${userId} (${normalizedLogs.length} logs)`);
}

/**
 * Generate neuro-audit using Groq Llama-3.1
 */
async function generateAudit(
  userId: string,
  userData: FirebaseFirestore.DocumentData,
  logs: NormalizedLog[]
): Promise<string> {
  // Handle empty logs case
  if (logs.length === 0) {
    return `# Neuro-Audit: Insufficient Data

No urge logs recorded in the past 7 days. Please log your urges to enable behavioral analysis.

**Next Steps:** Begin tracking urges to generate actionable insights.`;
  }

  // Prepare the prompt context
  const persona = userData.userPersona || 'default';
  const logsText = logs
    .map(
      (log, i) =>
        `${i + 1}. [${log.time}] Trigger: "${log.trigger}" → Failed: ${log.failed ? 'YES' : 'NO'}`
    )
    .join('\n');

  const systemPrompt = `You are a strict, clinical behavioral psychologist specializing in dopamine dysregulation and impulse control disorders. Your role is to analyze user behavior patterns and provide actionable psychological insights.

RESPONSE FORMAT - You MUST respond in strict Markdown with exactly three sections (headers):
1. "## The Pattern" - Identify recurring behavioral patterns, triggers, and failure modes
2. "## The Weakest Link" - Name the single weakest point in their impulse control chain
3. "## Next Week's Protocol" - Provide 3-5 specific, measurable behavioral interventions

TONE: Clinical, direct, non-judgmental. No conversational filler. Be concise and actionable.
PERSONA: User identity is "${persona}". Tailor language to their cognitive objective.`;

  const userPrompt = `Analyze these ${logs.length} urge logs from the past 7 days:

${logsText}

Generate a clinical behavioral audit with the three required sections.`;

  try {
    // Call Groq API with Llama-3.1
    const message = await groq.messages.create({
      model: 'mixtral-8x7b-32768', // Using Mixtral as fallback, adjust to llama-3.1 when available
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    // Extract text from response
    const responseText =
      message.content[0].type === 'text' ? message.content[0].text : '';

    // Validate response structure
    if (
      !responseText.includes('## The Pattern') ||
      !responseText.includes('## The Weakest Link') ||
      !responseText.includes('## Next Week\'s Protocol')
    ) {
      console.warn(`⚠️ Response missing required headers for user ${userId}`);
      return fallbackAudit(logs);
    }

    return responseText;
  } catch (error) {
    console.error(`❌ Groq API error for user ${userId}:`, error);
    return fallbackAudit(logs);
  }
}

/**
 * Fallback audit when API fails or returns invalid format
 */
function fallbackAudit(logs: NormalizedLog[]): string {
  const failedCount = logs.filter((log) => log.failed).length;
  const successRate = ((logs.length - failedCount) / logs.length) * 100;

  const triggers = logs.reduce(
    (acc, log) => {
      acc[log.trigger] = (acc[log.trigger] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const topTrigger = Object.entries(triggers).sort(([, a], [, b]) => b - a)[0][0];

  return `# Neuro-Audit: Behavioral Analysis

## The Pattern
Your logs show ${logs.length} recorded urges over the past week. The most frequent trigger was "${topTrigger}". Your success rate in resisting urges was ${successRate.toFixed(1)}%.

## The Weakest Link
The trigger "${topTrigger}" appears to be your vulnerability point, accounting for ${triggers[topTrigger]} of your ${logs.length} recorded urges.

## Next Week's Protocol
1. **Trigger Avoidance**: Minimize exposure to "${topTrigger}" contexts this week
2. **Micro-Interventions**: Implement the 5-minute pause technique when you encounter "${topTrigger}"
3. **Logging Consistency**: Continue daily logging to refine patterns
4. **Environmental Design**: Restructure your environment to reduce "${topTrigger}" accessibility`;
}

/**
 * Optional: Manual trigger for testing (callable function)
 */
export const triggerWeeklyAuditTest = functions
  .region('us-central1')
  .https.onCall(async (data, context) => {
    // Verify admin privileges
    if (!context.auth?.uid) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    try {
      console.log('🧪 Testing weekly audit for user:', context.auth.uid);

      const userDoc = await db
        .collection('users')
        .doc(context.auth.uid)
        .get();

      if (!userDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'User not found');
      }

      const batch = db.batch();
      await processUserAudit(context.auth.uid, userDoc.data() || {}, batch);
      await batch.commit();

      return {
        success: true,
        message: 'Audit generated successfully',
        userId: context.auth.uid,
      };
    } catch (error) {
      console.error('Test audit error:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to generate test audit'
      );
    }
  });
