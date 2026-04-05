#!/bin/bash

# Quick setup script for Firebase Cloud Functions
# Run this from the project root

echo "🚀 ResetDopa Cloud Functions Setup"
echo "===================================="

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Install it first:"
    echo "   npm install -g firebase-tools"
    exit 1
fi

# Step 1: Navigate to functions directory
cd functions || exit 1

# Step 2: Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Step 3: Create .env file
if [ ! -f .env ]; then
    echo ""
    echo "🔑 Setting up environment variables..."
    cp .env.example .env
    echo "   Created .env file - please add your GROQ_API_KEY"
    echo "   Get it from: https://console.groq.com"
fi

# Step 4: Test build
echo ""
echo "🔨 Testing TypeScript compilation..."
npm run build

# Step 5: Deploy prompt
echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit functions/.env and add your GROQ_API_KEY"
echo "2. Deploy with: npm run deploy"
echo "3. Monitor logs with: npm run logs"
echo ""
echo "To test locally:"
echo "  npm run serve"
echo ""
