/**
 * Satellite Radiometric & Infrared Image Processing Engine
 * Converts Infrared (NIR/SWIR/CIR/Thermal) to True-Color Photorealistic RGB
 * and computes Quantitative Multi-Temporal Change Metrics
 */

import { IRColormap, IRConversionSettings, QuantitativeChangeReport } from '../types';

/**
 * Colormap lookup table generators (256 RGB entries)
 */
function createColormapLut(colormap: IRColormap): Uint8Array {
  const lut = new Uint8Array(256 * 3);

  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    let r = 0, g = 0, b = 0;

    switch (colormap) {
      case 'ironbow': {
        // FLIR Ironbow: Deep violet -> blue -> magenta -> red -> orange -> yellow -> white
        if (t < 0.2) {
          r = Math.floor(t / 0.2 * 40);
          g = 0;
          b = Math.floor(t / 0.2 * 120);
        } else if (t < 0.4) {
          const f = (t - 0.2) / 0.2;
          r = Math.floor(40 + f * 150);
          g = 0;
          b = Math.floor(120 - f * 80);
        } else if (t < 0.7) {
          const f = (t - 0.4) / 0.3;
          r = Math.floor(190 + f * 65);
          g = Math.floor(f * 140);
          b = Math.floor(40 - f * 40);
        } else if (t < 0.9) {
          const f = (t - 0.7) / 0.2;
          r = 255;
          g = Math.floor(140 + f * 95);
          b = Math.floor(f * 50);
        } else {
          const f = (t - 0.9) / 0.1;
          r = 255;
          g = 235 + Math.floor(f * 20);
          b = 50 + Math.floor(f * 205);
        }
        break;
      }

      case 'inferno': {
        // Perceptually uniform Inferno
        r = Math.floor(Math.min(255, Math.max(0, 255 * (1.1 * t + 0.1 * Math.sin(t * Math.PI)))));
        g = Math.floor(Math.min(255, Math.max(0, 255 * Math.pow(t, 2) * 1.3)));
        b = Math.floor(Math.min(255, Math.max(0, 255 * (Math.sin(t * Math.PI * 0.8) * 0.7 + (t > 0.8 ? (t - 0.8) * 5 : 0)))));
        break;
      }

      case 'viridis': {
        // Matplotlib Viridis: Purple -> Teal -> Green -> Yellow
        r = Math.floor(Math.max(0, Math.min(255, 255 * (-0.5 * t * t + 1.2 * t))));
        g = Math.floor(Math.max(0, Math.min(255, 255 * (Math.sin(t * Math.PI * 0.9) * 0.85 + (t > 0.5 ? 0.3 : 0)))));
        b = Math.floor(Math.max(0, Math.min(255, 255 * (0.8 - 0.7 * t + (t < 0.3 ? 0.3 : 0)))));
        break;
      }

      case 'rainbow_jet': {
        // Traditional Jet Colormap
        const v = t * 4;
        r = Math.floor(Math.max(0, Math.min(255, 255 * Math.min(v - 1.5, 4.5 - v))));
        g = Math.floor(Math.max(0, Math.min(255, 255 * Math.min(v - 0.5, 3.5 - v))));
        b = Math.floor(Math.max(0, Math.min(255, 255 * Math.min(v + 0.5, 2.5 - v))));
        break;
      }

      case 'turbo': {
        // Google Turbo Colormap
        r = Math.floor(Math.max(0, Math.min(255, 255 * (0.1357 + t * (4.5874 + t * (-42.308 + t * (130.58 + t * (-150.56 + t * 58.13))))))));
        g = Math.floor(Math.max(0, Math.min(255, 255 * (0.0914 + t * (2.194 + t * (4.842 + t * (-14.18 + t * (4.27 + t * 2.82))))))));
        b = Math.floor(Math.max(0, Math.min(255, 255 * (0.1067 + t * (12.59 + t * (-60.18 + t * (109.07 + t * (-88.5 + t * 27.05))))))));
        break;
      }

      case 'thermal_anomaly': {
        // Thermal hotspot highlight: Low = Dark slate, High = Glowing Fire/Plasma
        if (t < 0.65) {
          const dark = t / 0.65;
          r = Math.floor(20 + dark * 40);
          g = Math.floor(25 + dark * 45);
          b = Math.floor(35 + dark * 55);
        } else if (t < 0.85) {
          const f = (t - 0.65) / 0.2;
          r = Math.floor(180 + f * 75);
          g = Math.floor(40 + f * 90);
          b = 20;
        } else {
          const f = (t - 0.85) / 0.15;
          r = 255;
          g = Math.floor(130 + f * 125);
          b = Math.floor(f * 220);
        }
        break;
      }

      case 'swir_moisture': {
        // SWIR Burn / Moisture Composite
        if (t < 0.4) {
          r = 20;
          g = Math.floor(t / 0.4 * 180);
          b = Math.floor(t / 0.4 * 240);
        } else if (t < 0.7) {
          const f = (t - 0.4) / 0.3;
          r = Math.floor(f * 140);
          g = Math.floor(180 - f * 80);
          b = Math.floor(240 - f * 200);
        } else {
          const f = (t - 0.7) / 0.3;
          r = Math.floor(140 + f * 115);
          g = Math.floor(100 - f * 60);
          b = 40;
        }
        break;
      }

      case 'black_hot': {
        // Inverted grayscale
        const v = Math.floor((1 - t) * 255);
        r = v; g = v; b = v;
        break;
      }

      case 'white_hot':
      default: {
        const v = Math.floor(t * 255);
        r = v; g = v; b = v;
        break;
      }
    }

    lut[i * 3] = Math.max(0, Math.min(255, r));
    lut[i * 3 + 1] = Math.max(0, Math.min(255, g));
    lut[i * 3 + 2] = Math.max(0, Math.min(255, b));
  }

  return lut;
}

/**
 * Performs radiometric conversion on an HTMLImageElement or Canvas
 */
export async function convertIrImageToColor(
  imageSource: HTMLImageElement | string,
  settings: IRConversionSettings
): Promise<{
  convertedDataUrl: string;
  histogram: { r: number[]; g: number[]; b: number[] };
  processingTimeMs: number;
}> {
  const startTime = performance.now();

  // Load image if string dataUrl
  let img: HTMLImageElement;
  if (typeof imageSource === 'string') {
    img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = imageSource;
    });
  } else {
    img = imageSource;
  }

  const width = img.naturalWidth || img.width || 512;
  const height = img.naturalHeight || img.height || 512;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to acquire canvas 2D context');

  ctx.drawImage(img, 0, 0, width, height);
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const len = data.length;

  const histR = new Array(256).fill(0);
  const histG = new Array(256).fill(0);
  const histB = new Array(256).fill(0);

  const { colormap, gamma, chlorophyllBoost, hazeReduction } = settings;

  if (colormap === 'natural_truecolor') {
    // CIR False-Color (NIR=Red, Red=Green, Green=Blue) to True-Color Photorealistic RGB
    // In CIR: Vegetation is bright Red, Water is Dark Blue, Bare Soil is Gray/Tan.
    for (let i = 0; i < len; i += 4) {
      const nir = data[i];       // Red channel in CIR = NIR reflectance
      const red = data[i + 1];   // Green channel in CIR = Red reflectance
      const green = data[i + 2]; // Blue channel in CIR = Green reflectance

      // Compute Normalized Vegetation Index proxy
      const denom = nir + red;
      const ndvi = denom > 0 ? (nir - red) / denom : 0;

      let outR = 0, outG = 0, outB = 0;

      if (ndvi > 0.08) {
        // High NIR vegetative response -> Synthesize lush natural green foliage
        const vegStrength = Math.min(1.0, (ndvi - 0.08) / 0.5) * chlorophyllBoost;
        outR = Math.floor(red * 0.75 + green * 0.25 * (1 - vegStrength * 0.5));
        outG = Math.floor(Math.min(255, (nir * 0.85 + green * 0.35) * (0.8 + vegStrength * 0.5)));
        outB = Math.floor(green * 0.6 + red * 0.2);
      } else if (nir < 40 && red < 40 && green > 30) {
        // Deep water / aquatic body -> Natural deep oceanic cyan/blue
        outR = Math.floor(green * 0.2);
        outG = Math.floor(green * 0.7 + red * 0.3);
        outB = Math.floor(green * 1.3 + nir * 0.4);
      } else {
        // Soil, concrete, roads, urban fabric -> Natural earth tones & asphalt
        outR = Math.floor(red * 1.05 + green * 0.1);
        outG = Math.floor(red * 0.95 + green * 0.15);
        outB = Math.floor(green * 0.9 + red * 0.1);
      }

      // Haze reduction / dehazing stretch
      if (hazeReduction > 0) {
        const minVal = Math.min(outR, outG, outB);
        const hazeSubtract = minVal * (hazeReduction / 100) * 0.6;
        outR = Math.max(0, outR - hazeSubtract);
        outG = Math.max(0, outG - hazeSubtract);
        outB = Math.max(0, outB - hazeSubtract);
      }

      // Gamma correction
      if (gamma !== 1.0) {
        outR = Math.min(255, Math.floor(255 * Math.pow(outR / 255, 1 / gamma)));
        outG = Math.min(255, Math.floor(255 * Math.pow(outG / 255, 1 / gamma)));
        outB = Math.min(255, Math.floor(255 * Math.pow(outB / 255, 1 / gamma)));
      }

      data[i] = outR;
      data[i + 1] = outG;
      data[i + 2] = outB;

      histR[outR]++;
      histG[outG]++;
      histB[outB]++;
    }
  } else {
    // Thermal & Spectral Colormap Radiometric mapping
    const lut = createColormapLut(colormap);

    for (let i = 0; i < len; i += 4) {
      // Calculate luminance / radiometric radiance DN
      let val = Math.floor(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);

      // Apply Gamma
      if (gamma !== 1.0) {
        val = Math.min(255, Math.max(0, Math.floor(255 * Math.pow(val / 255, 1 / gamma))));
      }

      const outR = lut[val * 3];
      const outG = lut[val * 3 + 1];
      const outB = lut[val * 3 + 2];

      data[i] = outR;
      data[i + 1] = outG;
      data[i + 2] = outB;

      histR[outR]++;
      histG[outG]++;
      histB[outB]++;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  const convertedDataUrl = canvas.toDataURL('image/png');
  const processingTimeMs = Math.round(performance.now() - startTime);

  return {
    convertedDataUrl,
    histogram: { r: histR, g: histG, b: histB },
    processingTimeMs
  };
}

/**
 * Calculates exact mathematical change delta percentage and pixel confusion mask
 * between two multi-temporal satellite images
 */
export async function computeMultiTemporalChangePercentage(
  t1Source: string,
  t2Source: string,
  changeThreshold: number = 25
): Promise<{
  changePercentage: number;
  changedPixelCount: number;
  totalPixelCount: number;
  changeHeatmapUrl: string;
  breakdown: {
    vegetationLossPercentage: number;
    urbanExpansionPercentage: number;
    waterDeltaPercentage: number;
    otherChangePercentage: number;
  };
}> {
  const [img1, img2] = await Promise.all([
    loadImage(t1Source),
    loadImage(t2Source)
  ]);

  const width = Math.min(img1.naturalWidth || 512, img2.naturalWidth || 512);
  const height = Math.min(img1.naturalHeight || 512, img2.naturalHeight || 512);

  const canvas1 = document.createElement('canvas');
  canvas1.width = width;
  canvas1.height = height;
  const ctx1 = canvas1.getContext('2d')!;
  ctx1.drawImage(img1, 0, 0, width, height);
  const data1 = ctx1.getImageData(0, 0, width, height).data;

  const canvas2 = document.createElement('canvas');
  canvas2.width = width;
  canvas2.height = height;
  const ctx2 = canvas2.getContext('2d')!;
  ctx2.drawImage(img2, 0, 0, width, height);
  const data2 = ctx2.getImageData(0, 0, width, height).data;

  const outCanvas = document.createElement('canvas');
  outCanvas.width = width;
  outCanvas.height = height;
  const outCtx = outCanvas.getContext('2d')!;
  const outImgData = outCtx.createImageData(width, height);
  const outData = outImgData.data;

  const totalPixels = width * height;
  let changedPixels = 0;
  let vegLossPixels = 0;
  let urbanGrowthPixels = 0;
  let waterDeltaPixels = 0;

  for (let i = 0; i < data1.length; i += 4) {
    const r1 = data1[i], g1 = data1[i + 1], b1 = data1[i + 2];
    const r2 = data2[i], g2 = data2[i + 1], b2 = data2[i + 2];

    // Compute radiometric euclidean delta
    const diff = Math.sqrt(
      Math.pow(r2 - r1, 2) + 
      Math.pow(g2 - g1, 2) + 
      Math.pow(b2 - b1, 2)
    ) / 1.732; // normalized 0-255

    if (diff >= changeThreshold) {
      changedPixels++;

      // Classify semantic change direction
      // Vegetation loss: Greenness in T1 was higher than in T2
      const greenness1 = g1 - (r1 + b1) / 2;
      const greenness2 = g2 - (r2 + b2) / 2;
      const blueness1 = b1 - (r1 + g1) / 2;
      const blueness2 = b2 - (r2 + g2) / 2;

      if (greenness1 > 15 && greenness2 < 0) {
        // Vegetation Loss / Wildfire / Deforestation -> Neon Red (#f43f5e)
        vegLossPixels++;
        outData[i] = 244;
        outData[i + 1] = 63;
        outData[i + 2] = 94;
        outData[i + 3] = Math.min(230, Math.floor(diff * 2));
      } else if (blueness2 > 20 && blueness1 < 0) {
        // Water Inundation / Flood -> Neon Cyan (#06b6d4)
        waterDeltaPixels++;
        outData[i] = 6;
        outData[i + 1] = 182;
        outData[i + 2] = 212;
        outData[i + 3] = Math.min(230, Math.floor(diff * 2));
      } else if (r2 > 130 && g2 > 130 && b2 > 130 && (r1 < 100 || g1 < 100)) {
        // Urban / Impervious surface expansion -> Amber (#f59e0b)
        urbanGrowthPixels++;
        outData[i] = 245;
        outData[i + 1] = 158;
        outData[i + 2] = 11;
        outData[i + 3] = Math.min(230, Math.floor(diff * 2));
      } else {
        // General landscape transformation -> Purple (#a855f7)
        outData[i] = 168;
        outData[i + 1] = 85;
        outData[i + 2] = 247;
        outData[i + 3] = Math.min(200, Math.floor(diff * 1.8));
      }
    } else {
      // Unchanged background (subtle transparent slate)
      outData[i] = 0;
      outData[i + 1] = 0;
      outData[i + 2] = 0;
      outData[i + 3] = 0;
    }
  }

  outCtx.putImageData(outImgData, 0, 0);
  const changeHeatmapUrl = outCanvas.toDataURL('image/png');

  const changePercentage = parseFloat(((changedPixels / totalPixels) * 100).toFixed(2));
  const vegetationLossPercentage = parseFloat(((vegLossPixels / totalPixels) * 100).toFixed(2));
  const urbanExpansionPercentage = parseFloat(((urbanGrowthPixels / totalPixels) * 100).toFixed(2));
  const waterDeltaPercentage = parseFloat(((waterDeltaPixels / totalPixels) * 100).toFixed(2));
  const otherChangePercentage = parseFloat(Math.max(0, changePercentage - vegetationLossPercentage - urbanExpansionPercentage - waterDeltaPercentage).toFixed(2));

  return {
    changePercentage,
    changedPixelCount: changedPixels,
    totalPixelCount: totalPixels,
    changeHeatmapUrl,
    breakdown: {
      vegetationLossPercentage,
      urbanExpansionPercentage,
      waterDeltaPercentage,
      otherChangePercentage
    }
  };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}
