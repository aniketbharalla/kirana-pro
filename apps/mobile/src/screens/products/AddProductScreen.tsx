import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Switch,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  PRODUCT_CATEGORIES,
  PRODUCT_UNITS,
  GST_RATES,
  ProductUnit,
} from '@kirana-pro/shared';
import { addProduct } from '../../services/product';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../theme';

export const AddProductScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form fields
  const [name, setName] = useState('');
  const [nameHindi, setNameHindi] = useState('');
  const [category, setCategory] = useState(PRODUCT_CATEGORIES[0].id);
  const [barcode, setBarcode] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [gstRate, setGstRate] = useState<number>(0);
  const [unit, setUnit] = useState<ProductUnit>('packet');
  const [isLoose, setIsLoose] = useState<boolean>(false);
  const [currentStock, setCurrentStock] = useState('10');
  const [minStockAlert, setMinStockAlert] = useState('5');

  // Check if routed with pre-filled data (e.g. from Barcode Scanner / Open Food Facts)
  useEffect(() => {
    if (route.params) {
      if (route.params.barcode) setBarcode(route.params.barcode);
      if (route.params.name) setName(route.params.name);
      if (route.params.isLoose !== undefined) setIsLoose(route.params.isLoose);
      if (route.params.unit) setUnit(route.params.unit);
    }
  }, [route.params]);

  // If loose product toggled on, auto default unit to kg
  const handleToggleLoose = (val: boolean) => {
    setIsLoose(val);
    if (val) {
      setUnit('kg');
    }
  };

  const handleSave = async () => {
    setErrorMsg('');
    if (!name.trim()) {
      setErrorMsg('Please enter product name');
      return;
    }

    const sPrice = parseFloat(sellingPrice);
    if (isNaN(sPrice) || sPrice < 0) {
      setErrorMsg('Please enter a valid selling price');
      return;
    }

    const pPrice = purchasePrice.trim() ? parseFloat(purchasePrice) : sPrice * 0.8;
    const initialStock = currentStock.trim() ? parseFloat(currentStock) : 0;
    const alertLevel = minStockAlert.trim() ? parseFloat(minStockAlert) : 5;

    if (!user?.storeId) {
      setErrorMsg('No active store detected. Please set up store first.');
      return;
    }

    setLoading(true);
    try {
      await addProduct(
        user.storeId,
        {
          name: name.trim(),
          nameHindi: nameHindi.trim() || undefined,
          category,
          barcode: barcode.trim() || null,
          purchasePrice: pPrice,
          sellingPrice: sPrice,
          gstRate,
          unit,
          isLoose,
          pricePerUnit: sPrice,
          currentStock: initialStock,
          minStockAlert: alertLevel,
          imageURL: null,
          isActive: true,
        },
        user.uid
      );

      navigation.goBack();
    } catch (err: any) {
      console.error('Add product error:', err);
      setErrorMsg(err.message || 'Failed to save product');
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          {errorMsg ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
            </View>
          ) : null}

          {/* Barcode section with quick scan trigger */}
          <View style={styles.card}>
            <View style={styles.barcodeRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>BARCODE (EAN/UPC)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Scan or type barcode"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={barcode}
                  onChangeText={setBarcode}
                />
              </View>
              <TouchableOpacity
                style={styles.scanBtn}
                onPress={() => navigation.navigate('BarcodeScanner')}
              >
                <Text style={styles.scanBtnIcon}>📷</Text>
                <Text style={styles.scanBtnText}>Scan</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Product Basic Info */}
          <View style={styles.card}>
            <Text style={styles.cardHeader}>Item Details</Text>
            <Text style={styles.fieldLabel}>PRODUCT NAME *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Maggi Masala Noodles 70g"
              placeholderTextColor="#94A3B8"
              value={name}
              onChangeText={setName}
            />

            <Text style={[styles.fieldLabel, { marginTop: 12 }]}>HINDI NAME (OPTIONAL)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. मैगी मसाला"
              placeholderTextColor="#94A3B8"
              value={nameHindi}
              onChangeText={setNameHindi}
            />

            <Text style={[styles.fieldLabel, { marginTop: 12 }]}>CATEGORY</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillRow}>
              {PRODUCT_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.smallPill, category === cat.id && styles.smallPillActive]}
                  onPress={() => setCategory(cat.id)}
                >
                  <Text
                    style={[styles.smallPillText, category === cat.id && styles.smallPillTextActive]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Pricing & Measuring Unit */}
          <View style={styles.card}>
            <Text style={styles.cardHeader}>Pricing & Measuring</Text>

            <View style={styles.looseToggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleTitle}>⚖️ Loose / By Weight (Taraju)</Text>
                <Text style={styles.toggleSub}>
                  Sold loose (chawal, dal, cheeni). Enables 1-tap price-to-weight calculation.
                </Text>
              </View>
              <Switch
                value={isLoose}
                onValueChange={handleToggleLoose}
                trackColor={{ false: '#E2E8F0', true: '#10B981' }}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputBox, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.fieldLabel}>SELLING PRICE (₹) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 50"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={sellingPrice}
                  onChangeText={setSellingPrice}
                />
              </View>

              <View style={[styles.inputBox, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.fieldLabel}>PURCHASE PRICE (₹)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 42"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={purchasePrice}
                  onChangeText={setPurchasePrice}
                />
              </View>
            </View>

            <Text style={[styles.fieldLabel, { marginTop: 12 }]}>UNIT</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillRow}>
              {PRODUCT_UNITS.map((u) => (
                <TouchableOpacity
                  key={u.value}
                  style={[styles.smallPill, unit === u.value && styles.smallPillActive]}
                  onPress={() => setUnit(u.value as ProductUnit)}
                >
                  <Text
                    style={[styles.smallPillText, unit === u.value && styles.smallPillTextActive]}
                  >
                    {u.label} ({u.labelHindi})
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.fieldLabel, { marginTop: 12 }]}>GST RATE (%)</Text>
            <View style={styles.gstRow}>
              {GST_RATES.map((rate) => (
                <TouchableOpacity
                  key={rate}
                  style={[styles.gstPill, gstRate === rate && styles.gstPillActive]}
                  onPress={() => setGstRate(rate)}
                >
                  <Text style={[styles.gstText, gstRate === rate && styles.gstTextActive]}>
                    {rate}%
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Stock Tracking */}
          <View style={styles.card}>
            <Text style={styles.cardHeader}>Stock & Inventory</Text>
            <View style={styles.row}>
              <View style={[styles.inputBox, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.fieldLabel}>INITIAL STOCK</Text>
                <TextInput
                  style={styles.input}
                  placeholder="10"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={currentStock}
                  onChangeText={setCurrentStock}
                />
              </View>

              <View style={[styles.inputBox, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.fieldLabel}>LOW STOCK ALERT AT</Text>
                <TextInput
                  style={styles.input}
                  placeholder="5"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={minStockAlert}
                  onChangeText={setMinStockAlert}
                />
              </View>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
            activeOpacity={0.88}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveBtnText}>✓ Save to Catalog</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
  },
  scroll: {
    padding: 18,
    paddingBottom: 40,
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  cardHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  barcodeRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
  },
  scanBtnIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  scanBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#065F46',
  },
  pillRow: {
    flexDirection: 'row',
    marginTop: 4,
    marginBottom: 8,
  },
  smallPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    marginRight: 8,
  },
  smallPillActive: {
    backgroundColor: '#10B981',
  },
  smallPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  smallPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  looseToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: 14,
  },
  toggleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#166534',
  },
  toggleSub: {
    fontSize: 11,
    color: '#15803D',
    marginTop: 2,
    paddingRight: 10,
  },
  row: {
    flexDirection: 'row',
  },
  inputBox: {
    marginBottom: 4,
  },
  gstRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  gstPill: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  gstPillActive: {
    backgroundColor: '#10B981',
    borderColor: '#059669',
  },
  gstText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  gstTextActive: {
    color: '#FFFFFF',
  },
  saveBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
    marginTop: 8,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
