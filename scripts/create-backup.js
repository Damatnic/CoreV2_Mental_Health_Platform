#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

// Configuration
const PROJECT_ROOT = path.resolve(__dirname, '..');
const BACKUP_DIR = path.join(PROJECT_ROOT, 'backups');
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
const BACKUP_NAME = `astral-backup-${TIMESTAMP}`;

// Directories and files to exclude from backup
const EXCLUDE_PATTERNS = [
  'node_modules',
  'dist',
  'build',
  '.git',
  '*.log',
  'backups',
  '.env',
  'coverage',
  '.cache',
  'playwright-report',
  'test-results'
];

// Create backups directory if it doesn't exist
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  console.log('✅ Created backups directory');
}

console.log('🚀 Starting backup process...');
console.log(`📁 Project root: ${PROJECT_ROOT}`);
console.log(`📦 Backup name: ${BACKUP_NAME}`);

// Function to get file count (excluding ignored patterns)
function getFileCount() {
  try {
    const excludeArgs = EXCLUDE_PATTERNS.map(pattern => `--exclude="${pattern}"`).join(' ');
    const command = `find . -type f ${excludeArgs} | wc -l`;
    const count = execSync(command, { cwd: PROJECT_ROOT, encoding: 'utf8' }).trim();
    return parseInt(count, 10);
  } catch (error) {
    // Fallback for Windows
    let count = 0;
    const countFiles = (dir) => {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const relativePath = path.relative(PROJECT_ROOT, fullPath);
        
        // Check if should be excluded
        const shouldExclude = EXCLUDE_PATTERNS.some(pattern => {
          if (pattern.includes('*')) {
            return relativePath.includes(pattern.replace('*', ''));
          }
          return relativePath.includes(pattern);
        });
        
        if (shouldExclude) continue;
        
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          countFiles(fullPath);
        } else {
          count++;
        }
      }
    };
    countFiles(PROJECT_ROOT);
    return count;
  }
}

// Function to calculate directory size
function getDirectorySize(dir) {
  let size = 0;
  
  const calculateSize = (currentDir) => {
    const items = fs.readdirSync(currentDir);
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const relativePath = path.relative(PROJECT_ROOT, fullPath);
      
      // Check if should be excluded
      const shouldExclude = EXCLUDE_PATTERNS.some(pattern => {
        if (pattern.includes('*')) {
          return relativePath.includes(pattern.replace('*', ''));
        }
        return relativePath.includes(pattern);
      });
      
      if (shouldExclude) continue;
      
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        calculateSize(fullPath);
      } else {
        size += stat.size;
      }
    }
  };
  
  calculateSize(dir);
  return size;
}

// Get project metadata
console.log('📊 Gathering project metadata...');
const fileCount = getFileCount();
const projectSize = getDirectorySize(PROJECT_ROOT);
const packageJson = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'package.json'), 'utf8'));

// Create backup manifest
const manifest = {
  timestamp: new Date().toISOString(),
  backupName: BACKUP_NAME,
  projectName: packageJson.name,
  projectVersion: packageJson.version,
  fileCount: fileCount,
  projectSizeBytes: projectSize,
  projectSizeMB: (projectSize / (1024 * 1024)).toFixed(2),
  nodeVersion: process.version,
  npmVersion: execSync('npm -v', { encoding: 'utf8' }).trim(),
  platform: process.platform,
  excludedPatterns: EXCLUDE_PATTERNS,
  dependencies: Object.keys(packageJson.dependencies || {}).length,
  devDependencies: Object.keys(packageJson.devDependencies || {}).length
};

// Save manifest
const manifestPath = path.join(BACKUP_DIR, `${BACKUP_NAME}-manifest.json`);
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log('✅ Created backup manifest');

// Create tar archive
console.log('📦 Creating backup archive...');
const excludeArgs = EXCLUDE_PATTERNS.map(pattern => `--exclude='${pattern}'`).join(' ');
const tarCommand = process.platform === 'win32'
  ? `tar -czf "${path.join(BACKUP_DIR, `${BACKUP_NAME}.tar.gz`)}" ${excludeArgs} .`
  : `tar -czf "${path.join(BACKUP_DIR, `${BACKUP_NAME}.tar.gz`)}" ${excludeArgs} --transform 's,^\\.,${BACKUP_NAME},' .`;

try {
  execSync(tarCommand, { 
    cwd: PROJECT_ROOT,
    stdio: 'inherit',
    shell: true
  });
  console.log('✅ Created backup archive');
} catch (error) {
  console.error('❌ Failed to create tar archive:', error.message);
  console.log('Attempting alternative backup method...');
  
  // Alternative: Create zip using Node.js
  const archiver = require('archiver');
  const output = fs.createWriteStream(path.join(BACKUP_DIR, `${BACKUP_NAME}.zip`));
  const archive = archiver('zip', { zlib: { level: 9 } });
  
  output.on('close', () => {
    console.log(`✅ Created backup archive (${(archive.pointer() / (1024 * 1024)).toFixed(2)} MB)`);
  });
  
  archive.on('error', (err) => {
    throw err;
  });
  
  archive.pipe(output);
  
  // Add files to archive
  EXCLUDE_PATTERNS.forEach(pattern => {
    archive.glob('**/*', {
      cwd: PROJECT_ROOT,
      ignore: pattern
    });
  });
  
  archive.finalize();
}

// Calculate checksum
const archivePath = path.join(BACKUP_DIR, `${BACKUP_NAME}.tar.gz`);
if (fs.existsSync(archivePath)) {
  const fileBuffer = fs.readFileSync(archivePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  const checksum = hashSum.digest('hex');
  
  // Update manifest with checksum
  manifest.checksum = checksum;
  manifest.archiveSize = fs.statSync(archivePath).size;
  manifest.archiveSizeMB = (manifest.archiveSize / (1024 * 1024)).toFixed(2);
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  
  console.log(`✅ Calculated checksum: ${checksum.slice(0, 16)}...`);
}

// Create restoration instructions
const restoreInstructions = `# Restoration Instructions for ${BACKUP_NAME}

## Prerequisites
- Node.js ${process.version} or higher
- npm ${manifest.npmVersion} or higher

## Restoration Steps

1. **Extract the backup archive:**
   \`\`\`bash
   tar -xzf ${BACKUP_NAME}.tar.gz
   \`\`\`

2. **Navigate to the extracted directory:**
   \`\`\`bash
   cd ${BACKUP_NAME}
   \`\`\`

3. **Install dependencies:**
   \`\`\`bash
   npm install
   \`\`\`

4. **Copy environment variables (if needed):**
   \`\`\`bash
   cp .env.example .env
   # Edit .env with your configuration
   \`\`\`

5. **Build the project:**
   \`\`\`bash
   npm run build
   \`\`\`

6. **Run tests to verify:**
   \`\`\`bash
   npm test
   \`\`\`

## Backup Verification

To verify the backup integrity, check the SHA-256 checksum:
\`\`\`bash
sha256sum ${BACKUP_NAME}.tar.gz
\`\`\`

Expected checksum: ${manifest.checksum || 'Not calculated'}

## Backup Details
- Created: ${manifest.timestamp}
- Files: ${manifest.fileCount}
- Size: ${manifest.archiveSizeMB} MB
- Project Version: ${manifest.projectVersion}

## Notes
- This backup excludes: ${EXCLUDE_PATTERNS.join(', ')}
- Environment-specific files (.env) are not included for security
- Node modules are excluded and must be reinstalled

## Quick Restore Script
Save this as \`restore.sh\`:
\`\`\`bash
#!/bin/bash
tar -xzf ${BACKUP_NAME}.tar.gz
cd ${BACKUP_NAME}
npm install
cp .env.example .env
echo "✅ Restoration complete. Please configure .env file."
\`\`\`
`;

fs.writeFileSync(
  path.join(BACKUP_DIR, `${BACKUP_NAME}-restore.md`),
  restoreInstructions
);
console.log('✅ Created restoration instructions');

// Final summary
console.log('\n' + '='.repeat(50));
console.log('🎉 BACKUP COMPLETED SUCCESSFULLY!');
console.log('='.repeat(50));
console.log(`📁 Backup location: ${BACKUP_DIR}`);
console.log(`📦 Archive: ${BACKUP_NAME}.tar.gz`);
console.log(`📊 Manifest: ${BACKUP_NAME}-manifest.json`);
console.log(`📖 Instructions: ${BACKUP_NAME}-restore.md`);
console.log(`💾 Size: ${manifest.archiveSizeMB || 'Calculating...'} MB`);
console.log(`📂 Files backed up: ${fileCount}`);
console.log('='.repeat(50));

// Validate backup
console.log('\n🔍 Validating backup...');
if (fs.existsSync(archivePath)) {
  const stats = fs.statSync(archivePath);
  if (stats.size > 1048576) { // > 1MB
    console.log('✅ Backup file size validated (> 1MB)');
  } else {
    console.warn('⚠️ Backup file seems small. Please verify contents.');
  }
}

// Export manifest for use in other scripts
module.exports = manifest;