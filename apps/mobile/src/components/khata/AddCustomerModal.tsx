import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { createCustomer } from '../../services/khata';
import { useAuthStore } from '../../store/authStore';
import { useKhataStore } from '../../store/khataStore';

export interface AddCustomerModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AddCustomerModal: React.FC<AddCustomerModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuthStore();
  const { customers, setCustomers } = useKhataStore();

  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

  const storeId = user?.storeId || 'demo_store_1';

  const handleSave = async () => {
    const cleanPhone = phoneNumber.trim().replace(/\D/g, '');
    if (name.trim().length < 2) {
      Alert.alert('Invalid Name', 'Please enter a valid customer name.');
      return;
    }
    if (cleanPhone.length !== 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    try {
      const created = await createCustomer(storeId, {
        name: name.trim(),
        phoneNumber: cleanPhone,
        address: address.trim() || undefined,
      });

      setCustomers([created, ...customers]);
      setName('');
      setPhoneNumber('');
      setAddress('');
      setLoading(false);
      onClose();
      onSuccess?.();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not add customer.');
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Add Khata Customer</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>CUSTOMER NAME *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Ramesh Sharma (Pandit Ji)"
              placeholderTextColor="#94A3B8"
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.label}>10-DIGIT MOBILE NUMBER *</Text>
            <TextInput
              style={styles.input}
              placeholder="9876543210"
              placeholderTextColor="#94A3B8"
              keyboardType="phone-pad"
              maxLength={10}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
            />

            <Text style={styles.label}>ADDRESS / LANDMARK (OPTIONAL)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Near Shiv Mandir, Ward 4"
              placeholderTextColor="#94A3B8"
              value={address}
              onChangeText={setAddress}
            />

            <TouchableOpacity
              style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveBtnText}>Save to Khata Directory</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  closeBtn: {
    padding: 4,
  },
  closeText: {
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: '700',
  },
  form: {
    gap: 12,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: -4,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#0F172A',
  },
  saveBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
