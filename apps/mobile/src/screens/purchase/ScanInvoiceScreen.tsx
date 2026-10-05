import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  processInvoiceImage,
  rotateImage,
  OCRProgress,
  SAMPLE_PARLE_BILL_TEXT,
} from '../../services/ocrService';
import { colors } from '../../theme';
import { Supplier } from '@kirana-pro/shared';

export const ScanInvoiceScreen = ({ route, navigation }: any) => {
  const supplier: Supplier | undefined = route.params?.supplier;

  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState<OCRProgress>({
    status: '',
    progress: 0,
  });
  const [extractedRawText, setExtractedRawText] = useState('');
  const [showManualEdit, setShowManualEdit] = useState(false);

  // Pick image from camera
  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Needed',
          'Camera access is required to take a photo of the bill. You can also select an existing image from your gallery.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        setSelectedImageUri(uri);
        handleExecuteRealOCR(uri);
      }
    } catch (err: any) {
      Alert.alert('Camera Error', err.message || 'Could not open camera.');
    }
  };

  // Pick image from Gallery / Files
  const handlePickFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        setSelectedImageUri(uri);
        handleExecuteRealOCR(uri);
      }
    } catch (err: any) {
      Alert.alert('Gallery Error', err.message || 'Could not select image.');
    }
  };

  // Rotate selected bill photo 90 degrees
  const handleRotateImage = async () => {
    if (!selectedImageUri) return;
    try {
      setIsProcessing(true);
      setOcrProgress({ status: 'Rotating bill image 90°...', progress: 30 });
      const rotatedUri = await rotateImage(selectedImageUri, 90);
      setSelectedImageUri(rotatedUri);
    } catch (err: any) {
      Alert.alert('Rotate Error', 'Could not rotate image.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Run real OCR engine on the actual image
  const handleExecuteRealOCR = async (imageUriToScan?: string, textOverride?: string) => {
    const targetUri = imageUriToScan || selectedImageUri;

    if (!targetUri && !textOverride) {
      Alert.alert('Select Bill Image', 'Please capture or choose an invoice photo first.');
      return;
    }

    try {
      setIsProcessing(true);
      setOcrProgress({ status: 'Starting Optical Character Recognition...', progress: 10 });

      const { draft, rawText } = await processInvoiceImage(
        targetUri || undefined,
        textOverride,
        (progress) => setOcrProgress(progress)
      );

      setExtractedRawText(rawText);

      // Directly navigate to Review Extracted Bill screen immediately upon OCR completion
      navigation.navigate('ReviewInvoice', {
        draft:
          draft.items.length > 0
            ? draft
            : {
                supplierName: draft.supplierName || 'Wholesaler / Distributor',
                invoiceNo: draft.invoiceNo || `INV/${Date.now().toString().slice(-6)}`,
                items: [],
                subtotal: 0,
                totalCGST: 0,
                totalSGST: 0,
                netPayable: 0,
                confidence: 50,
              },
        supplier,
        invoiceImageUri: targetUri,
        rawText,
      });
    } catch (err: any) {
      setShowManualEdit(true);
      Alert.alert('OCR Error', 'Failed to scan image: ' + (err.message || 'Unknown OCR error'));
    } finally {
      setIsProcessing(false);
    }
  };

  // Quick test with the real Parle distributor bill text
  const handleLoadRealParleBill = () => {
    setExtractedRawText(SAMPLE_PARLE_BILL_TEXT.trim());
    handleExecuteRealOCR(undefined, SAMPLE_PARLE_BILL_TEXT.trim());
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Upload & Capture Card */}
      <View style={styles.captureCard}>
        {selectedImageUri ? (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: selectedImageUri }} style={styles.imagePreview} resizeMode="contain" />
            <Text style={styles.imagePreviewBadge}>📸 Selected Bill Photo</Text>
          </View>
        ) : (
          <View style={styles.placeholderContainer}>
            <Text style={styles.cameraIcon}>🧾</Text>
            <Text style={styles.captureTitle}>Real Wholesaler Bill Scanner</Text>
            <Text style={styles.captureDesc}>
              Upload any real printed invoice photo (Parle, Britannia, ITC, Mandi receipt).
              Our free on-device OCR extracts HSN, pack multipliers, unit rates, and GST splits.
            </Text>
          </View>
        )}

        {/* Real OCR Progress Indicator */}
        {isProcessing ? (
          <View style={styles.progressContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.progressStatus}>{ocrProgress.status || 'Scanning characters...'}</Text>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${Math.max(10, ocrProgress.progress)}%` }]} />
            </View>
            <Text style={styles.progressSubtext}>Powered by client-side Tesseract WASM (100% Free)</Text>
          </View>
        ) : (
          <View style={styles.buttonGroup}>
            <TouchableOpacity style={styles.cameraBtn} onPress={handleTakePhoto}>
              <Text style={styles.cameraBtnText}>📸 Take Photo with Camera</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.galleryBtn} onPress={handlePickFromGallery}>
              <Text style={styles.galleryBtnText}>🖼️ Choose Bill from Gallery / Files</Text>
            </TouchableOpacity>

            {selectedImageUri ? (
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.rotateBtn} onPress={handleRotateImage}>
                  <Text style={styles.rotateBtnText}>🔄 Rotate 90°</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.reScanBtn}
                  onPress={() => handleExecuteRealOCR(selectedImageUri)}
                >
                  <Text style={styles.reScanBtnText}>⚡ Run OCR on Bill</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            <TouchableOpacity style={styles.sampleBtn} onPress={handleLoadRealParleBill}>
              <Text style={styles.sampleBtnText}>📑 Test with Real Parle Bill (15 Items)</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Manual / Raw Text Editor (if OCR text needs inspection) */}
      {(showManualEdit || extractedRawText) && !isProcessing ? (
        <View style={styles.rawTextCard}>
          <Text style={styles.rawTextHeader}>Extracted Raw OCR Text</Text>
          <Text style={styles.rawTextSub}>
            You can adjust any smudged characters or numbers and re-run the parser:
          </Text>
          <TextInput
            style={styles.rawTextArea}
            multiline
            numberOfLines={8}
            value={extractedRawText}
            onChangeText={setExtractedRawText}
            placeholder="Extracted text will appear here..."
            placeholderTextColor={colors.textMuted}
          />
          <TouchableOpacity
            style={styles.parseRawBtn}
            onPress={() => handleExecuteRealOCR(undefined, extractedRawText)}
          >
            <Text style={styles.parseRawBtnText}>Parse Line Items from This Text ➔</Text>
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
    paddingBottom: 60,
  },
  captureCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.primaryBorder,
  },
  placeholderContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  cameraIcon: {
    fontSize: 54,
    marginBottom: 8,
  },
  captureTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  captureDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    paddingHorizontal: 10,
  },
  imagePreviewContainer: {
    width: '100%',
    height: 240,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    marginBottom: 16,
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  imagePreviewBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    color: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: 11,
    fontWeight: '700',
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 20,
  },
  progressStatus: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryDark,
    marginTop: 12,
  },
  progressBarBg: {
    width: '100%',
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    marginTop: 10,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressSubtext: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 8,
  },
  buttonGroup: {
    width: '100%',
    gap: 10,
    marginTop: 14,
  },
  cameraBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cameraBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  galleryBtn: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  galleryBtnText: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 14,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  rotateBtn: {
    flex: 1,
    backgroundColor: '#E2E8F0',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  rotateBtnText: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 13,
  },
  reScanBtn: {
    flex: 2,
    backgroundColor: '#0F172A',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  reScanBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  sampleBtn: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginTop: 4,
  },
  sampleBtnText: {
    color: '#92400E',
    fontWeight: '700',
    fontSize: 13,
  },
  rawTextCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rawTextHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  rawTextSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: 8,
  },
  rawTextArea: {
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
  parseRawBtn: {
    backgroundColor: colors.text,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  parseRawBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
