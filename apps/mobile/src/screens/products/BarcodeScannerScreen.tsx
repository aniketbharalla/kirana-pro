import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions, Camera } from 'expo-camera';
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { useProductStore } from '../../store/productStore';
import { useAuthStore } from '../../store/authStore';
import { fetchProductByBarcode, ScannedProductMetadata } from '../../services/openFoodFacts';
import { recordStockMovement } from '../../services/stock';
import { addProduct } from '../../services/product';
import { Product } from '@kirana-pro/shared';
import { colors } from '../../theme';

export const BarcodeScannerScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const { findByBarcode } = useProductStore();

  const [nativePermission, requestNativePermission] = useCameraPermissions();
  const [manualCode, setManualCode] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isScanningPaused, setIsScanningPaused] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Controlled camera state: camera only starts when user clicks "Start Camera" CTA!
  const [isCameraActive, setIsCameraActive] = useState(false);

  // Web camera & ZXing references
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const zxingControlsRef = useRef<IScannerControls | null>(null);
  const isScanningPausedRef = useRef(false);
  isScanningPausedRef.current = isScanningPaused;

  // Modal 1: Existing Product found -> Quick Stock Increment & Price update
  const [existingProduct, setExistingProduct] = useState<Product | null>(null);
  const [stockIncrement, setStockIncrement] = useState<number>(5);
  const [updatingStock, setUpdatingStock] = useState(false);

  // Modal 2: Product found from Open Food Facts -> Add with Buying & Selling Price
  const [openFoodProduct, setOpenFoodProduct] = useState<ScannedProductMetadata | null>(null);
  const [newSellingPrice, setNewSellingPrice] = useState('20');
  const [newPurchasePrice, setNewPurchasePrice] = useState('16');
  const [newInitialStock, setNewInitialStock] = useState('10');
  const [addingNewProduct, setAddingNewProduct] = useState(false);

  // Modal 3: Unrecognized Barcode -> Quick Manual Add with Buying/Selling Price & Profit
  const [manualAddBarcode, setManualAddBarcode] = useState<string | null>(null);
  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] = useState('General');
  const [customSellingPrice, setCustomSellingPrice] = useState('30');
  const [customPurchasePrice, setCustomPurchasePrice] = useState('24');
  const [customStock, setCustomStock] = useState('10');
  const [savingCustomProduct, setSavingCustomProduct] = useState(false);

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
                : 'Could not start camera on this device. You can type the barcode or upload from gallery.'
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
    return () => {
      if (zxingControlsRef.current) {
        zxingControlsRef.current.stop();
        zxingControlsRef.current = null;
      }
    };
  }, []);

  // Retail POS scanner audio chirp beep and vibration feedback
  const playScanBeep = () => {
    try {
      if (typeof window !== 'undefined') {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(1760, ctx.currentTime); // High crisp A6 1760Hz POS chirp
          gain.gain.setValueAtTime(0.3, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.14);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.14);
        }
      }
    } catch (e) {
      console.warn('Audio scan beep error:', e);
    }
  };

  const triggerScanSuccessFeedback = () => {
    // 1. Audio Beep
    playScanBeep();

    // 2. Vibration Feedback (Web & Native)
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

  // Main barcode processor
  const handleProcessBarcode = async (rawBarcode: string) => {
    const clean = rawBarcode.trim();
    if (!clean) return;

    triggerScanSuccessFeedback();
    setIsScanningPaused(true);

    // 1. Check if product already exists in current Dukaan catalog
    const existing = findByBarcode(clean);
    if (existing) {
      setExistingProduct(existing);
      setStockIncrement(5);
      return;
    }

    // 2. Query Open Food Facts free database
    setIsSearching(true);
    try {
      const offMetadata = await fetchProductByBarcode(clean);
      if (offMetadata) {
        setOpenFoodProduct(offMetadata);
        setNewSellingPrice('20');
        setNewPurchasePrice('16');
        setNewInitialStock('10');
      } else {
        // Not in Open Food Facts -> Open quick custom add modal
        setManualAddBarcode(clean);
        setCustomName('');
        setCustomSellingPrice('30');
        setCustomPurchasePrice('24');
        setCustomStock('10');
      }
    } catch (err) {
      console.warn('Scan lookup error:', err);
      setManualAddBarcode(clean);
    } finally {
      setIsSearching(false);
    }
  };

  // Native camera barcode detection callback
  const handleNativeBarcodeScanned = ({ data }: { data: string }) => {
    if (isScanningPaused || !data) return;
    handleProcessBarcode(data);
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
          } else if (Camera && typeof Camera.scanFromURLAsync === 'function') {
            const barcodes = await Camera.scanFromURLAsync(uri);
            if (barcodes && barcodes.length > 0) {
              handleProcessBarcode(barcodes[0].data);
              return;
            }
          }
        } catch (scanErr) {
          console.warn('Barcode decoding from image failed:', scanErr);
        }

        Alert.alert(
          'Barcode Not Detected',
          'Could not detect standard 1D barcode automatically from this photo. You can type the numbers printed below the barcode stripes.',
          [{ text: 'OK' }]
        );
        setIsSearching(false);
      }
    } catch (err: any) {
      Alert.alert('Gallery Error', err.message || 'Could not pick image.');
      setIsSearching(false);
    }
  };

  // Profit calculations
  const calculateProfit = (selling: string, buying: string) => {
    const s = parseFloat(selling) || 0;
    const b = parseFloat(buying) || 0;
    const profit = Math.round((s - b) * 100) / 100;
    const margin = s > 0 ? Math.round(((s - b) / s) * 1000) / 10 : 0;
    return { s, b, profit, margin };
  };

  // Action: Increment Stock on Existing Item
  const handleConfirmStockUpdate = async () => {
    if (!existingProduct || !user?.storeId) return;
    setUpdatingStock(true);

    try {
      await recordStockMovement(user.storeId, existingProduct.id, {
        type: 'in',
        quantity: stockIncrement,
        reason: 'purchase',
        note: `Restocked +${stockIncrement} ${existingProduct.unit}`,
        performedBy: user.uid,
      });

      Alert.alert(
        'Stock Updated! ✓',
        `Added +${stockIncrement} ${existingProduct.unit} to ${existingProduct.name}.\nNew Total Stock: ${
          existingProduct.currentStock + stockIncrement
        } ${existingProduct.unit}.`
      );

      setExistingProduct(null);
      setIsScanningPaused(false);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not update stock');
    } finally {
      setUpdatingStock(false);
    }
  };

  // Action: Add Item pre-filled from Open Food Facts with Buying & Selling Price
  const handleConfirmAddOpenFoodProduct = async () => {
    if (!openFoodProduct || !user?.storeId) return;

    const sPrice = parseFloat(newSellingPrice);
    if (isNaN(sPrice) || sPrice <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid Selling Price');
      return;
    }

    const pPrice = parseFloat(newPurchasePrice) || 0;
    const initStock = parseFloat(newInitialStock) || 0;
    setAddingNewProduct(true);

    try {
      await addProduct(
        user.storeId,
        {
          name: openFoodProduct.name,
          category: 'snacks-namkeen',
          barcode: openFoodProduct.barcode,
          purchasePrice: pPrice,
          sellingPrice: sPrice,
          gstRate: 0,
          unit: 'packet',
          isLoose: false,
          pricePerUnit: sPrice,
          currentStock: initStock,
          minStockAlert: 5,
          imageURL: openFoodProduct.imageUrl || null,
          isActive: true,
        },
        user.uid
      );

      const { profit, margin } = calculateProfit(newSellingPrice, newPurchasePrice);
      Alert.alert(
        'Product Added! 🎉',
        `"${openFoodProduct.name}" added to catalog!\nBuying Price: ₹${pPrice.toFixed(2)} • Selling Price: ₹${sPrice.toFixed(2)}\nProfit: ₹${profit.toFixed(2)}/unit (${margin}% margin)`
      );

      setOpenFoodProduct(null);
      setIsScanningPaused(false);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not add product');
    } finally {
      setAddingNewProduct(false);
    }
  };

  // Action: Save Unrecognized Custom Barcode Product
  const handleConfirmAddCustomProduct = async () => {
    if (!manualAddBarcode || !user?.storeId) return;

    if (!customName.trim()) {
      Alert.alert('Product Name Required', 'Please enter a name for this product.');
      return;
    }

    const sPrice = parseFloat(customSellingPrice);
    if (isNaN(sPrice) || sPrice <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid Selling Price');
      return;
    }

    const pPrice = parseFloat(customPurchasePrice) || 0;
    const stock = parseFloat(customStock) || 0;
    setSavingCustomProduct(true);

    try {
      await addProduct(
        user.storeId,
        {
          name: customName.trim(),
          category: customCategory,
          barcode: manualAddBarcode,
          purchasePrice: pPrice,
          sellingPrice: sPrice,
          gstRate: 0,
          unit: 'piece',
          isLoose: false,
          pricePerUnit: sPrice,
          currentStock: stock,
          minStockAlert: 5,
          imageURL: null,
          isActive: true,
        },
        user.uid
      );

      const { profit, margin } = calculateProfit(customSellingPrice, customPurchasePrice);
      Alert.alert(
        'Product Saved! 🎉',
        `"${customName}" added to Dukaan!\nWholesale Buying: ₹${pPrice.toFixed(2)} | Selling: ₹${sPrice.toFixed(2)}\nProfit: ₹${profit.toFixed(2)}/unit (${margin}% margin)`
      );

      setManualAddBarcode(null);
      setIsScanningPaused(false);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not save product');
    } finally {
      setSavingCustomProduct(false);
    }
  };

  const offProfitCalc = calculateProfit(newSellingPrice, newPurchasePrice);
  const customProfitCalc = calculateProfit(customSellingPrice, customPurchasePrice);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Scanner Card */}
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
                  style={StyleSheet.absoluteFillObject}
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
                  onBarcodeScanned={isScanningPaused ? undefined : handleNativeBarcodeScanned}
                />
              ) : null}

              {/* Viewfinder Target Framing Box (Shows exact location where to position barcode) */}
              <View style={styles.viewfinderCenterFrame} pointerEvents="none">
                {/* 4 Green Corner Brackets */}
                <View style={styles.cornerTL} />
                <View style={styles.cornerTR} />
                <View style={styles.cornerBL} />
                <View style={styles.cornerBR} />

                {/* Animated Red Laser Scan Line */}
                <View style={styles.redLaserLine} />

                {/* Instruction Pill */}
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
              <Text style={styles.standbyTitle}>Smart Product Barcode Scanner</Text>
              <Text style={styles.standbyDesc}>
                Scan any Indian FMCG package (Maggi, Parle-G, Chips, Soap) to auto-fill details and track buying/selling profits.
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

          {/* Searching Badge */}
          {isSearching && (
            <View style={styles.searchingBadge}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.searchingText}>Searching Catalog & Open Food Facts...</Text>
            </View>
          )}
        </View>

        {/* Manual Barcode Input & Quick Demos */}
        <View style={styles.bottomControls}>
          <Text style={styles.controlHeader}>Manual Barcode Entry (या बारकोड नंबर डालें)</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.barcodeInput}
              placeholder="e.g. 8901030000001"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              value={manualCode}
              onChangeText={setManualCode}
            />
            <TouchableOpacity
              style={styles.processBtn}
              onPress={() => handleProcessBarcode(manualCode)}
              disabled={isSearching}
            >
              <Text style={styles.processBtnText}>Verify</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Barcode Demo Buttons */}
          <Text style={styles.demoHeading}>💡 Quick FMCG Barcodes to Test:</Text>
          <View style={styles.demoChipsRow}>
            <TouchableOpacity
              style={styles.demoChip}
              onPress={() => {
                setManualCode('8901030000001');
                handleProcessBarcode('8901030000001');
              }}
            >
              <Text style={styles.demoChipText}>🍜 Maggi (8901030000001)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.demoChip}
              onPress={() => {
                setManualCode('8901491101837');
                handleProcessBarcode('8901491101837');
              }}
            >
              <Text style={styles.demoChipText}>🥔 Lay's Chips</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.demoChip}
              onPress={() => {
                setManualCode('8901719101037');
                handleProcessBarcode('8901719101037');
              }}
            >
              <Text style={styles.demoChipText}>🍪 Parle-G</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.demoChip}
              onPress={() => {
                setManualCode('8901030383708');
                handleProcessBarcode('8901030383708');
              }}
            >
              <Text style={styles.demoChipText}>🧴 Dettol Soap</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* MODAL 1: Existing Product Scanned -> Quick Restock & Details */}
        <Modal
          visible={!!existingProduct}
          transparent
          animationType="slide"
          onRequestClose={() => {
            setExistingProduct(null);
            setIsScanningPaused(false);
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalBadge}>
                <Text style={styles.modalBadgeText}>✓ PRODUCT FOUND IN DUKAAN</Text>
              </View>
              <Text style={styles.modalTitle}>{existingProduct?.name}</Text>
              <Text style={styles.modalSub}>
                Current Stock: <Text style={{ fontWeight: '800' }}>{existingProduct?.currentStock} {existingProduct?.unit}</Text> • Retail Selling: <Text style={{ fontWeight: '800', color: colors.primaryDark }}>₹{existingProduct?.sellingPrice.toFixed(2)}</Text>
              </Text>

              {/* Profit Insight */}
              <View style={styles.profitBanner}>
                <Text style={styles.profitBannerText}>
                  Buying Cost: ₹{(existingProduct?.purchasePrice || 0).toFixed(2)} • Profit Margin: ₹{((existingProduct?.sellingPrice || 0) - (existingProduct?.purchasePrice || 0)).toFixed(2)} ({existingProduct?.sellingPrice ? (((existingProduct.sellingPrice - (existingProduct.purchasePrice || 0)) / existingProduct.sellingPrice) * 100).toFixed(1) : 0}%)
                </Text>
              </View>

              <Text style={styles.stepperLabel}>Add Inward Stock Quantity:</Text>
              <View style={styles.stepperRow}>
                {[1, 5, 10, 25, 50].map((num) => (
                  <TouchableOpacity
                    key={num}
                    style={[
                      styles.stepperChip,
                      stockIncrement === num && styles.stepperChipActive,
                    ]}
                    onPress={() => setStockIncrement(num)}
                  >
                    <Text
                      style={[
                        styles.stepperText,
                        stockIncrement === num && styles.stepperTextActive,
                      ]}
                    >
                      +{num}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => {
                    setExistingProduct(null);
                    setIsScanningPaused(false);
                  }}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.confirmBtn}
                  onPress={handleConfirmStockUpdate}
                  disabled={updatingStock}
                >
                  {updatingStock ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.confirmBtnText}>
                      Update Stock (+{stockIncrement})
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* MODAL 2: Product Found in Open Food Facts -> Ask Buying & Selling Price with Live Profit */}
        <Modal
          visible={!!openFoodProduct}
          transparent
          animationType="slide"
          onRequestClose={() => {
            setOpenFoodProduct(null);
            setIsScanningPaused(false);
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={[styles.modalBadge, { backgroundColor: '#ECFDF5' }]}>
                <Text style={[styles.modalBadgeText, { color: '#065F46' }]}>
                  🌐 FOUND IN OPEN FOOD FACTS
                </Text>
              </View>

              <View style={styles.offRow}>
                {openFoodProduct?.imageUrl ? (
                  <Image
                    source={{ uri: openFoodProduct.imageUrl }}
                    style={styles.offImage}
                  />
                ) : (
                  <View style={styles.offPlaceholder}>
                    <Text style={{ fontSize: 24 }}>📦</Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitle}>{openFoodProduct?.name}</Text>
                  {openFoodProduct?.brand && (
                    <Text style={styles.offBrand}>Brand: {openFoodProduct.brand}</Text>
                  )}
                  <Text style={styles.offBarcode}>Barcode: {openFoodProduct?.barcode}</Text>
                </View>
              </View>

              {/* Buying Price & Selling Price Inputs */}
              <View style={styles.formRow}>
                <View style={{ flex: 1, marginRight: 6 }}>
                  <Text style={styles.inputMiniLabel}>BUYING PRICE (₹) *</Text>
                  <TextInput
                    style={styles.miniInput}
                    placeholder="16"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    value={newPurchasePrice}
                    onChangeText={setNewPurchasePrice}
                  />
                  <Text style={styles.inputHint}>Wholesale Cost</Text>
                </View>

                <View style={{ flex: 1, marginHorizontal: 6 }}>
                  <Text style={styles.inputMiniLabel}>SELLING PRICE (₹) *</Text>
                  <TextInput
                    style={styles.miniInput}
                    placeholder="20"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    value={newSellingPrice}
                    onChangeText={setNewSellingPrice}
                  />
                  <Text style={styles.inputHint}>MRP / Retail</Text>
                </View>

                <View style={{ flex: 1, marginLeft: 6 }}>
                  <Text style={styles.inputMiniLabel}>INITIAL STOCK</Text>
                  <TextInput
                    style={styles.miniInput}
                    placeholder="10"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    value={newInitialStock}
                    onChangeText={setNewInitialStock}
                  />
                  <Text style={styles.inputHint}>Units Inward</Text>
                </View>
              </View>

              {/* Real-time Profit & Margin Calculator */}
              <View
                style={[
                  styles.profitCard,
                  offProfitCalc.profit < 0 ? styles.lossCard : styles.gainCard,
                ]}
              >
                <View style={styles.profitHeader}>
                  <Text style={styles.profitTitle}>
                    {offProfitCalc.profit < 0 ? '⚠️ SELLING AT LOSS' : '📊 PROFIT & MARGIN'}
                  </Text>
                  <Text
                    style={[
                      styles.profitMarginBadge,
                      offProfitCalc.profit < 0 ? styles.lossBadge : styles.gainBadge,
                    ]}
                  >
                    {offProfitCalc.margin}% Margin
                  </Text>
                </View>
                <Text style={styles.profitMainText}>
                  Profit per Unit: <Text style={{ fontWeight: '900' }}>₹{offProfitCalc.profit.toFixed(2)}</Text>
                </Text>
                <Text style={styles.profitSubText}>
                  Expected batch profit on {newInitialStock || 0} units: ₹
                  {(offProfitCalc.profit * (parseFloat(newInitialStock) || 0)).toFixed(2)}
                </Text>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => {
                    setOpenFoodProduct(null);
                    setIsScanningPaused(false);
                  }}
                >
                  <Text style={styles.cancelBtnText}>Dismiss</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.confirmBtn, { backgroundColor: '#059669' }]}
                  onPress={handleConfirmAddOpenFoodProduct}
                  disabled={addingNewProduct}
                >
                  {addingNewProduct ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.confirmBtnText}>+ Save to Dukaan</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* MODAL 3: Custom / Unrecognized Barcode Quick Add Form */}
        <Modal
          visible={!!manualAddBarcode}
          transparent
          animationType="slide"
          onRequestClose={() => {
            setManualAddBarcode(null);
            setIsScanningPaused(false);
          }}
        >
          <View style={styles.modalOverlay}>
            <ScrollView style={styles.customAddScroll} contentContainerStyle={styles.modalCard}>
              <View style={[styles.modalBadge, { backgroundColor: '#FEF3C7' }]}>
                <Text style={[styles.modalBadgeText, { color: '#92400E' }]}>
                  📝 NEW BARCODE: {manualAddBarcode}
                </Text>
              </View>

              <Text style={styles.modalTitle}>Add Custom Item to Catalog</Text>
              <Text style={styles.modalSub}>
                Enter the product name, wholesale buying price, and retail selling price:
              </Text>

              <Text style={styles.inputMiniLabel}>PRODUCT NAME *</Text>
              <TextInput
                style={styles.textInputFull}
                placeholder="e.g. Local Sweets / Rice 1kg"
                placeholderTextColor="#94A3B8"
                value={customName}
                onChangeText={setCustomName}
              />

              {/* Buying & Selling Price Inputs */}
              <View style={[styles.formRow, { marginTop: 12 }]}>
                <View style={{ flex: 1, marginRight: 6 }}>
                  <Text style={styles.inputMiniLabel}>BUYING PRICE (₹) *</Text>
                  <TextInput
                    style={styles.miniInput}
                    placeholder="24"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    value={customPurchasePrice}
                    onChangeText={setCustomPurchasePrice}
                  />
                  <Text style={styles.inputHint}>Wholesale Cost</Text>
                </View>

                <View style={{ flex: 1, marginHorizontal: 6 }}>
                  <Text style={styles.inputMiniLabel}>SELLING PRICE (₹) *</Text>
                  <TextInput
                    style={styles.miniInput}
                    placeholder="30"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    value={customSellingPrice}
                    onChangeText={setCustomSellingPrice}
                  />
                  <Text style={styles.inputHint}>Retail MRP</Text>
                </View>

                <View style={{ flex: 1, marginLeft: 6 }}>
                  <Text style={styles.inputMiniLabel}>STOCK QTY</Text>
                  <TextInput
                    style={styles.miniInput}
                    placeholder="10"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    value={customStock}
                    onChangeText={setCustomStock}
                  />
                  <Text style={styles.inputHint}>Units Inward</Text>
                </View>
              </View>

              {/* Profit & Margin Card */}
              <View
                style={[
                  styles.profitCard,
                  customProfitCalc.profit < 0 ? styles.lossCard : styles.gainCard,
                  { marginTop: 12 },
                ]}
              >
                <View style={styles.profitHeader}>
                  <Text style={styles.profitTitle}>
                    {customProfitCalc.profit < 0 ? '⚠️ SELLING AT LOSS' : '📊 PROFIT PER UNIT'}
                  </Text>
                  <Text
                    style={[
                      styles.profitMarginBadge,
                      customProfitCalc.profit < 0 ? styles.lossBadge : styles.gainBadge,
                    ]}
                  >
                    {customProfitCalc.margin}% Margin
                  </Text>
                </View>
                <Text style={styles.profitMainText}>
                  Profit: <Text style={{ fontWeight: '900' }}>₹{customProfitCalc.profit.toFixed(2)}</Text> / unit
                </Text>
              </View>

              <View style={[styles.modalActions, { marginTop: 18 }]}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => {
                    setManualAddBarcode(null);
                    setIsScanningPaused(false);
                  }}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
                  onPress={handleConfirmAddCustomProduct}
                  disabled={savingCustomProduct}
                >
                  {savingCustomProduct ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.confirmBtnText}>✓ Save to Dukaan</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </Modal>
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
    justifyContent: 'space-between',
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
    bottom: -40,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    paddingHorizontal: 12,
    paddingVertical: 6,
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
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
    elevation: 5,
    zIndex: 20,
  },
  searchingText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  bottomControls: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  controlHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  barcodeInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  processBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: 20,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  processBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  demoHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 8,
  },
  demoChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  demoChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  demoChipText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  customAddScroll: {
    maxHeight: '90%',
  },
  modalBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 10,
  },
  modalBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#166534',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 14,
  },
  profitBanner: {
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 14,
  },
  profitBannerText: {
    fontSize: 12,
    color: '#1E40AF',
    fontWeight: '700',
  },
  stepperLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  stepperRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  stepperChip: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  stepperChipActive: {
    backgroundColor: '#10B981',
    borderColor: '#059669',
  },
  stepperText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  stepperTextActive: {
    color: '#FFFFFF',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  confirmBtn: {
    flex: 1,
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  offRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  offImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
  },
  offPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  offBrand: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  offBarcode: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  formRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  inputMiniLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 4,
  },
  inputHint: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  miniInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  textInputFull: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 10,
  },
  profitCard: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  gainCard: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  lossCard: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  profitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  profitTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#065F46',
  },
  profitMarginBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    fontSize: 11,
    fontWeight: '800',
  },
  gainBadge: {
    backgroundColor: '#10B981',
    color: '#FFFFFF',
  },
  lossBadge: {
    backgroundColor: '#EF4444',
    color: '#FFFFFF',
  },
  profitMainText: {
    fontSize: 13,
    color: '#065F46',
    fontWeight: '600',
  },
  profitSubText: {
    fontSize: 11,
    color: '#047857',
    marginTop: 2,
  },
});
