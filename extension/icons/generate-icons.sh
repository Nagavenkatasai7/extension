#!/bin/bash

# Script to generate placeholder icons for the Chrome extension
# Requires ImageMagick to be installed

echo "🎨 Generating Chrome Extension Icons..."

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "❌ ImageMagick is not installed."
    echo "📦 Install it with:"
    echo "   macOS: brew install imagemagick"
    echo "   Linux: sudo apt-get install imagemagick"
    echo "   Windows: Download from https://imagemagick.org/script/download.php"
    exit 1
fi

# Create 128x128 icon
convert -size 128x128 xc:'#0A66C2' \
    -gravity center \
    -pointsize 60 \
    -font Helvetica-Bold \
    -fill white \
    -annotate +0+0 'Li' \
    icon128.png

echo "✅ Created icon128.png"

# Create 48x48 icon
convert icon128.png -resize 48x48 icon48.png
echo "✅ Created icon48.png"

# Create 16x16 icon
convert icon128.png -resize 16x16 icon16.png
echo "✅ Created icon16.png"

echo "🎉 All icons generated successfully!"
echo "📁 Location: $(pwd)"
