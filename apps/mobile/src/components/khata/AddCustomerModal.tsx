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
import { Feather } from '@expo/vector-icons';
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
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Feather name="x" size={18} color="#82808B" />
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>CUSTOMER NAME *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Ramesh Sharma"
              placeholderTextColor="#82808B"
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.label}>10-DIGIT MOBILE NUMBER *</Text>
            <TextInput
              style={styles.input}
              placeholder="9876543210"
              placeholderTextColor="#82808B"
              keyboardType="phone-pad"
              maxLength={10}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
            />

            <Text style={styles.label}>ADDRESS / LANDMARK (OPTIONAL)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Near Shiv Mandir, Ward 4"
              placeholderTextColor="#82808B"
              value={address}
              onChangeText={setAddress}
            />

            <TouchableOpacity
              style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={loading}
              activeOpacity={0.85}
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
    backgroundColor: 'rgba(47, 43, 61, 0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 20,
    borderWidth: 1,
    borderColor: '#DBDADE',
    shadowColor: '#2F2B3D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4B465C',
  },
  closeBtn: {
    padding: 4,
  },
  form: {
    gap: 12,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#82808B',
    marginBottom: -4,
  },
  input: {
    backgroundColor: '#F8F7FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DBDADE',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#4B465C',
  },
  saveBtn: {
    backgroundColor: '#7367F0',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#7367F0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
