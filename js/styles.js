/**
 * 526 Retro & Modern Camera Photo Styles (frames, borders, mounts, HUDs, masks, textures).
 * Works independently and combinably with all 534 RETRO_FILTERS.
 */

export const STYLE_CATEGORIES = [
  { id: 'all', label: 'ALL' },
  { id: 'favorites', label: '★ FAVS' },
  { id: 'polaroid', label: 'POLAROID' },
  { id: 'film35', label: '35MM FILM' },
  { id: 'slide', label: 'SLIDE MOUNT' },
  { id: 'editorial', label: 'EDITORIAL' },
  { id: 'digicam', label: 'DIGICAM / HUD' },
  { id: 'viewfinder', label: 'VIEWFINDER' },
  { id: 'postcard', label: 'POSTCARD' },
  { id: 'darkroom', label: 'DARKROOM' },
  { id: 'modern', label: 'MODERN' },
  { id: 'geometric', label: 'SHAPES' },
];

function createStyle({
  id,
  name,
  subtitle,
  category,
  badge,
  engine,
  bg = '#f3efe6',
  fg = '#3b352e',
  accent = '#e85d04',
  secondary = '#2a6f97',
  tag = '',
  pad = 0.065,
  chin = 0.22,
  radius = 0,
  texture = 'none',
  overlay = 'none',
}) {
  return {
    id,
    name,
    subtitle,
    category,
    badge,
    engine,
    bg,
    fg,
    accent,
    secondary,
    tag,
    pad,
    chin,
    radius,
    texture,
    overlay,
  };
}

// Preserves legacy IDs ('none', 'polaroid', '35mm') as flagship styles
const FLAGSHIP_STYLES = [
  createStyle({
    id: 'none',
    name: 'FULL BLEED',
    subtitle: 'Borderless Raw Frame',
    category: 'editorial',
    badge: 'RAW',
    engine: 'none',
    bg: '#141210',
    fg: '#f4eee4',
    accent: '#ff8232',
    pad: 0,
    chin: 0,
  }),
  createStyle({
    id: 'polaroid',
    name: 'POLAROID',
    subtitle: 'Classic Instant Print',
    category: 'polaroid',
    badge: 'INSTANT',
    engine: 'polaroid',
    bg: '#f3efe6',
    fg: '#4a433b',
    accent: '#e85d04',
    pad: 0.065,
    chin: 0.22,
    texture: 'paper',
  }),
  createStyle({
    id: '35mm',
    name: '35MM STRIP',
    subtitle: 'Sprocket Celluloid Film',
    category: 'film35',
    badge: '35MM',
    engine: 'film35',
    bg: '#141210',
    fg: '#eae4d8',
    accent: '#d97724',
    pad: 0.025,
    chin: 0.11,
  }),
];

const STYLE_BLUEPRINTS = [
  {
    category: 'polaroid',
    badge: 'INSTANT',
    engine: 'polaroid',
    bases: [
      ['CREAM', '#f3efe6', '#4c453c', '#d96b27', 'paper'],
      ['PURE WHITE', '#fafafa', '#333333', '#1d3557', 'clean'],
      ['MATTE BLACK', '#181716', '#e6dfd3', '#ff8232', 'matte'],
      ['KRAFT', '#d2b48c', '#3d2b1f', '#8b4513', 'grain'],
      ['BLUSH PINK', '#f6dce0', '#5a3a40', '#d65a72', 'paper'],
      ['MINT CREAM', '#dff0e6', '#2e4a3d', '#40916c', 'paper'],
      ['SKY WASH', '#dceaf7', '#2b4257', '#3a86ff', 'paper'],
      ['LAVENDER', '#e8dff5', '#423659', '#7b2cbf', 'paper'],
      ['SUNFLOWER', '#f9ebc2', '#52431d', '#e09f3e', 'paper'],
      ['TERRACOTTA', '#e8c4b0', '#4f291c', '#bc4749', 'grain'],
      ['SLATE', '#2d3136', '#e2e6eb', '#4ea8de', 'matte'],
    ],
    variants: [
      ['CLASSIC', { pad: 0.065, chin: 0.22, overlay: 'none' }],
      ['WIDE', { pad: 0.05, chin: 0.18, overlay: 'line' }],
      ['TAPE', { pad: 0.07, chin: 0.22, overlay: 'tape' }],
      ['GOLD RIM', { pad: 0.065, chin: 0.22, overlay: 'foil' }],
      ['STAMPED', { pad: 0.07, chin: 0.24, overlay: 'stamp' }],
    ],
  },
  {
    category: 'film35',
    badge: '35MM',
    engine: 'film35',
    bases: [
      ['KODAK STRIP', '#131110', '#ede7db', '#e89b2d', 'clean'],
      ['FUJI STRIP', '#101614', '#e5efe9', '#38b07b', 'clean'],
      ['CINESTILL', '#121318', '#e8eaf2', '#e63946', 'clean'],
      ['ILFORD BW', '#121212', '#e5e5e5', '#a8a8a8', 'clean'],
      ['AGFA RED', '#161110', '#f0e4df', '#d9482b', 'clean'],
      ['SEPIA FILM', '#1c1510', '#eddcc8', '#c88a4b', 'grain'],
      ['CLEAR ACETATE', '#222120', '#d8d2c7', '#ff9f1c', 'matte'],
      ['ORWO OLIVE', '#141712', '#e4eadc', '#8ab17d', 'clean'],
      ['LOMO POP', '#151218', '#f2e9f7', '#ff006e', 'clean'],
      ['REVERSAL', '#0e1318', '#dde8f2', '#4ea8de', 'clean'],
      ['DOUBLE 120', '#11100f', '#ece6da', '#f4a261', 'clean'],
    ],
    variants: [
      ['HORIZ', { pad: 0.025, chin: 0.11, overlay: 'horiz' }],
      ['VERT', { pad: 0.11, chin: 0.025, overlay: 'vert' }],
      ['NUMBERED', { pad: 0.03, chin: 0.12, overlay: 'numbers' }],
      ['BURN EDGE', { pad: 0.03, chin: 0.11, overlay: 'burn' }],
      ['CONTACT', { pad: 0.04, chin: 0.13, overlay: 'contact' }],
    ],
  },
  {
    category: 'slide',
    badge: 'SLIDE',
    engine: 'slide',
    bases: [
      ['KODACHROME', '#f2ece0', '#b83227', '#d9482b', 'paper'],
      ['EKTACHROME', '#f4f4f0', '#1d4e89', '#0077b6', 'paper'],
      ['AGFACHROME', '#eee7d7', '#d95d18', '#f77f00', 'paper'],
      ['FUJICHROME', '#f1f3ef', '#2d6a4f', '#40916c', 'paper'],
      ['GEPE PRO', '#242321', '#d8d2c7', '#ff8232', 'matte'],
      ['PLASTIC IVORY', '#e9e4d9', '#38332e', '#9c6644', 'clean'],
      ['KODAK YELLOW', '#f6d55c', '#2b2416', '#c1121f', 'clean'],
      ['VINTAGE TAN', '#d8c3a5', '#4a3b2c', '#8e5534', 'grain'],
      ['CHROME BLUE', '#dbe7f3', '#1b365d', '#3a86ff', 'paper'],
      ['ARCHIVE GRAY', '#cfccc6', '#2b2a28', '#e63946', 'paper'],
    ],
    variants: [
      ['SQUARE', { pad: 0.12, chin: 0.12, radius: 0.03, overlay: 'notch' }],
      ['ROUNDED', { pad: 0.11, chin: 0.11, radius: 0.07, overlay: 'clean' }],
      ['LABELED', { pad: 0.12, chin: 0.14, radius: 0.03, overlay: 'label' }],
      ['DOUBLE RIM', { pad: 0.12, chin: 0.12, radius: 0.04, overlay: 'double' }],
      ['STAMPED', { pad: 0.13, chin: 0.13, radius: 0.03, overlay: 'stamp' }],
    ],
  },
  {
    category: 'editorial',
    badge: 'PRINT',
    engine: 'editorial',
    bases: [
      ['GALLERY MAT', '#f7f5f0', '#1c1b19', '#8a7968', 'paper'],
      ['OBSIDIAN MAT', '#111010', '#f0ece3', '#d4a656', 'matte'],
      ['SWISS GRID', '#f2f0eb', '#181818', '#e63946', 'clean'],
      ['ARCHIVE ZINE', '#ebe5d9', '#2b2621', '#bc4749', 'paper'],
      ['LOOKBOOK', '#faf9f6', '#222222', '#555555', 'clean'],
      ['ATELIER', '#e8e2d5', '#322b24', '#8c5e3c', 'paper'],
      ['NOCTURNE', '#17191c', '#e4e8ef', '#64dfdf', 'matte'],
      ['MONOCLE', '#f4f1ea', '#202020', '#d97724', 'paper'],
      ['SANDSTONE', '#dfd3c3', '#3b3228', '#9e5a3c', 'grain'],
      ['CHARCOAL', '#232220', '#eae4d8', '#ff8232', 'matte'],
      ['SAGE PRINT', '#dfe5dc', '#263327', '#52796f', 'paper'],
    ],
    variants: [
      ['MINIMAL', { pad: 0.08, chin: 0.08, overlay: 'hairline' }],
      ['EXHIBITION', { pad: 0.09, chin: 0.16, overlay: 'placard' }],
      ['MAGAZINE', { pad: 0.04, chin: 0.09, overlay: 'masthead' }],
      ['DOUBLE MAT', { pad: 0.10, chin: 0.12, overlay: 'double' }],
      ['ISSUE NO', { pad: 0.06, chin: 0.14, overlay: 'issue' }],
    ],
  },
  {
    category: 'digicam',
    badge: 'OSD',
    engine: 'digicam',
    bases: [
      ['CAMCORDER 98', '#0a0a0a', '#ffffff', '#ff3b30', 'none'],
      ['VHS PLAY', '#0b0e14', '#e8f1ff', '#4ea8de', 'scan'],
      ['CYBERSHOT 03', '#101418', '#f0f7ff', '#ff9f1c', 'none'],
      ['MINIDV 2001', '#0e1116', '#f4f6f8', '#38b000', 'scan'],
      ['HANDYCAM', '#12100e', '#ffe9c4', '#ff7b29', 'none'],
      ['CRT TELE', '#0d0d10', '#c8f7dc', '#00f5d4', 'scan'],
      ['CINEMA SCOPE', '#050505', '#f2ece1', '#ffd166', 'none'],
      ['SECURITY CAM', '#090c0a', '#70e000', '#ef233c', 'scan'],
      ['FLIP PHONE', '#111217', '#dbe4ff', '#ff006e', 'none'],
      ['DIGICAM PRO', '#0d0f12', '#f8f9fa', '#4cc9f0', 'none'],
      ['BETAMAX 84', '#14110f', '#ffddb3', '#f77f00', 'scan'],
    ],
    variants: [
      ['REC HUD', { pad: 0, chin: 0, overlay: 'rec' }],
      ['TIMECODE', { pad: 0, chin: 0, overlay: 'timecode' }],
      ['SUBTITLE', { pad: 0, chin: 0.12, overlay: 'letterbox' }],
      ['BEZEL', { pad: 0.05, chin: 0.07, radius: 0.06, overlay: 'crt' }],
      ['EXIF BAR', { pad: 0.02, chin: 0.09, overlay: 'exif' }],
    ],
  },
  {
    category: 'viewfinder',
    badge: 'OPTIC',
    engine: 'viewfinder',
    bases: [
      ['LEICA M', '#0c0c0c', '#fff4e0', '#ff8232', 'none'],
      ['HASSELBLAD', '#0e0e0d', '#f4efe6', '#ffb703', 'none'],
      ['NIKON FM2', '#101112', '#a7f3d0', '#ef4444', 'none'],
      ['CONTAX G2', '#111010', '#fde68a', '#f97316', 'none'],
      ['ROLLEI TLR', '#0d0d0d', '#e5e5e5', '#fb923c', 'none'],
      ['CANON AE-1', '#0f1012', '#fca5a5', '#f59e0b', 'none'],
      ['PENTAX K1000', '#111110', '#e0f2fe', '#38bdf8', 'none'],
      ['MAMIYA RB67', '#0c0c0b', '#f5ebe0', '#e63946', 'none'],
      ['OLYMPUS OM1', '#0f0e0d', '#fef3c7', '#fb7185', 'none'],
      ['RANGEFINDER', '#121110', '#d9f99d', '#facc15', 'none'],
      ['BRONICA SQ', '#0e0f10', '#f3e8ff', '#c084fc', 'none'],
    ],
    variants: [
      ['FRAMELINE', { pad: 0, chin: 0, overlay: 'frameline' }],
      ['SPLIT PRISM', { pad: 0, chin: 0, overlay: 'prism' }],
      ['V-NOTCH', { pad: 0.03, chin: 0.03, overlay: 'vnotch' }],
      ['TELEMETRY', { pad: 0, chin: 0, overlay: 'telemetry' }],
      ['GRID + EV', { pad: 0, chin: 0, overlay: 'gridev' }],
    ],
  },
  {
    category: 'postcard',
    badge: 'MAIL',
    engine: 'postcard',
    bases: [
      ['AIRMAIL', '#f6f1e7', '#263248', '#d62828', '#1d4ed8'],
      ['PARIS POST', '#f2eadc', '#3d312a', '#c1121f', '#003049'],
      ['TOKYO MAIL', '#f5f2eb', '#2b2b2b', '#e63946', '#457b9d'],
      ['TELEGRAM', '#e9d8a6', '#33291f', '#9b2226', '#005f73'],
      ['VINTAGE STAMP', '#f0e6d2', '#46372b', '#bc4749', '#386641'],
      ['PASSPORT', '#eae2d6', '#1d2d44', '#ae2012', '#3e5c76'],
      ['WASHI NOTE', '#f7f3eb', '#3b352f', '#e07a5f', '#81b29a'],
      ['KRAFT PARCEL', '#cfb288', '#38271a', '#9e2a2b', '#335c67'],
      ['COASTAL CARD', '#eef5f7', '#1e3a5f', '#ff6b6b', '#4ecdc4'],
      ['AUTUMN POST', '#f3e5d8', '#4a2c2a', '#d95d39', '#588157'],
      ['ROMANTIC', '#f9ecec', '#54383b', '#d90429', '#8d99ae'],
    ],
    variants: [
      ['PAR AVION', { pad: 0.06, chin: 0.11, overlay: 'airmail' }],
      ['WASHI TAPE', { pad: 0.065, chin: 0.14, overlay: 'tape' }],
      ['CORNER MOUNT', { pad: 0.075, chin: 0.12, overlay: 'corners' }],
      ['SCALLOP', { pad: 0.07, chin: 0.09, overlay: 'scallop' }],
      ['POSTMARK', { pad: 0.065, chin: 0.15, overlay: 'postmark' }],
    ],
  },
  {
    category: 'darkroom',
    badge: 'LAB',
    engine: 'darkroom',
    bases: [
      ['SILVER REBATE', '#0e0d0c', '#e6e1d6', '#d97724', 'grain'],
      ['HASSELBLAD 6X6', '#100f0e', '#f2ece1', '#ff8232', 'matte'],
      ['WET PLATE', '#141210', '#d8cbb8', '#a67c52', 'grain'],
      ['ENLARGER', '#0b0b0b', '#e2dfd7', '#e63946', 'matte'],
      ['CONTACT PROOF', '#121110', '#eae4d8', '#f59e0b', 'clean'],
      ['TINTYPE', '#171412', '#d2c2aa', '#8c6239', 'grain'],
      ['FILED MASK', '#090909', '#e5e5e5', '#ff7b29', 'matte'],
      ['DARKROOM RED', '#180c0c', '#f5d0d0', '#ef233c', 'matte'],
      ['PLATINUM', '#151514', '#e0ddd5', '#b5a68e', 'grain'],
      ['ALBUMEN', '#1c1712', '#ebd9c0', '#c48f5a', 'grain'],
    ],
    variants: [
      ['ROUGH EDGE', { pad: 0.05, chin: 0.08, overlay: 'rough' }],
      ['PROOF MARK', { pad: 0.055, chin: 0.11, overlay: 'proof' }],
      ['EASEL MAT', { pad: 0.085, chin: 0.085, overlay: 'easel' }],
      ['DUST + BURN', { pad: 0.04, chin: 0.06, overlay: 'dust' }],
      ['NOTCHED', { pad: 0.06, chin: 0.06, overlay: 'notch' }],
    ],
  },
  {
    category: 'modern',
    badge: 'MOD',
    engine: 'modern',
    bases: [
      ['AURORA', '#1b263b', '#f8fafc', '#4cc9f0', '#f72585'],
      ['SUNSET GLASS', '#2b1b24', '#fff7ed', '#fb923c', '#f43f5e'],
      ['FROST WHITE', '#f1f5f9', '#0f172a', '#3b82f6', '#94a3b8'],
      ['OBSIDIAN UI', '#09090b', '#fafafa', '#ff8232', '#27272a'],
      ['MINT GLASS', '#ecfdf5', '#064e3b', '#10b981', '#6ee7b7'],
      ['CYBER NEON', '#0d0221', '#f0f7ff', '#00f5d4', '#ff006e'],
      ['PEACH GLOW', '#fff1e6', '#4a2c2a', '#ff758f', '#ffb5a7'],
      ['NORDIC CARD', '#e2e8f0', '#1e293b', '#0284c7', '#64748b'],
      ['EMERALD DARK', '#06211a', '#ecfdf5', '#34d399', '#059669'],
      ['VAPORWAVE', '#1a0b2e', '#f8e1ff', '#ff4ecd', '#00e5ff'],
    ],
    variants: [
      ['SQUIRCLE', { pad: 0.05, chin: 0.05, radius: 0.07, overlay: 'clean' }],
      ['FLOATING', { pad: 0.075, chin: 0.09, radius: 0.04, overlay: 'shadow' }],
      ['GRADIENT', { pad: 0.06, chin: 0.06, radius: 0.05, overlay: 'gradient' }],
      ['NEON RING', { pad: 0.045, chin: 0.065, radius: 0.05, overlay: 'neon' }],
      ['STORY PILL', { pad: 0.05, chin: 0.13, radius: 0.05, overlay: 'pill' }],
    ],
  },
  {
    category: 'geometric',
    badge: 'SHAPE',
    engine: 'geometric',
    bases: [
      ['IVORY', '#f4f0e8', '#2b2723', '#e05a0c', 'paper'],
      ['CARBON', '#131211', '#f2ece1', '#ff8232', 'matte'],
      ['SAND', '#e4d5be', '#3a2f24', '#b5651d', 'paper'],
      ['NAVY', '#14213d', '#edf2f4', '#fca311', 'matte'],
      ['SAGE', '#cad2c5', '#2f3e46', '#52796f', 'paper'],
      ['ROSE', '#f2d7d9', '#4a2529', '#c9184a', 'paper'],
      ['SLATE', '#2b2d42', '#edf2f4', '#ef233c', 'matte'],
      ['CREAM', '#faf3dd', '#3d405b', '#e07a5f', 'paper'],
      ['OLIVE', '#3a402c', '#f4f1de', '#e9c46a', 'matte'],
    ],
    variants: [
      ['ARCH', { pad: 0.07, chin: 0.09, overlay: 'arch' }],
      ['CIRCLE', { pad: 0.08, chin: 0.08, overlay: 'circle' }],
      ['OVAL CAMEO', { pad: 0.08, chin: 0.08, overlay: 'oval' }],
      ['TICKET STUB', { pad: 0.06, chin: 0.11, overlay: 'ticket' }],
      ['SOFT GATE', { pad: 0.06, chin: 0.06, radius: 0.11, overlay: 'gate' }],
    ],
  },
];

function generateCatalogStyles() {
  const list = [];
  for (const spec of STYLE_BLUEPRINTS) {
    for (const [baseName, bg, fg, accent, fourth] of spec.bases) {
      for (const [varName, mod] of spec.variants) {
        const slug = `${spec.category}-${baseName}-${varName}`
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');

        const isHexFourth = typeof fourth === 'string' && fourth.startsWith('#');
        list.push(
          createStyle({
            id: slug,
            name: `${baseName} ${varName}`,
            subtitle: `${spec.category.toUpperCase()} • ${baseName}`,
            category: spec.category,
            badge: spec.badge,
            engine: spec.engine,
            bg,
            fg,
            accent,
            secondary: isHexFourth ? fourth : accent,
            texture: isHexFourth ? 'clean' : fourth,
            pad: mod.pad ?? 0.06,
            chin: mod.chin ?? 0.10,
            radius: mod.radius ?? 0,
            overlay: mod.overlay || 'none',
          })
        );
      }
    }
  }
  return list;
}

export const PHOTO_STYLES = [...FLAGSHIP_STYLES, ...generateCatalogStyles()];

const STYLE_MAP = new Map(PHOTO_STYLES.map((s) => [s.id, s]));

export function getStyleById(id) {
  return STYLE_MAP.get(id) || PHOTO_STYLES[0];
}
