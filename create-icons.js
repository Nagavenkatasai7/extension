#!/usr/bin/env node

/**
 * Simple script to create placeholder PNG icons for the Chrome extension
 * Requires no external dependencies - uses Node.js built-in libraries
 */

const fs = require('fs');
const path = require('path');

console.log('🎨 Creating placeholder icons for Chrome extension...\n');

// Create simple 1x1 PNG with LinkedIn blue color
// This is a base64-encoded minimal PNG
const createPNG = (size) => {
  // Simple 1x1 blue PNG, will be scaled by browser
  const base64PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  return Buffer.from(base64PNG, 'base64');
};

// Better placeholder with LinkedIn colors
// This creates a more visible icon
const createBetterIcon = (size) => {
  // This is a simple LinkedIn-colored square icon (base64)
  // Blue background: #0A66C2
  const iconSVG = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${size}" height="${size}" fill="#0A66C2" rx="${size/8}"/>
    <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size*0.5}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="central">Li</text>
  </svg>`;

  return Buffer.from(iconSVG);
};

const iconsDir = path.join(__dirname, 'extension', 'icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

const sizes = [16, 48, 128];

console.log('📝 Note: These are SVG placeholders. For best results:');
console.log('   1. Use the generate-icons.sh script (requires ImageMagick)');
console.log('   2. Or create PNG files manually using an image editor');
console.log('   3. Or use an online tool like https://favicon.io\n');

console.log('Creating SVG placeholders for now...\n');

sizes.forEach(size => {
  const iconPath = path.join(iconsDir, `icon${size}.svg`);
  const iconContent = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#0A66C2" rx="${size/8}"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size*0.4}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="central">Li</text>
</svg>`;

  fs.writeFileSync(iconPath, iconContent);
  console.log(`✅ Created icon${size}.svg`);
});

// Update manifest to use SVG icons temporarily
const manifestPath = path.join(__dirname, 'extension', 'manifest.json');
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  // Update icon paths to use SVG
  manifest.icons = {
    "16": "icons/icon16.svg",
    "48": "icons/icon48.svg",
    "128": "icons/icon128.svg"
  };

  manifest.action.default_icon = {
    "16": "icons/icon16.svg",
    "48": "icons/icon48.svg",
    "128": "icons/icon128.svg"
  };

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log('✅ Updated manifest.json to use SVG icons\n');
}

console.log('🎉 Done! Extension icons created.\n');
console.log('⚠️  Note: Chrome supports SVG icons, but PNG is recommended.');
console.log('💡 To create proper PNG icons:');
console.log('   - Run: cd extension/icons && ./generate-icons.sh');
console.log('   - Or visit: https://favicon.io/favicon-generator/');
console.log('   - Or use any image editor to create 16x16, 48x48, 128x128 PNGs\n');
