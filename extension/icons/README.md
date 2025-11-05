# Extension Icons

This folder should contain the following icon files:
- `icon16.png` (16x16 pixels)
- `icon48.png` (48x48 pixels)
- `icon128.png` (128x128 pixels)

## Creating Icons

You can create these icons using any image editor. Here are some options:

### Option 1: Use an Online Tool
1. Visit [Favicon.io](https://favicon.io/favicon-generator/)
2. Create an icon with the LinkedIn colors (blue: #0A66C2)
3. Download and rename the files

### Option 2: Use Figma/Canva
1. Create a square canvas (128x128)
2. Design your icon with the LinkedIn theme
3. Export in 16x16, 48x48, and 128x128 sizes

### Option 3: Use This SVG Template
Save this as an SVG file and convert to PNG:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <rect width="128" height="128" rx="16" fill="#0A66C2"/>
  <path d="M30 98V42h16v56H30zm8-64c-5 0-9-4-9-9s4-9 9-9 9 4 9 9-4 9-9 9zm60 64H82V69c0-6-2-8-6-8-4.5 0-7 2.5-7 8v29H53V42h16v6c2-3 6-7 14-7 9 0 17 5 17 16v41z" fill="white"/>
</svg>
```

### Option 4: Use CommandLine (ImageMagick)
If you have ImageMagick installed:
```bash
convert -size 128x128 xc:#0A66C2 -gravity center -pointsize 60 -fill white -annotate +0+0 "Li" icon128.png
convert icon128.png -resize 48x48 icon48.png
convert icon128.png -resize 16x16 icon16.png
```

## Quick Placeholder Icons

For testing purposes, you can use solid color squares:
1. Create 128x128, 48x48, and 16x16 PNG files
2. Fill them with LinkedIn blue (#0A66C2)
3. Add text "Li" in white

The extension will work without custom icons, but Chrome will show a default placeholder.
