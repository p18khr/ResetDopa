const fs = require('fs');
const filePath = './src/screens/Dashboard.js';
let content = fs.readFileSync(filePath, 'utf8');

console.log('Original content checks:');
console.log('Contains "We\'re here":', content.includes("We're here"));
console.log('Contains "regain your will":', content.includes("regain your will"));
console.log('Contains "Let\'s begin":', content.includes("Let's begin"));

// Replace the three lines
content = content.replace(
  "We're here to help you regain your will and focus. We make boring things feel interesting again — one tiny, meaningful action at a time.",
  "A 30-day program built on tiny, consistent actions. Each day builds momentum toward stronger focus and will."
);

content = content.replace(
  "We've curated a 30‑day program for you. To ease onboarding, start by selecting 5 tasks you feel drawn to today. Each task has a purpose — why it's here and how it helps.",
  "Start by selecting 5 tasks for Week 1. These will be your anchors — the foundation of your practice."
);

content = content.replace(
  "Let's begin your reset. Happy journey! 🌱",
  "As you build consistency, task count increases to match your momentum. Begin now. 🌱"
);

fs.writeFileSync(filePath, content, 'utf8');

// Verify
const updatedContent = fs.readFileSync(filePath, 'utf8');
console.log('\nAfter update checks:');
console.log('Contains "A 30-day program":', updatedContent.includes("A 30-day program"));
console.log('Contains "Week 1":', updatedContent.includes("Week 1"));
console.log('Contains "consistency, task count increases":', updatedContent.includes("consistency, task count increases"));

console.log('\nFile updated successfully');
