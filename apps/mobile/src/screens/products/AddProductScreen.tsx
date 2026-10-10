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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  PRODUCT_CATEGORIES,
  PRODUCT_UNITS,
  GST_RATES,
  ProductUnit,
} from '@kirana-pro/shared';
import { addProduct } from '../../services/product';
import { useAuthStore } from '../../store/authStore';

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

    const effectiveStoreId = user?.storeId || 'demo_store_1';
    const effectiveUserId = user?.uid || 'user_1';

    setLoading(true);
    try {
      await addProduct(
        effectiveStoreId,
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
        effectiveUserId
      );

      navigation.goBack();
    } catch (err: any) {
      console.error('Add product error:', err);
      setErrorMsg(err.message || 'Failed to save product locally');
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
              <Feather name="alert-circle" size={15} color="#EA5455" style={{ marginRight: 6 }} />
              <Text style={styles.errorText}>{errorMsg}</Text>
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
                  placeholderTextColor="#82808B"
                  keyboardType="numeric"
                  value={barcode}
                  onChangeText={setBarcode}
                />
              </View>
              <TouchableOpacity
                style={styles.scanBtn}
                onPress={() => navigation.navigate('BarcodeScanner')}
                activeOpacity={0.85}
              >
                <Feather name="camera" size={16} color="#7367F0" style={{ marginRight: 6 }} />
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
              placeholderTextColor="#82808B"
              value={name}
              onChangeText={setName}
            />

            <Text style={[styles.fieldLabel, { marginTop: 12 }]}>HINDI NAME (OPTIONAL)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. मैगी मसाला"
              placeholderTextColor="#82808B"
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
                  activeOpacity={0.8}
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
                <Text style={styles.toggleTitle}>Loose / By Weight (Taraju)</Text>
                <Text style={styles.toggleSub}>
                  Sold loose (chawal, dal, cheeni). Enables 1-tap price-to-weight calculation.
                </Text>
              </View>
              <Switch
                value={isLoose}
                onValueChange={handleToggleLoose}
                trackColor={{ false: '#DBDADE', true: '#7367F0' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputBox, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.fieldLabel}>SELLING PRICE (₹) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 50"
                  placeholderTextColor="#82808B"
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
                  placeholderTextColor="#82808B"
                  keyboardType="numeric"
                  value={purchasePrice}
                  onChangeText={setPurchasePrice}
                />
              </View>
            </View>

            {sellingPrice && purchasePrice ? (
              <View style={styles.profitBannerBox}>
                {parseFloat(sellingPrice) >= parseFloat(purchasePrice) ? (
                  <Text style={styles.profitBannerGain}>
                    Expected Profit: ₹{(parseFloat(sellingPrice) - parseFloat(purchasePrice)).toFixed(2)} / unit (
                    {(((parseFloat(sellingPrice) - parseFloat(purchasePrice)) / parseFloat(sellingPrice)) * 100).toFixed(1)}% margin)
                  </Text>
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Feather name="alert-triangle" size={13} color="#EA5455" style={{ marginRight: 4 }} />
                    <Text style={styles.profitBannerLoss}>
                      Selling price is less than buying price (Loss: ₹
                      {(parseFloat(purchasePrice) - parseFloat(sellingPrice)).toFixed(2)}/unit)
                    </Text>
                  </View>
                )}
              </View>
            ) : null}

            <Text style={[styles.fieldLabel, { marginTop: 12 }]}>UNIT</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillRow}>
              {PRODUCT_UNITS.map((u) => (
                <TouchableOpacity
                  key={u.value}
                  style={[styles.smallPill, unit === u.value && styles.smallPillActive]}
                  onPress={() => setUnit(u.value as ProductUnit)}
                  activeOpacity={0.8}
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
                  activeOpacity={0.8}
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
                  placeholderTextColor="#82808B"
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
                  placeholderTextColor="#82808B"
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
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Feather name="check" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.saveBtnText}>Save to Catalog</Text>
              </View>
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
    backgroundColor: '#F8F7FA',
  },
  container: {
    flex: 1,
  },
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
  errorBox: {
    backgroundColor: '#FCE4E4',
    borderWidth: 1,
    borderColor: '#EA5455',
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    color: '#EA5455',
    fontSize: 13,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: '#DBDADE',
    marginBottom: 14,
  },
  cardHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4B465C',
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#82808B',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#F8F7FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DBDADE',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '600',
    color: '#4B465C',
  },
  barcodeRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDEBFD',
    borderWidth: 1,
    borderColor: '#7367F0',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 8,
  },
  scanBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7367F0',
  },
  pillRow: {
    flexDirection: 'row',
    marginTop: 4,
    marginBottom: 8,
  },
  smallPill: {
    backgroundColor: '#F8F7FA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#DBDADE',
  },
  smallPillActive: {
    backgroundColor: '#7367F0',
    borderColor: '#7367F0',
  },
  smallPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5D596C',
  },
  smallPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  looseToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDEBFD',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(115, 103, 240, 0.2)',
    marginBottom: 14,
  },
  toggleTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7367F0',
  },
  toggleSub: {
    fontSize: 11,
    color: '#5D596C',
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
    backgroundColor: '#F8F7FA',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DBDADE',
  },
  gstPillActive: {
    backgroundColor: '#7367F0',
    borderColor: '#7367F0',
  },
  gstText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5D596C',
  },
  gstTextActive: {
    color: '#FFFFFF',
  },
  saveBtn: {
    backgroundColor: '#7367F0',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7367F0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
    marginTop: 8,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  profitBannerBox: {
    backgroundColor: '#E8FADF',
    borderWidth: 1,
    borderColor: '#28C76F',
    borderRadius: 6,
    padding: 10,
    marginTop: 8,
  },
  profitBannerGain: {
    fontSize: 12,
    fontWeight: '600',
    color: '#28C76F',
  },
  profitBannerLoss: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EA5455',
  },
});

