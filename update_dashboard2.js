const fs = require('fs');
const filePath = './src/screens/Dashboard.js';
let content = fs.readFileSync(filePath, 'utf8');

// Use regex to match any apostrophe/quote character
// Replace line 1
content = content.replace(
  /We.re here to help you regain your will and focus\. We make boring things feel interesting again — one tiny, meaningful action at a time\./,
  "A 30-day program built on tiny, consistent actions. Each day builds momentum toward stronger focus and will."
);

// Replace line 2
content = content.replace(
  /We.ve curated a 30.day program for you\. To ease onboarding, start by selecting 5 tasks you feel drawn to today\. Each task has a purpose — why it.s here and how it helps\./,
  "Start by selecting 5 tasks for Week 1. These will be your anchors — the foundation of your practice."
);

// Replace line 3
content = content.replace(
  /Let.s begin your reset\. Happy journey!/,
  "As you build consistency, task count increases to match your momentum. Begin now."
);

fs.writeFileSync(filePath, content, 'utf8');

const updated = fs.readFileSync(filePath, 'utf8');
console.log('Contains "A 30-day program built":', updated.includes("A 30-day program built"));
console.log('Contains "Week 1":', updated.includes("Week 1"));
console.log('Contains "consistency, task count increases":', updated.includes("consistency, task count increases"));
console.log('File updated!');
