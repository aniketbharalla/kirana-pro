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
import { recordKhataTransaction } from '../../services/khata';
import { CustomerKhata } from '@kirana-pro/shared';
import { useAuthStore } from '../../store/authStore';

export interface RecordPaymentModalProps {
  visible: boolean;
  customer: CustomerKhata | null;
  onClose: () => void;
  onSuccess: (updatedBalance: number) => void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  visible,
  customer,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuthStore();
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  if (!customer) return null;

  const handleRecordPayment = async () => {
    const numAmt = parseFloat(amount);
    if (!numAmt || numAmt <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount received.');
      return;
    }

    setLoading(true);
    try {
      await recordKhataTransaction(
        customer.storeId,
        customer.id,
        'credit',
        numAmt,
        note.trim() || 'Payment received (जमा)',
        user?.uid || 'demo_owner'
      );

      const newBalance = Math.max(0, Math.round((customer.currentBalance - numAmt) * 100) / 100);
      setAmount('');
      setNote('');
      setLoading(false);
      onClose();
      onSuccess(newBalance);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not record repayment.');
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Record Payment (जमा)</Text>
              <Text style={styles.sub}>{customer.name}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Feather name="x" size={18} color="#82808B" />
            </TouchableOpacity>
          </View>

          <View style={styles.balanceInfo}>
            <Text style={styles.balanceLabel}>CURRENT DUE BALANCE</Text>
            <Text style={styles.balanceVal}>₹{customer.currentBalance}</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>AMOUNT RECEIVED (₹) *</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
              autoFocus
            />

            <View style={styles.quickRow}>
              <TouchableOpacity
                style={styles.quickChip}
                onPress={() => setAmount(String(customer.currentBalance))}
              >
                <Text style={styles.quickChipText}>Full Clear (₹{customer.currentBalance})</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>NOTE (OPTIONAL)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Cash payment / GPay received"
              placeholderTextColor="#94A3B8"
              value={note}
              onChangeText={setNote}
            />

            <TouchableOpacity
              style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
              onPress={handleRecordPayment}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveBtnText}>Confirm Payment & Update Khata</Text>
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
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  sub: {
    fontSize: 13,
    color: '#64748B',
  },
  closeBtn: {
    padding: 4,
  },
  closeText: {
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: '700',
  },
  balanceInfo: {
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  balanceVal: {
    fontSize: 22,
    fontWeight: '900',
    color: '#DC2626',
    marginTop: 2,
  },
  form: {
    gap: 10,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  amountInput: {
    backgroundColor: '#F8F7FA',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#7367F0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 24,
    fontWeight: '700',
    color: '#4B465C',
    textAlign: 'center',
  },
  quickRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 6,
  },
  quickChip: {
    backgroundColor: '#EDEBFD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(115, 103, 240, 0.2)',
  },
  quickChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7367F0',
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
    marginTop: 10,
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
    fontSize: 15,
    fontWeight: '600',
  },
});
