# sCamera — Retro Film Camera PWA

A tactile, offline-ready retro camera Progressive Web App with real-time WebGL film stock shaders, quartz date stamping, analog light leaks, film frames, and local film roll persistence.

## Retro Camera Filters
- **GOLD 200** — Warm Kodak Gold 35mm highlights, lifted shadows, organic grain
- **PORTRA 400** — Natural pastel skin tones and airy highlights
- **SUPERIA 400** — Crisp Fuji greens and cool shadow cast
- **SX-70** — Dreamy Polaroid instant-film fade and soft halation
- **800T** — CineStill tungsten neon blues with signature red highlight halation
- **TRI-X 400** — High-contrast classic silver gelatin monochrome
- **90s FLASH** — Crunchy disposable camera contrast, vignette, and retro tint
- **CCD 2003** — Early 2000s digital compact sensor look
- **DAGUERRE** — Antique warm sepia toning

## Features
- **Live Camera + Photo Import Mode**: Shoot live via `getUserMedia` (front/rear switch, digital zoom, EV compensation, tap-to-focus reticle, self-timer, screen/torch flash) or import any image to apply retro filters.
- **Retro Lab Controls**: Quartz date stamp (`TODAY` or `'98 RETRO`), film frames (`Full Bleed`, `Polaroid`, `35mm Strip`), analog light leaks (`Amber`, `Magenta`, `Gold`, `Random`), film grain, lens vignette, and synthesized Web Audio shutter sound.
- **Local Persistence**: Preferences, film roll counter, and gallery index are saved in `localStorage`, while full-resolution JPEG captures and thumbnails are stored offline in `IndexedDB` (`sCameraDB`).
- **PWA & Offline Support**: Relative-path `manifest.webmanifest` and `sw.js` service worker designed for seamless hosting on GitHub Pages (project subpath or root).

## GitHub Pages Deployment
1. Push this repository to GitHub (`main` branch).
2. In your GitHub repository go to **Settings → Pages**.
3. Set **Source** to **GitHub Actions** (uses `.github/workflows/pages.yml`) or **Deploy from a branch** (`main` / `(root)`).
