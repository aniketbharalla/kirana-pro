import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from 'react-native';
import { processInvoiceImage, SAMPLE_PARLE_BILL_TEXT } from '../../services/ocrService';
import { colors } from '../../theme';
import { Supplier } from '@kirana-pro/shared';

export const ScanInvoiceScreen = ({ route, navigation }: any) => {
  const supplier: Supplier | undefined = route.params?.supplier;
  const useSampleBill = route.params?.useSampleBill;

  const [isProcessing, setIsProcessing] = useState(false);
  const [billText, setBillText] = useState(SAMPLE_PARLE_BILL_TEXT.trim());
  const [showManualText, setShowManualText] = useState(false);

  useEffect(() => {
    if (useSampleBill) {
      handleRunOCR(SAMPLE_PARLE_BILL_TEXT);
    }
  }, [useSampleBill]);

  const handleRunOCR = async (textToProcess?: string) => {
    try {
      setIsProcessing(true);
      const draft = await processInvoiceImage(undefined, textToProcess || billText);

      navigation.navigate('ReviewInvoice', {
        draft,
        supplier,
      });
    } catch (err: any) {
      alert('Failed to process bill OCR: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.viewfinderCard}>
        <Text style={styles.cameraIcon}>📸</Text>
        <Text style={styles.viewfinderTitle}>Distributor Invoice Scanner</Text>
        <Text style={styles.viewfinderDesc}>
          Align the distributor receipt within view. Ensures HSN, outer packs (PB/JAR), and rate are readable.
        </Text>

        {isProcessing ? (
          <View style={styles.processingBlock}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.processingText}>🔍 Free On-Device OCR Running...</Text>
            <Text style={styles.processingSubtext}>
              Extracting HSN codes, pack multipliers & GST splits
            </Text>
          </View>
        ) : (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.captureBtn}
              onPress={() => handleRunOCR()}
            >
              <Text style={styles.captureBtnText}>⚡ Scan Sample Parle Bill</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toggleTextBtn}
              onPress={() => setShowManualText(!showManualText)}
            >
              <Text style={styles.toggleTextBtnText}>
                {showManualText ? 'Hide Bill Text' : '📝 Paste Bill Text / Manual Review'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {showManualText && !isProcessing ? (
        <View style={styles.textInputBlock}>
          <Text style={styles.textInputLabel}>Bill Raw Text / OCR Preview</Text>
          <TextInput
            style={styles.textArea}
            multiline
            numberOfLines={8}
            value={billText}
            onChangeText={setBillText}
            placeholder="Paste text extracted from bill..."
            placeholderTextColor={colors.textMuted}
          />
          <TouchableOpacity
            style={styles.parseCustomBtn}
            onPress={() => handleRunOCR(billText)}
          >
            <Text style={styles.parseCustomBtnText}>Run Parser on This Text</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
  },
  viewfinderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.primaryBorder,
  },
  cameraIcon: {
    fontSize: 54,
    marginBottom: 10,
  },
  viewfinderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  viewfinderDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  processingBlock: {
    marginTop: 24,
    alignItems: 'center',
  },
  processingText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primaryDark,
    marginTop: 12,
  },
  processingSubtext: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  actionButtons: {
    width: '100%',
    marginTop: 24,
    gap: 10,
  },
  captureBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  captureBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  toggleTextBtn: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  toggleTextBtnText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 13,
  },
  textInputBlock: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textInputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  textArea: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    fontSize: 12,
    fontFamily: 'monospace',
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  parseCustomBtn: {
    backgroundColor: colors.text,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  parseCustomBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
