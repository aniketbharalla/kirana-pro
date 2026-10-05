import { computeNewStock } from '../services/stock';

describe('computeNewStock', () => {
  it('increases stock on type "in"', () => {
    const result = computeNewStock(10, 5, 'in');
    expect(result).toBe(15);
  });

  it('decreases stock on type "out"', () => {
    const result = computeNewStock(10, 3, 'out');
    expect(result).toBe(7);
  });

  it('sets direct stock on type "adjustment"', () => {
    const result = computeNewStock(10, 25, 'adjustment');
    expect(result).toBe(25);
  });

  it('throws error when type "out" would make stock negative', () => {
    expect(() => computeNewStock(2, 5, 'out')).toThrow(
      'Insufficient stock: cannot reduce 2 by 5'
    );
  });
});
