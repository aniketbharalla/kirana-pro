import { formatWhatsAppUdharReminder } from '@kirana-pro/shared';

describe('Loyalty & Udhar Reminders', () => {
  it('calculates earned loyalty points: 1 point per ₹100 spent', () => {
    const calculateEarnedPoints = (grandTotal: number) => Math.floor(grandTotal / 100);

    expect(calculateEarnedPoints(99)).toBe(0);
    expect(calculateEarnedPoints(150)).toBe(1);
    expect(calculateEarnedPoints(480)).toBe(4);
    expect(calculateEarnedPoints(1250)).toBe(12);
  });

  it('caps redemption at available points and max 20% of cart total', () => {
    const calculateRedeemDiscount = (
      cartTotal: number,
      availablePoints: number,
      pointsToRedeem: number
    ) => {
      const maxAllowedDiscount = cartTotal * 0.2; // 20% cap
      const requestedPoints = Math.min(availablePoints, pointsToRedeem);
      return Math.min(requestedPoints, maxAllowedDiscount);
    };

    // ₹500 cart, 50 points available, wants to redeem 50 -> max discount = 100 (20% of 500) -> 50 used
    expect(calculateRedeemDiscount(500, 50, 50)).toBe(50);

    // ₹100 cart, 50 points available, wants to redeem 50 -> max discount = 20 -> capped at 20
    expect(calculateRedeemDiscount(100, 50, 50)).toBe(20);
  });

  it('generates 1-tap WhatsApp reminder with embedded NPCI UPI URI', () => {
    const reminder = formatWhatsAppUdharReminder(
      'Suresh Verma',
      350,
      'Sharma Kirana Store',
      'sharma@okaxis'
    );

    expect(reminder).toContain('Suresh Verma');
    expect(reminder).toContain('₹350.00');
    expect(reminder).toContain('sharma%40okaxis');
    expect(reminder).toContain('upi://pay?');
  });
});
