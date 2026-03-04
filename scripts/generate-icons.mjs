#!/usr/bin/env node
/**
 * Icon Generator for ShardDen
 * Generates icons for Web, Desktop (Tauri), and App from source logo
 * 
 * Usage: node scripts/generate-icons.mjs
 */

import sharp from 'sharp';
import pngToIco from 'png-to-ico';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync, existsSync, copyFileSync, writeFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Source logo path
const SOURCE_LOGO = join(rootDir, 'public', 'ShardDen Logo.png');

// Output directories
const WEB_PUBLIC = join(rootDir, 'packages', 'web', 'public');
const DESKTOP_ICONS = join(rootDir, 'packages', 'desktop', 'src-tauri', 'icons');

// Required icon sizes
const ICON_SIZES = [
  { size: 16, name: 'icon-16x16.png' },
  { size: 32, name: 'icon-32x32.png' },
  { size: 48, name: 'icon-48x48.png' },
  { size: 64, name: 'icon-64x64.png' },
  { size: 128, name: 'icon-128x128.png' },
  { size: 192, name: 'icon-192x192.png' },  // PWA
  { size: 256, name: 'icon-256x256.png' },
  { size: 512, name: 'icon-512x512.png' },  // PWA
  { size: 1024, name: 'icon-1024x1024.png' }, // App Store
];

// Favicon sizes for ICO
const FAVICON_SIZES = [16, 32, 48];

async function generatePngIcons(sourcePath, outputDir) {
  console.log(`\n📦 Generating PNG icons to ${outputDir}...`);
  
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  for (const { size, name } of ICON_SIZES) {
    const outputPath = join(outputDir, name);
    await sharp(sourcePath)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(outputPath);
    console.log(`  ✓ Generated ${name} (${size}x${size})`);
  }
}

async function generateFavicon(sourcePath, outputDir) {
  console.log(`\n🎨 Generating favicon.ico...`);
  
  // Generate PNG buffers for multi-size ICO
  const pngBuffers = [];
  for (const size of FAVICON_SIZES) {
    const buffer = await sharp(sourcePath)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toBuffer();
    pngBuffers.push(buffer);
  }
  
  // Generate true ICO format
  const icoBuffer = await pngToIco(pngBuffers);
  writeFileSync(join(outputDir, 'favicon.ico'), icoBuffer);
  
  console.log(`  ✓ Generated favicon.ico (multi-size ICO)`);
}

async function generateAppleTouchIcon(sourcePath, outputDir) {
  console.log(`\n🍎 Generating Apple Touch Icon...`);
  
  // Apple Touch Icon should be 180x180 with white background
  await sharp(sourcePath)
    .resize(180, 180, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    })
    .png()
    .toFile(join(outputDir, 'apple-touch-icon.png'));
  
  console.log(`  ✓ Generated apple-touch-icon.png (180x180)`);
}

async function copyToDesktop(outputDir) {
  console.log(`\n🖥️  Copying icons to Desktop (Tauri)...`);
  
  if (!existsSync(DESKTOP_ICONS)) {
    mkdirSync(DESKTOP_ICONS, { recursive: true });
  }

  // Copy required sizes for Tauri
  const tauriSizes = [32, 128, 256];
  for (const size of tauriSizes) {
    const sourceFile = join(outputDir, `icon-${size}x${size}.png`);
    if (existsSync(sourceFile)) {
      copyFileSync(sourceFile, join(DESKTOP_ICONS, `${size}x${size}.png`));
      console.log(`  ✓ Copied ${size}x${size}.png to Tauri icons`);
    }
  }

  // Copy 256x256 as icon.png
  const icon256 = join(outputDir, 'icon-256x256.png');
  if (existsSync(icon256)) {
    copyFileSync(icon256, join(DESKTOP_ICONS, 'icon.png'));
    console.log(`  ✓ Copied icon.png to Tauri icons`);
  }
  
  // Generate icon.ico for Windows
  console.log(`\n🪟 Generating Windows icon.ico...`);
  const icoBuffers = [];
  for (const size of [16, 32, 48, 64, 128, 256]) {
    const buffer = await sharp(SOURCE_LOGO)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toBuffer();
    icoBuffers.push(buffer);
  }
  const icoBuffer = await pngToIco(icoBuffers);
  writeFileSync(join(DESKTOP_ICONS, 'icon.ico'), icoBuffer);
  console.log(`  ✓ Generated icon.ico (multi-size ICO)`);
}
async function main() {
  console.log('🚀 ShardDen Icon Generator');
  console.log('================================');
  console.log(`Source: ${SOURCE_LOGO}`);
  
  if (!existsSync(SOURCE_LOGO)) {
    console.error(`❌ Source logo not found: ${SOURCE_LOGO}`);
    process.exit(1);
  }

  try {
    // Generate all PNG icons for Web
    await generatePngIcons(SOURCE_LOGO, WEB_PUBLIC);
    
    // Generate favicon.ico
    await generateFavicon(SOURCE_LOGO, WEB_PUBLIC);
    
    // Generate Apple Touch Icon
    await generateAppleTouchIcon(SOURCE_LOGO, WEB_PUBLIC);
    
    // Copy icons to Desktop
    await copyToDesktop(WEB_PUBLIC);
    
    console.log('\n✅ Icon generation complete!');
    console.log('\nGenerated icons:');
    console.log(`  - Web: ${WEB_PUBLIC}`);
    console.log(`  - Desktop: ${DESKTOP_ICONS}`);
    
  } catch (error) {
    console.error('❌ Error generating icons:', error);
    process.exit(1);
  }
}

main();