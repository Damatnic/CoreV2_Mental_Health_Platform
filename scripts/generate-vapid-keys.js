#!/usr/bin/env node

/**
 * VAPID Key Generation Script for Push Notifications
 * 
 * This script generates VAPID (Voluntary Application Server Identification) keys
 * for Web Push Protocol implementation in the CoreV2 Mental Health Platform.
 * 
 * Usage: node scripts/generate-vapid-keys.js
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Check if web-push is installed
let webpush;
try {
  webpush = require('web-push');
} catch (error) {
  console.error('Error: web-push package not found.');
  console.log('Installing web-push...');
  const { execSync } = require('child_process');
  execSync('npm install web-push', { stdio: 'inherit' });
  webpush = require('web-push');
}

console.log('');
console.log('🔑 VAPID Key Generator for CoreV2 Mental Health Platform');
console.log('========================================================');
console.log('');

// Generate VAPID keys
const vapidKeys = webpush.generateVAPIDKeys();

console.log('✅ VAPID keys generated successfully!');
console.log('');
console.log('📋 Your VAPID Keys:');
console.log('==================');
console.log('');
console.log('Public Key:');
console.log(vapidKeys.publicKey);
console.log('');
console.log('Private Key:');
console.log(vapidKeys.privateKey);
console.log('');

// Create environment variable entries
const envContent = `
# Push Notification VAPID Keys
VITE_VAPID_PUBLIC_KEY="${vapidKeys.publicKey}"
VAPID_PRIVATE_KEY="${vapidKeys.privateKey}"
VAPID_SUBJECT="mailto:support@corev2mentalhealth.com"
`;

console.log('📝 Environment Variables (add to your .env files):');
console.log('==================================================');
console.log(envContent);

// Check if .env.example exists and update it
const envExamplePath = path.join(process.cwd(), '.env.example');
if (fs.existsSync(envExamplePath)) {
  const currentContent = fs.readFileSync(envExamplePath, 'utf8');
  
  // Check if VAPID keys already exist in the file
  if (!currentContent.includes('VAPID_PUBLIC_KEY')) {
    // Append VAPID configuration
    const updatedContent = currentContent + '\n' + envContent;
    fs.writeFileSync(envExamplePath, updatedContent);
    console.log('✅ Updated .env.example with VAPID key placeholders');
  } else {
    console.log('ℹ️  VAPID key placeholders already exist in .env.example');
  }
}

// Create a secure key storage file (for production)
const keyStoragePath = path.join(process.cwd(), 'vapid-keys.json');
const keyStorage = {
  publicKey: vapidKeys.publicKey,
  privateKey: vapidKeys.privateKey,
  subject: 'mailto:support@corev2mentalhealth.com',
  generatedAt: new Date().toISOString(),
  warning: 'KEEP THIS FILE SECURE! Never commit to version control!'
};

fs.writeFileSync(keyStoragePath, JSON.stringify(keyStorage, null, 2));
console.log('');
console.log(`✅ Keys saved to: ${keyStoragePath}`);
console.log('⚠️  IMPORTANT: Add vapid-keys.json to .gitignore!');

// Check and update .gitignore
const gitignorePath = path.join(process.cwd(), '.gitignore');
if (fs.existsSync(gitignorePath)) {
  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
  if (!gitignoreContent.includes('vapid-keys.json')) {
    fs.appendFileSync(gitignorePath, '\n# VAPID Keys (never commit!)\nvapid-keys.json\n');
    console.log('✅ Added vapid-keys.json to .gitignore');
  }
}

console.log('');
console.log('🚀 Next Steps:');
console.log('==============');
console.log('1. Copy the environment variables to your .env files');
console.log('2. For Netlify deployment:');
console.log('   - Add VITE_VAPID_PUBLIC_KEY to Netlify environment variables');
console.log('   - Add VAPID_PRIVATE_KEY to Netlify environment variables');
console.log('   - Add VAPID_SUBJECT to Netlify environment variables');
console.log('3. Test push notifications locally with: npm run test:notifications');
console.log('');
console.log('📚 Documentation:');
console.log('================');
console.log('- VAPID keys are used to identify your server to push services');
console.log('- Public key is used in the browser/client');
console.log('- Private key is used on the server (keep it secret!)');
console.log('- Subject should be a mailto: or https: URL');
console.log('');
console.log('✨ VAPID key generation complete!');
console.log('');