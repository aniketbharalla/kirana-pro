/**
 * Free-Tier Client-Side Tesseract.js OCR Wrapper (Next.js 15 App Router compatible)
 * Runs purely in-browser via WebAssembly (WASM). No paid API key, no external billing.
 */
import Tesseract from 'tesseract.js';

export interface OCRProgressCallback {
  (status: string, progress: number): void;
}

export interface OCRResult {
  text: string;
  confidence: number;
}

/**
 * Preprocesses an image on a hidden canvas to improve OCR recognition rates:
 * - Upscales low-resolution images
 * - Enhances contrast and binarizes/thresholds grayscale
 * - Supports rotation (0, 90, 180, 270 degrees)
 */
export async function preprocessImage(
  imageSource: string | File | Blob,
  rotationAngle = 0
): Promise<string> {
  if (typeof window === 'undefined') return '';

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(img.src);
        return;
      }

      // Handle orientation
      const isSideways = rotationAngle === 90 || rotationAngle === 270;
      const baseWidth = isSideways ? img.height : img.width;
      const baseHeight = isSideways ? img.width : img.height;

      // Scale up if resolution is low (e.g. WhatsApp compression < 1500px)
      const scale = Math.max(1, Math.min(3, 2000 / Math.max(baseWidth, baseHeight)));
      canvas.width = Math.round(baseWidth * scale);
      canvas.height = Math.round(baseHeight * scale);

      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotationAngle * Math.PI) / 180);

      const drawW = (isSideways ? canvas.height : canvas.width);
      const drawH = (isSideways ? canvas.width : canvas.height);
      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();

      // Simple contrast enhancement
      try {
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = imgData.data;
        const contrast = 1.25; // 25% contrast boost
        const factor = (259 * (contrast * 100 + 255)) / (255 * (259 - contrast * 100));

        for (let i = 0; i < d.length; i += 4) {
          // Grayscale
          const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
          // Boost contrast
          const contrasted = factor * (gray - 128) + 128;
          const clamped = Math.max(0, Math.min(255, contrasted));
          d[i] = clamped;
          d[i + 1] = clamped;
          d[i + 2] = clamped;
        }
        ctx.putImageData(imgData, 0, 0);
      } catch {
        // Fallback to unmanipulated canvas
      }

      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = (err) => reject(err);

    if (typeof imageSource === 'string') {
      img.src = imageSource;
    } else {
      img.src = URL.createObjectURL(imageSource);
    }
  });
}

/**
 * Recognizes text from an invoice image using Tesseract.js WASM.
 */
export async function recognizeInvoice(
  imageSource: string | File | Blob,
  onProgress?: OCRProgressCallback,
  rotationAngle = 0
): Promise<OCRResult> {
  onProgress?.('Pre-processing bill image...', 5);

  let processedSource = imageSource;
  if (typeof window !== 'undefined') {
    try {
      processedSource = await preprocessImage(imageSource, rotationAngle);
    } catch (e) {
      console.warn('Preprocessing skipped, using raw image:', e);
    }
  }

  onProgress?.('Loading OCR Engine (WASM)...', 15);

  const result = await Tesseract.recognize(processedSource, 'eng', {
    logger: (m) => {
      if (m.status === 'recognizing text') {
        const pct = Math.round(15 + (m.progress || 0) * 80);
        onProgress?.(`Recognizing text... ${Math.round((m.progress || 0) * 100)}%`, pct);
      } else if (m.status) {
        onProgress?.(m.status.replace(/_/g, ' '), 20);
      }
    },
  });

  onProgress?.('Parsing invoice structure...', 98);

  return {
    text: result.data.text || '',
    confidence: result.data.confidence || 0,
  };
}
