# PWA Icon Replacement Required

## Issue
The current PWA icons in the `/public` directory are 1x1 pixel placeholder files:
- `icon-192.png` (1x1 pixels)
- `icon-512.png` (1x1 pixels)

## Required Actions
Replace these placeholder files with actual PWA-compliant icons:

### Icon Sizes Needed
1. **icon-192.png** - 192x192 pixels
2. **icon-512.png** - 512x512 pixels
3. **Additional recommended sizes:**
   - `icon-72.png` - 72x72 pixels
   - `icon-96.png` - 96x96 pixels
   - `icon-128.png` - 128x128 pixels
   - `icon-144.png` - 144x144 pixels
   - `icon-152.png` - 152x152 pixels
   - `icon-384.png` - 384x384 pixels

### Design Requirements
- **Subject**: Mental health support theme (current icon.svg can be used as reference)
- **Background**: Should work on both light and dark backgrounds
- **Format**: PNG with transparency
- **Maskable**: Design should work with adaptive icon masks
- **Safe zones**: Keep important content within safe zones for maskable icons

### File Locations
All icon files should be placed in:
```
/public/
├── icon-72.png
├── icon-96.png
├── icon-128.png
├── icon-144.png
├── icon-152.png
├── icon-192.png
├── icon-384.png
├── icon-512.png
└── icon.svg (already exists)
```

### Manifest Update
After creating icons, update `/public/manifest.json` to include additional sizes:
```json
"icons": [
  {
    "src": "/icon-72.png",
    "sizes": "72x72",
    "type": "image/png",
    "purpose": "any"
  },
  {
    "src": "/icon-96.png", 
    "sizes": "96x96",
    "type": "image/png",
    "purpose": "any"
  },
  {
    "src": "/icon-128.png",
    "sizes": "128x128", 
    "type": "image/png",
    "purpose": "any"
  },
  {
    "src": "/icon-144.png",
    "sizes": "144x144",
    "type": "image/png",
    "purpose": "any"
  },
  {
    "src": "/icon-152.png",
    "sizes": "152x152",
    "type": "image/png", 
    "purpose": "any"
  },
  {
    "src": "/icon-192.png",
    "sizes": "192x192",
    "type": "image/png",
    "purpose": "any maskable"
  },
  {
    "src": "/icon-384.png",
    "sizes": "384x384",
    "type": "image/png",
    "purpose": "any"
  },
  {
    "src": "/icon-512.png",
    "sizes": "512x512", 
    "type": "image/png",
    "purpose": "any maskable"
  },
  {
    "src": "/icon.svg",
    "sizes": "any",
    "type": "image/svg+xml",
    "purpose": "any"
  }
]
```

### Tools for Icon Generation
- **Figma/Adobe Illustrator**: For creating vector-based icons
- **PWA Asset Generator**: For generating all required sizes
- **Maskable.app**: For testing maskable icon designs
- **PWA Builder**: Microsoft's PWA icon generator

## Priority
**High** - PWA installation and app store listing require proper icons.