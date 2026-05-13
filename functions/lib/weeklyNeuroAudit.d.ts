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
/**
 * MAIN: Weekly Neuro-Audit (Every Sunday 8:00 PM PT)
 */
export declare const weeklyNeuroAudit: import("firebase-functions/v2/scheduler").ScheduleFunction;
export default weeklyNeuroAudit;
