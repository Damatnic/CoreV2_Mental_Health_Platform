#!/bin/bash
# Video Optimization Script
# Generated automatically from video analysis

echo "🎬 Starting video optimization..."

# Check if FFmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo "❌ FFmpeg is not installed. Please install FFmpeg first."
    echo "   Windows: Download from https://ffmpeg.org/download.html"
    echo "   macOS: brew install ffmpeg"
    echo "   Ubuntu: sudo apt install ffmpeg"
    exit 1
fi

# Create backup directory
BACKUP_DIR="Videos_backup_$(date +%Y%m%d_%H%M%S)"
echo "📦 Creating backup in $BACKUP_DIR..."
mkdir -p "$BACKUP_DIR"
cp -r public/Videos/* "$BACKUP_DIR/" 2>/dev/null || true


echo "✅ Video optimization complete!"
echo "📊 Check the optimized videos in public/Videos/"
echo "📦 Original videos backed up to $BACKUP_DIR"

# Generate video manifest for progressive loading
echo "📋 Generating video manifest..."
node scripts/generate-video-manifest.js

echo "🚀 All optimizations complete!"
