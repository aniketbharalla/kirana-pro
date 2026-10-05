import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../theme';
import { Supplier } from '@kirana-pro/shared';

export const CreatePurchaseScreen = ({ route, navigation }: any) => {
  const supplier: Supplier | undefined = route.params?.supplier;

  return (
    <View style={styles.container}>
      {supplier ? (
        <View style={styles.supplierBanner}>
          <Text style={styles.supplierBannerLabel}>Inwarding for Wholesaler</Text>
          <Text style={styles.supplierBannerName}>{supplier.name}</Text>
          <Text style={styles.supplierBannerPhone}>📞 {supplier.phone}</Text>
        </View>
      ) : null}

      <Text style={styles.title}>How would you like to inward stock?</Text>
      <Text style={styles.subtitle}>
        Select an option to record goods received and update your inventory automatically.
      </Text>

      {/* Option 1: AI OCR Bill Scanner */}
      <TouchableOpacity
        style={styles.optionCard}
        onPress={() => navigation.navigate('ScanInvoice', { supplier })}
      >
        <View style={styles.optionIconContainer}>
          <Text style={styles.optionIcon}>📷</Text>
        </View>
        <View style={styles.optionContent}>
          <Text style={styles.optionTitle}>Scan Distributor Bill (OCR)</Text>
          <Text style={styles.optionDesc}>
            Take a photo of printed bill. Automatically extracts HSN, pack multipliers (PB/JAR), rates & GST.
          </Text>
          <View style={styles.recommendedBadge}>
            <Text style={styles.recommendedBadgeText}>⚡ Recommended • 1-Click</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Option 2: Quick Demo Parle Bill */}
      <TouchableOpacity
        style={[styles.optionCard, styles.optionCardSecondary]}
        onPress={() =>
          navigation.navigate('ScanInvoice', {
            supplier,
            useSampleBill: true,
          })
        }
      >
        <View style={styles.optionIconContainer}>
          <Text style={styles.optionIcon}>⚡</Text>
        </View>
        <View style={styles.optionContent}>
          <Text style={styles.optionTitle}>Demo: Test Parle Distributor Bill</Text>
          <Text style={styles.optionDesc}>
            Instantly load 5 items from N R Enterprises (20-20, Parle-G, Hide & Seek, Monaco) with 5% GST.
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
  },
  supplierBanner: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    marginBottom: 20,
  },
  supplierBannerLabel: {
    fontSize: 11,
    color: colors.textMuted,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  supplierBannerName: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
    marginTop: 2,
  },
  supplierBannerPhone: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: 20,
    lineHeight: 18,
  },
  optionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 2,
    borderColor: colors.primary,
    marginBottom: 16,
  },
  optionCardSecondary: {
    borderColor: colors.border,
  },
  optionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  optionIcon: {
    fontSize: 24,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  optionDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 16,
  },
  recommendedBadge: {
    backgroundColor: '#ECFDF5',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 8,
  },
  recommendedBadgeText: {
    color: colors.primaryDark,
    fontSize: 11,
    fontWeight: '700',
  },
});
