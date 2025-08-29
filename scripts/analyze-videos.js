#!/usr/bin/env node

/**
 * Video Asset Optimization Script
 * Analyzes and optimizes video files for web delivery
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

// Video optimization configuration
const VIDEO_CONFIG = {
  // Maximum file size for web delivery (in MB)
  maxFileSize: 50,
  
  // Recommended video formats
  formats: ['webm', 'mp4'],
  
  // Quality settings
  qualities: {
    low: { width: 480, bitrate: '500k' },
    medium: { width: 720, bitrate: '1000k' },
    high: { width: 1080, bitrate: '2000k' }
  },
  
  // Mental health content guidelines
  mentalHealthOptimization: {
    // Ensure quick loading for crisis intervention videos
    priorityVideos: ['crisis', 'emergency', 'support'],
    
    // Optimize for accessibility
    requireCaptions: true,
    
    // Ensure videos work offline
    enableCaching: true
  }
};

class VideoOptimizer {
  constructor() {
    this.videoDirectory = path.join(process.cwd(), 'public', 'Videos');
    this.results = {
      totalVideos: 0,
      totalSize: 0,
      largeVideos: [],
      optimizationSuggestions: [],
      mentalHealthRecommendations: []
    };
  }

  // Get file size in MB
  getFileSize(filePath) {
    try {
      const stats = fs.statSync(filePath);
      return Math.round(stats.size / (1024 * 1024) * 100) / 100; // Round to 2 decimal places
    } catch (error) {
      log(`Warning: Could not read file ${filePath}: ${error.message}`, 'yellow');
      return 0;
    }
  }

  // Analyze video files
  analyzeVideos() {
    if (!fs.existsSync(this.videoDirectory)) {
      log('❌ Videos directory not found', 'red');
      return false;
    }

    const files = fs.readdirSync(this.videoDirectory);
    const videoFiles = files.filter(file => 
      /\.(mp4|webm|mov|avi|mkv)$/i.test(file)
    );

    log(`\n📹 Found ${videoFiles.length} video files`, 'cyan');

    videoFiles.forEach(file => {
      const filePath = path.join(this.videoDirectory, file);
      const size = this.getFileSize(filePath);
      
      this.results.totalVideos++;
      this.results.totalSize += size;

      // Check if file is too large
      if (size > VIDEO_CONFIG.maxFileSize) {
        this.results.largeVideos.push({
          name: file,
          size: size,
          path: filePath,
          optimization: this.getOptimizationSuggestion(file, size)
        });
      }

      // Check mental health content optimization
      this.analyzeMentalHealthContent(file, size);
    });

    return true;
  }

  // Get optimization suggestion for a video
  getOptimizationSuggestion(filename, size) {
    const suggestions = [];

    if (size > 100) {
      suggestions.push('Consider compressing to reduce file size significantly');
    } else if (size > VIDEO_CONFIG.maxFileSize) {
      suggestions.push('Compress to meet web delivery standards');
    }

    // Check if it's mental health content
    const isMentalHealthContent = VIDEO_CONFIG.mentalHealthOptimization.priorityVideos
      .some(keyword => filename.toLowerCase().includes(keyword));

    if (isMentalHealthContent) {
      suggestions.push('Optimize for quick loading - crisis intervention priority');
    }

    suggestions.push('Convert to WebM format for better compression');
    suggestions.push('Generate multiple quality versions (480p, 720p, 1080p)');

    return suggestions;
  }

  // Analyze mental health specific optimizations
  analyzeMentalHealthContent(filename, size) {
    const lowerName = filename.toLowerCase();
    
    // Check for mental health keywords
    const mentalHealthKeywords = [
      'ted lasso', 'quote', 'support', 'motivation', 'wellness',
      'crisis', 'help', 'therapy', 'mindfulness', 'inspiration'
    ];

    const isRelevant = mentalHealthKeywords.some(keyword => 
      lowerName.includes(keyword)
    );

    if (isRelevant) {
      this.results.mentalHealthRecommendations.push({
        filename,
        size,
        recommendations: [
          'Ensure captions are available for accessibility',
          'Optimize for offline viewing capabilities',
          'Consider creating preview/thumbnail versions',
          'Implement progressive loading for better UX',
          'Test loading performance on mobile networks'
        ]
      });
    }
  }

  // Generate optimization commands
  generateOptimizationCommands() {
    const commands = [];

    this.results.largeVideos.forEach(video => {
      const baseName = path.parse(video.name).name;
      const inputPath = video.path;

      // Generate WebM versions
      commands.push({
        type: 'conversion',
        description: `Convert ${video.name} to WebM format`,
        command: `ffmpeg -i "${inputPath}" -c:v libvpx-vp9 -b:v 1M -c:a libopus "${path.join(this.videoDirectory, baseName)}.webm"`
      });

      // Generate multiple quality versions
      Object.entries(VIDEO_CONFIG.qualities).forEach(([quality, settings]) => {
        commands.push({
          type: 'quality',
          description: `Create ${quality} quality version of ${video.name}`,
          command: `ffmpeg -i "${inputPath}" -vf scale=${settings.width}:-2 -b:v ${settings.bitrate} "${path.join(this.videoDirectory, baseName)}_${quality}.mp4"`
        });
      });

      // Generate poster images
      commands.push({
        type: 'poster',
        description: `Generate poster image for ${video.name}`,
        command: `ffmpeg -i "${inputPath}" -ss 00:00:01 -vframes 1 "${path.join(this.videoDirectory, baseName)}_poster.jpg"`
      });
    });

    return commands;
  }

  // Print detailed analysis report
  printReport() {
    log('\n📊 VIDEO OPTIMIZATION ANALYSIS', 'bright');
    log('='.repeat(50), 'cyan');

    // Overall metrics
    log(`\n📈 Overall Metrics:`, 'bright');
    log(`   Total videos: ${this.results.totalVideos}`, 'green');
    log(`   Total size: ${this.results.totalSize.toFixed(2)}MB`, 'green');
    log(`   Large videos (>${VIDEO_CONFIG.maxFileSize}MB): ${this.results.largeVideos.length}`, 
        this.results.largeVideos.length > 0 ? 'red' : 'green');
    log(`   Average size: ${(this.results.totalSize / this.results.totalVideos).toFixed(2)}MB`, 'cyan');

    // Large videos analysis
    if (this.results.largeVideos.length > 0) {
      log(`\n⚠️  Large Videos Requiring Optimization:`, 'red');
      this.results.largeVideos.forEach(video => {
        log(`   • ${video.name}: ${video.size.toFixed(2)}MB`, 'red');
        video.optimization.forEach(suggestion => {
          log(`     - ${suggestion}`, 'yellow');
        });
      });
    }

    // Mental health content recommendations
    if (this.results.mentalHealthRecommendations.length > 0) {
      log(`\n🏥 Mental Health Content Optimization:`, 'bright');
      this.results.mentalHealthRecommendations.forEach(content => {
        log(`   📹 ${content.filename} (${content.size.toFixed(2)}MB)`, 'cyan');
        content.recommendations.forEach(rec => {
          log(`     • ${rec}`, 'reset');
        });
      });
    }

    // Web delivery recommendations
    log(`\n🌐 Web Delivery Recommendations:`, 'bright');
    log(`   • Use WebM format for better compression`, 'green');
    log(`   • Implement progressive video loading`, 'green');
    log(`   • Generate multiple quality versions for adaptive streaming`, 'green');
    log(`   • Add poster images for faster perceived loading`, 'green');
    log(`   • Ensure videos work offline for crisis support`, 'yellow');

    // Accessibility recommendations
    log(`\n♿ Accessibility Recommendations:`, 'bright');
    log(`   • Add closed captions to all videos`, 'green');
    log(`   • Provide audio descriptions for visual content`, 'green');
    log(`   • Ensure videos are keyboard navigable`, 'green');
    log(`   • Test with screen readers`, 'green');

    // Performance impact
    const potentialSavings = this.results.largeVideos.reduce((total, video) => {
      return total + (video.size * 0.6); // Assume 60% compression
    }, 0);

    log(`\n⚡ Performance Impact:`, 'bright');
    log(`   Current total size: ${this.results.totalSize.toFixed(2)}MB`, 'red');
    log(`   Potential savings: ${potentialSavings.toFixed(2)}MB (60% compression)`, 'green');
    log(`   Optimized total: ${(this.results.totalSize - potentialSavings).toFixed(2)}MB`, 'green');
  }

  // Generate optimization script
  generateOptimizationScript() {
    const commands = this.generateOptimizationCommands();
    
    let scriptContent = `#!/bin/bash
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

`;

    commands.forEach(cmd => {
      scriptContent += `
# ${cmd.description}
echo "🔄 ${cmd.description}..."
${cmd.command}

`;
    });

    scriptContent += `
echo "✅ Video optimization complete!"
echo "📊 Check the optimized videos in public/Videos/"
echo "📦 Original videos backed up to $BACKUP_DIR"

# Generate video manifest for progressive loading
echo "📋 Generating video manifest..."
node scripts/generate-video-manifest.js

echo "🚀 All optimizations complete!"
`;

    try {
      fs.writeFileSync('scripts/optimize-videos.sh', scriptContent);
      
      // Make script executable on Unix systems
      try {
        fs.chmodSync('scripts/optimize-videos.sh', '755');
      } catch (error) {
        log(`Note: Could not set script permissions: ${error.message}`, 'yellow');
      }
      
      log(`\n📝 Generated optimization script: scripts/optimize-videos.sh`, 'green');
      log(`   Run this script to optimize all videos automatically`, 'cyan');
    } catch (error) {
      log(`❌ Failed to generate optimization script: ${error.message}`, 'red');
    }
  }

  // Generate video manifest for progressive loading
  generateVideoManifest() {
    const manifest = {
      version: 1,
      generated: new Date().toISOString(),
      videos: []
    };

    if (fs.existsSync(this.videoDirectory)) {
      const files = fs.readdirSync(this.videoDirectory);
      const videoFiles = files.filter(file => 
        /\.(mp4|webm)$/i.test(file)
      );

      videoFiles.forEach(file => {
        const filePath = path.join(this.videoDirectory, file);
        const size = this.getFileSize(filePath);
        const baseName = path.parse(file).name;

        manifest.videos.push({
          name: baseName,
          formats: [
            {
              format: path.extname(file).substring(1),
              file: file,
              size: size
            }
          ],
          poster: `${baseName}_poster.jpg`,
          priority: this.getVideoPriority(file),
          mentalHealthContent: this.isMentalHealthContent(file)
        });
      });
    }

    try {
      fs.writeFileSync(
        path.join(process.cwd(), 'public', 'video-manifest.json'),
        JSON.stringify(manifest, null, 2)
      );
      log(`📋 Generated video manifest: public/video-manifest.json`, 'green');
    } catch (error) {
      log(`❌ Failed to generate video manifest: ${error.message}`, 'red');
    }
  }

  // Determine video priority for loading
  getVideoPriority(filename) {
    const lowerName = filename.toLowerCase();
    
    if (lowerName.includes('crisis') || lowerName.includes('emergency')) {
      return 10; // Highest priority
    }
    
    if (lowerName.includes('support') || lowerName.includes('help')) {
      return 8;
    }
    
    if (lowerName.includes('ted lasso') || lowerName.includes('quote')) {
      return 6; // Medium priority for inspirational content
    }
    
    return 3; // Default priority
  }

  // Check if video contains mental health content
  isMentalHealthContent(filename) {
    const mentalHealthKeywords = [
      'ted lasso', 'quote', 'support', 'motivation', 'wellness',
      'crisis', 'help', 'therapy', 'mindfulness', 'inspiration'
    ];
    
    return mentalHealthKeywords.some(keyword => 
      filename.toLowerCase().includes(keyword)
    );
  }

  // Run complete analysis
  run() {
    log('\n🎬 Starting Video Optimization Analysis...', 'bright');
    
    if (!this.analyzeVideos()) {
      return false;
    }
    
    this.printReport();
    this.generateOptimizationScript();
    this.generateVideoManifest();
    
    return true;
  }
}

// Run analysis if script is executed directly
if (require.main === module) {
  const optimizer = new VideoOptimizer();
  const success = optimizer.run();
  process.exit(success ? 0 : 1);
}

module.exports = VideoOptimizer;
