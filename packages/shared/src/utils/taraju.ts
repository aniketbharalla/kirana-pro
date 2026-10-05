export interface WeightCalculationResult {
  grams: number;
  display: string;
}

export interface PriceCalculationResult {
  price: number;
  display: string;
}

export const calculateWeight = (
  pricePerKg: number,
  amount: number
): WeightCalculationResult => {
  if (pricePerKg <= 0 || amount <= 0) {
    return { grams: 0, display: '0 g' };
  }

  const grams = Math.round((amount / pricePerKg) * 1000);

  if (grams >= 1000) {
    const kg = (grams / 1000).toFixed(2);
    return { grams, display: `${kg} kg` };
  }

  return { grams, display: `${grams} g` };
};

export const calculatePrice = (
  pricePerKg: number,
  weightInGrams: number
): PriceCalculationResult => {
  if (pricePerKg <= 0 || weightInGrams <= 0) {
    return { price: 0, display: '₹0.00' };
  }

  const rawPrice = (weightInGrams / 1000) * pricePerKg;
  const price = Math.round(rawPrice * 100) / 100;

  return { price, display: `₹${price.toFixed(2)}` };
};
