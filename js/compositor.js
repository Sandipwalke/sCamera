/**
 * High-resolution photo capture compositor & unified Style renderer.
 * Powers full-resolution JPEG export, live viewfinder style overlays, and 96x64 style previews.
 */

import { RetroRenderer } from './gl-renderer.js';
import { ASPECT_RATIOS } from './filters.js';
import { getStyleById } from './styles.js';

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

export function formatDateStamp(mode, date = new Date()) {
  if (mode === 'off') return '';
  const yy = mode === 'retro98' ? '98' : String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `'${yy} ${mm} ${dd}`;
}

export function computeOutputDimensions(srcW, srcH, aspectKey, maxEdge = 1920) {
  const ratio = ASPECT_RATIOS[aspectKey]?.ratio || 4 / 3;
  const isPortrait = srcH > srcW;
  const targetRatio = ratio === 1 ? 1 : isPortrait ? 1 / ratio : ratio;

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

function drawDateStamp(ctx, stampText, imgX, imgY, width, height) {
  if (!stampText) return;
  const fontSize = Math.max(16, Math.round(Math.min(width, height) * 0.042));
  const padRight = Math.round(width * 0.045);
  const padBottom = Math.round(height * 0.045);

  ctx.save();
  ctx.font = `700 ${fontSize}px "Courier New", monospace`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';

  const sx = imgX + width - padRight;
  const sy = imgY + height - padBottom;

  ctx.shadowColor = 'rgba(255, 72, 0, 0.92)';
  ctx.shadowBlur = Math.round(fontSize * 0.45);
  ctx.fillStyle = 'rgba(255, 118, 26, 0.92)';
  ctx.fillText(stampText, sx, sy);

  ctx.shadowBlur = 2;
  ctx.fillStyle = '#ff9a3c';
  ctx.fillText(stampText, sx, sy);
  ctx.restore();
}

function traceAperturePath(ctx, style, x, y, w, h) {
  ctx.beginPath();
  const ov = style.overlay;
  if (style.engine === 'geometric') {
    if (ov === 'circle') {
      const r = Math.min(w, h) * 0.48;
      ctx.arc(x + w / 2, y + h / 2, r, 0, Math.PI * 2);
      ctx.closePath();
      return;
    }
    if (ov === 'oval') {
      ctx.ellipse(x + w / 2, y + h / 2, w * 0.46, h * 0.48, 0, 0, Math.PI * 2);
      ctx.closePath();
      return;
    }
    if (ov === 'arch') {
      const archR = w * 0.5;
      ctx.moveTo(x, y + h);
      ctx.lineTo(x, y + archR);
      ctx.arc(x + archR, y + archR, archR, Math.PI, 0, false);
      ctx.lineTo(x + w, y + h);
      ctx.closePath();
      return;
    }
  }
  const rad = style.radius ? Math.min(w, h) * style.radius : 0;
  if (rad > 0) {
    _roundRect(ctx, x, y, w, h, rad);
  } else {
    ctx.rect(x, y, w, h);
  }
}

/**
 * Renders any of the 528 styles either around a supplied photo source (for export / thumbnails)
 * or as a transparent live overlay over the camera viewfinder (source === null).
 */
export function renderStyleLayer(
  ctx,
  totalW,
  totalH,
  source,
  style,
  { filterName = 'GOLD 200', frameNumber = 1, dateStampText = '', compact = false } = {}
) {
  const s = style || getStyleById('none');

  // Compute aperture inside (totalW, totalH)
  const padX = Math.round(totalW * (s.pad || 0));
  const padTop = Math.round(totalH * (s.pad || 0));
  const padBot = Math.round(totalH * (s.chin ?? s.pad ?? 0));

  const imgX = padX;
  const imgY = padTop;
  const imgW = Math.max(8, totalW - padX * 2);
  const imgH = Math.max(8, totalH - padTop - padBot);

  if (s.engine === 'none') {
    if (source) {
      ctx.drawImage(source, 0, 0, totalW, totalH);
      drawDateStamp(ctx, dateStampText, 0, 0, totalW, totalH);
    }
    return;
  }

  const isOverlayOnly = !source;

  const paintBackdrop = () => {
    if (s.engine === 'modern' && s.overlay === 'gradient') {
      const grad = ctx.createLinearGradient(0, 0, totalW, totalH);
      grad.addColorStop(0, s.accent);
      grad.addColorStop(0.5, s.bg);
      grad.addColorStop(1, s.secondary || s.accent);
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = s.bg;
    }

    if (isOverlayOnly) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, totalW, totalH);
      traceAperturePath(ctx, s, imgX, imgY, imgW, imgH);
      // Fill only outside the aperture using even-odd rule? traceAperturePath starts a fresh beginPath,
      // so let's draw rect & aperture cleanly via clip or path helpers:
      ctx.restore();
      _fillOutsideAperture(ctx, totalW, totalH, s, imgX, imgY, imgW, imgH);
    } else {
      ctx.fillRect(0, 0, totalW, totalH);
    }

    // Subtle texture speckles for paper / grain styles
    if (!compact && (s.texture === 'paper' || s.texture === 'grain') && (padX > 2 || padBot > 2)) {
      ctx.save();
      _clipOutsideAperture(ctx, totalW, totalH, s, imgX, imgY, imgW, imgH);
      ctx.fillStyle = s.texture === 'grain' ? 'rgba(0,0,0,0.08)' : 'rgba(120,100,80,0.04)';
      const step = Math.max(6, Math.round(totalW * 0.015));
      for (let y = 0; y < totalH; y += step) {
        for (let x = (y % (step * 2) === 0 ? 0 : step / 2); x < totalW; x += step) {
          ctx.fillRect(x, y, 1, 1);
        }
      }
      ctx.restore();
    }
  };

  paintBackdrop();

  // Draw photo inside aperture (if exporting or rendering thumbnail)
  if (source) {
    ctx.save();
    traceAperturePath(ctx, s, imgX, imgY, imgW, imgH);
    ctx.clip();
    ctx.drawImage(source, imgX, imgY, imgW, imgH);
    if (dateStampText && !compact) {
      drawDateStamp(ctx, dateStampText, imgX, imgY, imgW, imgH);
    }
    ctx.restore();
  }

  // Draw engine-specific decorations
  const minDim = Math.min(totalW, totalH);
  const labelFont = Math.max(compact ? 5 : 12, Math.round(minDim * 0.026));
  const tinyFont = Math.max(compact ? 4 : 10, Math.round(minDim * 0.02));

  if (s.engine === 'polaroid') {
    ctx.save();
    ctx.strokeStyle = 'rgba(0,0,0,0.16)';
    ctx.lineWidth = Math.max(1, Math.round(minDim * 0.003));
    traceAperturePath(ctx, s, imgX, imgY, imgW, imgH);
    ctx.stroke();

    if (s.overlay === 'foil') {
      ctx.strokeStyle = s.accent;
      ctx.lineWidth = Math.max(1, Math.round(minDim * 0.005));
      ctx.strokeRect(imgX - 3, imgY - 3, imgW + 6, imgH + 6);
    } else if (s.overlay === 'tape') {
      ctx.fillStyle = 'rgba(244, 224, 178, 0.72)';
      const tw = Math.round(totalW * 0.16);
      const th = Math.round(totalH * 0.045);
      ctx.save();
      ctx.translate(imgX + tw * 0.4, imgY);
      ctx.rotate(-0.22);
      ctx.fillRect(-tw / 2, -th / 2, tw, th);
      ctx.restore();
      ctx.save();
      ctx.translate(imgX + imgW - tw * 0.4, imgY);
      ctx.rotate(0.22);
      ctx.fillRect(-tw / 2, -th / 2, tw, th);
      ctx.restore();
    }

    if (!compact) {
      const chinY = imgY + imgH + padBot * 0.52;
      ctx.fillStyle = s.fg;
      ctx.font = `600 ${labelFont}px "Georgia", serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const prefix = s.overlay === 'stamp' ? `★ ${filterName}` : filterName;
      ctx.fillText(`${prefix}  •  EXP ${String(frameNumber).padStart(3, '0')}`, totalW / 2, chinY);
      if (s.overlay === 'line') {
        ctx.strokeStyle = s.accent;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(imgX, imgY + imgH + padBot * 0.18);
        ctx.lineTo(imgX + imgW, imgY + imgH + padBot * 0.18);
        ctx.stroke();
      }
    }
    ctx.restore();
  } else if (s.engine === 'film35') {
    ctx.save();
    const isVert = s.overlay === 'vert';
    ctx.fillStyle = s.fg;
    if (isVert) {
      const barW = Math.max(4, imgX);
      const holeW = Math.round(barW * 0.52);
      const holeH = Math.round(barW * 0.44);
      const spacing = Math.max(4, holeH * 2.1);
      const r = Math.max(1, Math.round(holeH * 0.2));
      for (let y = Math.round(spacing * 0.35); y < totalH - holeH; y += spacing) {
        _roundRect(ctx, Math.round((barW - holeW) * 0.5), y, holeW, holeH, r);
        ctx.fill();
        _roundRect(ctx, totalW - barW + Math.round((barW - holeW) * 0.5), y, holeW, holeH, r);
        ctx.fill();
      }
    } else {
      const barH = Math.max(4, imgY);
      const holeW = Math.round(barH * 0.44);
      const holeH = Math.round(barH * 0.50);
      const spacing = Math.max(4, holeW * 2.15);
      const r = Math.max(1, Math.round(holeW * 0.18));
      for (let x = Math.round(spacing * 0.35); x < totalW - holeW; x += spacing) {
        _roundRect(ctx, x, Math.round((barH - holeH) * 0.5), holeW, holeH, r);
        ctx.fill();
        _roundRect(ctx, x, totalH - barH + Math.round((barH - holeH) * 0.5), holeW, holeH, r);
        ctx.fill();
      }
      if (!compact) {
        ctx.font = `700 ${tinyFont}px "Courier New", monospace`;
        ctx.fillStyle = s.accent;
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'left';
        ctx.fillText(`sCAMERA ${filterName}`, imgX + 6, Math.round(barH * 0.16));
        ctx.textAlign = 'right';
        ctx.fillText(`${String(frameNumber).padStart(2, '0')}A`, totalW - imgX - 6, totalH - Math.round(barH * 0.16));
      }
    }
    if (s.overlay === 'burn') {
      const burnGrad = ctx.createLinearGradient(0, 0, totalW * 0.14, 0);
      burnGrad.addColorStop(0, 'rgba(255, 92, 0, 0.55)');
      burnGrad.addColorStop(1, 'rgba(255, 92, 0, 0)');
      ctx.fillStyle = burnGrad;
      ctx.fillRect(0, 0, totalW * 0.14, totalH);
    }
    ctx.restore();
  } else if (s.engine === 'slide') {
    ctx.save();
    ctx.strokeStyle = 'rgba(0,0,0,0.22)';
    ctx.lineWidth = Math.max(1, Math.round(minDim * 0.004));
    traceAperturePath(ctx, s, imgX, imgY, imgW, imgH);
    ctx.stroke();

    if (s.overlay === 'double') {
      ctx.strokeStyle = s.accent;
      ctx.lineWidth = Math.max(1, Math.round(minDim * 0.004));
      ctx.strokeRect(totalW * 0.04, totalH * 0.04, totalW * 0.92, totalH * 0.92);
    }
    if (!compact) {
      ctx.fillStyle = s.fg;
      ctx.font = `800 ${tinyFont}px "Courier New", monospace`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(s.name, imgX, imgY * 0.5);
      ctx.textAlign = 'right';
      ctx.fillStyle = s.accent;
      ctx.fillText(`SLIDE #${String(frameNumber).padStart(3, '0')}`, imgX + imgW, totalH - padBot * 0.5);
    }
    ctx.restore();
  } else if (s.engine === 'editorial') {
    ctx.save();
    if (s.overlay === 'hairline' || s.overlay === 'double') {
      ctx.strokeStyle = s.fg;
      ctx.globalAlpha = 0.25;
      ctx.lineWidth = Math.max(1, Math.round(minDim * 0.002));
      ctx.strokeRect(imgX - 4, imgY - 4, imgW + 8, imgH + 8);
      ctx.globalAlpha = 1;
    }
    if (!compact) {
      if (s.overlay === 'masthead') {
        ctx.fillStyle = s.fg;
        ctx.font = `800 ${Math.round(labelFont * 1.45)}px "Georgia", serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText('sCAMERA EDITION', totalW / 2, imgY + Math.round(labelFont * 1.25));
      }
      ctx.fillStyle = s.fg;
      ctx.font = `700 ${tinyFont}px "Courier New", monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const label = s.overlay === 'issue'
        ? `ISSUE NO. ${String(frameNumber).padStart(2, '0')}  —  ${filterName}`
        : `${filterName}  /  ${s.name}`;
      ctx.fillText(label, totalW / 2, imgY + imgH + padBot * 0.52);
    }
    ctx.restore();
  } else if (s.engine === 'digicam') {
    ctx.save();
    if (s.texture === 'scan' && !compact) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.14)';
      for (let y = imgY; y < imgY + imgH; y += 4) {
        ctx.fillRect(imgX, y, imgW, 1);
      }
    }
    if (s.overlay === 'letterbox') {
      const bar = Math.round(totalH * 0.11);
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, totalW, bar);
      ctx.fillRect(0, totalH - bar, totalW, bar);
      if (!compact) {
        ctx.fillStyle = '#f8f9fa';
        ctx.font = `500 ${labelFont}px "Georgia", serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`"${filterName} — Frame ${String(frameNumber).padStart(3, '0')}"`, totalW / 2, totalH - bar * 0.5);
      }
    } else if (!compact) {
      const m = Math.round(minDim * 0.045);
      ctx.font = `800 ${labelFont}px "Courier New", monospace`;
      // Top-left REC dot
      ctx.fillStyle = s.accent;
      ctx.beginPath();
      ctx.arc(imgX + m, imgY + m, Math.max(4, labelFont * 0.34), 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = s.fg;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(s.overlay === 'exif' ? `${filterName}  F2.8  1/125` : 'REC', imgX + m + labelFont * 0.7, imgY + m);
      ctx.textAlign = 'right';
      ctx.fillText(`00:${String(frameNumber).padStart(2, '0')}:24`, imgX + imgW - m * 0.6, imgY + m);
    } else {
      // Compact badge dot on preview thumbnail
      ctx.fillStyle = s.accent;
      ctx.beginPath();
      ctx.arc(imgX + 10, imgY + 10, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  } else if (s.engine === 'viewfinder') {
    ctx.save();
    ctx.strokeStyle = s.fg;
    ctx.globalAlpha = 0.7;
    ctx.lineWidth = Math.max(1, Math.round(minDim * 0.003));
    const inset = Math.round(minDim * 0.08);
    const bLen = Math.round(minDim * 0.08);
    // Optical corner framelines
    _cornerBrackets(ctx, imgX + inset, imgY + inset, imgW - inset * 2, imgH - inset * 2, bLen);

    if (s.overlay === 'prism') {
      const r = Math.round(minDim * 0.11);
      ctx.beginPath();
      ctx.arc(totalW / 2, totalH / 2, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(totalW / 2 - r, totalH / 2);
      ctx.lineTo(totalW / 2 + r, totalH / 2);
      ctx.stroke();
    } else if (s.overlay === 'telemetry' || s.overlay === 'gridev') {
      ctx.beginPath();
      ctx.moveTo(totalW / 2 - bLen * 0.5, totalH / 2);
      ctx.lineTo(totalW / 2 + bLen * 0.5, totalH / 2);
      ctx.moveTo(totalW / 2, totalH / 2 - bLen * 0.5);
      ctx.lineTo(totalW / 2, totalH / 2 + bLen * 0.5);
      ctx.stroke();
    }

    if (!compact) {
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = s.accent;
      ctx.font = `700 ${tinyFont}px "Courier New", monospace`;
      ctx.textAlign = 'left';
      ctx.fillText(`${s.name}  •  1/250  F2.0`, imgX + inset, totalH - inset * 0.65);
    }
    ctx.restore();
  } else if (s.engine === 'postcard') {
    ctx.save();
    if (s.overlay === 'airmail') {
      const stripeW = Math.max(6, Math.round(minDim * 0.035));
      for (let x = 0; x < totalW; x += stripeW * 2) {
        ctx.fillStyle = (Math.floor(x / (stripeW * 2)) % 2 === 0) ? s.accent : s.secondary;
        ctx.fillRect(x, 0, stripeW, Math.max(3, Math.round(padTop * 0.28)));
        ctx.fillRect(x, totalH - Math.max(3, Math.round(padTop * 0.28)), stripeW, Math.max(3, Math.round(padTop * 0.28)));
      }
    } else if (s.overlay === 'corners') {
      ctx.fillStyle = s.fg;
      const c = Math.max(8, Math.round(minDim * 0.055));
      _photoCorner(ctx, imgX, imgY, c, 1, 1);
      _photoCorner(ctx, imgX + imgW, imgY, c, -1, 1);
      _photoCorner(ctx, imgX, imgY + imgH, c, 1, -1);
      _photoCorner(ctx, imgX + imgW, imgY + imgH, c, -1, -1);
    } else if (s.overlay === 'tape') {
      ctx.fillStyle = 'rgba(244, 224, 178, 0.78)';
      ctx.fillRect(totalW * 0.38, Math.max(0, imgY - minDim * 0.025), totalW * 0.24, Math.max(4, minDim * 0.045));
    }
    if (!compact) {
      ctx.fillStyle = s.fg;
      ctx.font = `700 ${tinyFont}px "Georgia", serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(`POSTCARD • ${s.name}`, imgX, imgY + imgH + padBot * 0.52);
      ctx.textAlign = 'right';
      ctx.fillStyle = s.accent;
      ctx.fillText(`AIR MAIL #${String(frameNumber).padStart(3, '0')}`, imgX + imgW, imgY + imgH + padBot * 0.52);
    }
    ctx.restore();
  } else if (s.engine === 'darkroom') {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth = Math.max(1, Math.round(minDim * 0.004));
    ctx.strokeRect(imgX, imgY, imgW, imgH);
    if (!compact) {
      ctx.fillStyle = s.accent;
      ctx.font = `700 ${tinyFont}px "Courier New", monospace`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(`PROOF // ${filterName} // ${String(frameNumber).padStart(2, '0')}A`, imgX, imgY + imgH + padBot * 0.55);
    }
    ctx.restore();
  } else if (s.engine === 'modern') {
    ctx.save();
    if (s.overlay === 'neon') {
      ctx.shadowColor = s.accent;
      ctx.shadowBlur = compact ? 5 : 18;
      ctx.strokeStyle = s.accent;
      ctx.lineWidth = Math.max(1.5, Math.round(minDim * 0.006));
      traceAperturePath(ctx, s, imgX, imgY, imgW, imgH);
      ctx.stroke();
    } else if (s.overlay === 'pill' && !compact) {
      const pw = Math.round(totalW * 0.42);
      const ph = Math.round(padBot * 0.54);
      const px = (totalW - pw) / 2;
      const py = imgY + imgH + (padBot - ph) * 0.5;
      ctx.fillStyle = s.accent;
      _roundRect(ctx, px, py, pw, ph, ph / 2);
      ctx.fill();
      ctx.fillStyle = '#0d0c0b';
      ctx.font = `800 ${tinyFont}px "Courier New", monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${filterName} • #${frameNumber}`, totalW / 2, py + ph / 2);
    }
    ctx.restore();
  } else if (s.engine === 'geometric') {
    ctx.save();
    ctx.strokeStyle = s.accent;
    ctx.lineWidth = Math.max(1, Math.round(minDim * 0.005));
    traceAperturePath(ctx, s, imgX, imgY, imgW, imgH);
    ctx.stroke();
    if (!compact) {
      ctx.fillStyle = s.fg;
      ctx.font = `700 ${tinyFont}px "Courier New", monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${s.name}  •  ${filterName}`, totalW / 2, imgY + imgH + padBot * 0.52);
    }
    ctx.restore();
  }
}

function _fillOutsideAperture(ctx, totalW, totalH, style, imgX, imgY, imgW, imgH) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, totalW, totalH);
  // Trace counter-clockwise or use evenodd
  const ov = style.overlay;
  if (style.engine === 'geometric' && ov === 'circle') {
    const r = Math.min(imgW, imgH) * 0.48;
    ctx.arc(imgX + imgW / 2, imgY + imgH / 2, r, 0, Math.PI * 2, true);
  } else if (style.engine === 'geometric' && ov === 'oval') {
    ctx.ellipse(imgX + imgW / 2, imgY + imgH / 2, imgW * 0.46, imgH * 0.48, 0, 0, Math.PI * 2, true);
  } else if (style.engine === 'geometric' && ov === 'arch') {
    const archR = imgW * 0.5;
    ctx.moveTo(imgX, imgY + imgH);
    ctx.lineTo(imgX + imgW, imgY + imgH);
    ctx.lineTo(imgX + imgW, imgY + archR);
    ctx.arc(imgX + archR, imgY + archR, archR, 0, Math.PI, true);
    ctx.closePath();
  } else {
    const rad = style.radius ? Math.min(imgW, imgH) * style.radius : 0;
    if (rad > 0) {
      _roundRectHole(ctx, imgX, imgY, imgW, imgH, rad);
    } else {
      ctx.moveTo(imgX, imgY);
      ctx.lineTo(imgX, imgY + imgH);
      ctx.lineTo(imgX + imgW, imgY + imgH);
      ctx.lineTo(imgX + imgW, imgY);
      ctx.closePath();
    }
  }
  ctx.fill('evenodd');
  ctx.restore();
}

function _clipOutsideAperture(ctx, totalW, totalH, style, imgX, imgY, imgW, imgH) {
  ctx.beginPath();
  ctx.rect(0, 0, totalW, totalH);
  ctx.moveTo(imgX, imgY);
  ctx.lineTo(imgX, imgY + imgH);
  ctx.lineTo(imgX + imgW, imgY + imgH);
  ctx.lineTo(imgX + imgW, imgY);
  ctx.closePath();
  ctx.clip('evenodd');
}

function _cornerBrackets(ctx, x, y, w, h, len) {
  ctx.beginPath();
  ctx.moveTo(x, y + len); ctx.lineTo(x, y); ctx.lineTo(x + len, y);
  ctx.moveTo(x + w - len, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + len);
  ctx.moveTo(x, y + h - len); ctx.lineTo(x, y + h); ctx.lineTo(x + len, y + h);
  ctx.moveTo(x + w - len, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y + h - len);
  ctx.stroke();
}

function _photoCorner(ctx, cx, cy, size, dx, dy) {
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + size * dx, cy);
  ctx.lineTo(cx, cy + size * dy);
  ctx.closePath();
  ctx.fill();
}

/**
 * Renders the final filtered + stamped + styled image and returns { blob, thumbBlob, width, height }.
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
  styleObj,
  frameNumber,
}) {
  const style = styleObj || getStyleById(frameStyle || 'none');
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

  const padX = Math.round(width * (style.pad || 0));
  const padTop = Math.round(height * (style.pad || 0));
  const padBot = Math.round(height * (style.chin ?? style.pad ?? 0));
  const finalW = width + padX * 2;
  const finalH = height + padTop + padBot;

  const out = document.createElement('canvas');
  out.width = finalW;
  out.height = finalH;
  const ctx = out.getContext('2d');

  renderStyleLayer(ctx, finalW, finalH, glCanvas, style, {
    filterName: filter.name,
    frameNumber,
    dateStampText: formatDateStamp(dateStampMode),
    compact: false,
  });

  const blob = await canvasToBlob(out, 'image/jpeg', 0.92);

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

function _roundRectHole(ctx, x, y, w, h, r) {
  ctx.moveTo(x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.lineTo(x, y + h - r);
  ctx.quadraticCurveTo(x, y + h, x + r, y + h);
  ctx.lineTo(x + w - r, y + h);
  ctx.quadraticCurveTo(x + w, y + h, x + w, y + h - r);
  ctx.lineTo(x + w, y + r);
  ctx.quadraticCurveTo(x + w, y, x + w - r, y);
  ctx.closePath();
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}
