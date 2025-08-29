#!/bin/bash

echo "🚀 AstralCore Deployment Script"
echo "================================"

# Build the project
echo "📦 Building project..."
npm run build

# Check if build was successful
if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix errors and try again."
    exit 1
fi

echo "✅ Build successful!"

# Deploy to Netlify
echo "🌐 Deploying to Netlify..."
npx netlify deploy --prod --dir dist

echo "✅ Deployment complete!"
echo "🔗 Your site should be live at: https://astral-core-react.netlify.app"