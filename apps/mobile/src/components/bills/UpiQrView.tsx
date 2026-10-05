import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { generateUpiUri } from '@kirana-pro/shared';

export interface UpiQrViewProps {
  vpa: string;
  payeeName: string;
  amount: number;
  invoiceNumber: string;
}

export const UpiQrView: React.FC<UpiQrViewProps> = ({
  vpa,
  payeeName,
  amount,
  invoiceNumber,
}) => {
  const upiUri = generateUpiUri(vpa, payeeName, amount, invoiceNumber);
  // Free client QR image generation via reliable Google Chart QR API
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
    upiUri
  )}`;

  return (
    <View style={styles.container}>
      <Text style={styles.scanPrompt}>
        Scan with any UPI App (GPay, PhonePe, Paytm, BHIM)
      </Text>

      <View style={styles.qrCard}>
        <Image
          source={{ uri: qrApiUrl }}
          style={styles.qrImage}
          resizeMode="contain"
        />
        <View style={styles.badgeRow}>
          <Text style={styles.appBadge}>Google Pay</Text>
          <Text style={styles.appBadge}>PhonePe</Text>
          <Text style={styles.appBadge}>Paytm</Text>
        </View>
      </View>

      <View style={styles.infoBox}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Store UPI ID:</Text>
          <Text style={styles.infoVal}>{vpa}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Exact Amount:</Text>
          <Text style={styles.infoAmount}>₹{amount.toFixed(2)}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  scanPrompt: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 12,
    textAlign: 'center',
  },
  qrCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 14,
  },
  qrImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 12,
  },
  appBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#065F46',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  infoBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    width: '100%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  infoVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  infoAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#10B981',
  },
});
