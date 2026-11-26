# sCamera — Retro & Modern Film Camera PWA

A tactile, offline-ready camera Progressive Web App with **534 retro and modern camera filters**, live 35mm film-roll preview thumbnails, real-time WebGL shaders, quartz date stamping, analog light leaks, film frames, and local persistence.

## Filter Collection (534 Presets)
- **Retro Film (70+)**: Kodak Gold, Portra, Ektar, Ultramax, ColorPlus, Kodachrome, Ektachrome, Fuji Superia, Pro 400H, Velvia, Provia, Agfa Vista, Natura, Ferrania
- **Instant (50+)**: Polaroid SX-70, 600, Spectra, Go, Land 100, Impossible, Instax Mini & Wide, Peel-Apart, FP-100C
- **B&W & Antique (52+)**: Tri-X 400, HP5 Plus, T-Max, Delta 3200, Acros 100, Double-X, Noir, Daguerreotype, Sepia, Cyanotype
- **Modern Editorial (60+)**: Studio Clean, Minimal, Golden Hour, Nordic, Tokyo Crisp, Paris Café, Desert Sun, Architectural, Airy Bright, Seoul Soft
- **Cinema, Vibrant, Pastel, Moody, Duotone & Lo-Fi/CCD (300+)**: CineStill 800T/50D/400D, Teal & Orange, Cyberpunk Neon, Bleach Bypass, Technicolor, Holga, Diana F+, Lomo LC-A, 2003 CCD Digicam, VHS, and more.

## Features
- **Live Film-Roll Preview Thumbnails**: Every visible filter card renders a real-time miniature preview inside a 35mm sprocket-framed card, with category tabs, search catalog, and `★` Favorites.
- **Live Camera + Photo Import Mode**: Shoot live via `getUserMedia` (front/rear switch, digital zoom, EV compensation, tap-to-focus reticle, self-timer, screen/torch flash) or import any image to apply filters.
- **Auto-Save to Local Gallery & Device**: Captured photos save offline to the in-app **GALLERY** (`IndexedDB` + `localStorage` index) and automatically download to your device (toggleable in **LAB ⚙**).
- **Retro Lab Controls**: Quartz date stamp (`TODAY` or `'98 RETRO`), film frames (`Full Bleed`, `Polaroid`, `35mm Strip`), analog light leaks, film grain, lens vignette, and synthesized Web Audio shutter sound.
- **PWA & Offline Support**: Relative-path `manifest.webmanifest` and `sw.js` service worker designed for GitHub Pages.
