import { calculateWeight, calculatePrice } from '../utils/taraju';

describe('calculateWeight', () => {
  it('₹5 of ₹50/kg rice = 100g', () => {
    expect(calculateWeight(50, 5)).toEqual({ grams: 100, display: '100 g' });
  });

  it('₹100 of ₹50/kg rice = 2.00 kg', () => {
    expect(calculateWeight(50, 100)).toEqual({ grams: 2000, display: '2.00 kg' });
  });

  it('₹7 of ₹50/kg = 140g (whole grams, no floating point)', () => {
    expect(calculateWeight(50, 7)).toEqual({ grams: 140, display: '140 g' });
  });

  it('₹10 of ₹33/kg = 303g (rounds to nearest gram)', () => {
    expect(calculateWeight(33, 10)).toEqual({ grams: 303, display: '303 g' });
  });
});

describe('calculatePrice', () => {
  it('250g of ₹50/kg = ₹12.50', () => {
    expect(calculatePrice(50, 250)).toEqual({ price: 12.5, display: '₹12.50' });
  });

  it('1000g of ₹50/kg = ₹50.00', () => {
    expect(calculatePrice(50, 1000)).toEqual({ price: 50, display: '₹50.00' });
  });

  it('100g of ₹33/kg = ₹3.30', () => {
    expect(calculatePrice(33, 100)).toEqual({ price: 3.3, display: '₹3.30' });
  });
});
