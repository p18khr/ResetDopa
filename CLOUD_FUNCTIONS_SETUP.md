# ✅ Firebase Cloud Functions - Weekly Neuro-Audit System

## 📦 What Was Created

### File Structure
```
functions/
├── package.json           # Dependencies (firebase-functions, groq-sdk, firebase-admin)
├── index.js              # Main Cloud Function (2 exports)
├── tsconfig.json         # TypeScript config
├── .env.example          # Environment variables template
├── README.md             # Full documentation
└── node_modules/         # (after npm install)
```

### Two Exported Functions

#### 1. **generateWeeklyAudit** (Scheduled)
- **Trigger**: Every Sunday at 8:00 PM
- **Timezone**: America/Denver (configurable)
- **Logic**:
  - Query all users with `isPremium: true`
  - For each user, fetch `urge_logs` from past 7 days
  - Call Groq Llama-3.1 API with behavioral psychologist system prompt
  - Save result to `users/{userId}/weekly_audits/{docId}`
  - Batch commit all writes

#### 2. **triggerWeeklyAuditTest** (Callable)
- **Trigger**: Manual call from client (requires auth)
- **Purpose**: Test audit generation for single user
- **Endpoint**: Call from React Native via Firebase Functions SDK

---

## 🎯 Architecture Details

### System Prompt (Behavioral Psychologist)
```
You are a strict, clinical behavioral psychologist specializing in dopamine dysregulation...

RESPONSE FORMAT - You MUST respond with exactly three sections:
1. "## The Pattern" - Recurring behavioral patterns, triggers, failure modes
2. "## The Weakest Link" - Single weakest point in impulse control chain
3. "## Next Week's Protocol" - 3-5 specific, measurable behavioral interventions

TONE: Clinical, direct, non-judgmental. No conversational filler.
PERSONA: Tailored to user's userPersona (student/professional/minimalist)
```

### Data Flow

**Input** → `/users/{userId}/urge_logs` (past 7 days)
```typescript
{
  trigger: "Social Media" | "Work Email" | ...
  failed: true | false
  timestamp: Timestamp
}
```

**Normalization** (lightweight array for API)
```typescript
[
  { trigger: "Instagram", failed: true, time: "2024-01-14" },
  { trigger: "Reddit", failed: false, time: "2024-01-13" },
  ...
]
```

**Output** → `/users/{userId}/weekly_audits/{docId}`
```typescript
{
  content: "# Neuro-Audit...\n\n## The Pattern\n...",
  generatedAt: Timestamp,
  logsCount: 23,
  weekEndDate: Date
}
```

---

## 🚀 Quick Start

### Step 1: Install Dependencies
```bash
cd functions
npm install
```

### Step 2: Get Groq API Key
1. Go to https://console.groq.com
2. Sign up / Log in
3. Create API key
4. Copy key

### Step 3: Set Environment Variable
```bash
cd functions
cp .env.example .env
# Edit .env and paste your GROQ_API_KEY
```

### Step 4: Deploy
```bash
npm run deploy
# or from project root:
firebase deploy --only functions
```

### Step 5: Verify Deployment
```bash
npm run logs
# Should see: "✅ Weekly audit complete. Processed: X, Skipped: Y"
```

---

## 🧪 Testing

### Test Locally (Emulator)
```bash
cd functions
npm run serve
```
Then manually trigger via Firebase emulator UI.

### Test in Production (Callable Function)
From your React Native app, add this test button:

```typescript
import { httpsCallable } from 'firebase/functions';
import { functions } from './firebaseConfig';

export async function testAuditGeneration() {
  try {
    const triggerTest = httpsCallable(functions, 'triggerWeeklyAuditTest');
    const result = await triggerTest();
    console.log('✅ Audit result:', result.data);
    alert('Audit generated! Check Firestore.');
  } catch (error) {
    console.error('❌ Error:', error);
    alert('Test failed. Check console.');
  }
}
```

---

## ⚙️ Configuration

### Adjust Schedule
**File**: `functions/index.js` line 25-27

Current:
```typescript
.pubsub
  .schedule('every sunday 20:00')
  .timeZone('America/Denver')
```

Change timezone:
- `'America/New_York'`
- `'America/Los_Angeles'`
- `'Europe/London'`
- `'Asia/Tokyo'`
- etc.

Change schedule:
- `'every day 18:00'`
- `'every monday,wednesday,friday 09:00'`
- `'0 20 * * 0'` (cron format)

### Switch Groq Model
**File**: `functions/index.js` line 119

Current:
```typescript
model: 'mixtral-8x7b-32768'
```

When Llama-3.1 is available:
```typescript
model: 'llama-3.1-70b-versatile'
```

---

## 🛡️ Error Handling

| Scenario | Behavior |
|----------|----------|
| **0 logs for user** | Skip API call, save default "Insufficient Data" doc |
| **Groq API timeout** | Return fallback audit with stats |
| **Invalid response format** | Log warning, return fallback audit with trigger analysis |
| **Batch write fails** | Transaction rolls back; retried next execution |
| **User not found** | Gracefully skip, continue with next user |

---

## 📊 Monitoring

### View Logs
```bash
firebase functions:log --limit 50
```

### Check Function Execution
Firebase Console → Cloud Functions → `generateWeeklyAudit`
- Last executed
- Execution time
- Error rate

### Firestore Health
Check `/users/{userId}/weekly_audits` collection:
```bash
firebase firestore:inspect
```

---

## 🔒 Security Checklist

✅ **Groq API Key**
- Stored in environment variables (not hardcoded)
- Rotatable via Firebase Console

✅ **Firestore Security**
- Only premium users queried (`isPremium == true`)
- Only own user's audits can be read

✅ **Callable Function**
- Requires authentication (`context.auth?.uid`)
- User can only trigger own audit

---

## 🐛 Troubleshooting

### Function not triggering at scheduled time
1. Check timezone is correct (line 27)
2. Verify no errors in previous runs (via logs)
3. Check project has billing enabled

### Groq API rate limit reached
1. Add exponential backoff (extend timeout in package.json)
2. Reduce concurrent user processing
3. Upgrade Groq plan

### Response missing required headers
1. Check Groq model availability
2. Verify system prompt (lines 85-94)
3. Review Groq API docs

### Fallback audit being saved instead of Groq response
1. Check GROQ_API_KEY is set correctly
2. Verify Groq account has credits
3. Check function logs for API error details

---

## 📝 Next Steps

1. ✅ Install dependencies: `npm install`
2. ✅ Get Groq API key from https://console.groq.com
3. ✅ Set GROQ_API_KEY in .env or Firebase Console
4. ✅ Deploy: `npm run deploy`
5. ✅ Test with `triggerWeeklyAuditTest` callable function
6. ✅ Monitor first Sunday execution via Firebase Console
7. ✅ Adjust timezone/schedule as needed

---

## 📚 Documentation

- **Full README**: `functions/README.md`
- **Firestore Rules**: Should be updated to allow weekly_audits reads
- **API Docs**: https://console.groq.com/docs
- **Firebase Functions**: https://firebase.google.com/docs/functions

---

**Status**: ✅ Ready to deploy!
