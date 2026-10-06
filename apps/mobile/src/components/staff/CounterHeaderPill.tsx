import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { useStaffStore } from '../../store/staffStore';
import { StaffPINLockModal } from './StaffPINLockModal';
import { colors } from '../../theme';

export const CounterHeaderPill: React.FC = () => {
  const { activeStaff, counterNumber } = useStaffStore();
  const [showModal, setShowModal] = useState(false);

  const roleEmoji =
    activeStaff?.role === 'owner' ? '👑' : activeStaff?.role === 'manager' ? '💼' : '🧑‍💼';

  return (
    <>
      <TouchableOpacity
        style={styles.pill}
        activeOpacity={0.8}
        onPress={() => setShowModal(true)}
      >
        <Text style={styles.counterText}>C{counterNumber}</Text>
        <View style={styles.divider} />
        <Text style={styles.nameText} numberOfLines={1}>
          {roleEmoji} {activeStaff?.name?.split(' ')[0] || 'Staff'}
        </Text>
        <Text style={styles.lockIcon}>🔒</Text>
      </TouchableOpacity>

      <StaffPINLockModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={() => setShowModal(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  counterText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
  },
  divider: {
    width: 1,
    height: 12,
    backgroundColor: '#CBD5E1',
  },
  nameText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    maxWidth: 90,
  },
  lockIcon: {
    fontSize: 10,
    opacity: 0.7,
  },
});
