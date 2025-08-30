#!/usr/bin/env node

/**
 * Icon Generation Script for Astral Core
 * Generates proper PWA icons from SVG source
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.dirname(__dirname);
const publicPath = path.join(projectRoot, 'public');

console.log('\n🎨 Generating PWA Icons for Astral Core...\n');

// SVG source for the icon (star/galaxy theme for mental health platform)
const svgIcon = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <!-- Background Circle -->
  <circle cx="256" cy="256" r="250" fill="url(#bgGradient)"/>
  
  <!-- Outer Stars Ring -->
  <g transform="translate(256, 256)">
    <!-- Top Star -->
    <path d="M 0,-180 l 15,30 35,5 -25,25 6,35 -31,-16 -31,16 6,-35 -25,-25 35,-5 z" 
          fill="white" opacity="0.9" filter="url(#glow)"/>
    <!-- Right Star -->
    <path d="M 180,0 l -30,15 -5,35 -25,-25 -35,6 16,-31 -16,-31 35,6 25,-25 5,35 z" 
          fill="white" opacity="0.9" filter="url(#glow)"/>
    <!-- Bottom Star -->
    <path d="M 0,180 l -15,-30 -35,-5 25,-25 -6,-35 31,16 31,-16 -6,35 25,25 -35,5 z" 
          fill="white" opacity="0.9" filter="url(#glow)"/>
    <!-- Left Star -->
    <path d="M -180,0 l 30,-15 5,-35 25,25 35,-6 -16,31 16,31 -35,-6 -25,25 -5,-35 z" 
          fill="white" opacity="0.9" filter="url(#glow)"/>
  </g>
  
  <!-- Center Heart Symbol (representing care and support) -->
  <g transform="translate(256, 256)">
    <path d="M 0,-40 C -25,-65 -75,-65 -75,-30 C -75,5 -45,35 0,70 C 45,35 75,5 75,-30 C 75,-65 25,-65 0,-40 z" 
          fill="white" filter="url(#glow)"/>
  </g>
  
  <!-- Inner Circle Glow -->
  <circle cx="256" cy="256" r="120" fill="none" stroke="white" stroke-width="2" opacity="0.3"/>
  <circle cx="256" cy="256" r="100" fill="none" stroke="white" stroke-width="1" opacity="0.2"/>
  
  <!-- Small decorative stars -->
  <circle cx="150" cy="150" r="3" fill="white" opacity="0.7"/>
  <circle cx="362" cy="150" r="3" fill="white" opacity="0.7"/>
  <circle cx="150" cy="362" r="3" fill="white" opacity="0.7"/>
  <circle cx="362" cy="362" r="3" fill="white" opacity="0.7"/>
  <circle cx="100" cy="256" r="2" fill="white" opacity="0.5"/>
  <circle cx="412" cy="256" r="2" fill="white" opacity="0.5"/>
  <circle cx="256" cy="100" r="2" fill="white" opacity="0.5"/>
  <circle cx="256" cy="412" r="2" fill="white" opacity="0.5"/>
</svg>`;

// Icon sizes to generate
const iconSizes = [
  { size: 16, name: 'favicon-16x16.png' },
  { size: 32, name: 'favicon-32x32.png' },
  { size: 192, name: 'icon-192.png' },
  { size: 512, name: 'icon-512.png' },
  { size: 180, name: 'apple-touch-icon.png' }, // iOS
  { size: 192, name: 'android-chrome-192.png' }, // Android
  { size: 512, name: 'android-chrome-512.png' }, // Android
  { size: 150, name: 'mstile-150x150.png' }, // Windows
];

// Maskable icon (with safe zone padding)
const maskableSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#667eea"/>
  <g transform="scale(0.7) translate(110, 110)">
    ${svgIcon.replace(/<\?xml.*?\?>/, '').replace(/<svg.*?>/, '').replace(/<\/svg>/, '')}
  </g>
</svg>`;

async function generateIcons() {
  try {
    // Ensure public directory exists
    if (!fs.existsSync(publicPath)) {
      fs.mkdirSync(publicPath, { recursive: true });
    }

    // Save the base SVG
    const svgPath = path.join(publicPath, 'icon.svg');
    fs.writeFileSync(svgPath, svgIcon);
    console.log('✅ Created icon.svg');

    // Save maskable SVG
    const maskableSvgPath = path.join(publicPath, 'icon-maskable.svg');
    fs.writeFileSync(maskableSvgPath, maskableSvg);
    console.log('✅ Created icon-maskable.svg');

    // Generate PNG icons from SVG
    for (const config of iconSizes) {
      const outputPath = path.join(publicPath, config.name);
      
      try {
        await sharp(Buffer.from(svgIcon))
          .resize(config.size, config.size)
          .png({ quality: 95, compressionLevel: 9 })
          .toFile(outputPath);
        
        const stats = fs.statSync(outputPath);
        console.log(`✅ Created ${config.name} (${config.size}x${config.size}) - ${(stats.size / 1024).toFixed(2)}KB`);
      } catch (error) {
        console.error(`❌ Failed to create ${config.name}:`, error.message);
      }
    }

    // Generate maskable icons
    const maskableIcons = [
      { size: 192, name: 'icon-192-maskable.png' },
      { size: 512, name: 'icon-512-maskable.png' }
    ];

    for (const config of maskableIcons) {
      const outputPath = path.join(publicPath, config.name);
      
      try {
        await sharp(Buffer.from(maskableSvg))
          .resize(config.size, config.size)
          .png({ quality: 95, compressionLevel: 9 })
          .toFile(outputPath);
        
        const stats = fs.statSync(outputPath);
        console.log(`✅ Created ${config.name} (maskable) - ${(stats.size / 1024).toFixed(2)}KB`);
      } catch (error) {
        console.error(`❌ Failed to create ${config.name}:`, error.message);
      }
    }

    // Create favicon.ico (multi-resolution)
    console.log('\n📦 Creating favicon.ico...');
    try {
      const favicon16 = await sharp(Buffer.from(svgIcon))
        .resize(16, 16)
        .png()
        .toBuffer();
      
      const favicon32 = await sharp(Buffer.from(svgIcon))
        .resize(32, 32)
        .png()
        .toBuffer();

      // For now, we'll use the 32x32 as favicon.ico
      // (Proper .ico generation would require additional libraries)
      fs.writeFileSync(path.join(publicPath, 'favicon.ico'), favicon32);
      console.log('✅ Created favicon.ico');
    } catch (error) {
      console.error('❌ Failed to create favicon.ico:', error.message);
    }

    // Create browserconfig.xml for Windows tiles
    const browserConfig = `<?xml version="1.0" encoding="utf-8"?>
<browserconfig>
  <msapplication>
    <tile>
      <square150x150logo src="/mstile-150x150.png"/>
      <TileColor>#667eea</TileColor>
    </tile>
  </msapplication>
</browserconfig>`;
    
    fs.writeFileSync(path.join(publicPath, 'browserconfig.xml'), browserConfig);
    console.log('✅ Created browserconfig.xml');

    // Create site.webmanifest with all icons
    const manifest = {
      name: 'Astral Core Mental Health Platform',
      short_name: 'Astral Core',
      description: 'Anonymous mental health support platform',
      theme_color: '#667eea',
      background_color: '#ffffff',
      display: 'standalone',
      orientation: 'portrait',
      start_url: '/',
      icons: [
        {
          src: '/favicon-16x16.png',
          sizes: '16x16',
          type: 'image/png'
        },
        {
          src: '/favicon-32x32.png',
          sizes: '32x32',
          type: 'image/png'
        },
        {
          src: '/icon-192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: '/icon-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: '/icon-192-maskable.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'maskable'
        },
        {
          src: '/icon-512-maskable.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable'
        },
        {
          src: '/apple-touch-icon.png',
          sizes: '180x180',
          type: 'image/png'
        }
      ]
    };

    fs.writeFileSync(
      path.join(publicPath, 'site.webmanifest'),
      JSON.stringify(manifest, null, 2)
    );
    console.log('✅ Created site.webmanifest');

    console.log('\n✨ Icon generation complete!');
    console.log(`📁 Icons saved to: ${publicPath}`);

    // Report total size
    const files = fs.readdirSync(publicPath).filter(f => f.endsWith('.png'));
    const totalSize = files.reduce((sum, file) => {
      const stats = fs.statSync(path.join(publicPath, file));
      return sum + stats.size;
    }, 0);
    console.log(`📊 Total icon size: ${(totalSize / 1024).toFixed(2)}KB`);

  } catch (error) {
    console.error('❌ Icon generation failed:', error);
    process.exit(1);
  }
}

// Run the icon generation
generateIcons().catch(console.error);