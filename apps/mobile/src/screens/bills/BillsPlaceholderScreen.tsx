import React from 'react';
import { View, StyleSheet, Text, SafeAreaView } from 'react-native';
import { Feather } from '@expo/vector-icons';

export const BillsPlaceholderScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.iconCircle}>
          <Feather name="file-text" size={36} color="#7367F0" />
        </View>
        <Text style={styles.title}>POS Billing & Invoicing</Text>
        <Text style={styles.subtitle}>
          Fast barcode checkout, WhatsApp receipts (wa.me link free), split payments, and customer ledger (Udhaar khata) will be available in Phase 2.
        </Text>

        <View style={styles.previewBox}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Feather name="zap" size={14} color="#7367F0" style={{ marginRight: 6 }} />
            <Text style={styles.previewHeading}>Coming Features:</Text>
          </View>
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
    backgroundColor: '#F8F7FA',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EDEBFD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(115, 103, 240, 0.2)',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#4B465C',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#82808B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  previewBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: '#DBDADE',
  },
  previewHeading: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B465C',
  },
  previewItem: {
    fontSize: 13,
    color: '#5D596C',
    marginVertical: 3,
  },
});

