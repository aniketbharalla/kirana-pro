import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
  Modal,
} from 'react-native';
import { useStaffStore } from '../../store/staffStore';
import { StaffMember, StaffRole } from '@kirana-pro/shared';
import { colors } from '../../theme';

export const StaffManagementScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const { staffList, activeStaff, addStaff, updateStaff, setActiveStaff } = useStaffStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<StaffRole>('cashier');
  const [pin, setPin] = useState('');
  const [counterAssigned, setCounterAssigned] = useState('1');

  const handleAddStaff = () => {
    if (!name.trim()) {
      Alert.alert('Name Required', 'Please enter staff member name');
      return;
    }
    if (pin.trim().length !== 4 || isNaN(Number(pin))) {
      Alert.alert('Invalid PIN', 'Staff PIN must be exactly 4 digits');
      return;
    }

    addStaff({
      storeId: 'demo_store_1',
      name: name.trim(),
      phone: phone.trim() || undefined,
      role,
      pin: pin.trim(),
      counterAssigned: parseInt(counterAssigned) || 1,
      isActive: true,
    });

    Alert.alert('Staff Added! 🎉', `Added ${name} as ${role}. PIN: ${pin}`);
    setShowAddModal(false);
    setName('');
    setPhone('');
    setPin('');
  };

  const handleToggleActive = (staff: StaffMember) => {
    if (staff.id === 'staff_owner') {
      Alert.alert('Action Restricted', 'Cannot deactivate store owner');
      return;
    }
    updateStaff(staff.id, { isActive: !staff.isActive });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header Banner */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Staff & Cashier Directory</Text>
            <Text style={styles.sub}>
              Manage counter cashiers, 4-digit PINs & role permissions
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setShowAddModal(true)}
          >
            <Text style={styles.addBtnText}>+ Add Staff</Text>
          </TouchableOpacity>
        </View>

        {/* Staff List */}
        <View style={styles.listCard}>
          {staffList.map((member) => {
            const isActiveUser = activeStaff?.id === member.id;
            return (
              <View key={member.id} style={styles.staffItem}>
                <View style={styles.avatar}>
                  <Text style={{ fontSize: 20 }}>
                    {member.role === 'owner' ? '👑' : member.role === 'manager' ? '💼' : '🧑‍💼'}
                  </Text>
                </View>

                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.memberName}>{member.name}</Text>
                    {isActiveUser && (
                      <View style={styles.currentBadge}>
                        <Text style={styles.currentBadgeText}>Active Now</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.memberSub}>
                    {member.role.toUpperCase()} • Counter {member.counterAssigned || 1} • PIN: **** ({member.pin})
                  </Text>
                  {member.phone && <Text style={styles.phoneText}>📞 {member.phone}</Text>}
                </View>

                <View style={styles.actionsRow}>
                  {!isActiveUser && (
                    <TouchableOpacity
                      style={styles.switchBtn}
                      onPress={() => {
                        setActiveStaff(member);
                        Alert.alert('Switched Staff', `Switched active user to ${member.name}`);
                      }}
                    >
                      <Text style={styles.switchBtnText}>Switch</Text>
                    </TouchableOpacity>
                  )}
                  {member.id !== 'staff_owner' && (
                    <TouchableOpacity
                      style={[
                        styles.toggleBtn,
                        member.isActive ? styles.toggleDeactivate : styles.toggleActivate,
                      ]}
                      onPress={() => handleToggleActive(member)}
                    >
                      <Text
                        style={[
                          styles.toggleText,
                          member.isActive ? styles.textRed : styles.textGreen,
                        ]}
                      >
                        {member.isActive ? 'Deactivate' : 'Activate'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Roles Permission Reference Card */}
        <View style={styles.rolesCard}>
          <Text style={styles.rolesHeader}>Role Permissions Guide</Text>
          <View style={styles.roleRow}>
            <Text style={styles.roleName}>👑 Owner:</Text>
            <Text style={styles.roleDesc}>Full access to sales, purchase costs, reports, tax & staff</Text>
          </View>
          <View style={styles.roleRow}>
            <Text style={styles.roleName}>💼 Manager:</Text>
            <Text style={styles.roleDesc}>Can bill, edit inventory, manage stock & view sales reports</Text>
          </View>
          <View style={styles.roleRow}>
            <Text style={styles.roleName}>🧑‍💼 Cashier:</Text>
            <Text style={styles.roleDesc}>High-speed barcode scanning & billing only; cost prices hidden</Text>
          </View>
        </View>

        {/* Modal: Add New Staff Member */}
        <Modal visible={showAddModal} animationType="slide" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Add New Staff / Cashier</Text>

              <Text style={styles.inputLabel}>STAFF NAME *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Suresh Verma"
              />

              <Text style={styles.inputLabel}>MOBILE NUMBER (OPTIONAL)</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="10-digit phone"
                keyboardType="phone-pad"
              />

              <Text style={styles.inputLabel}>ROLE</Text>
              <View style={styles.roleSelectRow}>
                {(['cashier', 'manager', 'owner'] as StaffRole[]).map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.roleSelectBtn, role === r && styles.roleSelectBtnActive]}
                    onPress={() => setRole(r)}
                  >
                    <Text
                      style={[
                        styles.roleSelectText,
                        role === r && styles.roleSelectTextActive,
                      ]}
                    >
                      {r.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>4-DIGIT PIN (लॉगिन पिन) *</Text>
              <TextInput
                style={styles.input}
                value={pin}
                onChangeText={setPin}
                placeholder="e.g. 5566"
                keyboardType="numeric"
                maxLength={4}
              />

              <Text style={styles.inputLabel}>ASSIGNED COUNTER</Text>
              <View style={styles.counterRow}>
                {['1', '2', '3'].map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[
                      styles.counterBtn,
                      counterAssigned === c && styles.counterBtnActive,
                    ]}
                    onPress={() => setCounterAssigned(c)}
                  >
                    <Text
                      style={[
                        styles.counterText,
                        counterAssigned === c && styles.counterTextActive,
                      ]}
                    >
                      Counter {c}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalBtns}>
                <TouchableOpacity
                  style={[styles.btn, styles.cancelBtn]}
                  onPress={() => setShowAddModal(false)}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btn, styles.saveBtn]}
                  onPress={handleAddStaff}
                >
                  <Text style={styles.saveBtnText}>Save Staff ➔</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  sub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    maxWidth: 240,
  },
  addBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  listCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  staffItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  currentBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  currentBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
  },
  memberSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  phoneText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  actionsRow: {
    gap: 6,
    alignItems: 'flex-end',
  },
  switchBtn: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  switchBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  toggleBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  toggleDeactivate: {
    backgroundColor: '#FEE2E2',
  },
  toggleActivate: {
    backgroundColor: '#DCFCE7',
  },
  toggleText: {
    fontSize: 11,
    fontWeight: '700',
  },
  textRed: {
    color: '#DC2626',
  },
  textGreen: {
    color: '#16A34A',
  },
  rolesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  rolesHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  roleRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  roleName: {
    width: 90,
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  roleDesc: {
    flex: 1,
    fontSize: 12,
    color: '#64748B',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#0F172A',
  },
  roleSelectRow: {
    flexDirection: 'row',
    gap: 8,
  },
  roleSelectBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  roleSelectBtnActive: {
    backgroundColor: colors.primary,
  },
  roleSelectText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  roleSelectTextActive: {
    color: '#FFFFFF',
  },
  counterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  counterBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  counterBtnActive: {
    backgroundColor: colors.primary,
  },
  counterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  counterTextActive: {
    color: '#FFFFFF',
  },
  modalBtns: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: '#F1F5F9',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  saveBtn: {
    backgroundColor: colors.primary,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
