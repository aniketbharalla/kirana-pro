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
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import {
  processInvoiceImage,
  rotateImage,
  OCRProgress,
  SAMPLE_PARLE_BILL_TEXT,
} from '../../services/ocrService';
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
            <View style={styles.imagePreviewBadge}>
              <Feather name="camera" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.imagePreviewBadgeText}>Selected Bill Photo</Text>
            </View>
          </View>
        ) : (
          <View style={styles.placeholderContainer}>
            <View style={styles.iconCircle}>
              <Feather name="file-text" size={32} color="#7367F0" />
            </View>
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
            <ActivityIndicator size="large" color="#7367F0" />
            <Text style={styles.progressStatus}>{ocrProgress.status || 'Scanning characters...'}</Text>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${Math.max(10, ocrProgress.progress)}%` }]} />
            </View>
            <Text style={styles.progressSubtext}>Powered by client-side Tesseract WASM</Text>
          </View>
        ) : (
          <View style={styles.buttonGroup}>
            <TouchableOpacity style={styles.cameraBtn} onPress={handleTakePhoto} activeOpacity={0.85}>
              <Feather name="camera" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.cameraBtnText}>Take Photo with Camera</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.galleryBtn} onPress={handlePickFromGallery} activeOpacity={0.85}>
              <Feather name="image" size={16} color="#4B465C" style={{ marginRight: 8 }} />
              <Text style={styles.galleryBtnText}>Choose Bill from Gallery</Text>
            </TouchableOpacity>

            {selectedImageUri ? (
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.rotateBtn} onPress={handleRotateImage} activeOpacity={0.85}>
                  <Feather name="rotate-cw" size={15} color="#5D596C" style={{ marginRight: 6 }} />
                  <Text style={styles.rotateBtnText}>Rotate 90°</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.reScanBtn}
                  onPress={() => handleExecuteRealOCR(selectedImageUri)}
                  activeOpacity={0.85}
                >
                  <Feather name="zap" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.reScanBtnText}>Run OCR on Bill</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            <TouchableOpacity style={styles.sampleBtn} onPress={handleLoadRealParleBill} activeOpacity={0.85}>
              <Feather name="file-text" size={15} color="#7367F0" style={{ marginRight: 6 }} />
              <Text style={styles.sampleBtnText}>Test with Real Parle Bill (15 Items)</Text>
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
            placeholderTextColor="#82808B"
          />
          <TouchableOpacity
            style={styles.parseRawBtn}
            onPress={() => handleExecuteRealOCR(undefined, extractedRawText)}
            activeOpacity={0.85}
          >
            <Text style={styles.parseRawBtnText}>Parse Line Items from This Text</Text>
            <Feather name="arrow-right" size={15} color="#FFFFFF" style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        </View>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F7FA',
  },
  content: {
    padding: 16,
    paddingBottom: 60,
  },
  captureCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DBDADE',
    borderStyle: 'dashed',
  },
  placeholderContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EDEBFD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  captureTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4B465C',
  },
  captureDesc: {
    fontSize: 13,
    color: '#82808B',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    paddingHorizontal: 10,
  },
  imagePreviewContainer: {
    width: '100%',
    height: 240,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#2F2B3D',
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
    backgroundColor: 'rgba(47, 43, 61, 0.85)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  imagePreviewBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 20,
  },
  progressStatus: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7367F0',
    marginTop: 12,
  },
  progressBarBg: {
    width: '100%',
    height: 6,
    backgroundColor: '#DBDADE',
    borderRadius: 3,
    marginTop: 10,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#7367F0',
    borderRadius: 3,
  },
  progressSubtext: {
    fontSize: 11,
    color: '#82808B',
    marginTop: 8,
  },
  buttonGroup: {
    width: '100%',
    gap: 10,
    marginTop: 14,
  },
  cameraBtn: {
    backgroundColor: '#7367F0',
    paddingVertical: 14,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7367F0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  cameraBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  galleryBtn: {
    backgroundColor: '#F8F7FA',
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DBDADE',
  },
  galleryBtnText: {
    color: '#4B465C',
    fontWeight: '600',
    fontSize: 14,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  rotateBtn: {
    flex: 1,
    backgroundColor: '#F8F7FA',
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DBDADE',
  },
  rotateBtnText: {
    color: '#5D596C',
    fontWeight: '600',
    fontSize: 13,
  },
  reScanBtn: {
    flex: 2,
    backgroundColor: '#7367F0',
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reScanBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  sampleBtn: {
    backgroundColor: '#EDEBFD',
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(115, 103, 240, 0.2)',
    marginTop: 4,
  },
  sampleBtnText: {
    color: '#7367F0',
    fontWeight: '600',
    fontSize: 13,
  },
  rawTextCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#DBDADE',
  },
  rawTextHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4B465C',
  },
  rawTextSub: {
    fontSize: 12,
    color: '#82808B',
    marginTop: 2,
    marginBottom: 8,
  },
  rawTextArea: {
    backgroundColor: '#F8F7FA',
    borderRadius: 8,
    padding: 12,
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#4B465C',
    borderWidth: 1,
    borderColor: '#DBDADE',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  parseRawBtn: {
    backgroundColor: '#7367F0',
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  parseRawBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
});

