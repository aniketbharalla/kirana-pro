export interface ScannedProductMetadata {
  barcode: string;
  name: string;
  brand?: string;
  quantity?: string;
  imageUrl?: string;
  categories?: string;
}

export const USER_AGENT = 'KiranaPro-App/1.0 - contact@kiranapro.in';

export const parseOpenFoodFactsProduct = (data: any): ScannedProductMetadata | null => {
  if (!data || data.status !== 1 || !data.product) {
    return null;
  }

  const p = data.product;
  const name =
    p.product_name_en ||
    p.product_name ||
    p.product_name_hi ||
    p.generic_name ||
    'Packaged Grocery Item';

  return {
    barcode: data.code || p.code || '',
    name: name.trim(),
    brand: p.brands || undefined,
    quantity: p.quantity || undefined,
    imageUrl: p.image_front_small_url || p.image_front_url || undefined,
    categories: p.categories || undefined,
  };
};

export const fetchProductByBarcode = async (
  barcode: string
): Promise<ScannedProductMetadata | null> => {
  const cleanBarcode = barcode.trim();
  if (!cleanBarcode) return null;

  try {
    const url = `https://world.openfoodfacts.net/api/v2/product/${encodeURIComponent(cleanBarcode)}.json`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      // If 404 or other HTTP error
      return null;
    }

    const data = await response.json();
    return parseOpenFoodFactsProduct(data);
  } catch (err) {
    console.warn(`Open Food Facts lookup failed for ${cleanBarcode}:`, err);
    return null;
  }
};
