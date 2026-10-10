import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
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
          <View style={styles.phoneRow}>
            <Feather name="phone" size={12} color={colors.textSecondary} style={{ marginRight: 4 }} />
            <Text style={styles.supplierBannerPhone}>{supplier.phone}</Text>
          </View>
        </View>
      ) : null}

      <Text style={styles.title}>How would you like to inward stock?</Text>
      <Text style={styles.subtitle}>
        Select an option to record goods received and update your inventory automatically.
      </Text>

      {/* Option 1: Real OCR Bill Scanner */}
      <TouchableOpacity
        style={styles.optionCard}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('ScanInvoice', { supplier })}
      >
        <View style={styles.optionIconContainer}>
          <Feather name="camera" size={22} color={colors.primary} />
        </View>
        <View style={styles.optionContent}>
          <Text style={styles.optionTitle}>Real Bill Scanner (Camera / Photo)</Text>
          <Text style={styles.optionDesc}>
            Capture a live camera photo or pick an invoice image from your phone/files. On-device Tesseract OCR scans the physical bill directly.
          </Text>
          <View style={styles.recommendedBadge}>
            <Feather name="zap" size={11} color={colors.primary} style={{ marginRight: 4 }} />
            <Text style={styles.recommendedBadgeText}>Real OCR • Zero Paid APIs</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Option 2: Paste Bill Text */}
      <TouchableOpacity
        style={[styles.optionCard, styles.optionCardSecondary]}
        activeOpacity={0.85}
        onPress={() =>
          navigation.navigate('ScanInvoice', {
            supplier,
            useSampleBill: false,
          })
        }
      >
        <View style={styles.optionIconContainer}>
          <Feather name="file-text" size={22} color={colors.textSecondary} />
        </View>
        <View style={styles.optionContent}>
          <Text style={styles.optionTitle}>Paste Bill Text / Manual Raw Review</Text>
          <Text style={styles.optionDesc}>
            Type or paste copied lines from a WhatsApp invoice or PDF to parse items, rates, and GST.
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
    padding: 16,
  },
  supplierBanner: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    marginBottom: 16,
  },
  supplierBannerLabel: {
    fontSize: 11,
    color: colors.textMuted,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  supplierBannerName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginTop: 2,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  supplierBannerPhone: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 18,
  },
  optionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1.5,
    borderColor: colors.primary,
    marginBottom: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  optionCardSecondary: {
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.04,
  },
  optionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 8,
  },
  recommendedBadgeText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
});
