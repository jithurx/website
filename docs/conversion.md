# Astro Conversion Process

This document outlines the steps taken to convert the single-file HTML website (`index.html`) into a modular Astro project.

## Why Astro?
Astro provides excellent developer experience by allowing us to break down our UI into manageable, reusable components while shipping zero JavaScript by default, unless interactive components require it. This is perfect for a portfolio site that is mostly static but features isolated interactive animations.

## Steps Taken

1. **Initialization**
   - Bootstrapped a minimal Astro project using `npx create-astro@latest --template minimal`.
   - Setup basic configuration in `astro.config.mjs`.

2. **Asset Migration**
   - Moved all static assets (`images/`, `favicon.ico`, `site.webmanifest`, `CNAME`) from the root directory into the `public/` directory.

3. **Layout Creation**
   - Created `src/layouts/Layout.astro` to house the `<html>`, `<head>`, global metadata, fonts, and CSS variables. This ensures all pages share the same base structure and styling.

4. **Component Modularization**
   Extracted specific sections of `index.html` into their own `.astro` components:
   - `StarCanvas.astro`: The 3D star background animation and `<canvas>`.
   - `ProfilePhoto.astro`: The avatar image and styling.
   - `NameHeading.astro`: The interactive glitching name text ("jithurx" -> "Abhijith R").
   - `TypingTagline.astro`: The animated typing text underneath the name.
   - `SocialLinks.astro`: The grid of social media icons.
   - `FooterCredit.astro`: The small footer element.

5. **Page Assembly**
   - Updated `src/pages/index.astro` to import the Layout and all components, reconstructing the original page layout cleanly.

6. **Cleanup**
   - Removed the original `index.html`.

## How to Run

To run the site locally:
```bash
npm install
npm run dev
```

To build for production:
```bash
npm run build
```
