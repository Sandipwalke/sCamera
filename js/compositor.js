/**
 * High-resolution photo capture compositor.
 * Renders filtered image via RetroRenderer, then overlays Quartz Date Stamp and Film Frame.
 */

import { RetroRenderer } from './gl-renderer.js';
import { ASPECT_RATIOS } from './filters.js';

let captureCanvas = null;
let captureRenderer = null;

function getCaptureRenderer(width, height) {
  if (!captureCanvas) {
    captureCanvas = document.createElement('canvas');
    captureCanvas.width = width;
    captureCanvas.height = height;
    captureRenderer = new RetroRenderer(captureCanvas);
  } else if (captureCanvas.width !== width || captureCanvas.height !== height) {
    captureCanvas.width = width;
    captureCanvas.height = height;
  }
  return { canvas: captureCanvas, renderer: captureRenderer };
}

/**
 * Formats the iconic retro quartz date stamp string.
 * @param {'off'|'modern'|'retro98'} mode
 * @param {Date} date
 */
export function formatDateStamp(mode, date = new Date()) {
  if (mode === 'off') return '';
  const yy = mode === 'retro98' ? '98' : String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `'${yy} ${mm} ${dd}`;
}

/**
 * Computes crisp target dimensions honoring aspect ratio without exceeding maxEdge.
 */
export function computeOutputDimensions(srcW, srcH, aspectKey, maxEdge = 1920) {
  const ratio = ASPECT_RATIOS[aspectKey]?.ratio || 4 / 3;
  // Match orientation of source if portrait vs landscape unless 1:1
  const isPortrait = srcH > srcW;
  const targetRatio = ratio === 1 ? 1 : (isPortrait ? 1 / ratio : ratio);

  let width;
  let height;
  if (targetRatio >= 1) {
    width = Math.min(maxEdge, Math.max(srcW, 1080));
    height = Math.round(width / targetRatio);
    if (height > maxEdge) {
      height = maxEdge;
      width = Math.round(height * targetRatio);
    }
  } else {
    height = Math.min(maxEdge, Math.max(srcH, 1080));
    width = Math.round(height * targetRatio);
    if (width > maxEdge) {
      width = maxEdge;
      height = Math.round(width / targetRatio);
    }
  }
  return { width: Math.max(320, width), height: Math.max(320, height) };
}

/**
 * Renders the final filtered + stamped + framed image and returns { blob, thumbBlob, width, height }.
 */
export async function composeShot({
  source,
  sourceWidth,
  sourceHeight,
  aspectRatio,
  filter,
  exposure,
  zoom,
  mirror,
  grainIntensity,
  vignetteIntensity,
  lightLeakMode,
  lightLeakIntensity,
  lightLeakSeed,
  dateStampMode,
  frameStyle,
  frameNumber,
}) {
  const { width, height } = computeOutputDimensions(sourceWidth, sourceHeight, aspectRatio, 1920);
  const { canvas: glCanvas, renderer } = getCaptureRenderer(width, height);

  renderer.render(source, sourceWidth, sourceHeight, {
    filter,
    exposure,
    zoom,
    mirror,
    grainIntensity,
    vignetteIntensity,
    lightLeakMode,
    lightLeakIntensity,
    lightLeakSeed,
    time: Math.random() * 100.0,
  });

  // Final 2D composite canvas (handles date stamp & optional film frames)
  const out = document.createElement('canvas');
  const ctx = out.getContext('2d');

  let imgX = 0;
  let imgY = 0;
  let finalW = width;
  let finalH = height;

  if (frameStyle === 'polaroid') {
    const padSide = Math.round(width * 0.065);
    const padTop = Math.round(width * 0.065);
    const padBottom = Math.round(width * 0.22);
    finalW = width + padSide * 2;
    finalH = height + padTop + padBottom;
    imgX = padSide;
    imgY = padTop;

    out.width = finalW;
    out.height = finalH;

    // Warm instant paper background
    ctx.fillStyle = '#f3efe6';
    ctx.fillRect(0, 0, finalW, finalH);

    // Subtle recessed photo border shadow
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.fillRect(imgX - 2, imgY - 2, width + 4, height + 4);
  } else if (frameStyle === '35mm') {
    const barH = Math.round(height * 0.11);
    const sidePad = Math.round(width * 0.025);
    finalW = width + sidePad * 2;
    finalH = height + barH * 2;
    imgX = sidePad;
    imgY = barH;

    out.width = finalW;
    out.height = finalH;

    // Dark celluloid negative strip
    ctx.fillStyle = '#141210';
    ctx.fillRect(0, 0, finalW, finalH);
  } else {
    out.width = finalW;
    out.height = finalH;
  }

  // Draw filtered photo
  ctx.drawImage(glCanvas, imgX, imgY, width, height);

  // Draw Quartz Date Stamp inside photo corner
  const stampText = formatDateStamp(dateStampMode);
  if (stampText) {
    const fontSize = Math.max(18, Math.round(Math.min(width, height) * 0.042));
    const padRight = Math.round(width * 0.045);
    const padBottom = Math.round(height * 0.045);

    ctx.save();
    ctx.font = `700 ${fontSize}px "Courier New", monospace`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';

    const sx = imgX + width - padRight;
    const sy = imgY + height - padBottom;

    // Outer phosphor glow
    ctx.shadowColor = 'rgba(255, 72, 0, 0.92)';
    ctx.shadowBlur = Math.round(fontSize * 0.45);
    ctx.fillStyle = 'rgba(255, 118, 26, 0.92)';
    ctx.fillText(stampText, sx, sy);

    // Crisp hot core
    ctx.shadowBlur = 2;
    ctx.fillStyle = '#ff9a3c';
    ctx.fillText(stampText, sx, sy);
    ctx.restore();
  }

  // Decorate film frames
  if (frameStyle === 'polaroid') {
    const chinCenterY = imgY + height + (finalH - (imgY + height)) * 0.52;
    ctx.save();
    ctx.fillStyle = '#524b42';
    ctx.font = `600 ${Math.max(16, Math.round(width * 0.03))}px "Georgia", serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${filter.name}  •  EXP ${String(frameNumber).padStart(3, '0')}`, finalW / 2, chinCenterY);
    ctx.restore();
  } else if (frameStyle === '35mm') {
    const barH = imgY;
    const holeW = Math.round(barH * 0.44);
    const holeH = Math.round(barH * 0.52);
    const holeRadius = Math.max(3, Math.round(holeW * 0.18));
    const spacing = holeW * 2.15;

    ctx.save();
    // Sprocket holes top and bottom
    ctx.fillStyle = '#eae4d8';
    for (let x = Math.round(spacing * 0.4); x < finalW - holeW; x += spacing) {
      _roundRect(ctx, x, Math.round((barH - holeH) * 0.5), holeW, holeH, holeRadius);
      ctx.fill();
      _roundRect(ctx, x, finalH - barH + Math.round((barH - holeH) * 0.5), holeW, holeH, holeRadius);
      ctx.fill();
    }

    // Orange negative edge markings
    const edgeFont = Math.max(11, Math.round(barH * 0.20));
    ctx.font = `700 ${edgeFont}px "Courier New", monospace`;
    ctx.fillStyle = '#d97724';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillText(`sCAMERA ${filter.name}`, imgX + 6, Math.round(barH * 0.14));
    ctx.textAlign = 'right';
    ctx.fillText(`${String(frameNumber).padStart(2, '0')}A`, finalW - imgX - 6, finalH - Math.round(barH * 0.14));
    ctx.restore();
  }

  const blob = await canvasToBlob(out, 'image/jpeg', 0.92);

  // Generate thumbnail (max 360px) for snappy gallery & localStorage fallback
  const thumbScale = Math.min(1, 360 / Math.max(finalW, finalH));
  const thumbCanvas = document.createElement('canvas');
  thumbCanvas.width = Math.max(1, Math.round(finalW * thumbScale));
  thumbCanvas.height = Math.max(1, Math.round(finalH * thumbScale));
  const tctx = thumbCanvas.getContext('2d');
  tctx.drawImage(out, 0, 0, thumbCanvas.width, thumbCanvas.height);
  const thumbBlob = await canvasToBlob(thumbCanvas, 'image/jpeg', 0.8);

  return {
    blob,
    thumbBlob,
    width: finalW,
    height: finalH,
  };
}

function _roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}
