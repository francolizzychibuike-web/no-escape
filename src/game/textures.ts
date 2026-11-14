/**
 * NO ESCAPE - Procedural PBR Canvas Textures
 * High-definition procedural textures rendered on HTML5 2D Canvas.
 * Zero external file dependencies - 100% reliable, zero 404s.
 */

import * as THREE from 'three';

class TextureGenerator {
  private cache: Map<string, THREE.CanvasTexture> = new Map();

  // Helper to configure procedural textures
  private setupTexture(canvas: HTMLCanvasElement, isColor: boolean = true): THREE.CanvasTexture {
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    if (isColor) {
      texture.colorSpace = THREE.SRGBColorSpace;
    }
    return texture;
  }

  /**
   * Industrial Worn Concrete Texture (Decaying bunker walls & floors)
   */
  public getConcreteTexture(): THREE.CanvasTexture {
    if (this.cache.has('concrete')) return this.cache.get('concrete')!;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Base concrete gray
    ctx.fillStyle = '#26292b';
    ctx.fillRect(0, 0, 512, 512);

    // Noise speckles & grunge
    for (let i = 0; i < 40000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const brightness = Math.floor(25 + Math.random() * 35);
      ctx.fillStyle = `rgba(${brightness}, ${brightness + 2}, ${brightness + 4}, 0.25)`;
      ctx.fillRect(x, y, 2, 2);
    }

    // Cracks
    ctx.strokeStyle = 'rgba(10, 10, 12, 0.6)';
    ctx.lineWidth = 1.5;
    for (let c = 0; c < 8; c++) {
      let cx = Math.random() * 512;
      let cy = Math.random() * 512;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      for (let s = 0; s < 12; s++) {
        cx += (Math.random() - 0.5) * 40;
        cy += (Math.random() - 0.5) * 40;
        ctx.lineTo(cx, cy);
      }
      ctx.stroke();
    }

    // Grunge stains
    for (let g = 0; g < 15; g++) {
      const gx = Math.random() * 512;
      const gy = Math.random() * 512;
      const grad = ctx.createRadialGradient(gx, gy, 10, gx, gy, 60 + Math.random() * 40);
      grad.addColorStop(0, 'rgba(12, 14, 15, 0.45)');
      grad.addColorStop(1, 'rgba(12, 14, 15, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(gx, gy, 80, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = this.setupTexture(canvas, true);
    this.cache.set('concrete', tex);
    return tex;
  }

  /**
   * Rusty Iron Grate Texture (Trap House floors & moving platforms)
   */
  public getMetalGrateTexture(): THREE.CanvasTexture {
    if (this.cache.has('metal_grate')) return this.cache.get('metal_grate')!;

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#1e1c1b';
    ctx.fillRect(0, 0, 256, 256);

    // Cross-hatch diamond grates
    ctx.strokeStyle = '#3d3835';
    ctx.lineWidth = 3;
    const step = 32;
    for (let x = -256; x < 512; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 256, 256);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x + 256, 0);
      ctx.lineTo(x, 256);
      ctx.stroke();
    }

    // Rust oxidation spots
    for (let r = 0; r < 25; r++) {
      const rx = Math.random() * 256;
      const ry = Math.random() * 256;
      const rustGrad = ctx.createRadialGradient(rx, ry, 2, rx, ry, 25);
      rustGrad.addColorStop(0, 'rgba(120, 48, 20, 0.55)');
      rustGrad.addColorStop(1, 'rgba(80, 30, 15, 0)');
      ctx.fillStyle = rustGrad;
      ctx.beginPath();
      ctx.arc(rx, ry, 25, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = this.setupTexture(canvas, true);
    this.cache.set('metal_grate', tex);
    return tex;
  }

  /**
   * Hazard Caution Stripes (For moving traps, crushers, and pit edges)
   */
  public getHazardTexture(): THREE.CanvasTexture {
    if (this.cache.has('hazard')) return this.cache.get('hazard')!;

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#a88914';
    ctx.fillRect(0, 0, 256, 256);

    ctx.fillStyle = '#181615';
    const stripeW = 40;
    for (let x = -256; x < 512; x += stripeW * 2) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + stripeW, 0);
      ctx.lineTo(x + stripeW - 256, 256);
      ctx.lineTo(x - 256, 256);
      ctx.closePath();
      ctx.fill();
    }

    const tex = this.setupTexture(canvas, true);
    this.cache.set('hazard', tex);
    return tex;
  }

  /**
   * Nightmare Void Texture (Pulsating veins, deep dark red/black)
   */
  public getNightmareTexture(): THREE.CanvasTexture {
    if (this.cache.has('nightmare')) return this.cache.get('nightmare')!;

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#120406';
    ctx.fillRect(0, 0, 256, 256);

    // Glowing organic veins
    ctx.strokeStyle = 'rgba(180, 20, 40, 0.4)';
    ctx.lineWidth = 2;
    for (let v = 0; v < 12; v++) {
      let vx = Math.random() * 256;
      let vy = Math.random() * 256;
      ctx.beginPath();
      ctx.moveTo(vx, vy);
      for (let s = 0; s < 8; s++) {
        vx += (Math.random() - 0.5) * 50;
        vy += (Math.random() - 0.5) * 50;
        ctx.lineTo(vx, vy);
      }
      ctx.stroke();
    }

    const tex = this.setupTexture(canvas, true);
    this.cache.set('nightmare', tex);
    return tex;
  }

  /**
   * Bump Map for surface roughness
   */
  public getGenericBumpMap(): THREE.CanvasTexture {
    if (this.cache.has('bump')) return this.cache.get('bump')!;

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, 256, 256);

    for (let i = 0; i < 20000; i++) {
      const v = Math.floor(Math.random() * 256);
      ctx.fillStyle = `rgb(${v}, ${v}, ${v})`;
      ctx.fillRect(Math.random() * 256, Math.random() * 256, 1, 1);
    }

    const tex = this.setupTexture(canvas, false);
    this.cache.set('bump', tex);
    return tex;
  }
}

export const textures = new TextureGenerator();
