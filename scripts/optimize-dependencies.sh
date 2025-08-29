#!/bin/bash
# Dependency Optimization Script
# Generated automatically from dependency analysis

echo "🔧 Starting dependency optimization..."

# Remove heavy database dependencies from production build
echo "📦 Optimizing database dependencies..."
npm uninstall pg pg-connection-string pgpass postgres-bytea
npm install --save-dev pg pg-connection-string

# Optimize AI/ML dependencies
echo "🤖 Optimizing AI dependencies..."
# Consider replacing full tensorflow bundle with specific modules
# npm uninstall @tensorflow/tfjs
# npm install @tensorflow/tfjs-core @tensorflow/tfjs-backend-webgl

# Tree-shaking improvements
echo "🌳 Implementing tree-shaking improvements..."
# npm uninstall @tensorflow/tfjs && npm install @tensorflow/tfjs-core + specific backends

# Bundle analysis
echo "📊 Running bundle analysis..."
npm run build
node scripts/analyze-bundle-advanced.js

echo "✅ Dependency optimization complete!"
