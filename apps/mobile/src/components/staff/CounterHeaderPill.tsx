import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useStaffStore } from '../../store/staffStore';
import { StaffPINLockModal } from './StaffPINLockModal';

export const CounterHeaderPill: React.FC = () => {
  const { activeStaff, counterNumber } = useStaffStore();
  const [showModal, setShowModal] = useState(false);

  const roleIcon =
    activeStaff?.role === 'owner' ? 'award' : activeStaff?.role === 'manager' ? 'briefcase' : 'user';

  return (
    <>
      <TouchableOpacity
        style={styles.pill}
        activeOpacity={0.8}
        onPress={() => setShowModal(true)}
      >
        <Text style={styles.counterText}>C{counterNumber}</Text>
        <View style={styles.divider} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Feather name={roleIcon as any} size={11} color="#7367F0" />
          <Text style={styles.nameText} numberOfLines={1}>
            {activeStaff?.name?.split(' ')[0] || 'Staff'}
          </Text>
        </View>
        <Feather name="lock" size={10} color="#82808B" />
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
    backgroundColor: '#EDEBFD',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(115, 103, 240, 0.2)',
    gap: 6,
  },
  counterText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7367F0',
  },
  divider: {
    width: 1,
    height: 12,
    backgroundColor: '#DBDADE',
  },
  nameText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B465C',
    maxWidth: 90,
  },
});

