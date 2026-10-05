import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { createSupplier } from '../../services/supplier';
import { colors } from '../../theme';
import { SupplierType } from '@kirana-pro/shared';

export const AddSupplierScreen = ({ navigation }: any) => {
  const { user } = useAuthStore();
  const storeId = user?.storeId || 'dev_store_001';

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [gstin, setGstin] = useState('');
  const [city, setCity] = useState('');
  const [type, setType] = useState<SupplierType>('Distributor');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter supplier or company name.');
      return;
    }
    if (!phone.trim() || phone.trim().length < 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number.');
      return;
    }

    try {
      setIsSubmitting(true);
      await createSupplier(storeId, {
        name: name.trim(),
        phone: phone.trim(),
        gstin: gstin.trim().toUpperCase() || undefined,
        city: city.trim() || undefined,
        type,
      });
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save supplier.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Add Wholesaler / Distributor</Text>
      <Text style={styles.subheading}>
        Enter supplier details to manage purchase orders and bills.
      </Text>

      {/* Supplier Name */}
      <Text style={styles.label}>Supplier / Agency Name *</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. N R ENTERPRISES (Parle Distributor)"
        placeholderTextColor={colors.textMuted}
        value={name}
        onChangeText={setName}
      />

      {/* Phone Number */}
      <Text style={styles.label}>Mobile / WhatsApp Number *</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. 7415545631"
        placeholderTextColor={colors.textMuted}
        keyboardType="phone-pad"
        maxLength={10}
        value={phone}
        onChangeText={setPhone}
      />

      {/* GSTIN */}
      <Text style={styles.label}>GSTIN (Optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. 23NMQPK6686L1Z0"
        placeholderTextColor={colors.textMuted}
        autoCapitalize="characters"
        value={gstin}
        onChangeText={setGstin}
      />

      {/* City */}
      <Text style={styles.label}>City / Market Location</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Bhopal"
        placeholderTextColor={colors.textMuted}
        value={city}
        onChangeText={setCity}
      />

      {/* Supplier Type */}
      <Text style={styles.label}>Supplier Category</Text>
      <View style={styles.typeRow}>
        {(['Distributor', 'Wholesaler', 'Direct'] as SupplierType[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.typeBtn, type === t && styles.typeBtnActive]}
            onPress={() => setType(t)}
          >
            <Text style={[styles.typeBtnText, type === t && styles.typeBtnTextActive]}>
              {t}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        <Text style={styles.submitBtnText}>
          {isSubmitting ? 'Saving...' : 'Save Wholesaler'}
        </Text>
      </TouchableOpacity>
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
  heading: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  subheading: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  typeBtnActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  typeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  typeBtnTextActive: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 30,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
});
