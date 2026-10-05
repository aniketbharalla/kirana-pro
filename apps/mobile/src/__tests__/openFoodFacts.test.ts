import { fetchProductByBarcode, parseOpenFoodFactsProduct } from '../services/openFoodFacts';

describe('openFoodFacts service', () => {
  it('parses valid Open Food Facts API response correctly', () => {
    const mockApiResponse = {
      status: 1,
      code: '8901030000001',
      product: {
        product_name: 'Maggi 2-Minute Masala Noodles',
        brands: 'Nestle',
        quantity: '70g',
        image_front_small_url: 'https://images.openfoodfacts.org/images/products/maggi.jpg',
        categories: 'Noodles, Groceries',
      },
    };

    const parsed = parseOpenFoodFactsProduct(mockApiResponse);
    expect(parsed).not.toBeNull();
    expect(parsed?.name).toBe('Maggi 2-Minute Masala Noodles');
    expect(parsed?.brand).toBe('Nestle');
    expect(parsed?.imageUrl).toBe('https://images.openfoodfacts.org/images/products/maggi.jpg');
    expect(parsed?.barcode).toBe('8901030000001');
  });

  it('returns null when product is not found in Open Food Facts', () => {
    const mockNotFoundResponse = {
      status: 0,
      status_verbose: 'product not found',
    };

    const parsed = parseOpenFoodFactsProduct(mockNotFoundResponse);
    expect(parsed).toBeNull();
  });
});
