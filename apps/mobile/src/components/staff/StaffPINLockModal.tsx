import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { useStaffStore } from '../../store/staffStore';

interface StaffPINLockModalProps {
  visible: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
}

export const StaffPINLockModal: React.FC<StaffPINLockModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const { isLocked, activeStaff, staffList, unlockWithPIN } = useStaffStore();
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const triggerHaptic = () => {
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch {}
  };

  const handleKeyPress = (digit: string) => {
    triggerHaptic();
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setErrorMsg('');

      if (nextPin.length === 4) {
        // Attempt unlock automatically on 4th digit
        setTimeout(() => {
          const res = unlockWithPIN(nextPin);
          if (res.success) {
            try {
              if (Platform.OS !== 'web') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
            } catch {}
            setPin('');
            setErrorMsg('');
            onSuccess?.();
            onClose?.();
          } else {
            try {
              if (Platform.OS !== 'web') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              }
            } catch {}
            setErrorMsg(res.error || 'Incorrect PIN');
            setPin('');
          }
        }, 150);
      }
    }
  };

  const handleDelete = () => {
    triggerHaptic();
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg('');
  };

  const handleClear = () => {
    triggerHaptic();
    setPin('');
    setErrorMsg('');
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={false}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.lockIconCircle}>
            <Feather name="lock" size={28} color="#7367F0" />
          </View>
          <Text style={styles.title}>Counter Locked / Cashier Switch</Text>
          <Text style={styles.subtitle}>
            Enter 4-digit staff PIN to unlock this register
          </Text>
          <Text style={styles.currentStaffBadge}>
            Current: {activeStaff?.name} ({activeStaff?.role?.toUpperCase()})
          </Text>
        </View>

        {/* PIN Indicators (4 Dots) */}
        <View style={styles.pinDotsRow}>
          {[0, 1, 2, 3].map((idx) => {
            const filled = pin.length > idx;
            return (
              <View
                key={idx}
                style={[
                  styles.dot,
                  filled && styles.dotFilled,
                  errorMsg ? styles.dotError : null,
                ]}
              />
            );
          })}
        </View>

        {/* Error message */}
        {errorMsg ? (
          <View style={styles.errorContainer}>
            <Feather name="alert-triangle" size={13} color="#EA5455" style={{ marginRight: 6 }} />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : (
          <View style={styles.hintContainer}>
            <Text style={styles.hintText}>
              Default PINs: Owner: 1234 • Cashier 1: 0000 • Cashier 2: 1111
            </Text>
          </View>
        )}

        {/* Numeric Keypad */}
        <View style={styles.keypad}>
          {[
            ['1', '2', '3'],
            ['4', '5', '6'],
            ['7', '8', '9'],
            ['C', '0', 'DEL'],
          ].map((row, rIdx) => (
            <View key={rIdx} style={styles.keypadRow}>
              {row.map((btn) => {
                if (btn === 'C') {
                  return (
                    <TouchableOpacity
                      key={btn}
                      style={[styles.keyBtn, styles.specialKey]}
                      onPress={handleClear}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.specialKeyText}>Clear</Text>
                    </TouchableOpacity>
                  );
                }
                if (btn === 'DEL') {
                  return (
                    <TouchableOpacity
                      key={btn}
                      style={[styles.keyBtn, styles.specialKey]}
                      onPress={handleDelete}
                      activeOpacity={0.7}
                    >
                      <Feather name="delete" size={20} color="#A8AAAE" />
                    </TouchableOpacity>
                  );
                }
                return (
                  <TouchableOpacity
                    key={btn}
                    style={styles.keyBtn}
                    activeOpacity={0.7}
                    onPress={() => handleKeyPress(btn)}
                  >
                    <Text style={styles.keyText}>{btn}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        {/* Cancel button if modal was opened intentionally */}
        {onClose && (
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
            <Text style={styles.cancelBtnText}>Dismiss</Text>
          </TouchableOpacity>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2F2B3D',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  lockIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: 'rgba(115, 103, 240, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#A8AAAE',
    textAlign: 'center',
  },
  currentStaffBadge: {
    marginTop: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
    fontSize: 12,
    color: '#7367F0',
    fontWeight: '600',
  },
  pinDotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 20,
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#4B465C',
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: '#7367F0',
    borderColor: '#7367F0',
    transform: [{ scale: 1.15 }],
  },
  dotError: {
    borderColor: '#EA5455',
    backgroundColor: '#EA5455',
  },
  errorContainer: {
    backgroundColor: 'rgba(234, 84, 85, 0.16)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#EA5455',
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    color: '#EA5455',
    fontSize: 13,
    fontWeight: '600',
  },
  hintContainer: {
    marginBottom: 20,
  },
  hintText: {
    color: '#A8AAAE',
    fontSize: 11,
    textAlign: 'center',
  },
  keypad: {
    width: '100%',
    maxWidth: 320,
    gap: 12,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  keyBtn: {
    flex: 1,
    height: 64,
    backgroundColor: '#3C364C',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  keyText: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  specialKey: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  specialKeyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A8AAAE',
  },
  cancelBtn: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  cancelBtnText: {
    color: '#A8AAAE',
    fontSize: 14,
    fontWeight: '600',
  },
});

