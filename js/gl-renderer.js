/**
 * Real-time WebGL retro film shader renderer with Canvas2D fallback.
 * Uses identical shader math for live viewfinder and full-resolution capture.
 */

const VERTEX_SHADER = `
attribute vec2 a_pos;
varying vec2 v_uv;

void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision highp float;

varying vec2 v_uv;

uniform sampler2D u_tex;
uniform vec2 u_texSize;
uniform vec2 u_outSize;
uniform vec4 u_crop; // u0, v0, u1, v1
uniform float u_mirror;

uniform float u_exposure;
uniform float u_contrast;
uniform float u_saturation;
uniform float u_warmth;
uniform float u_tint;
uniform float u_fade;
uniform vec3 u_shadowColor;
uniform vec3 u_highlightColor;
uniform mat3 u_colorMatrix;

uniform float u_grain;
uniform float u_grainSize;
uniform float u_vignette;
uniform float u_aberration;
uniform float u_halation;
uniform vec3 u_halationColor;
uniform float u_softness;
uniform float u_sepia;
uniform float u_digitalCrunch;

uniform float u_lightLeak;
uniform float u_lightLeakMode;
uniform float u_lightLeakSeed;
uniform float u_time;

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

vec2 mapUV(vec2 uv) {
  float ux = mix(uv.x, 1.0 - uv.x, u_mirror);
  return vec2(
    mix(u_crop.x, u_crop.z, ux),
    mix(u_crop.y, u_crop.w, uv.y)
  );
}

vec3 sampleClamped(vec2 uv) {
  return texture2D(u_tex, clamp(uv, 0.001, 0.999)).rgb;
}

void main() {
  vec2 uv = v_uv;
  vec2 centerOffset = uv - vec2(0.5);
  float distSq = dot(centerOffset, centerOffset);

  // Chromatic aberration (radial R/B shift)
  vec2 caShift = centerOffset * u_aberration * (0.4 + distSq * 2.4);
  vec2 uvR = mapUV(uv + caShift);
  vec2 uvG = mapUV(uv);
  vec2 uvB = mapUV(uv - caShift);

  vec3 col;
  col.r = sampleClamped(uvR).r;
  col.g = sampleClamped(uvG).g;
  col.b = sampleClamped(uvB).b;

  // Vintage lens softness & 4-tap neighbor sampling for halation/crunch
  vec2 texel = 1.0 / max(u_texSize, vec2(1.0));
  vec2 blurStep = texel * (1.5 + u_softness * 2.5);
  vec3 n1 = sampleClamped(uvG + vec2(blurStep.x, blurStep.y));
  vec3 n2 = sampleClamped(uvG + vec2(-blurStep.x, blurStep.y));
  vec3 n3 = sampleClamped(uvG + vec2(blurStep.x, -blurStep.y));
  vec3 n4 = sampleClamped(uvG + vec2(-blurStep.x, -blurStep.y));
  vec3 softAvg = (n1 + n2 + n3 + n4) * 0.25;

  if (u_softness > 0.001) {
    col = mix(col, softAvg, u_softness * 0.42);
  }

  // Early 2003 CCD digicam crisp sharpening + slight quantization feel
  if (u_digitalCrunch > 0.001) {
    vec3 sharp = col + (col - softAvg) * 0.55 * u_digitalCrunch;
    col = mix(col, sharp, u_digitalCrunch);
  }

  // Highlight halation / film base scatter bloom
  if (u_halation > 0.001) {
    vec2 halStep = texel * 5.0;
    vec3 h1 = sampleClamped(uvG + vec2(halStep.x, 0.0));
    vec3 h2 = sampleClamped(uvG - vec2(halStep.x, 0.0));
    vec3 h3 = sampleClamped(uvG + vec2(0.0, halStep.y));
    vec3 h4 = sampleClamped(uvG - vec2(0.0, halStep.y));
    vec3 hAvg = (softAvg + h1 + h2 + h3 + h4) * 0.2;
    float hLuma = dot(hAvg, vec3(0.299, 0.587, 0.114));
    float bloomMask = smoothstep(0.68, 0.99, hLuma);
    col += u_halationColor * bloomMask * u_halation * 0.48;
  }

  // Exposure compensation
  col *= pow(2.0, u_exposure);

  // White balance warmth & tint
  col.r *= (1.0 + u_warmth * 0.42);
  col.b *= (1.0 - u_warmth * 0.42);
  col.g *= (1.0 + u_tint * 0.28);

  // Film dye crosstalk matrix
  col = clamp(u_colorMatrix * col, 0.0, 1.5);

  // S-curve contrast & lifted black fade
  col = clamp(col, 0.0, 1.0);
  col = (col - 0.5) * u_contrast + 0.5;
  col = clamp(col, 0.0, 1.0);
  col = mix(col, pow(col, vec3(0.95)), 0.2);

  // Shadow & highlight color split-toning
  float luma = dot(col, vec3(0.299, 0.587, 0.114));
  float shadowWeight = pow(1.0 - luma, 2.0);
  float highWeight = pow(luma, 1.5);
  col += u_shadowColor * shadowWeight;
  col *= mix(vec3(1.0), u_highlightColor, highWeight);

  // Lifted film black point (fade)
  col = col * (1.0 - u_fade) + u_fade * 0.85;

  // Saturation
  float gray = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(vec3(gray), col, u_saturation);

  // Antique sepia toning
  if (u_sepia > 0.001) {
    vec3 sep = vec3(
      dot(col, vec3(0.393, 0.769, 0.189)),
      dot(col, vec3(0.349, 0.686, 0.168)),
      dot(col, vec3(0.272, 0.534, 0.131))
    );
    col = mix(col, sep, u_sepia);
  }

  // Mild 8-bit CCD banding feel for 2003 digicam
  if (u_digitalCrunch > 0.001) {
    float levels = mix(255.0, 72.0, u_digitalCrunch * 0.45);
    col = floor(col * levels + 0.5) / levels;
  }

  // Analog light leaks
  if (u_lightLeak > 0.001 && u_lightLeakMode > 0.5) {
    float s = u_lightLeakSeed;
    vec2 leakCenter1 = vec2(0.06 + 0.1 * sin(s * 3.1), 0.18 + 0.65 * fract(s * 1.73));
    vec2 leakCenter2 = vec2(0.94 - 0.1 * cos(s * 2.3), 0.25 + 0.55 * fract(s * 2.91));
    float d1 = length((uv - leakCenter1) * vec2(1.4, 0.55));
    float d2 = length((uv - leakCenter2) * vec2(1.2, 0.65));

    vec3 leakCol = vec3(0.0);
    if (u_lightLeakMode < 1.5) {
      // Mode 1: Warm amber-orange edge burn
      float g1 = exp(-d1 * 3.4);
      float g2 = exp(-d2 * 4.5) * 0.45;
      leakCol = vec3(1.0, 0.42, 0.08) * g1 + vec3(1.0, 0.72, 0.22) * g2;
    } else if (u_lightLeakMode < 2.5) {
      // Mode 2: Magenta / crimson film flare
      float g1 = exp(-d1 * 3.8) * 0.55;
      float g2 = exp(-d2 * 3.1);
      leakCol = vec3(0.95, 0.14, 0.42) * g2 + vec3(1.0, 0.45, 0.18) * g1;
    } else {
      // Mode 3: Golden corner wash
      float corner = exp(-length((uv - vec2(fract(s * 7.1) > 0.5 ? 0.02 : 0.98, 0.05)) * vec2(0.9, 1.1)) * 2.4);
      leakCol = vec3(1.0, 0.66, 0.24) * corner;
    }
    // Screen blend light leak
    vec3 scaledLeak = clamp(leakCol * u_lightLeak * 0.92, 0.0, 1.0);
    col = 1.0 - (1.0 - clamp(col, 0.0, 1.0)) * (1.0 - scaledLeak);
  }

  // Optical lens vignette
  float vig = smoothstep(0.18, 0.88, length(centerOffset) * 1.38);
  col *= 1.0 - vig * u_vignette;

  // Luma-weighted silver halide film grain
  if (u_grain > 0.001) {
    vec2 grainCoord = floor((uv * u_outSize) / max(u_grainSize, 1.0));
    float n = hash12(grainCoord + vec2(fract(u_time * 17.31) * 213.7, fract(u_time * 31.17) * 149.3)) - 0.5;
    float midWeight = 1.0 - abs(luma - 0.5) * 0.9;
    col += n * u_grain * (0.65 + 0.55 * midWeight);
  }

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;

export function computeCropRect(srcW, srcH, outW, outH, zoom = 1.0) {
  const safeSrcW = Math.max(1, srcW);
  const safeSrcH = Math.max(1, srcH);
  const safeOutW = Math.max(1, outW);
  const safeOutH = Math.max(1, outH);

  const srcAspect = safeSrcW / safeSrcH;
  const outAspect = safeOutW / safeOutH;

  let cropW = 1.0;
  let cropH = 1.0;

  if (srcAspect > outAspect) {
    cropW = outAspect / srcAspect;
  } else {
    cropH = srcAspect / outAspect;
  }

  const safeZoom = Math.max(1.0, zoom);
  cropW /= safeZoom;
  cropH /= safeZoom;

  return [
    0.5 - cropW * 0.5,
    0.5 - cropH * 0.5,
    0.5 + cropW * 0.5,
    0.5 + cropH * 0.5,
  ];
}

export class RetroRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = null;
    this.program = null;
    this.texture = null;
    this.uniforms = {};
    this.isWebGL = false;
    this.ctx2d = null;
    this._init();
  }

  _init() {
    const opts = {
      alpha: false,
      antialias: false,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance',
    };
    const gl = this.canvas.getContext('webgl', opts) || this.canvas.getContext('experimental-webgl', opts);
    if (!gl) {
      this.ctx2d = this.canvas.getContext('2d');
      return;
    }

    const vs = this._compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = this._compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vs || !fs) {
      this.ctx2d = this.canvas.getContext('2d');
      return;
    }

    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn('WebGL link failed, falling back to Canvas2D:', gl.getProgramInfoLog(program));
      this.ctx2d = this.canvas.getContext('2d');
      return;
    }

    gl.useProgram(program);

    // Fullscreen quad
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );
    const aPos = gl.getAttribLocation(program, 'a_pos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    // Source texture
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    const uniformNames = [
      'u_tex', 'u_texSize', 'u_outSize', 'u_crop', 'u_mirror',
      'u_exposure', 'u_contrast', 'u_saturation', 'u_warmth', 'u_tint', 'u_fade',
      'u_shadowColor', 'u_highlightColor', 'u_colorMatrix',
      'u_grain', 'u_grainSize', 'u_vignette', 'u_aberration', 'u_halation',
      'u_halationColor', 'u_softness', 'u_sepia', 'u_digitalCrunch',
      'u_lightLeak', 'u_lightLeakMode', 'u_lightLeakSeed', 'u_time',
    ];
    for (const name of uniformNames) {
      this.uniforms[name] = gl.getUniformLocation(program, name);
    }

    this.gl = gl;
    this.program = program;
    this.texture = texture;
    this.isWebGL = true;
  }

  _compileShader(gl, type, src) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.warn('Shader compile error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  render(source, sourceWidth, sourceHeight, options) {
    if (!source || sourceWidth <= 0 || sourceHeight <= 0) return;

    if (!this.isWebGL) {
      this._render2DFallback(source, sourceWidth, sourceHeight, options);
      return;
    }

    const gl = this.gl;
    const outW = this.canvas.width;
    const outH = this.canvas.height;
    gl.viewport(0, 0, outW, outH);
    gl.useProgram(this.program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    gl.uniform1i(this.uniforms.u_tex, 0);

    const crop = computeCropRect(sourceWidth, sourceHeight, outW, outH, options.zoom || 1.0);
    const p = options.filter.params;

    gl.uniform2f(this.uniforms.u_texSize, sourceWidth, sourceHeight);
    gl.uniform2f(this.uniforms.u_outSize, outW, outH);
    gl.uniform4f(this.uniforms.u_crop, crop[0], crop[1], crop[2], crop[3]);
    gl.uniform1f(this.uniforms.u_mirror, options.mirror ? 1.0 : 0.0);

    gl.uniform1f(this.uniforms.u_exposure, options.exposure ?? 0.0);
    gl.uniform1f(this.uniforms.u_contrast, p.contrast);
    gl.uniform1f(this.uniforms.u_saturation, p.saturation);
    gl.uniform1f(this.uniforms.u_warmth, p.warmth);
    gl.uniform1f(this.uniforms.u_tint, p.tint);
    gl.uniform1f(this.uniforms.u_fade, p.fade);
    gl.uniform3fv(this.uniforms.u_shadowColor, p.shadowColor);
    gl.uniform3fv(this.uniforms.u_highlightColor, p.highlightColor);
    gl.uniformMatrix3fv(this.uniforms.u_colorMatrix, false, new Float32Array(p.colorMatrix));

    const grainScale = options.grainIntensity ?? 1.0;
    const vigScale = options.vignetteIntensity ?? 1.0;

    gl.uniform1f(this.uniforms.u_grain, p.grain * grainScale);
    gl.uniform1f(this.uniforms.u_grainSize, p.grainSize);
    gl.uniform1f(this.uniforms.u_vignette, Math.min(0.95, p.vignette * vigScale));
    gl.uniform1f(this.uniforms.u_aberration, p.aberration);
    gl.uniform1f(this.uniforms.u_halation, p.halation);
    gl.uniform3fv(this.uniforms.u_halationColor, p.halationColor);
    gl.uniform1f(this.uniforms.u_softness, p.softness);
    gl.uniform1f(this.uniforms.u_sepia, p.sepia);
    gl.uniform1f(this.uniforms.u_digitalCrunch, p.digitalCrunch);

    gl.uniform1f(this.uniforms.u_lightLeak, options.lightLeakIntensity ?? 0.65);
    gl.uniform1f(this.uniforms.u_lightLeakMode, options.lightLeakMode ?? 0.0);
    gl.uniform1f(this.uniforms.u_lightLeakSeed, options.lightLeakSeed ?? 1.23);
    gl.uniform1f(this.uniforms.u_time, options.time ?? 0.0);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  _render2DFallback(source, sourceWidth, sourceHeight, options) {
    const ctx = this.ctx2d;
    if (!ctx) return;
    const outW = this.canvas.width;
    const outH = this.canvas.height;
    const crop = computeCropRect(sourceWidth, sourceHeight, outW, outH, options.zoom || 1.0);
    const sx = crop[0] * sourceWidth;
    const sy = crop[1] * sourceHeight;
    const sw = (crop[2] - crop[0]) * sourceWidth;
    const sh = (crop[3] - crop[1]) * sourceHeight;

    ctx.save();
    const p = options.filter.params;
    const brightness = Math.pow(2, options.exposure ?? 0) * 100;
    const contrast = p.contrast * 100;
    const saturate = p.saturation * 100;
    const sepia = (p.sepia + Math.max(0, p.warmth) * 1.2) * 100;
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturate}%) sepia(${Math.min(100, sepia)}%)`;
    if (options.mirror) {
      ctx.translate(outW, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(source, sx, sy, sw, sh, 0, 0, outW, outH);
    ctx.restore();
  }
}
