/**
 * Generates an NPCI compliant standard UPI payment intent URI
 * @param vpa Virtual Payment Address (e.g. 9876543210@paytm)
 * @param payeeName Name of the merchant or store
 * @param amount Total bill amount in INR
 * @param transactionNote Invoice reference note
 */
export const generateUpiUri = (
  vpa: string,
  payeeName: string,
  amount: number,
  transactionNote: string
): string => {
  const formattedAmount = amount.toFixed(2);
  const cleanVpa = vpa.trim();
  const cleanName = payeeName.trim();
  const cleanNote = transactionNote.trim();

  const params = new URLSearchParams({
    pa: cleanVpa,
    pn: cleanName,
    am: formattedAmount,
    cu: 'INR',
    tn: cleanNote,
  });

  return `upi://pay?${params.toString()}`;
};
