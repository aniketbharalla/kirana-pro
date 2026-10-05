import React from 'react';
import { View, StyleSheet, Text, SafeAreaView, TouchableOpacity } from 'react-native';
import { colors } from '../../theme';

export const BillsPlaceholderScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconEmoji}>🧾</Text>
        </View>
        <Text style={styles.title}>POS Billing & Invoicing</Text>
        <Text style={styles.subtitle}>
          Fast barcode checkout, WhatsApp receipts (wa.me link free), split payments, and customer ledger (Udhaar khata) will be available in Phase 2.
        </Text>

        <View style={styles.previewBox}>
          <Text style={styles.previewHeading}>✨ Coming Features:</Text>
          <Text style={styles.previewItem}>• 1-Tap WhatsApp PDF Invoices</Text>
          <Text style={styles.previewItem}>• Instant Barcode & Taraju Addition</Text>
          <Text style={styles.previewItem}>• Cash & UPI Split Settlement</Text>
          <Text style={styles.previewItem}>• Zero fees, 100% Free Tier</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  iconEmoji: {
    fontSize: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  previewBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  previewHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  previewItem: {
    fontSize: 13,
    color: '#475569',
    marginVertical: 3,
  },
});
