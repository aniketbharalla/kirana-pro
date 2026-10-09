import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useCartStore } from '../../store/cartStore';
import { useProductStore } from '../../store/productStore';
import { useAuthStore } from '../../store/authStore';
import { fetchProductByBarcode, ScannedProductMetadata } from '../../services/openFoodFacts';
import { addProduct } from '../../services/product';
import { Product } from '@kirana-pro/shared';

export interface POSBarcodeScannerModalProps {
  visible: boolean;
  onClose: () => void;
}

export const POSBarcodeScannerModal: React.FC<POSBarcodeScannerModalProps> = ({
  visible,
  onClose,
}) => {
  const { user } = useAuthStore();
  const { findByBarcode } = useProductStore();
  const { items, totals, addItem } = useCartStore();

  const [nativePermission, requestNativePermission] = useCameraPermissions();
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isScanningPaused, setIsScanningPaused] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Success Feedback Toast
  const [lastAddedToast, setLastAddedToast] = useState<string | null>(null);

  // Unrecognized Barcode Quick-Add Modal
  const [unrecognizedCode, setUnrecognizedCode] = useState<string | null>(null);
  const [unrecognizedName, setUnrecognizedName] = useState('');
  const [unrecognizedSellingPrice, setUnrecognizedSellingPrice] = useState('20');
  const [unrecognizedCostPrice, setUnrecognizedCostPrice] = useState('16');
  const [isSavingNewProduct, setIsSavingNewProduct] = useState(false);

  // Web ZXing references
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const zxingControlsRef = useRef<IScannerControls | null>(null);
  const isScanningPausedRef = useRef(false);
  isScanningPausedRef.current = isScanningPaused;

  // Retail POS Audio Beep (1760Hz high-frequency chirp)
  const playPOSScanBeep = () => {
    try {
      if (typeof window !== 'undefined') {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(1760, ctx.currentTime);
          gain.gain.setValueAtTime(0.3, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.14);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.14);
        }
      }
    } catch (e) {
      console.warn('Audio scan beep notice:', e);
    }
  };

  // Vibration / Haptic Feedback
  const triggerScanFeedback = () => {
    playPOSScanBeep();
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch {
      // Haptics fallback
    }
  };

  // Start Camera upon explicit user click
  const handleStartCamera = async () => {
    setCameraError(null);
    setIsScanningPaused(false);

    if (Platform.OS === 'web') {
      setIsCameraActive(true);
      try {
        const reader = new BrowserMultiFormatReader();
        setTimeout(async () => {
          if (!videoRef.current) return;
          try {
            const controls = await reader.decodeFromConstraints(
              {
                video: {
                  facingMode: { ideal: 'environment' },
                  width: { ideal: 1280 },
                  height: { ideal: 720 },
                },
              },
              videoRef.current,
              (result) => {
                if (result && !isScanningPausedRef.current) {
                  const text = result.getText();
                  if (text && text.trim()) {
                    handleProcessBarcode(text.trim());
                  }
                }
              }
            );
            zxingControlsRef.current = controls;
          } catch (cameraErr: any) {
            console.warn('ZXing camera start error:', cameraErr);
            setCameraError(
              cameraErr.name === 'NotAllowedError'
                ? 'Camera access was blocked by your browser. Please allow camera in browser permissions.'
                : 'Could not access camera. You can type the barcode or click demo items below.'
            );
          }
        }, 300);
      } catch (err: any) {
        setCameraError('Failed to initialize camera scanner.');
      }
    } else {
      // Native iOS/Android
      const res = await requestNativePermission();
      if (res.granted) {
        setIsCameraActive(true);
      } else {
        Alert.alert('Permission Needed', 'Camera permission is required to scan barcodes.');
      }
    }
  };

  const handleStopCamera = () => {
    setIsCameraActive(false);
    if (zxingControlsRef.current) {
      zxingControlsRef.current.stop();
      zxingControlsRef.current = null;
    }
  };

  useEffect(() => {
    if (!visible) {
      handleStopCamera();
      setLastAddedToast(null);
      setUnrecognizedCode(null);
    }
  }, [visible]);

  // Main barcode processor for POS Billing
  const handleProcessBarcode = async (rawCode: string) => {
    const clean = rawCode.trim();
    if (!clean) return;

    triggerScanFeedback();
    setIsScanningPaused(true);

    // 1. Check if product already exists in current Dukaan catalog
    const existing = findByBarcode(clean);
    if (existing) {
      addItem(existing, 1);
      setLastAddedToast(`✅ Added 1x "${existing.name}" (₹${existing.sellingPrice}) to Bill!`);

      // Resume camera after 1.8 seconds for continuous barcode gun scanning
      setTimeout(() => {
        setIsScanningPaused(false);
      }, 1800);
      return;
    }

    // 2. Barcode not in catalog -> Query Open Food Facts or prompt quick add
    setIsSearching(true);
    try {
      const offMetadata = await fetchProductByBarcode(clean);
      if (offMetadata) {
        setUnrecognizedCode(clean);
        setUnrecognizedName(offMetadata.name || '');
        setUnrecognizedSellingPrice(offMetadata.suggestedPrice ? String(offMetadata.suggestedPrice) : '20');
        setUnrecognizedCostPrice(offMetadata.suggestedPrice ? String(Math.round(offMetadata.suggestedPrice * 0.8)) : '16');
      } else {
        setUnrecognizedCode(clean);
        setUnrecognizedName('');
        setUnrecognizedSellingPrice('20');
        setUnrecognizedCostPrice('16');
      }
    } catch {
      setUnrecognizedCode(clean);
      setUnrecognizedName('');
      setUnrecognizedSellingPrice('20');
      setUnrecognizedCostPrice('16');
    } finally {
      setIsSearching(false);
    }
  };

  // Add Unrecognized Product and add to Bill
  const handleSaveAndAddUnrecognized = async () => {
    if (!unrecognizedCode || !unrecognizedName.trim()) {
      Alert.alert('Product Name Required', 'Please enter a name for this product.');
      return;
    }

    const selling = parseFloat(unrecognizedSellingPrice) || 20;
    const cost = parseFloat(unrecognizedCostPrice) || Math.round(selling * 0.8);
    const storeId = user?.storeId || 'demo_store_1';
    const userId = user?.uid || 'cashier';

    setIsSavingNewProduct(true);
    try {
      const newProduct = await addProduct(
        storeId,
        {
          name: unrecognizedName.trim(),
          nameHindi: undefined,
          category: 'snacks-namkeen',
          barcode: unrecognizedCode,
          purchasePrice: cost,
          sellingPrice: selling,
          gstRate: 0,
          unit: 'packet',
          isLoose: false,
          pricePerUnit: selling,
          currentStock: 24,
          minStockAlert: 5,
          imageURL: null,
          isActive: true,
        },
        userId
      );

      // Add directly to cart
      addItem(newProduct, 1);
      setLastAddedToast(`✅ Added 1x "${newProduct.name}" (₹${newProduct.sellingPrice}) to Bill!`);
      setUnrecognizedCode(null);

      // Resume scanning
      setTimeout(() => {
        setIsScanningPaused(false);
      }, 1200);
    } catch (err: any) {
      console.warn('Failed to save new product:', err);
      // Fallback: Add mock product item to cart directly
      const fallbackProd: Product = {
        id: `custom_${Date.now()}`,
        storeId,
        name: unrecognizedName.trim(),
        nameHindi: undefined,
        category: 'general',
        barcode: unrecognizedCode,
        purchasePrice: cost,
        sellingPrice: selling,
        gstRate: 0,
        unit: 'packet',
        isLoose: false,
        pricePerUnit: selling,
        currentStock: 20,
        minStockAlert: 5,
        imageURL: null,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      addItem(fallbackProd, 1);
      setLastAddedToast(`✅ Added 1x "${fallbackProd.name}" (₹${fallbackProd.sellingPrice}) to Bill!`);
      setUnrecognizedCode(null);
      setIsScanningPaused(false);
    } finally {
      setIsSavingNewProduct(false);
    }
  };

  // Pick barcode image from gallery
  const handlePickBarcodeImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        setIsSearching(true);

        try {
          if (Platform.OS === 'web') {
            const reader = new BrowserMultiFormatReader();
            const zxResult = await reader.decodeFromImageUrl(uri);
            if (zxResult) {
              handleProcessBarcode(zxResult.getText());
              return;
            }
          }
        } catch (scanErr) {
          console.warn('Barcode decoding from image failed:', scanErr);
        }

        Alert.alert(
          'Barcode Not Detected',
          'Could not detect 1D barcode automatically from this photo. You can type the barcode number below.',
          [{ text: 'OK' }]
        );
        setIsSearching(false);
      }
    } catch (err: any) {
      Alert.alert('Gallery Error', err.message || 'Could not pick image.');
      setIsSearching(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        {/* Top Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>⚡ POS Barcode Scanner</Text>
            <Text style={styles.headerSub}>
              Point camera at product barcode to add to bill
            </Text>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>✕ Done</Text>
          </TouchableOpacity>
        </View>

        {/* Live Cart Counter Banner */}
        <View style={styles.cartSummaryBanner}>
          <Text style={styles.cartSummaryText}>
            🛒 Current Bill: <Text style={{ fontWeight: '800' }}>{items.length} items</Text> •{' '}
            <Text style={{ fontWeight: '800', color: '#059669' }}>₹{totals.grandTotal.toFixed(2)}</Text>
          </Text>
        </View>

        {/* Success Added Toast Banner */}
        {lastAddedToast && (
          <View style={styles.successToast}>
            <Text style={styles.successToastText}>{lastAddedToast}</Text>
          </View>
        )}

        {/* Scanner Viewfinder Box */}
        <View style={styles.scannerWrapper}>
          {isCameraActive ? (
            <View style={styles.activeCameraContainer}>
              {Platform.OS === 'web' ? (
                <video
                  ref={videoRef as any}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                  }}
                />
              ) : nativePermission?.granted ? (
                <CameraView
                  style={StyleSheet.absoluteFill}
                  facing="back"
                  barcodeScannerSettings={{
                    barcodeTypes: [
                      'ean13',
                      'ean8',
                      'upc_a',
                      'upc_e',
                      'code128',
                      'code39',
                      'qr',
                    ],
                  }}
                  onBarcodeScanned={isScanningPaused ? undefined : ({ data }) => handleProcessBarcode(data)}
                />
              ) : null}

              {/* Viewfinder Centered Target Reticle Box */}
              <View style={styles.viewfinderCenterFrame} pointerEvents="none">
                <View style={styles.cornerTL} />
                <View style={styles.cornerTR} />
                <View style={styles.cornerBL} />
                <View style={styles.cornerBR} />
                <View style={styles.redLaserLine} />
                <View style={styles.targetBadge}>
                  <Text style={styles.targetBadgeText}>🎯 Keep Barcode Inside Box (बारकोड यहाँ रखें)</Text>
                </View>
              </View>

              {/* Stop Camera Button */}
              <TouchableOpacity style={styles.stopCameraBtn} onPress={handleStopCamera}>
                <Text style={styles.stopCameraBtnText}>✕ Close Camera</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Standby Card with Click to Start CTA */
            <View style={styles.standbyCard}>
              <View style={styles.standbyIconBadge}>
                <Text style={styles.standbyIcon}>📷</Text>
              </View>
              <Text style={styles.standbyTitle}>Camera Barcode Scanner</Text>
              <Text style={styles.standbyDesc}>
                Click below to start camera scanner and scan customer grocery items directly into the bill.
              </Text>

              {cameraError ? (
                <View style={styles.cameraErrorBanner}>
                  <Text style={styles.cameraErrorText}>⚠️ {cameraError}</Text>
                </View>
              ) : null}

              <TouchableOpacity style={styles.startScanCTA} onPress={handleStartCamera}>
                <Text style={styles.startScanCTAText}>📸 Click to Start Camera Scanner</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.galleryCTA} onPress={handlePickBarcodeImage}>
                <Text style={styles.galleryCTAText}>🖼️ Or Pick Photo from Gallery</Text>
              </TouchableOpacity>
            </View>
          )}

          {isSearching && (
            <View style={styles.searchingBadge}>
              <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.searchingText}>Searching Product...</Text>
            </View>
          )}
        </View>

        {/* Manual Barcode Entry & FMCG Quick Test Chips */}
        <View style={styles.bottomSection}>
          <Text style={styles.sectionLabel}>Manual Barcode Entry (या नंबर डालें):</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.manualInput}
              placeholder="e.g. 8901058852331"
              value={manualCode}
              onChangeText={setManualCode}
              keyboardType="numeric"
            />
            <TouchableOpacity
              style={styles.addCodeBtn}
              onPress={() => {
                if (manualCode.trim()) {
                  handleProcessBarcode(manualCode.trim());
                  setManualCode('');
                }
              }}
            >
              <Text style={styles.addCodeBtnText}>⚡ Add to Bill</Text>
            </TouchableOpacity>
          </View>

          {/* FMCG Quick Test Chips */}
          <Text style={styles.demoLabel}>Quick FMCG Demos (Click to Scan):</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.demoScroll}>
            {[
              { name: '🍜 Maggi 70g', code: '8901058852331' },
              { name: '🧂 Tata Salt 1kg', code: '8901030000002' },
              { name: '🌾 Atta 5kg', code: '8901030000001' },
              { name: '🌻 Fortune Oil 1L', code: '8906007281014' },
            ].map((chip) => (
              <TouchableOpacity
                key={chip.code}
                style={styles.demoChip}
                onPress={() => handleProcessBarcode(chip.code)}
              >
                <Text style={styles.demoChipText}>{chip.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Done Button */}
          <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
            <Text style={styles.doneBtnText}>
              Done / Return to Bill (Total: ₹{totals.grandTotal.toFixed(2)}) ➔
            </Text>
          </TouchableOpacity>
        </View>

        {/* MODAL: Unrecognized Barcode Quick Add */}
        <Modal
          visible={!!unrecognizedCode}
          transparent
          animationType="slide"
          onRequestClose={() => setUnrecognizedCode(null)}
        >
          <View style={styles.quickAddOverlay}>
            <View style={styles.quickAddContent}>
              <View style={styles.quickAddHeader}>
                <View>
                  <Text style={styles.quickAddTitle}>New Barcode Scanned</Text>
                  <Text style={styles.quickAddSub}>Barcode: {unrecognizedCode}</Text>
                </View>
                <TouchableOpacity onPress={() => setUnrecognizedCode(null)}>
                  <Text style={{ fontSize: 18, color: '#94A3B8' }}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Product Name (उत्पाद का नाम):</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Parle-G Gold 100g"
                value={unrecognizedName}
                onChangeText={setUnrecognizedName}
              />

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Selling MRP (₹):</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="20"
                    keyboardType="numeric"
                    value={unrecognizedSellingPrice}
                    onChangeText={setUnrecognizedSellingPrice}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Buying Cost (₹):</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="16"
                    keyboardType="numeric"
                    value={unrecognizedCostPrice}
                    onChangeText={setUnrecognizedCostPrice}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={styles.saveAndAddBtn}
                onPress={handleSaveAndAddUnrecognized}
                disabled={isSavingNewProduct}
              >
                {isSavingNewProduct ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveAndAddBtnText}>Save & Add to Bill ➔</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 14,
  },
  closeBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  cartSummaryBanner: {
    backgroundColor: '#ECFDF5',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#A7F3D0',
  },
  cartSummaryText: {
    fontSize: 13,
    color: '#065F46',
    fontWeight: '600',
  },
  successToast: {
    backgroundColor: '#059669',
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  successToastText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
    textAlign: 'center',
  },
  scannerWrapper: {
    flex: 1,
    margin: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  activeCameraContainer: {
    flex: 1,
    backgroundColor: '#000000',
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  standbyCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  standbyIconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  standbyIcon: {
    fontSize: 32,
  },
  standbyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  standbyDesc: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    maxWidth: 280,
    marginBottom: 20,
  },
  startScanCTA: {
    backgroundColor: '#10B981',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    width: '100%',
    maxWidth: 300,
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 10,
  },
  startScanCTAText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  galleryCTA: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    width: '100%',
    maxWidth: 300,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  galleryCTAText: {
    color: '#334155',
    fontWeight: '700',
    fontSize: 13,
  },
  stopCameraBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    zIndex: 30,
  },
  stopCameraBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  cameraErrorBanner: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
    width: '100%',
  },
  cameraErrorText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  viewfinderCenterFrame: {
    width: 280,
    height: 180,
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -140 }, { translateY: -90 }],
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },
  cornerTL: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 28,
    height: 28,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#10B981',
    borderTopLeftRadius: 10,
  },
  cornerTR: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 28,
    height: 28,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: '#10B981',
    borderTopRightRadius: 10,
  },
  cornerBL: {
    position: 'absolute',
    bottom: -2,
    left: -2,
    width: 28,
    height: 28,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#10B981',
    borderBottomLeftRadius: 10,
  },
  cornerBR: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 28,
    height: 28,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: '#10B981',
    borderBottomRightRadius: 10,
  },
  redLaserLine: {
    width: '90%',
    height: 3,
    backgroundColor: '#EF4444',
    borderRadius: 2,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 6,
  },
  targetBadge: {
    position: 'absolute',
    bottom: -38,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  targetBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  searchingBadge: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  searchingText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  bottomSection: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  manualInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  addCodeBtn: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addCodeBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  demoLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    marginTop: 12,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  demoScroll: {
    gap: 8,
    paddingBottom: 4,
  },
  demoChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  demoChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  doneBtn: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 14,
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  quickAddOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  quickAddContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },
  quickAddHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  quickAddTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  quickAddSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#0F172A',
  },
  saveAndAddBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  saveAndAddBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
});
