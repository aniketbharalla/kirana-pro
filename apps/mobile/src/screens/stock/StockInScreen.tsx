import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useProductStore } from '../../store/productStore';
import { useAuthStore } from '../../store/authStore';
import { recordStockMovement } from '../../services/stock';
import { StockMovementReason } from '@kirana-pro/shared';
import { colors } from '../../theme';
import { Feather } from '@expo/vector-icons';

export const StockInScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuthStore();
  const { products } = useProductStore();

  const productId = route.params?.productId;
  const product = products.find((p) => p.id === productId);

  const [quantity, setQuantity] = useState('10');
  const [reason, setReason] = useState<StockMovementReason>('purchase');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const handleQuickAdd = (amount: number) => {
    const current = parseFloat(quantity) || 0;
    setQuantity(String(current + amount));
  };

  const handleSaveStock = async () => {
    if (!product || !user?.storeId) return;

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter a valid stock amount');
      return;
    }

    setLoading(true);
    try {
      await recordStockMovement(user.storeId, product.id, {
        type: 'in',
        quantity: qty,
        reason,
        note: note.trim() || undefined,
        performedBy: user.uid,
      });

      Alert.alert(
        'Stock Updated',
        `Added +${qty} ${product.unit} to ${product.name}. Current stock is now ${
          product.currentStock + qty
        } ${product.unit}.`
      );

      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not update stock');
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Selected Product Card */}
        <View style={styles.card}>
          <Text style={styles.headerLabel}>INWARD PRODUCT</Text>
          <Text style={styles.productTitle}>
            {product?.name || 'Select a Product'}
          </Text>
          <Text style={styles.stockStatus}>
            Current Stock: {product?.currentStock || 0} {product?.unit || 'units'}
          </Text>
        </View>

        {/* Quantity Stepper */}
        <View style={styles.card}>
          <Text style={styles.headerLabel}>QUANTITY TO INWARD ({product?.unit})</Text>
          <TextInput
            style={styles.qtyInput}
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#94A3B8"
            autoFocus
          />

          <View style={styles.chipsRow}>
            {[5, 10, 25, 50, 100].map((num) => (
              <TouchableOpacity
                key={num}
                style={styles.qtyChip}
                onPress={() => handleQuickAdd(num)}
              >
                <Text style={styles.qtyChipText}>+{num}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Reason Selector */}
        <View style={styles.card}>
          <Text style={styles.headerLabel}>REASON FOR INWARD</Text>
          <View style={styles.reasonRow}>
            {(['purchase', 'return', 'correction'] as StockMovementReason[]).map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.reasonPill, reason === r && styles.reasonPillActive]}
                onPress={() => setReason(r)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Feather
                    name={r === 'purchase' ? 'truck' : r === 'return' ? 'corner-up-left' : 'edit-2'}
                    size={14}
                    color={reason === r ? '#7367F0' : '#6F6B7D'}
                    style={{ marginRight: 8 }}
                  />
                  <Text
                    style={[styles.reasonText, reason === r && styles.reasonTextActive]}
                  >
                    {r === 'purchase'
                      ? 'Supplier Restock'
                      : r === 'return'
                      ? 'Customer Return'
                      : 'Stock Correction'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.headerLabel, { marginTop: 14 }]}>
            NOTES / SUPPLIER BILL # (OPTIONAL)
          </Text>
          <TextInput
            style={styles.noteInput}
            placeholder="e.g. Invoice #412 from Balaji Traders"
            placeholderTextColor="#94A3B8"
            value={note}
            onChangeText={setNote}
          />
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.disabledBtn]}
          activeOpacity={0.88}
          onPress={handleSaveStock}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Feather name="check" size={16} color="#FFFFFF" />
              <Text style={styles.submitBtnText}>
                Inward +{quantity || 0} {product?.unit}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scroll: {
    padding: 18,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  headerLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  productTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  stockStatus: {
    fontSize: 13,
    color: '#28C76F',
    fontWeight: '600',
    marginTop: 4,
  },
  qtyInput: {
    backgroundColor: '#F8F7FA',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#7367F0',
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 28,
    fontWeight: '800',
    color: '#2F2B3D',
    textAlign: 'center',
    marginBottom: 12,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  qtyChip: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  qtyChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  reasonRow: {
    gap: 8,
  },
  reasonPill: {
    backgroundColor: '#F8F7FA',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#DBDADE',
  },
  reasonPillActive: {
    backgroundColor: '#EDEBFD',
    borderColor: '#7367F0',
  },
  reasonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6F6B7D',
  },
  reasonTextActive: {
    color: '#7367F0',
    fontWeight: '700',
  },
  noteInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  submitBtn: {
    backgroundColor: '#7367F0',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#7367F0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 3,
    marginTop: 10,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  disabledBtn: {
    opacity: 0.6,
  },
});
