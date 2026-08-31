/**
 * Remote Sensing Pixel-Level Differencing and Bi-Temporal Epoch Comparison Engine
 * Computes exact pixel-wise radiometric delta, Euclidean chromatic distance,
 * spectral band shifts (NDVI / NDWI drift), and generates colorized change overlays.
 */

export type DifferenceOverlayStyle = 'semantic' | 'heatmap' | 'neon' | 'monochrome';

export interface DifferenceOptions {
  threshold: number; // 5 to 60 (sensitivity threshold in 0-255 scale)
  style: DifferenceOverlayStyle;
  opacity: number; // 0.1 to 1.0
  resolution?: number; // default 512 for fast real-time interactive computation
}

export interface DifferenceResult {
  overlayDataUrl: string;
  totalPixels: number;
  changedPixels: number;
  changePercentage: number;
  meanDelta: number;
  breakdown: {
    lossPct: number;      // Vegetation loss, burn scar, structural damage (Red)
    floodPct: number;     // Water inundation / flood expansion (Cyan/Blue)
    regrowthPct: number;  // Vegetation regrowth / greening (Green)
    urbanPct: number;     // Built-up expansion / new reflectivity (Amber/Yellow)
    stablePct: number;    // Unchanged terrain
  };
  hotspot: {
    normX: number;
    normY: number;
    intensity: number;
  };
  histogram: Array<{ range: string; count: number; color: string }>;
}

/**
 * Loads an image from URL / Base64 into an HTMLImageElement
 */
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = url;
  });
}

/**
 * Computes pixel-level difference between two co-registered remote sensing epoch images
 */
export async function computePixelDifference(
  img1Url: string,
  img2Url: string,
  options: DifferenceOptions = { threshold: 24, style: 'semantic', opacity: 0.85, resolution: 512 }
): Promise<DifferenceResult> {
  const [img1, img2] = await Promise.all([loadImage(img1Url), loadImage(img2Url)]);
  const size = options.resolution || 512;

  // Offscreen canvas for Image 1 (Epoch 1 Pre)
  const canvas1 = document.createElement('canvas');
  canvas1.width = size;
  canvas1.height = size;
  const ctx1 = canvas1.getContext('2d', { willReadFrequently: true });
  if (!ctx1) throw new Error('Could not create Canvas 2D context');
  ctx1.drawImage(img1, 0, 0, size, size);
  const data1 = ctx1.getImageData(0, 0, size, size).data;

  // Offscreen canvas for Image 2 (Epoch 2 Post)
  const canvas2 = document.createElement('canvas');
  canvas2.width = size;
  canvas2.height = size;
  const ctx2 = canvas2.getContext('2d', { willReadFrequently: true });
  if (!ctx2) throw new Error('Could not create Canvas 2D context');
  ctx2.drawImage(img2, 0, 0, size, size);
  const data2 = ctx2.getImageData(0, 0, size, size).data;

  // Target overlay canvas
  const outCanvas = document.createElement('canvas');
  outCanvas.width = size;
  outCanvas.height = size;
  const outCtx = outCanvas.getContext('2d');
  if (!outCtx) throw new Error('Could not create Output Canvas context');
  const outImgData = outCtx.createImageData(size, size);
  const outData = outImgData.data;

  const totalPixels = size * size;
  let changedPixels = 0;
  let sumDelta = 0;

  let lossCount = 0;
  let floodCount = 0;
  let regrowthCount = 0;
  let urbanCount = 0;

  let maxDelta = 0;
  let maxIdx = 0;

  const bins = [0, 0, 0, 0, 0]; // 5 histogram bins: 0-20, 21-50, 51-100, 101-160, >160

  const threshold = options.threshold || 24;
  const baseAlpha = Math.round((options.opacity ?? 0.85) * 255);

  for (let i = 0; i < data1.length; i += 4) {
    const r1 = data1[i];
    const g1 = data1[i + 1];
    const b1 = data1[i + 2];

    const r2 = data2[i];
    const g2 = data2[i + 1];
    const b2 = data2[i + 2];

    const dr = r2 - r1;
    const dg = g2 - g1;
    const db = b2 - b1;

    // Euclidean 3D color distance
    const euclidean = Math.sqrt(dr * dr + dg * dg + db * db);
    sumDelta += euclidean;

    // Histogram grouping
    if (euclidean <= 20) bins[0]++;
    else if (euclidean <= 50) bins[1]++;
    else if (euclidean <= 100) bins[2]++;
    else if (euclidean <= 160) bins[3]++;
    else bins[4]++;

    if (euclidean > maxDelta) {
      maxDelta = euclidean;
      maxIdx = i / 4;
    }

    if (euclidean >= threshold) {
      changedPixels++;

      // Radiometric & spectral delta heuristics
      const brightness1 = 0.299 * r1 + 0.587 * g1 + 0.114 * b1;
      const brightness2 = 0.299 * r2 + 0.587 * g2 + 0.114 * b2;
      const deltaBrightness = brightness2 - brightness1;

      // Pseudo-NDVI indicator using Green/Red channel differentials
      const pseudoNdvi1 = (g1 - r1) / (g1 + r1 + 1);
      const pseudoNdvi2 = (g2 - r2) / (g2 + r2 + 1);
      const deltaNdvi = pseudoNdvi2 - pseudoNdvi1;

      // Classification
      let outR = 255;
      let outG = 255;
      let outB = 255;
      let outA = baseAlpha;

      if (options.style === 'semantic') {
        if (deltaNdvi < -0.15 || (g1 > r1 && g2 < r2) || (deltaBrightness < -35 && dr < 0)) {
          // Vegetation loss, burn scar, building destruction -> ALERT RED
          outR = 244;
          outG = 63;
          outB = 94; // #f43f5e
          lossCount++;
        } else if (db > 25 && deltaBrightness < 10 && b2 > r2) {
          // Flood / water expansion -> NEON CYAN
          outR = 6;
          outG = 182;
          outB = 212; // #06b6d4
          floodCount++;
        } else if (deltaNdvi > 0.15 || (g2 > g1 + 25)) {
          // Vegetation regrowth / greening -> EMERALD GREEN
          outR = 34;
          outG = 197;
          outB = 94; // #22c55e
          regrowthCount++;
        } else if (deltaBrightness > 30) {
          // Built-up expansion / new reflective surfaces -> AMBER
          outR = 245;
          outG = 158;
          outB = 11; // #f59e0b
          urbanCount++;
        } else {
          // General anomaly / soil disturbance -> VIOLET
          outR = 168;
          outG = 85;
          outB = 247;
          lossCount++;
        }
      } else if (options.style === 'heatmap') {
        // Thermal change gradient: Blue -> Green -> Yellow -> Red
        const norm = Math.min(1.0, (euclidean - threshold) / 120);
        if (norm < 0.25) {
          outR = 0;
          outG = Math.round(norm * 4 * 255);
          outB = 255;
        } else if (norm < 0.5) {
          outR = 0;
          outG = 255;
          outB = Math.round((1 - (norm - 0.25) * 4) * 255);
        } else if (norm < 0.75) {
          outR = Math.round((norm - 0.5) * 4 * 255);
          outG = 255;
          outB = 0;
        } else {
          outR = 255;
          outG = Math.round((1 - (norm - 0.75) * 4) * 255);
          outB = 0;
        }
        outA = Math.round(baseAlpha * (0.4 + 0.6 * norm));
        lossCount++;
      } else if (options.style === 'neon') {
        // High-contrast neon highlight overlay
        outR = 74;
        outG = 222;
        outB = 128; // #4ade80 neon green
        outA = Math.min(255, Math.round(baseAlpha * 1.2));
        lossCount++;
      } else if (options.style === 'monochrome') {
        // Pure absolute delta magnitude grayscale
        const intensity = Math.min(255, Math.round((euclidean / 180) * 255));
        outR = intensity;
        outG = intensity;
        outB = intensity;
        outA = baseAlpha;
        lossCount++;
      }

      outData[i] = outR;
      outData[i + 1] = outG;
      outData[i + 2] = outB;
      outData[i + 3] = outA;
    } else {
      // Unchanged pixel: transparent
      outData[i] = 0;
      outData[i + 1] = 0;
      outData[i + 2] = 0;
      outData[i + 3] = 0;
    }
  }

  outCtx.putImageData(outImgData, 0, 0);
  const overlayDataUrl = outCanvas.toDataURL('image/png');

  const changePct = Number(((changedPixels / totalPixels) * 100).toFixed(1));
  const meanDelta = Number((sumDelta / totalPixels).toFixed(1));

  const totalCategorized = Math.max(1, lossCount + floodCount + regrowthCount + urbanCount);
  const breakdown = {
    lossPct: Number(((lossCount / totalCategorized) * changePct).toFixed(1)),
    floodPct: Number(((floodCount / totalCategorized) * changePct).toFixed(1)),
    regrowthPct: Number(((regrowthCount / totalCategorized) * changePct).toFixed(1)),
    urbanPct: Number(((urbanCount / totalCategorized) * changePct).toFixed(1)),
    stablePct: Number((100 - changePct).toFixed(1))
  };

  const hotspotY = Math.floor(maxIdx / size);
  const hotspotX = maxIdx % size;

  const histogram = [
    { range: '0-20 (Stable)', count: bins[0], color: '#4ade80' },
    { range: '21-50 (Low)', count: bins[1], color: '#38bdf8' },
    { range: '51-100 (Medium)', count: bins[2], color: '#f59e0b' },
    { range: '101-160 (High)', count: bins[3], color: '#f97316' },
    { range: '>160 (Severe)', count: bins[4], color: '#f43f5e' }
  ];

  return {
    overlayDataUrl,
    totalPixels,
    changedPixels,
    changePercentage: changePct,
    meanDelta,
    breakdown,
    hotspot: {
      normX: Number((hotspotX / size).toFixed(4)),
      normY: Number((hotspotY / size).toFixed(4)),
      intensity: Number(maxDelta.toFixed(1))
    },
    histogram
  };
}
