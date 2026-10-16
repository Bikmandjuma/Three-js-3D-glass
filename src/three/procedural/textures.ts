/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';

// Texture cache to prevent redundant Canvas allocations
const textureCache: Record<string, THREE.CanvasTexture> = {};

/**
 * Procedural speckled dark peat and potting loam texture
 */
export function getSoilTexture(): THREE.CanvasTexture {
  if (textureCache['soil']) return textureCache['soil'];

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Base rich dark earth
  ctx.fillStyle = '#261a12';
  ctx.fillRect(0, 0, 512, 512);

  // Layered soil grain & organic flecks
  for (let i = 0; i < 15000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const radius = Math.random() * 2.2 + 0.4;
    const tone = Math.random();

    if (tone < 0.4) {
      ctx.fillStyle = `rgba(18, 12, 8, ${0.4 + Math.random() * 0.4})`; // dark humus
    } else if (tone < 0.75) {
      ctx.fillStyle = `rgba(64, 42, 28, ${0.3 + Math.random() * 0.3})`; // brown loam
    } else if (tone < 0.93) {
      ctx.fillStyle = `rgba(46, 56, 32, ${0.2 + Math.random() * 0.3})`; // micro-moss greenish tinge
    } else {
      ctx.fillStyle = `rgba(180, 165, 140, ${0.25 + Math.random() * 0.35})`; // perlite / sand specks
    }

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache['soil'] = texture;
  return texture;
}

/**
 * High-frequency bump map for soil relief
 */
export function getSoilBumpTexture(): THREE.CanvasTexture {
  if (textureCache['soilBump']) return textureCache['soilBump'];

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 8000; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const val = Math.floor(Math.random() * 255);
    const rad = Math.random() * 2.5 + 0.5;
    ctx.fillStyle = `rgb(${val}, ${val}, ${val})`;
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  textureCache['soilBump'] = texture;
  return texture;
}

/**
 * Turned dark walnut / teak wood grain texture
 */
export function getWoodGrainTexture(): THREE.CanvasTexture {
  if (textureCache['wood']) return textureCache['wood'];

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Base warm walnut
  ctx.fillStyle = '#3a2312';
  ctx.fillRect(0, 0, 512, 512);

  // Wood rings and elongated fibers
  for (let y = 0; y < 512; y++) {
    const wave = Math.sin(y * 0.05) * 8 + Math.sin(y * 0.12) * 4;
    const darkness = Math.sin((y + wave) * 0.1) * 0.35 + 0.5;
    const r = Math.floor(45 * darkness + 25);
    const g = Math.floor(28 * darkness + 15);
    const b = Math.floor(16 * darkness + 8);
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.fillRect(0, y, 512, 1);
  }

  // Vertical wood striations
  ctx.fillStyle = 'rgba(20, 10, 5, 0.08)';
  for (let i = 0; i < 300; i++) {
    const x = Math.random() * 512;
    const w = Math.random() * 2 + 1;
    ctx.fillRect(x, 0, w, 512);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache['wood'] = texture;
  return texture;
}

/**
 * Organic leaf texture with central midrib and radiating secondary veins
 */
export function getLeafVeinTexture(tint: string = '#2d6b38'): THREE.CanvasTexture {
  const key = `leaf_${tint}`;
  if (textureCache[key]) return textureCache[key];

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Leaf gradient blade
  const grad = ctx.createLinearGradient(0, 0, 256, 0);
  grad.addColorStop(0, '#1d4825');
  grad.addColorStop(0.5, tint);
  grad.addColorStop(1, '#1d4825');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 512);

  // Subtle lighter midrib
  ctx.strokeStyle = '#6ab875';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(128, 512);
  ctx.quadraticCurveTo(128, 256, 128, 0);
  ctx.stroke();

  // Lateral veins branching off midrib
  ctx.strokeStyle = 'rgba(125, 200, 140, 0.35)';
  ctx.lineWidth = 1.5;
  for (let y = 50; y < 490; y += 28) {
    // Left branch
    ctx.beginPath();
    ctx.moveTo(128, y);
    ctx.quadraticCurveTo(70, y - 18, 15, y - 35);
    ctx.stroke();

    // Right branch
    ctx.beginPath();
    ctx.moveTo(128, y);
    ctx.quadraticCurveTo(186, y - 18, 241, y - 35);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache[key] = texture;
  return texture;
}

/**
 * Droplet condensation pattern for humid glass
 */
export function getCondensationTexture(): THREE.CanvasTexture {
  if (textureCache['condensation']) return textureCache['condensation'];

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, 512, 512);

  // Micro droplets
  for (let i = 0; i < 1800; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const r = Math.random() * 2.5 + 0.8;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    grad.addColorStop(0.7, 'rgba(230, 245, 255, 0.5)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Occasional larger teardrop runs
  for (let j = 0; j < 35; j++) {
    const x = Math.random() * 512;
    const y = Math.random() * 400;
    const len = Math.random() * 40 + 15;
    const r = Math.random() * 3 + 2.5;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = r * 0.8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (Math.random() - 0.5) * 4, y + len);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    ctx.arc(x, y + len, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 3);
  textureCache['condensation'] = texture;
  return texture;
}

/**
 * Procedural celestial starry night sky texture
 */
export function getStarfieldTexture(): THREE.CanvasTexture {
  if (textureCache['starfield']) return textureCache['starfield'];

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#05070e';
  ctx.fillRect(0, 0, 1024, 512);

  // Soft purple/cyan cosmic nebula haze
  const nebula = ctx.createRadialGradient(400, 200, 10, 400, 200, 300);
  nebula.addColorStop(0, 'rgba(35, 20, 60, 0.35)');
  nebula.addColorStop(0.5, 'rgba(15, 30, 50, 0.2)');
  nebula.addColorStop(1, 'rgba(5, 7, 14, 0)');
  ctx.fillStyle = nebula;
  ctx.fillRect(0, 0, 1024, 512);

  // Random stars
  for (let i = 0; i < 900; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 512;
    const r = Math.random() * 1.3 + 0.3;
    const brightness = Math.random();
    ctx.fillStyle = brightness > 0.8 ? '#ffffff' : brightness > 0.5 ? '#b8d6ff' : '#ffe4b5';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache['starfield'] = texture;
  return texture;
}
