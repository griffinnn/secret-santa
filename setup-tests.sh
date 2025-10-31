#!/bin/bash

# Secret Santa Test Setup Script

echo "🎄 Setting up Playwright for Secret Santa tests..."

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install Node.js and npm first."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Install Playwright browsers
echo "🌐 Installing Playwright browsers..."
npx playwright install

echo ""
echo "✅ Setup complete!"
echo ""
echo "Ready to run tests. Choose one:"
echo "  • npm test              - Run all tests"
echo "  • npm run test:headed   - Run with visible browser"
echo "  • npm run test:ui       - Run with interactive UI"
echo "  • npm run test:debug    - Run in debug mode"
echo ""
echo "For more info, see tests/e2e/README.md"
