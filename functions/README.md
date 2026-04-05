# Firebase Cloud Functions - Neuro-Audit Generator

## Overview
Automated weekly behavioral audit system that reads user urge logs and generates clinical AI summaries using Groq's Llama-3.1.

**Schedule**: Every Sunday at 8:00 PM (configurable timezone)

## Architecture

### Trigger
- **Type**: Pub/Sub scheduled job
- **Cron**: `every sunday 20:00`
- **Timezone**: America/Denver (adjust in `index.js` line 27)

### Flow
1. Query all users with `isPremium: true`
2. For each user:
   - Fetch `urge_logs` from past 7 days
   - Normalize to lightweight array: `[{ trigger, failed, time }]`
   - Call Groq API with system prompt (behavioral psychologist)
   - Save result to `users/{userId}/weekly_audits/{docId}`
3. Batch commit all writes

### Data Model

**Input**: `/users/{userId}/urge_logs` (last 7 days)
```typescript
{
  trigger: string;        // e.g., "Social Media", "Work Email"
  failed: boolean;        // true if user failed to resist urge
  timestamp: Timestamp;
}
```

**Output**: `/users/{userId}/weekly_audits/{docId}`
```typescript
{
  content: string;        // Markdown audit from Llama-3.1
  generatedAt: Timestamp; // Server timestamp
  logsCount: number;      // Number of logs in week
  weekEndDate: Date;
}
```

## System Prompt Engineering

The system prompt instructs Llama-3.1 to:
- Act as a **strict clinical behavioral psychologist**
- Return **strict Markdown** with exactly three headers:
  - `## The Pattern` - Recurring behavioral patterns & triggers
  - `## The Weakest Link` - Single weakest point in impulse control
  - `## Next Week's Protocol` - 3-5 specific, measurable interventions
- Provide **clinical, direct, non-judgmental** tone
- Tailor language to user's `userPersona` (student/professional/minimalist)

## Error Handling

| Scenario | Behavior |
|----------|----------|
| 0 logs for user | Skip API call, save default "Insufficient Data" response |
| Groq API fails | Return fallback audit with statistics from logs |
| Invalid response format | Log warning, return fallback audit |
| Batch write fails | Function fails; retry on next execution |

## Deployment

### 1. Install Dependencies
```bash
cd functions
npm install
```

### 2. Set Environment Variables
```bash
# Firebase cloud console or .env.local
GROQ_API_KEY=your_groq_api_key_here
```

Or via Firebase CLI:
```bash
firebase functions:config:set groq.api_key="your_api_key"
```

### 3. Deploy
```bash
npm run deploy
# or
firebase deploy --only functions
```

### 4. View Logs
```bash
npm run logs
# or filter by function:
firebase functions:log --limit 50
```

## Testing

### Local Emulator
```bash
npm run serve
```
Then manually trigger via Firebase emulator UI.

### Callable Function (Production Testing)
Call `triggerWeeklyAuditTest` from the client to manually generate an audit:

```typescript
// In your React Native app
import { httpsCallable } from 'firebase/functions';

const triggerTest = httpsCallable(functions, 'triggerWeeklyAuditTest');
const result = await triggerTest({});
console.log('Audit result:', result.data);
```

## Troubleshooting

### Function times out
- Reduce max concurrent users processed
- Increase timeout in function configuration

### Groq API rate limit
- Add exponential backoff retry logic
- Implement request queuing

### Missing required headers in response
- Fallback audit is returned
- Check Groq API docs for Llama-3.1 availability in your region

## Variables

Update these in `index.js`:
- **Line 27**: Timezone (currently `'America/Denver'`)
- **Line 20**: Groq model (currently `'mixtral-8x7b-32768'`, change to `'llama-3.1-70b-versatile'` when available)
- **Batch size**: Add pagination if processing > 1000 users

## Firestore Indexes Required

Create composite index:
```
Collection: users
Filter: isPremium == true
Sort: (none)
```

And for urge_logs queries:
```
Collection: users/{userId}/urge_logs
Filter: timestamp >= [date]
Sort: timestamp (desc)
```

## Next Steps

1. Generate Groq API key: https://console.groq.com
2. Set `GROQ_API_KEY` environment variable
3. Adjust timezone in index.js line 27
4. Deploy: `npm run deploy`
5. Monitor first execution via Firebase Console → Functions
