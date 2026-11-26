/**
 * 520+ Retro & Modern Camera Filters.
 * Combines flagship film stocks with categorized analog, instant, monochrome,
 * modern editorial, cinema, vibrant, pastel, moody, duotone, and lo-fi looks.
 */

export const FILTER_CATEGORIES = [
  { id: 'all', label: 'ALL' },
  { id: 'favorites', label: '★ FAVS' },
  { id: 'retro', label: 'RETRO FILM' },
  { id: 'instant', label: 'INSTANT' },
  { id: 'bw', label: 'B&W' },
  { id: 'modern', label: 'MODERN' },
  { id: 'cinema', label: 'CINEMA' },
  { id: 'vibrant', label: 'VIBRANT' },
  { id: 'pastel', label: 'PASTEL' },
  { id: 'moody', label: 'MOODY' },
  { id: 'duotone', label: 'DUOTONE' },
  { id: 'lofi', label: 'LO-FI / CCD' },
];

export const ASPECT_RATIOS = {
  '4:3': { label: '4:3', ratio: 4 / 3, desc: 'Classic Rangefinder' },
  '3:2': { label: '3:2', ratio: 3 / 2, desc: '35mm Film' },
  '1:1': { label: '1:1', ratio: 1 / 1, desc: 'Instant Square' },
  '16:9': { label: '16:9', ratio: 16 / 9, desc: 'Cinema Frame' },
};

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function makeMatrix(rScale = 1, gScale = 1, bScale = 1, cross = 0) {
  return [
    rScale, cross * 0.5, -cross * 0.4,
    cross * 0.25, gScale, cross * 0.25,
    -cross * 0.4, cross * 0.5, bScale,
  ];
}

function rgbHex(r, g, b) {
  const toHex = (n) => clamp(Math.round(n * 255), 0, 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function createFilter({
  id,
  name,
  subtitle,
  category,
  badge,
  swatch,
  dateStampDefault = false,
  params,
}) {
  return {
    id,
    name,
    subtitle,
    category,
    badge,
    swatch,
    dateStampDefault,
    params: {
      contrast: 1.0,
      saturation: 1.0,
      warmth: 0.0,
      tint: 0.0,
      fade: 0.0,
      shadowColor: [0.0, 0.0, 0.0],
      highlightColor: [1.0, 1.0, 1.0],
      colorMatrix: [1, 0, 0, 0, 1, 0, 0, 0, 1],
      grain: 0.06,
      grainSize: 1.15,
      vignette: 0.22,
      aberration: 0.0015,
      halation: 0.1,
      halationColor: [1.0, 0.75, 0.5],
      softness: 0.06,
      sepia: 0.0,
      digitalCrunch: 0.0,
      ...params,
    },
  };
}

// Flagship iconic presets preserved with exact IDs for backward compatibility
const FLAGSHIP_FILTERS = [
  createFilter({
    id: 'kodak-gold',
    name: 'GOLD 200',
    subtitle: 'Kodak Gold 35mm',
    category: 'retro',
    badge: '35MM',
    swatch: ['#e8a849', '#c95f2b', '#2b1f18'],
    dateStampDefault: true,
    params: {
      contrast: 1.08, saturation: 1.14, warmth: 0.14, tint: -0.02, fade: 0.055,
      shadowColor: [0.06, 0.03, 0.01], highlightColor: [1.05, 0.98, 0.86],
      colorMatrix: [1.06, 0.04, -0.04, 0.02, 1.0, -0.02, -0.05, 0.01, 0.92],
      grain: 0.085, grainSize: 1.25, vignette: 0.32, aberration: 0.0022,
      halation: 0.18, halationColor: [1.0, 0.58, 0.25], softness: 0.12,
    },
  }),
  createFilter({
    id: 'portra-400',
    name: 'PORTRA 400',
    subtitle: 'Natural Portrait Film',
    category: 'retro',
    badge: 'PRO',
    swatch: ['#eab69f', '#89a894', '#38302c'],
    params: {
      contrast: 0.95, saturation: 0.94, warmth: 0.07, tint: 0.03, fade: 0.075,
      shadowColor: [0.02, 0.05, 0.045], highlightColor: [1.03, 0.99, 0.94],
      colorMatrix: [1.02, 0.05, -0.03, 0.01, 0.99, 0.02, -0.02, 0.03, 0.96],
      grain: 0.065, grainSize: 1.1, vignette: 0.22, aberration: 0.0014,
      halation: 0.22, halationColor: [1.0, 0.85, 0.72], softness: 0.18,
    },
  }),
  createFilter({
    id: 'fuji-superia',
    name: 'SUPERIA 400',
    subtitle: 'Fuji Crisp Cool Greens',
    category: 'retro',
    badge: 'X-TRA',
    swatch: ['#5fb49c', '#d16686', '#182423'],
    dateStampDefault: true,
    params: {
      contrast: 1.12, saturation: 1.10, warmth: -0.05, tint: 0.09, fade: 0.045,
      shadowColor: [0.01, 0.055, 0.05], highlightColor: [0.97, 1.02, 0.99],
      colorMatrix: [0.96, -0.02, 0.04, 0.02, 1.05, -0.01, 0.01, 0.04, 1.02],
      grain: 0.09, grainSize: 1.2, vignette: 0.30, aberration: 0.0025,
      halation: 0.12, halationColor: [0.75, 1.0, 0.92], softness: 0.10,
    },
  }),
  createFilter({
    id: 'polaroid-sx70',
    name: 'SX-70',
    subtitle: 'Instant Polaroid Dream',
    category: 'instant',
    badge: 'INSTANT',
    swatch: ['#d8cbb2', '#64837a', '#2c332d'],
    params: {
      contrast: 0.88, saturation: 0.84, warmth: 0.08, tint: 0.06, fade: 0.135,
      shadowColor: [0.04, 0.075, 0.07], highlightColor: [1.04, 1.0, 0.88],
      colorMatrix: [0.96, 0.08, -0.04, 0.04, 0.96, 0.02, -0.05, 0.08, 0.9],
      grain: 0.075, grainSize: 1.45, vignette: 0.44, aberration: 0.0042,
      halation: 0.36, halationColor: [1.0, 0.94, 0.78], softness: 0.42, sepia: 0.08,
    },
  }),
  createFilter({
    id: 'cinestill-800t',
    name: '800T',
    subtitle: 'CineStill Tungsten Neon',
    category: 'cinema',
    badge: 'CINE',
    swatch: ['#348aa7', '#e63946', '#0d1b2a'],
    params: {
      contrast: 1.15, saturation: 1.12, warmth: -0.16, tint: 0.02, fade: 0.04,
      shadowColor: [0.01, 0.05, 0.09], highlightColor: [0.96, 1.0, 1.06],
      colorMatrix: [0.95, 0.02, -0.03, 0.0, 0.99, 0.05, 0.02, 0.05, 1.08],
      grain: 0.105, grainSize: 1.3, vignette: 0.38, aberration: 0.0028,
      halation: 0.58, halationColor: [1.0, 0.22, 0.12], softness: 0.15,
    },
  }),
  createFilter({
    id: 'trix-400',
    name: 'TRI-X 400',
    subtitle: 'Classic Silver B&W',
    category: 'bw',
    badge: 'B&W',
    swatch: ['#e5e5e5', '#737373', '#141414'],
    params: {
      contrast: 1.26, saturation: 0.0, warmth: 0.0, tint: 0.0, fade: 0.04,
      shadowColor: [0.02, 0.02, 0.02], highlightColor: [1.02, 1.01, 0.99],
      grain: 0.15, grainSize: 1.55, vignette: 0.42, aberration: 0.001,
      halation: 0.16, halationColor: [0.95, 0.95, 0.95], softness: 0.08,
    },
  }),
  createFilter({
    id: 'disposable-90s',
    name: '90s FLASH',
    subtitle: 'FunSaver Disposable',
    category: 'lofi',
    badge: '1998',
    swatch: ['#f4a261', '#2a9d8f', '#264653'],
    dateStampDefault: true,
    params: {
      contrast: 1.18, saturation: 1.18, warmth: 0.06, tint: 0.08, fade: 0.06,
      shadowColor: [0.03, 0.065, 0.035], highlightColor: [1.04, 1.02, 0.92],
      colorMatrix: [1.05, 0.03, -0.02, 0.03, 1.03, -0.02, -0.03, 0.05, 0.94],
      grain: 0.135, grainSize: 1.6, vignette: 0.54, aberration: 0.0048,
      halation: 0.24, halationColor: [1.0, 0.72, 0.38], softness: 0.26,
    },
  }),
  createFilter({
    id: 'ccd-2003',
    name: 'CCD 2003',
    subtitle: 'Early Digital Compact',
    category: 'lofi',
    badge: '3.2MP',
    swatch: ['#4ea8de', '#f9c74f', '#22223b'],
    dateStampDefault: true,
    params: {
      contrast: 1.14, saturation: 1.22, warmth: -0.04, tint: -0.02, fade: 0.015,
      shadowColor: [0.01, 0.02, 0.05], highlightColor: [0.98, 1.02, 1.04],
      colorMatrix: [1.03, -0.02, 0.0, 0.0, 1.02, 0.02, 0.02, 0.02, 1.06],
      grain: 0.05, grainSize: 1.0, vignette: 0.18, aberration: 0.0032,
      halation: 0.1, halationColor: [0.85, 0.95, 1.0], softness: 0.0, digitalCrunch: 0.65,
    },
  }),
  createFilter({
    id: 'sepia-daguerre',
    name: 'DAGUERRE',
    subtitle: 'Antique Warm Sepia',
    category: 'bw',
    badge: '1890',
    swatch: ['#d4b483', '#8c6239', '#241910'],
    params: {
      contrast: 1.12, saturation: 0.15, warmth: 0.18, tint: 0.02, fade: 0.09,
      shadowColor: [0.07, 0.04, 0.015], highlightColor: [1.06, 0.96, 0.8],
      grain: 0.145, grainSize: 1.7, vignette: 0.64, aberration: 0.002,
      halation: 0.2, halationColor: [1.0, 0.82, 0.56], softness: 0.34, sepia: 0.88,
    },
  }),
];

/**
 * Curated category blueprints. Each category combines base looks × tonal variations
 * to generate 50+ distinct, meaningful presets per category (520+ total).
 */
const CATEGORY_SPECS = [
  {
    category: 'retro',
    badge: 'FILM',
    bases: [
      ['EKTAR', [0.10, -0.03, 1.14, 1.24, 0.03, 0.05, 0.02, 0.01, 1.05, 0.98, 0.90, 0.075, 0.25, 0.16]],
      ['ULTRAMAX', [0.09, 0.01, 1.10, 1.16, 0.05, 0.04, 0.03, 0.02, 1.04, 0.98, 0.93, 0.095, 0.30, 0.18]],
      ['COLORPLUS', [0.13, -0.01, 1.05, 1.08, 0.06, 0.05, 0.03, 0.01, 1.05, 0.99, 0.88, 0.09, 0.32, 0.20]],
      ['PRO 400H', [-0.04, 0.08, 0.96, 0.92, 0.08, 0.02, 0.06, 0.05, 0.98, 1.02, 1.00, 0.065, 0.22, 0.22]],
      ['VELVIA', [0.04, 0.02, 1.24, 1.32, 0.01, 0.02, 0.02, 0.04, 1.03, 1.01, 0.98, 0.05, 0.34, 0.12]],
      ['PROVIA', [-0.02, 0.03, 1.12, 1.12, 0.02, 0.01, 0.03, 0.05, 0.99, 1.01, 1.03, 0.055, 0.24, 0.12]],
      ['AGFA VISTA', [0.06, -0.04, 1.15, 1.20, 0.04, 0.05, 0.02, 0.03, 1.06, 0.97, 0.94, 0.09, 0.30, 0.18]],
      ['NATURA', [0.03, 0.05, 0.98, 1.02, 0.07, 0.03, 0.05, 0.04, 1.01, 1.02, 0.97, 0.11, 0.26, 0.24]],
      ['PORTRA 160', [0.05, 0.02, 0.92, 0.90, 0.08, 0.03, 0.04, 0.04, 1.02, 0.99, 0.96, 0.05, 0.20, 0.20]],
      ['PORTRA 800', [0.09, 0.01, 1.04, 1.08, 0.06, 0.04, 0.03, 0.02, 1.04, 1.00, 0.93, 0.115, 0.28, 0.26]],
      ['KODACHROME', [0.11, -0.02, 1.20, 1.12, 0.03, 0.06, 0.02, 0.01, 1.06, 0.97, 0.89, 0.07, 0.36, 0.15]],
      ['EKTACHROME', [-0.08, 0.04, 1.16, 1.15, 0.02, 0.01, 0.04, 0.08, 0.96, 1.01, 1.07, 0.065, 0.28, 0.16]],
      ['FERRANIA', [0.08, 0.03, 1.07, 1.05, 0.06, 0.05, 0.04, 0.02, 1.04, 1.00, 0.91, 0.10, 0.34, 0.22]],
    ],
    variants: [
      ['100', { contrast: -0.03, grain: -0.02, warmth: 0.0 }],
      ['400', { contrast: 0.03, grain: 0.02, fade: 0.01 }],
      ['PUSH +1', { contrast: 0.10, grain: 0.04, saturation: 0.08 }],
      ['EXPIRED', { fade: 0.05, tint: 0.05, warmth: 0.06, softness: 0.10 }],
      ['SUNSET', { warmth: 0.09, saturation: 0.06, halation: 0.14 }],
    ],
  },
  {
    category: 'instant',
    badge: 'INSTANT',
    bases: [
      ['POLA 600', [0.07, 0.05, 0.92, 0.88, 0.12, 0.04, 0.06, 0.05, 1.02, 1.0, 0.90, 0.08, 0.42, 0.32]],
      ['SPECTRA', [0.04, 0.06, 0.96, 0.92, 0.10, 0.03, 0.06, 0.07, 0.98, 1.02, 0.94, 0.075, 0.38, 0.28]],
      ['INSTAX MINI', [-0.03, 0.02, 1.06, 1.02, 0.06, 0.02, 0.04, 0.05, 0.99, 1.01, 1.02, 0.05, 0.28, 0.20]],
      ['INSTAX WIDE', [0.02, 0.03, 1.04, 0.98, 0.07, 0.03, 0.04, 0.04, 1.01, 1.01, 0.99, 0.055, 0.30, 0.22]],
      ['POLA GO', [0.09, 0.04, 0.95, 0.90, 0.11, 0.05, 0.05, 0.04, 1.03, 0.99, 0.91, 0.08, 0.40, 0.30]],
      ['LAND 100', [0.11, 0.02, 0.90, 0.82, 0.14, 0.06, 0.05, 0.03, 1.04, 0.98, 0.87, 0.095, 0.48, 0.34]],
      ['IMPOSSIBLE', [0.06, 0.08, 0.86, 0.78, 0.15, 0.04, 0.08, 0.07, 0.97, 1.02, 0.90, 0.10, 0.50, 0.38]],
      ['PEEL APART', [0.05, 0.04, 1.02, 0.94, 0.09, 0.04, 0.05, 0.04, 1.02, 1.00, 0.95, 0.085, 0.36, 0.26]],
      ['FP-100C', [0.01, 0.03, 1.08, 1.04, 0.05, 0.02, 0.04, 0.04, 1.00, 1.01, 1.00, 0.06, 0.26, 0.22]],
      ['ONE600', [0.08, 0.03, 0.94, 0.86, 0.12, 0.05, 0.06, 0.04, 1.02, 0.99, 0.92, 0.09, 0.44, 0.30]],
    ],
    variants: [
      ['CLASSIC', { softness: 0.22 }],
      ['CREAM', { warmth: 0.06, fade: 0.04, softness: 0.28 }],
      ['MINT TINT', { tint: 0.08, warmth: -0.05 }],
      ['FADED', { fade: 0.06, contrast: -0.08, saturation: -0.10 }],
      ['FLASH', { contrast: 0.10, vignette: 0.14, halation: 0.12 }],
    ],
  },
  {
    category: 'bw',
    badge: 'B&W',
    bases: [
      ['HP5 PLUS', [0.0, 0.0, 1.16, 0.0, 0.05, 0.02, 0.02, 0.02, 1.0, 1.0, 1.0, 0.12, 0.36, 0.14]],
      ['T-MAX 400', [0.0, 0.0, 1.24, 0.0, 0.03, 0.01, 0.01, 0.02, 1.0, 1.0, 1.0, 0.08, 0.32, 0.10]],
      ['DELTA 3200', [0.0, 0.0, 1.28, 0.0, 0.06, 0.03, 0.03, 0.03, 1.0, 1.0, 1.0, 0.20, 0.45, 0.18]],
      ['ACROS 100', [0.0, 0.0, 1.20, 0.0, 0.02, 0.01, 0.01, 0.01, 1.0, 1.0, 1.0, 0.05, 0.28, 0.10]],
      ['DOUBLE-X', [0.0, 0.0, 1.30, 0.0, 0.04, 0.02, 0.02, 0.02, 1.0, 1.0, 1.0, 0.14, 0.40, 0.16]],
      ['PAN F 50', [0.0, 0.0, 1.18, 0.0, 0.02, 0.01, 0.01, 0.01, 1.0, 1.0, 1.0, 0.04, 0.24, 0.08]],
      ['FP4 125', [0.0, 0.0, 1.12, 0.0, 0.04, 0.02, 0.02, 0.02, 1.0, 1.0, 1.0, 0.08, 0.30, 0.12]],
      ['FOMAPAN', [0.0, 0.0, 1.22, 0.0, 0.05, 0.02, 0.02, 0.02, 1.0, 1.0, 1.0, 0.15, 0.42, 0.16]],
      ['NOIR 1940', [0.0, 0.0, 1.38, 0.0, 0.01, 0.01, 0.01, 0.01, 1.0, 1.0, 1.0, 0.11, 0.56, 0.12]],
      ['SILVER GEL', [0.0, 0.0, 1.15, 0.0, 0.06, 0.03, 0.02, 0.02, 1.0, 1.0, 1.0, 0.10, 0.34, 0.20]],
    ],
    variants: [
      ['PURE', {}],
      ['HIGH CON', { contrast: 0.14, vignette: 0.12 }],
      ['SOFT MATTE', { contrast: -0.10, fade: 0.06 }],
      ['SEPIA', { sepia: 0.65, warmth: 0.10, saturation: 0.18 }],
      ['CYANOTYPE', { warmth: -0.22, saturation: 0.35, shadowColor: [0.0, 0.04, 0.09], highlightColor: [0.92, 0.98, 1.05] }],
    ],
  },
  {
    category: 'modern',
    badge: 'MOD',
    bases: [
      ['STUDIO CLEAN', [0.01, 0.0, 1.05, 1.04, 0.01, 0.01, 0.01, 0.02, 1.0, 1.0, 1.0, 0.015, 0.08, 0.05]],
      ['MINIMAL', [-0.02, 0.01, 1.02, 0.90, 0.02, 0.01, 0.02, 0.02, 0.99, 1.0, 1.01, 0.01, 0.06, 0.04]],
      ['GOLDEN HR', [0.14, -0.02, 1.06, 1.12, 0.02, 0.04, 0.02, 0.0, 1.05, 1.0, 0.92, 0.02, 0.12, 0.24]],
      ['NORDIC', [-0.10, 0.02, 1.04, 0.86, 0.03, 0.01, 0.03, 0.05, 0.96, 1.0, 1.05, 0.02, 0.10, 0.08]],
      ['TOKYO CRISP', [-0.04, 0.03, 1.10, 1.08, 0.01, 0.01, 0.02, 0.04, 0.98, 1.02, 1.03, 0.02, 0.12, 0.10]],
      ['PARIS CAFE', [0.08, 0.01, 1.03, 0.98, 0.04, 0.04, 0.03, 0.01, 1.03, 1.0, 0.95, 0.03, 0.16, 0.14]],
      ['DESERT SUN', [0.16, -0.03, 1.08, 1.10, 0.03, 0.05, 0.02, 0.0, 1.06, 0.99, 0.90, 0.025, 0.14, 0.20]],
      ['ARCHITECT', [-0.05, 0.0, 1.14, 0.84, 0.01, 0.01, 0.02, 0.03, 0.98, 1.0, 1.03, 0.015, 0.14, 0.05]],
      ['AIRY BRIGHT', [0.04, 0.02, 0.92, 0.96, 0.05, 0.02, 0.03, 0.03, 1.02, 1.01, 0.99, 0.015, 0.05, 0.22]],
      ['LIFESTYLE', [0.07, 0.01, 1.04, 1.06, 0.03, 0.03, 0.02, 0.01, 1.03, 1.01, 0.96, 0.02, 0.10, 0.12]],
      ['PORTRAIT PRO', [0.05, 0.02, 0.98, 0.98, 0.03, 0.02, 0.02, 0.02, 1.02, 1.0, 0.98, 0.02, 0.12, 0.16]],
      ['SEOUL SOFT', [0.02, 0.04, 0.94, 0.94, 0.04, 0.02, 0.03, 0.04, 1.00, 1.02, 1.01, 0.015, 0.08, 0.20]],
    ],
    variants: [
      ['I', {}],
      ['WARM', { warmth: 0.06, saturation: 0.04 }],
      ['COOL', { warmth: -0.07, tint: 0.02 }],
      ['MATTE', { fade: 0.045, contrast: -0.04 }],
      ['CRISP', { contrast: 0.08, digitalCrunch: 0.22 }],
    ],
  },
  {
    category: 'cinema',
    badge: 'CINE',
    bases: [
      ['TEAL ORANGE', [0.04, -0.02, 1.18, 1.16, 0.03, 0.0, 0.05, 0.07, 1.05, 0.99, 0.95, 0.06, 0.34, 0.24]],
      ['NEON RUNNER', [-0.14, -0.04, 1.22, 1.24, 0.02, 0.01, 0.04, 0.10, 0.96, 0.98, 1.10, 0.07, 0.38, 0.48]],
      ['KOWLOON', [-0.06, 0.12, 1.16, 1.10, 0.04, 0.0, 0.08, 0.04, 0.94, 1.06, 0.98, 0.08, 0.40, 0.32]],
      ['ANAMORPHIC', [-0.08, 0.02, 1.14, 1.06, 0.03, 0.01, 0.04, 0.07, 0.97, 1.01, 1.06, 0.06, 0.36, 0.42]],
      ['BLEACH', [0.0, 0.01, 1.32, 0.58, 0.02, 0.02, 0.03, 0.04, 1.0, 1.0, 1.02, 0.09, 0.42, 0.14]],
      ['TECHNICOLOR', [0.08, -0.02, 1.20, 1.30, 0.01, 0.03, 0.01, 0.04, 1.08, 1.02, 0.94, 0.06, 0.28, 0.18]],
      ['WESTERN', [0.16, -0.03, 1.16, 1.05, 0.04, 0.06, 0.03, 0.0, 1.07, 0.98, 0.85, 0.09, 0.42, 0.20]],
      ['MOONLIGHT', [-0.18, 0.02, 1.14, 0.92, 0.03, 0.0, 0.03, 0.10, 0.92, 1.00, 1.12, 0.07, 0.36, 0.28]],
      ['50D DAY', [0.05, 0.01, 1.08, 1.08, 0.03, 0.02, 0.03, 0.02, 1.02, 1.01, 0.98, 0.045, 0.24, 0.36]],
      ['400D', [0.03, 0.03, 1.10, 1.12, 0.04, 0.02, 0.04, 0.03, 1.01, 1.01, 0.99, 0.075, 0.30, 0.42]],
    ],
    variants: [
      ['24FPS', {}],
      ['RED HALO', { halation: 0.25, halationColor: [1.0, 0.20, 0.12] }],
      ['BLUE HALO', { halation: 0.22, halationColor: [0.35, 0.72, 1.0], warmth: -0.06 }],
      ['DEEP', { contrast: 0.08, vignette: 0.12 }],
      ['HAZE', { fade: 0.05, softness: 0.18 }],
    ],
  },
  {
    category: 'vibrant',
    badge: 'POP',
    bases: [
      ['TROPIC', [0.05, 0.04, 1.14, 1.34, 0.01, 0.02, 0.04, 0.02, 1.04, 1.04, 0.98, 0.03, 0.14, 0.12]],
      ['MIAMI', [0.06, -0.05, 1.12, 1.30, 0.02, 0.04, 0.01, 0.05, 1.06, 0.98, 1.05, 0.035, 0.16, 0.22]],
      ['AUTUMN', [0.15, -0.03, 1.15, 1.24, 0.02, 0.06, 0.02, 0.0, 1.08, 0.98, 0.86, 0.04, 0.22, 0.18]],
      ['MEDITERRAN', [-0.04, 0.02, 1.12, 1.28, 0.01, 0.01, 0.03, 0.06, 0.98, 1.02, 1.08, 0.025, 0.14, 0.14]],
      ['CORAL', [0.10, -0.04, 1.08, 1.26, 0.02, 0.05, 0.01, 0.02, 1.07, 0.99, 0.96, 0.03, 0.16, 0.18]],
      ['EMERALD', [-0.03, 0.10, 1.14, 1.22, 0.02, 0.0, 0.06, 0.03, 0.96, 1.07, 0.98, 0.035, 0.20, 0.14]],
      ['SOLARIS', [0.14, 0.01, 1.18, 1.32, 0.01, 0.05, 0.02, 0.0, 1.07, 1.01, 0.90, 0.03, 0.18, 0.26]],
      ['ELECTRIC', [-0.08, -0.02, 1.20, 1.36, 0.01, 0.01, 0.02, 0.07, 1.00, 1.00, 1.09, 0.03, 0.16, 0.22]],
      ['MANGO', [0.16, 0.02, 1.10, 1.28, 0.02, 0.06, 0.03, 0.0, 1.06, 1.02, 0.88, 0.03, 0.14, 0.18]],
      ['COBALT', [-0.12, 0.0, 1.16, 1.26, 0.01, 0.0, 0.02, 0.08, 0.95, 1.00, 1.12, 0.03, 0.18, 0.16]],
    ],
    variants: [
      ['VIVID', {}],
      ['SUNLIT', { warmth: 0.06, halation: 0.14 }],
      ['PUNCH', { contrast: 0.10, saturation: 0.10 }],
      ['CLEAN', { grain: -0.015, vignette: -0.06 }],
      ['FILM', { grain: 0.05, fade: 0.03 }],
    ],
  },
  {
    category: 'pastel',
    badge: 'SOFT',
    bases: [
      ['PEACH MILK', [0.10, -0.02, 0.88, 0.88, 0.09, 0.05, 0.03, 0.02, 1.04, 1.0, 0.95, 0.04, 0.14, 0.28]],
      ['LAVENDER', [-0.06, -0.06, 0.88, 0.84, 0.10, 0.04, 0.02, 0.07, 1.00, 0.97, 1.06, 0.04, 0.16, 0.26]],
      ['MATCHA', [0.02, 0.09, 0.90, 0.86, 0.08, 0.02, 0.06, 0.03, 0.98, 1.04, 0.96, 0.045, 0.16, 0.24]],
      ['ROSE QUARTZ', [0.08, -0.07, 0.89, 0.90, 0.09, 0.05, 0.01, 0.04, 1.05, 0.97, 1.00, 0.035, 0.14, 0.30]],
      ['VANILLA', [0.11, 0.02, 0.86, 0.82, 0.11, 0.05, 0.04, 0.02, 1.03, 1.01, 0.92, 0.04, 0.16, 0.28]],
      ['CLOUD', [-0.05, 0.02, 0.88, 0.80, 0.10, 0.02, 0.03, 0.05, 0.97, 1.00, 1.04, 0.04, 0.14, 0.26]],
      ['CREAM SODA', [0.07, 0.04, 0.91, 0.92, 0.08, 0.04, 0.04, 0.02, 1.02, 1.02, 0.95, 0.04, 0.15, 0.26]],
      ['SAKURA', [0.06, -0.06, 0.90, 0.92, 0.09, 0.05, 0.02, 0.04, 1.04, 0.98, 1.02, 0.035, 0.14, 0.32]],
      ['BUTTER', [0.12, 0.03, 0.89, 0.88, 0.09, 0.05, 0.04, 0.01, 1.04, 1.02, 0.90, 0.04, 0.16, 0.26]],
      ['DREAMY', [0.03, 0.01, 0.84, 0.85, 0.12, 0.03, 0.03, 0.04, 1.01, 1.00, 1.01, 0.04, 0.18, 0.40]],
    ],
    variants: [
      ['SOFT', { softness: 0.24 }],
      ['AIRY', { fade: 0.04, contrast: -0.05 }],
      ['BLOOM', { halation: 0.18, softness: 0.30 }],
      ['CANDY', { saturation: 0.12 }],
      ['FILM', { grain: 0.045 }],
    ],
  },
  {
    category: 'moody',
    badge: 'DARK',
    bases: [
      ['OBSIDIAN', [-0.04, 0.01, 1.24, 0.72, 0.04, 0.01, 0.02, 0.03, 0.98, 0.99, 1.01, 0.08, 0.48, 0.12]],
      ['ESPRESSO', [0.12, -0.01, 1.20, 0.78, 0.05, 0.06, 0.03, 0.01, 1.05, 0.97, 0.87, 0.08, 0.46, 0.16]],
      ['RAINY SLATE', [-0.10, 0.03, 1.16, 0.76, 0.05, 0.01, 0.03, 0.06, 0.95, 1.00, 1.05, 0.07, 0.42, 0.14]],
      ['PINEWOOD', [-0.04, 0.08, 1.18, 0.82, 0.04, 0.01, 0.06, 0.02, 0.95, 1.04, 0.95, 0.08, 0.44, 0.14]],
      ['MIDNIGHT', [-0.14, 0.0, 1.22, 0.84, 0.03, 0.0, 0.02, 0.08, 0.92, 0.99, 1.09, 0.085, 0.50, 0.18]],
      ['CHARCOAL', [-0.02, 0.0, 1.20, 0.62, 0.06, 0.02, 0.02, 0.02, 0.99, 0.99, 0.99, 0.09, 0.46, 0.12]],
      ['RUST', [0.10, -0.04, 1.20, 0.88, 0.04, 0.07, 0.02, 0.01, 1.07, 0.96, 0.88, 0.09, 0.44, 0.18]],
      ['SMOKED', [0.02, 0.02, 1.12, 0.74, 0.08, 0.03, 0.03, 0.03, 1.00, 1.00, 0.98, 0.08, 0.48, 0.16]],
      ['STORM', [-0.09, 0.04, 1.22, 0.80, 0.04, 0.01, 0.04, 0.06, 0.95, 1.01, 1.06, 0.085, 0.46, 0.16]],
      ['MAHOGANY', [0.11, -0.03, 1.18, 0.86, 0.04, 0.06, 0.02, 0.01, 1.06, 0.96, 0.90, 0.08, 0.44, 0.16]],
    ],
    variants: [
      ['MATTE', { fade: 0.04 }],
      ['DEEP', { contrast: 0.08, vignette: 0.12 }],
      ['GRAIN', { grain: 0.06 }],
      ['MIST', { softness: 0.18, fade: 0.05 }],
      ['SHADOW', { exposure: -0.15 }],
    ],
  },
  {
    category: 'duotone',
    badge: 'SPLIT',
    bases: [
      ['AMBER TEAL', [0.06, 0.01, 1.14, 1.04, 0.05, 0.0, 0.06, 0.07, 1.04, 1.00, 0.94, 0.06, 0.30, 0.20]],
      ['CRIMSON BLUE', [-0.02, -0.04, 1.16, 1.08, 0.04, 0.02, 0.01, 0.09, 1.05, 0.96, 1.03, 0.065, 0.32, 0.22]],
      ['GOLD VIOLET', [0.08, -0.05, 1.12, 1.02, 0.05, 0.05, 0.01, 0.08, 1.05, 0.97, 1.00, 0.06, 0.30, 0.22]],
      ['ROSE MINT', [0.02, 0.02, 1.06, 1.00, 0.06, 0.02, 0.06, 0.04, 1.04, 1.01, 0.99, 0.055, 0.26, 0.22]],
      ['COPPER NAVY', [0.05, -0.02, 1.15, 1.02, 0.04, 0.01, 0.02, 0.09, 1.06, 0.98, 0.97, 0.06, 0.34, 0.20]],
      ['TANG INDIGO', [0.07, -0.03, 1.14, 1.10, 0.04, 0.01, 0.02, 0.09, 1.06, 0.98, 0.96, 0.06, 0.30, 0.24]],
      ['PLUM LIME', [0.0, 0.04, 1.12, 1.06, 0.05, 0.05, 0.01, 0.06, 1.01, 1.04, 0.99, 0.06, 0.32, 0.20]],
      ['OLIVE PEACH', [0.06, 0.05, 1.08, 0.96, 0.06, 0.03, 0.06, 0.01, 1.02, 1.02, 0.93, 0.06, 0.28, 0.22]],
      ['CORAL SLATE', [0.05, -0.02, 1.10, 1.00, 0.05, 0.02, 0.03, 0.05, 1.05, 0.98, 0.98, 0.055, 0.28, 0.20]],
      ['GOLD CYAN', [0.04, 0.03, 1.12, 1.06, 0.04, 0.0, 0.05, 0.08, 1.04, 1.01, 0.98, 0.06, 0.30, 0.22]],
    ],
    variants: [
      ['SPLIT', {}],
      ['HIGH', { contrast: 0.10, saturation: 0.08 }],
      ['FADED', { fade: 0.06, contrast: -0.06 }],
      ['GLOW', { halation: 0.22 }],
      ['GRAIN', { grain: 0.05 }],
    ],
  },
  {
    category: 'lofi',
    badge: 'LO-FI',
    bases: [
      ['HOLGA 120', [0.06, 0.04, 1.14, 1.08, 0.08, 0.04, 0.05, 0.03, 1.02, 1.01, 0.95, 0.13, 0.68, 0.26]],
      ['DIANA F+', [0.04, 0.06, 1.10, 1.04, 0.09, 0.03, 0.06, 0.05, 0.99, 1.02, 0.98, 0.12, 0.64, 0.30]],
      ['LOMO LC-A', [0.07, -0.02, 1.24, 1.28, 0.03, 0.04, 0.02, 0.03, 1.05, 1.00, 0.97, 0.10, 0.62, 0.22]],
      ['CYBERSHOT', [-0.05, 0.01, 1.16, 1.20, 0.02, 0.01, 0.02, 0.05, 1.01, 1.02, 1.06, 0.05, 0.20, 0.14]],
      ['DIGI 2001', [-0.02, 0.03, 1.18, 1.15, 0.02, 0.02, 0.03, 0.04, 1.02, 1.01, 1.04, 0.06, 0.24, 0.12]],
      ['FLIP CAM', [0.04, 0.05, 1.20, 1.10, 0.04, 0.02, 0.05, 0.03, 1.01, 1.03, 0.96, 0.09, 0.32, 0.18]],
      ['VHS 1994', [0.05, 0.06, 1.06, 0.96, 0.10, 0.04, 0.06, 0.05, 1.02, 1.01, 0.95, 0.14, 0.42, 0.28]],
      ['Y2K FLASH', [0.02, -0.02, 1.22, 1.24, 0.02, 0.02, 0.02, 0.04, 1.04, 1.00, 1.04, 0.06, 0.36, 0.24]],
      ['DISPOSABLE', [0.08, 0.07, 1.16, 1.12, 0.07, 0.04, 0.06, 0.03, 1.03, 1.03, 0.93, 0.14, 0.56, 0.24]],
      ['TOY 110', [0.09, 0.04, 1.12, 1.06, 0.08, 0.05, 0.05, 0.02, 1.03, 1.01, 0.92, 0.16, 0.58, 0.26]],
    ],
    variants: [
      ['RAW', { digitalCrunch: 0.45, aberration: 0.0045 }],
      ['SOFT', { softness: 0.42, aberration: 0.0055 }],
      ['CCD', { digitalCrunch: 0.72, grainSize: 1.0 }],
      ['CROSS', { tint: 0.10, contrast: 0.10, saturation: 0.12 }],
      ['AGED', { fade: 0.07, warmth: 0.08, grain: 0.05 }],
    ],
  },
];

function generateCatalogFilters() {
  const generated = [];

  for (const spec of CATEGORY_SPECS) {
    for (const [baseName, vec] of spec.bases) {
      const [
        warmth, tint, contrast, saturation, fade,
        sr, sg, sb, mr, mg, mb, grain, vignette, halation,
      ] = vec;

      for (const [varName, mod] of spec.variants) {
        const finalWarmth = clamp(warmth + (mod.warmth || 0), -0.35, 0.35);
        const finalTint = clamp(tint + (mod.tint || 0), -0.35, 0.35);
        const finalContrast = clamp(contrast + (mod.contrast || 0), 0.75, 1.45);
        const finalSat = clamp(saturation + (mod.saturation || 0), 0.0, 1.5);
        const finalFade = clamp(fade + (mod.fade || 0), 0.0, 0.24);
        const finalGrain = clamp(grain + (mod.grain || 0), 0.0, 0.28);
        const finalVig = clamp(vignette + (mod.vignette || 0), 0.0, 0.88);
        const finalHal = clamp(halation + (mod.halation || 0), 0.0, 0.75);

        const slug = `${spec.category}-${baseName}-${varName}`
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');

        const hiCol = mod.highlightColor || [
          clamp(1.0 + finalWarmth * 0.28, 0.85, 1.12),
          clamp(1.0 + finalTint * 0.18, 0.88, 1.08),
          clamp(1.0 - finalWarmth * 0.28, 0.85, 1.12),
        ];

        const shCol = mod.shadowColor || [sr, sg, sb];
        const swatch = [
          rgbHex(clamp(0.62 + finalWarmth * 0.8, 0.15, 0.95), clamp(0.58 + finalTint * 0.7, 0.15, 0.95), clamp(0.58 - finalWarmth * 0.8, 0.15, 0.95)),
          rgbHex(clamp(mr * 0.55, 0.1, 0.95), clamp(mg * 0.55, 0.1, 0.95), clamp(mb * 0.55, 0.1, 0.95)),
          rgbHex(clamp(shCol[0] * 3.5 + 0.08, 0.05, 0.45), clamp(shCol[1] * 3.5 + 0.08, 0.05, 0.45), clamp(shCol[2] * 3.5 + 0.08, 0.05, 0.45)),
        ];

        // Monochrome swatch correction
        if (finalSat === 0 && !(mod.sepia > 0.1)) {
          swatch[0] = '#e2e2e2';
          swatch[1] = '#7a7a7a';
          swatch[2] = '#181818';
        }

        generated.push(
          createFilter({
            id: slug,
            name: `${baseName} ${varName}`,
            subtitle: `${spec.category.toUpperCase()} • ${baseName}`,
            category: spec.category,
            badge: spec.badge,
            swatch,
            dateStampDefault: spec.category === 'retro' || spec.category === 'lofi',
            params: {
              contrast: finalContrast,
              saturation: finalSat,
              warmth: finalWarmth,
              tint: finalTint,
              fade: finalFade,
              shadowColor: shCol,
              highlightColor: hiCol,
              colorMatrix: makeMatrix(mr, mg, mb, finalTint * 0.15),
              grain: finalGrain,
              grainSize: mod.grainSize || (spec.category === 'modern' ? 1.0 : 1.25),
              vignette: finalVig,
              aberration: mod.aberration || (spec.category === 'modern' ? 0.0008 : 0.0024),
              halation: finalHal,
              halationColor: mod.halationColor || [hiCol[0], hiCol[1] * 0.85, hiCol[2] * 0.72],
              softness: mod.softness ?? (spec.category === 'modern' ? 0.03 : 0.12),
              sepia: mod.sepia || 0.0,
              digitalCrunch: mod.digitalCrunch || 0.0,
            },
          })
        );
      }
    }
  }

  return generated;
}

export const RETRO_FILTERS = [...FLAGSHIP_FILTERS, ...generateCatalogFilters()];

const FILTER_MAP = new Map(RETRO_FILTERS.map((f) => [f.id, f]));

export function getFilterById(id) {
  return FILTER_MAP.get(id) || RETRO_FILTERS[0];
}
