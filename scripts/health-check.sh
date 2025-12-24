#!/bin/bash

echo "🏥 Checking Project Health..."

# 1. Linting
echo "🔍 Running Lint..."
npm run lint
if [ $? -ne 0 ]; then
    echo "❌ Linting Failed"
    exit 1
fi

# 2. Type Check
echo "📐 Running Type Check..."
npm run typecheck
if [ $? -ne 0 ]; then
    echo "❌ Type Check Failed"
    exit 1
fi

# 3. Tests
echo "🧪 Running Tests..."
npm test -- --passWithNoTests
if [ $? -ne 0 ]; then
    echo "❌ Tests Failed"
    exit 1
fi

echo "✅ All Systems Go! Project is healthy."
exit 0
