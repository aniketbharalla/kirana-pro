import { ScaleReading } from '../types/hardware';

/**
 * Parses serial ASCII data stream from electronic weighing scales
 * Supported formats:
 * - Essae/Toledo: "ST,GS,+001.250kg\r\n" or "US,GS,+000.500kg\r\n"
 * - Avery/Phoenix: "WN  001.500 kg\r\n"
 * - Simple ASCII numeric: "01.250\r\n" or "  1.250 kg\r\n"
 * - Multi-field: "WT: 001.250 KG  TARE: 000.000 KG\r\n"
 */
export const parseScaleWeight = (rawInput: string): ScaleReading | null => {
  if (!rawInput || typeof rawInput !== 'string') return null;

  const cleaned = rawInput.trim();
  if (cleaned.length === 0) return null;

  const now = new Date().toISOString();

  // 1. Essae / Toledo standard: ST,GS,+001.250kg or US,GS,+001.250kg
  const essaeMatch = cleaned.match(/(ST|US),(GS|NT),([+-]?\d+(?:\.\d+)?)\s*(kg|g)?/i);
  if (essaeMatch) {
    const isStable = essaeMatch[1].toUpperCase() === 'ST';
    let weight = parseFloat(essaeMatch[3]);
    let unit = (essaeMatch[4]?.toLowerCase() || 'kg') as 'kg' | 'g';

    if (unit === 'g') {
      weight = Math.round((weight / 1000) * 1000) / 1000;
      unit = 'kg';
    }

    return {
      weight: Math.max(0, weight),
      unit: 'kg',
      isStable,
      rawString: cleaned,
      timestamp: now,
    };
  }

  // 2. Weight label format: WT: 001.250 KG or WN  001.500 kg
  const labelMatch = cleaned.match(/(?:WT|WN|WEIGHT):\s*([+-]?\d+(?:\.\d+)?)\s*(kg|g)?/i);
  if (labelMatch) {
    let weight = parseFloat(labelMatch[1]);
    let unit = (labelMatch[2]?.toLowerCase() || 'kg') as 'kg' | 'g';
    if (unit === 'g') {
      weight = Math.round((weight / 1000) * 1000) / 1000;
      unit = 'kg';
    }

    return {
      weight: Math.max(0, weight),
      unit: 'kg',
      isStable: true,
      rawString: cleaned,
      timestamp: now,
    };
  }

  // 3. Fallback: Pure number with optional unit: "1.250" or "1.250 kg" or "+01.250"
  const numberMatch = cleaned.match(/([+-]?\d+(?:\.\d+)?)\s*(kg|g)?/i);
  if (numberMatch) {
    let weight = parseFloat(numberMatch[1]);
    let unit = (numberMatch[2]?.toLowerCase() || 'kg') as 'kg' | 'g';
    if (!isNaN(weight)) {
      if (unit === 'g') {
        weight = Math.round((weight / 1000) * 1000) / 1000;
        unit = 'kg';
      }

      return {
        weight: Math.max(0, weight),
        unit: 'kg',
        isStable: true,
        rawString: cleaned,
        timestamp: now,
      };
    }
  }

  return null;
};
