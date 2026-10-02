# Assets Directory for KhodroYar Application

This directory contains all the image assets required for the KhodroYar Android application.

## Required Files

The following files must be present in this directory for the application to build correctly:

### Application Icons
- `icon.png` - App icon (1024x1024 pixels, PNG format)
- `adaptive-icon.png` - Android adaptive icon foreground (1024x1024 pixels, transparent background)
- `notification-icon.png` - Notification icon (96x96 pixels, white on transparent)

### Splash Screen
- `splash.png` - Splash screen image (1284x2778 pixels recommended for most devices)

### Fonts
- `fonts/iranyekan/` - IranYekan font files (see fonts/iranyekan/README.md for details)

## Icon Design Guidelines

### App Icon (`icon.png`)
- Size: 1024x1024 pixels
- Format: PNG with transparent background
- Design: Should feature automotive elements with the "خودرویار" branding
- Primary colors: Navy (#1e3a8a) and Turquoise (#06b6d4)
- Style: Modern, clean, and easily recognizable

### Adaptive Icon (`adaptive-icon.png`)
- Size: 1024x1024 pixels
- Format: PNG with transparent background
- Must be a single layer (foreground only)
- The background color is defined in app.json (currently #0a1a2a - dark navy)
- Should be a simplified version of the app icon without text

### Notification Icon (`notification-icon.png`)
- Size: 96x96 pixels
- Format: PNG with transparent background
- Must be white (#FFFFFF) on transparent
- Simple, single-color design for visibility in status bar
- Recommended: Car silhouette or wrench icon

### Splash Screen (`splash.png`)
- Recommended size: 1284x2778 pixels (covers most Android devices)
- Format: PNG
- Background: Should match the app theme (dark navy #0a1a2a)
- Content: "خودرویار" logo with tagline "همراه هوشمند نگهداری خودروی شما"
- Style: Clean, professional automotive theme

## Creating the Assets

### Option 1: Use Online Tools
- **Icon**: Use [Android Asset Studio](https://romannurik.github.io/AndroidAssetStudio/) or [App Icon Generator](https://appicon.co/)
- **Splash Screen**: Use [Splash Screen Generator](https://www.canva.com/) or create a custom design

### Option 2: Create Manually
1. **App Icon**: Design in Figma, Adobe Illustrator, or Photoshop
2. **Adaptive Icon**: Create a foreground-only version of your icon
3. **Notification Icon**: Create a simple white car/wrench icon
4. **Splash Screen**: Design a full-screen loading image

### Option 3: Use Placeholder (For Development Only)
For development purposes, you can use simple placeholder images. However, for production builds, professional assets are recommended.

## Font Assets

See `fonts/iranyekan/README.md` for information about the IranYekan font requirements.

## Verification

After adding the assets, verify that:
1. All files are in the correct location
2. File names match exactly (case-sensitive)
3. File sizes are appropriate
4. File formats are correct (PNG)
5. The app.json file references the correct paths

## Troubleshooting

- **Build error: Missing asset**: Ensure the file exists and the path in app.json is correct
- **Icon not displaying**: Check that the icon file is a valid PNG with the correct dimensions
- **Splash screen not showing**: Verify the splash configuration in app.json matches your file
