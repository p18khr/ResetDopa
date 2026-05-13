"use strict";
/**
 * Weekly Neuro-Audit Cloud Function
 *
 * Trigger: Every Sunday at 8:00 PM PT
 * Purpose: Generate Llama-3.1 behavioral analysis for Premium users
 *
 * Business Logic:
 * 1. Fetch all users in batches of 50 (rate limiting)
 * 2. For each user: fetch last 7 days of urge_logs
 * 3. Call Groq API for "The Roast" (free analysis)
 * 4. If user purchased AI Protocol: add "Next Week's Protocol" (premium)
 * 5. Save Markdown audit to weekly_audits subcollection
 * 6. Reset ai_protocol_purchased flag
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.weeklyNeuroAudit = void 0;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const params_1 = require("firebase-functions/params");
const admin = __importStar(require("firebase-admin"));
const axios_1 = __importDefault(require("axios"));
const db = admin.firestore();
const groqApiKey = (0, params_1.defineSecret)('GROQ_API_KEY');
let GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const BATCH_SIZE = 50;
const DELAY_BETWEEN_REQUESTS_MS = 100;
/**
 * Batch iterator: Fetch users in chunks
 */
async function* fetchUsersBatch(batchSize) {
    let lastDoc = undefined;
    let hasMore = true;
    while (hasMore) {
        let query = db.collection('users').limit(batchSize);
        if (lastDoc)
            query = query.startAfter(lastDoc);
        const snapshot = await query.get();
        if (snapshot.empty) {
            hasMore = false;
        }
        else {
            yield snapshot.docs;
            lastDoc = snapshot.docs[snapshot.docs.length - 1];
        }
    }
}
/**
 * Format urge logs into lightweight array (token efficiency)
 */
function formatUrgeLogs(docs) {
    const logs = [];
    docs.forEach((doc) => {
        const data = doc.data();
        const timestamp = data.timestamp?.toDate?.() || new Date();
        logs.push({
            day: data.date || timestamp.toLocaleDateString(),
            time: timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            trigger: data.triggerApp || data.trigger || 'unknown',
            failed: data.bypassAttempted === true,
        });
    });
    return logs.sort((a, b) => new Date(`${b.day} ${b.time}`).getTime() - new Date(`${a.day} ${a.time}`).getTime());
}
/**
 * Fetch last 7 days of urge logs
 */
async function fetchRecentUrgeLogs(userId) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    try {
        const snapshot = await db
            .collection('users')
            .doc(userId)
            .collection('urge_logs')
            .where('timestamp', '>=', sevenDaysAgo)
            .orderBy('timestamp', 'desc')
            .get();
        return formatUrgeLogs(snapshot.docs);
    }
    catch (error) {
        console.warn(`Could not fetch urge logs for ${userId}:`, error);
        return [];
    }
}
/**
 * Call Groq Llama-3.1 for behavioral analysis
 */
async function generateAudit(email, logs, hasPurchasedProtocol) {
    const logSummary = logs.length > 0
        ? logs.slice(0, 5).map((l) => `${l.trigger} (${l.day})`).join(', ')
        : 'No urges';
    const failures = logs.filter((l) => l.failed).length;
    const failureRate = logs.length > 0 ? Math.round((failures / logs.length) * 100) : 0;
    const systemPrompt = `You are a ruthless clinical behavioral psychologist analyzing dopamine addiction.
Analyze with surgical precision and brutal honesty. Output strict Markdown.
Be specific and actionable.`;
    const userPrompt = `Analyze urge patterns for: ${email}

Last 7 days:
- Events: ${logSummary}
- Failures: ${failures}/${logs.length} (${failureRate}%)

Generate report:

## The Pattern
Identify temporal patterns, environmental triggers, and failure sequences.

## The Weakest Link
Name their biggest vulnerability. Brutal honesty.

${hasPurchasedProtocol
        ? `## Next Week's Protocol
ONE aggressive rule to break the weakness.
Format: "If [TRIGGER], then [BEHAVIOR]."
Absurdly specific.`
        : ''}

Max 2-3 sentences per section. 400 tokens max.`;
    try {
        const response = await axios_1.default.post(GROQ_API_URL, {
            model: 'llama-3.1-70b-versatile',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            temperature: 0.7,
            max_tokens: 400,
        }, {
            headers: {
                Authorization: `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json',
            },
            timeout: 30000,
        });
        return response.data.choices[0]?.message?.content || '';
    }
    catch (error) {
        console.error(`Groq error for ${email}:`, error.message);
        throw error;
    }
}
/**
 * Process single user: fetch data, generate audit, save, reset flag
 */
async function processUser(userDoc) {
    const uid = userDoc.id;
    const data = userDoc.data();
    if (!data?.email)
        return { success: false, userId: uid, error: 'No email' };
    try {
        const logs = await fetchRecentUrgeLogs(uid);
        const hasPurchasedProtocol = data.ai_protocol_purchased === true;
        const audit = await generateAudit(data.email, logs, hasPurchasedProtocol);
        await db
            .collection('users')
            .doc(uid)
            .collection('weekly_audits')
            .add({
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            week_ending: new Date(),
            audit,
            urge_count: logs.length,
            failures_this_week: logs.filter((l) => l.failed).length,
            had_protocol_purchase: hasPurchasedProtocol,
        });
        await db.collection('users').doc(uid).update({
            ai_protocol_purchased: false,
            last_audit_generated: admin.firestore.FieldValue.serverTimestamp(),
        });
        return { success: true, userId: uid };
    }
    catch (error) {
        console.error(`Failed to process user ${uid}:`, error.message);
        return { success: false, userId: uid, error: error.message };
    }
}
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
/**
 * MAIN: Weekly Neuro-Audit (Every Sunday 8:00 PM PT)
 */
exports.weeklyNeuroAudit = (0, scheduler_1.onSchedule)({
    schedule: 'every sunday 20:00',
    timeZone: 'America/Los_Angeles',
    secrets: [groqApiKey],
}, async (context) => {
    process.env.GROQ_API_KEY = groqApiKey.value();
    console.log('🧠 Starting Weekly Neuro-Audit...');
    const start = Date.now();
    let processed = 0;
    let success = 0;
    let failed = 0;
    const errors = [];
    try {
        for await (const batch of fetchUsersBatch(BATCH_SIZE)) {
            console.log(`Processing batch: ${batch.length} users`);
            for (const doc of batch) {
                await sleep(DELAY_BETWEEN_REQUESTS_MS);
                const result = await processUser(doc);
                processed++;
                if (result.success) {
                    success++;
                    console.log(`✅ ${result.userId}`);
                }
                else {
                    failed++;
                    errors.push(`${result.userId}: ${result.error}`);
                    console.log(`❌ ${result.userId}: ${result.error}`);
                }
            }
        }
        const duration = ((Date.now() - start) / 1000).toFixed(2);
        const summary = `
🎯 Complete: ${success}/${processed} | ${duration}s | ${failed} failures`;
        console.log(summary);
        await db.collection('audit_logs').add({
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            total_processed: processed,
            successful: success,
            failed,
            duration_seconds: parseFloat(duration),
            error_details: errors.slice(0, 10),
        });
        console.log(`Complete: ${success}/${processed} | ${failed} failures`);
    }
    catch (error) {
        console.error('🚨 Critical failure:', error.message);
        await db.collection('audit_logs').add({
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            status: 'CRITICAL_FAILURE',
            error_message: error.message,
            partial: { processed, successful: success, failed },
        });
        throw error;
    }
});
exports.default = exports.weeklyNeuroAudit;
//# sourceMappingURL=weeklyNeuroAudit.js.map