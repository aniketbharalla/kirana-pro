import { createWorker } from 'tesseract.js';
import { parseInvoiceText, PurchaseInvoiceDraft } from '@kirana-pro/shared';
import * as ImageManipulator from 'expo-image-manipulator';

export interface OCRProgress {
  status: string;
  progress: number;
}

export const SAMPLE_PARLE_BILL_TEXT = `
From : N R ENTERPRISES
NAGAR ROAD CHAI PE CHARCHA BHOPAL MANDI BHOPAL MP
Contact No 7415845631
GSTIN No 23MNQPK6685L1Z0
Invoice No : 740003042
Party Name : Chayan provision
Address Ashoka Garden
Phone No 8718945806
Sales Route : ASHOKA GARDEN GREEN CITY
SM Name/PH RACHIT RATHORE / 8269595491

S. HSN Code Product Name MRP UOM1 UOM2 Rate Gross Amt Sch dis. CGST SGST Amount
1 19059020 20-20 Classic - Butter - 144 PKT 8.60 gm Extra MRP - 5.00 5.00 2PB 4.25 102.04 0.00 2.50 2.55 2.50 2.55 107.14
2 19059020 20-20 Classic - Cashew - 144 PKT 4.30 gm Extra MRP - 5.00 5.00 2PB 4.25 102.04 0.00 2.50 2.55 2.50 2.55 107.14
3 19059020 HPY HPY 27+4.5G(24p)X132-12p TLO 5.00 1PB 4.25 93.54 0.00 2.50 2.34 2.50 2.34 98.22
4 19059020 Hide & Seek Choco 33g X 160p 10.00 1PB 8.50 170.07 0.00 2.50 4.25 2.50 4.25 178.57
5 19059020 Hide & Seek Classic - Chocolate - 72 PKT 15.50 gm Extra MRP - 30.00 30.00 6PKT 25.51 153.06 0.00 2.50 3.83 2.50 3.83 160.72
6 19059020 Krackjack Classic - Sweet & Salty - 120 PKT 12.60 gm Extra MRP - 10.00 10.00 2PB 8.50 204.08 0.00 2.50 5.10 2.50 5.10 214.28
7 19059020 Magix Kream Round - Chocolate - 144 PKT 3.30 gm Extra MRP - 4.50 4.50 1PB 3.90 46.75 2.34 2.50 1.11 2.50 1.11 46.64
8 19059020 Magix Kream Round - Elaichi - 144 PKT 3.30 gm Extra MRP - 4.50 4.50 1PB 3.90 46.75 2.34 2.50 1.11 2.50 1.11 46.64
9 19059020 Magix Kream Round - Green Apple - 144 PKT 3.30 gm Extra MRP - 4.50 4.50 1PB 3.90 46.75 2.34 2.50 1.11 2.50 1.11 46.64
10 17049020 Melody Choco 391g X 24 PB 100.00 3PBG 85.03 255.10 0.00 2.50 6.38 2.50 6.38 267.86
11 19059020 Monaco 23.2g+2.9g X 108+12p 5.00 1PB 4.25 114.80 0.00 2.50 2.87 2.50 2.87 120.54
12 19059020 Monaco 46.4g+5.8g X 120p SS 10.00 1PB 8.50 102.04 0.00 2.50 2.55 2.50 2.55 107.14
13 19059020 Parle-G Gluco 40+5g X 144p 5.00 1PB 4.33 103.90 0.00 2.50 2.60 2.50 2.60 109.10
14 19059020 Parle-G Gluco 80+10g X 72p DS 10.00 2PB 8.66 207.79 0.00 2.50 5.20 2.50 5.20 218.19
15 19059020 Parle-G Gold 56.25+12.5=68.75X72p 8.50 1PB 8.50 204.08 4.16 2.50 4.85 2.50 4.85 205.57

Gross Amt 1952.80
Sch Disc 11.17
Total Tax Amt 96.57
Net Amt 2018.00
`;

/**
 * Rotates an image by the specified degrees (e.g. 90, 180, 270) using expo-image-manipulator.
 */
export async function rotateImage(imageUri: string, degrees: number = 90): Promise<string> {
  try {
    const manipResult = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ rotate: degrees }],
      { compress: 0.95, format: ImageManipulator.SaveFormat.JPEG }
    );
    return manipResult.uri;
  } catch (err) {
    console.warn('Could not rotate image using expo-image-manipulator:', err);
    return imageUri;
  }
}

/**
 * Preprocesses an invoice image (upscales low-res camera images to >= 2200px width)
 * to satisfy Tesseract's minimum character x-height requirements.
 */
export async function preprocessImage(imageUri: string): Promise<string> {
  try {
    const manipResult = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ resize: { width: 2200 } }],
      { compress: 0.95, format: ImageManipulator.SaveFormat.JPEG }
    );
    return manipResult.uri;
  } catch (err) {
    console.warn('Could not preprocess image, using original:', err);
    return imageUri;
  }
}

/**
 * Performs real on-device / client-side OCR on an actual bill image using Tesseract WASM.
 * Zero paid APIs, 100% free-tier.
 */
export async function recognizeTextFromImage(
  imageSource: string,
  onProgress?: (progress: OCRProgress) => void
): Promise<string> {
  try {
    // Preprocess to ensure adequate DPI / resolution
    const processedSource = await preprocessImage(imageSource);

    const worker = await createWorker('eng', 1, {
      logger: (m) => {
        if (onProgress && m.status) {
          const pct = Math.round((m.progress || 0) * 100);
          let friendlyStatus = 'Processing image...';
          if (m.status === 'loading tesseract core') friendlyStatus = 'Loading OCR Engine...';
          else if (m.status === 'initializing tesseract') friendlyStatus = 'Initializing OCR...';
          else if (m.status === 'recognizing text') friendlyStatus = `Scanning Characters (${pct}%)...`;
          onProgress({ status: friendlyStatus, progress: pct });
        }
      },
    });

    const result = await worker.recognize(processedSource);
    let text = result.data.text || '';

    // If initial text is very sparse (< 50 chars), check if the image is oriented sideways (270° or 90°)
    if (text.trim().length < 50) {
      if (onProgress) {
        onProgress({ status: 'Optimizing bill orientation...', progress: 50 });
      }
      try {
        const rotatedUri = await rotateImage(processedSource, 270);
        const retryResult = await worker.recognize(rotatedUri);
        if ((retryResult.data.text || '').trim().length > text.trim().length) {
          text = retryResult.data.text || '';
        }
      } catch (rotErr) {
        console.warn('Orientation retry failed:', rotErr);
      }
    }

    await worker.terminate();
    return text;
  } catch (err: any) {
    console.warn('Real OCR execution error, falling back:', err.message);
    throw err;
  }
}

/**
 * Parses an invoice photo or raw text override into structured items, HSN, and GST.
 */
export async function processInvoiceImage(
  imageUri?: string,
  rawTextOverride?: string,
  onProgress?: (progress: OCRProgress) => void
): Promise<{ draft: PurchaseInvoiceDraft; rawText: string }> {
  let rawText = '';

  if (rawTextOverride && rawTextOverride.trim()) {
    rawText = rawTextOverride.trim();
  } else if (imageUri) {
    rawText = await recognizeTextFromImage(imageUri, onProgress);
  } else {
    rawText = SAMPLE_PARLE_BILL_TEXT.trim();
  }

  const draft = parseInvoiceText(rawText);
  return { draft, rawText };
}
