import { formatWhatsAppUdharReminder } from '../utils/khataReminder';

describe('formatWhatsAppUdharReminder', () => {
  it('formats polite Hindi/English message with NPCI UPI link', () => {
    const reminder = formatWhatsAppUdharReminder(
      'Ramesh Kumar',
      450.5,
      'Shree Ganesh Kirana',
      'ganesh@upi'
    );

    expect(reminder).toContain('Ramesh Kumar');
    expect(reminder).toContain('₹450.50');
    expect(reminder).toContain('Shree Ganesh Kirana');
    expect(reminder).toContain('upi://pay?');
    expect(reminder).toContain('pa=ganesh%40upi');
    expect(reminder).toContain('am=450.50');
    expect(reminder).toContain('cu=INR');
  });
});
