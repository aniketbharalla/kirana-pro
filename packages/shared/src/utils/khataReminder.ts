export function formatWhatsAppUdharReminder(
  customerName: string,
  balance: number,
  storeName: string,
  upiVpa: string
): string {
  const upiLink = `upi://pay?pa=${encodeURIComponent(upiVpa)}&pn=${encodeURIComponent(storeName)}&am=${balance.toFixed(2)}&cu=INR&tn=${encodeURIComponent('Khata Payment')}`;

  return (
    `*नमस्ते ${customerName} जी!*\n\n` +
    `आपके किराना खाते का बकाया बैलेंस *₹${balance.toFixed(2)}* है (${storeName})।\n\n` +
    `कृपया नीचे दिए गए UPI लिंक से भुगतान करें:\n` +
    `${upiLink}\n\n` +
    `धन्यवाद!\n*${storeName}*`
  );
}

export const formatWhatsAppKhataReminder = formatWhatsAppUdharReminder;
