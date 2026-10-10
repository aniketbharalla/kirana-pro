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
} from 'react-native';
import { useStaffStore } from '../../store/staffStore';
import { colors } from '../../theme';
import { Feather } from '@expo/vector-icons';

export const CounterShiftScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const {
    activeStaff,
    counterNumber,
    activeCounterSession,
    openShift,
    closeShift,
    setCounterNumber,
  } = useStaffStore();

  const [closingCash, setClosingCash] = useState('');
  const [shiftNotes, setShiftNotes] = useState('');
  const [openingFloat, setOpeningFloat] = useState('1000');
  const [isOpeningShift, setIsOpeningShift] = useState(false);
  const [selectedCounter, setSelectedCounter] = useState(counterNumber);

  const session = activeCounterSession;
  const isShiftActive = session && !session.isClosed;

  const openingCashVal = session?.openingCash || 0;
  const cashSalesVal = session?.cashSales || 0;
  const expectedCash = openingCashVal + cashSalesVal;
  const actualClosingCash = parseFloat(closingCash) || 0;
  const variance = closingCash.trim() ? actualClosingCash - expectedCash : 0;

  const handleStartShift = () => {
    const float = parseFloat(openingFloat) || 0;
    openShift(selectedCounter, float);
    setIsOpeningShift(false);
    Alert.alert(
      'Shift Started',
      `Counter ${selectedCounter} shift opened with ₹${float} cash float.`
    );
  };

  const handleCloseShift = () => {
    if (!closingCash.trim()) {
      Alert.alert('Count Cash', 'Please count the physical cash in drawer and enter the amount.');
      return;
    }

    const closed = closeShift(actualClosingCash, shiftNotes.trim());
    if (closed) {
      Alert.alert(
        'Shift Closed & Settled',
        `Counter ${closed.counterNumber} shift completed.\nExpected: ₹${expectedCash}\nActual: ₹${actualClosingCash}\nVariance: ${
          variance >= 0 ? `+₹${variance} (Surplus)` : `-₹${Math.abs(variance)} (Shortage)`
        }\nTotal Bills: ${closed.invoiceCount}`
      );
      setClosingCash('');
      setShiftNotes('');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header Banner */}
        <View style={styles.headerCard}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Counter Shift Register</Text>
            <Text style={styles.headerSub}>
              Cash drawer float & cashier handover tracking
            </Text>
          </View>
          <View
            style={[
              styles.statusPill,
              isShiftActive ? styles.statusPillActive : styles.statusPillClosed,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                isShiftActive ? styles.statusTextActive : styles.statusTextClosed,
              ]}
            >
              {isShiftActive ? `Counter ${session.counterNumber} Active` : 'Shift Closed'}
            </Text>
          </View>
        </View>

        {/* Counter & Staff Badge */}
        <View style={styles.staffCard}>
          <View style={styles.staffAvatar}>
            <Feather
              name={activeStaff?.role === 'owner' ? 'shield' : 'user'}
              size={22}
              color="#7367F0"
            />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.staffName}>{activeStaff?.name}</Text>
            <Text style={styles.staffRole}>
              Role: {activeStaff?.role?.toUpperCase()} • Counter {counterNumber}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.changeCounterBtn}
            onPress={() => setIsOpeningShift(true)}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Feather name="rotate-cw" size={12} color="#7367F0" />
              <Text style={styles.changeCounterText}>New Shift</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Modal/Inline: Open New Shift */}
        {isOpeningShift && (
          <View style={styles.newShiftBox}>
            <Text style={styles.sectionHeader}>Start New Counter Shift</Text>
            <Text style={styles.fieldLabel}>SELECT COUNTER NUMBER</Text>
            <View style={styles.counterRow}>
              {[1, 2, 3, 4].map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.counterBtn,
                    selectedCounter === c && styles.counterBtnSelected,
                  ]}
                  onPress={() => setSelectedCounter(c)}
                >
                  <Text
                    style={[
                      styles.counterBtnText,
                      selectedCounter === c && styles.counterBtnTextSelected,
                    ]}
                  >
                    Counter {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.fieldLabel, { marginTop: 12 }]}>
              OPENING CASH FLOAT (गल्ले में शुरुआती नकद)
            </Text>
            <TextInput
              style={styles.input}
              value={openingFloat}
              onChangeText={setOpeningFloat}
              keyboardType="numeric"
              placeholder="1000"
            />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.cancelBtn]}
                onPress={() => setIsOpeningShift(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.primaryBtn]}
                onPress={handleStartShift}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Feather name="play" size={14} color="#FFFFFF" />
                  <Text style={styles.primaryText}>Start Shift</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Live Shift Performance Metrics */}
        {isShiftActive && (
          <>
            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>OPENING FLOAT</Text>
                <Text style={styles.metricVal}>₹{session.openingCash}</Text>
                <Text style={styles.metricSub}>Morning Cash</Text>
              </View>

              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>TOTAL SALES</Text>
                <Text style={[styles.metricVal, { color: colors.primary }]}>
                  ₹{session.totalSales}
                </Text>
                <Text style={styles.metricSub}>{session.invoiceCount} Bills Made</Text>
              </View>

              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>CASH SALES</Text>
                <Text style={[styles.metricVal, { color: '#16A34A' }]}>
                  ₹{session.cashSales}
                </Text>
                <Text style={styles.metricSub}>Physical Cash In</Text>
              </View>

              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>UPI / DIGITAL</Text>
                <Text style={[styles.metricVal, { color: '#0284C7' }]}>
                  ₹{session.upiSales}
                </Text>
                <Text style={styles.metricSub}>Bank / QR</Text>
              </View>
            </View>

            {/* Expected Cash Drawer Tally */}
            <View style={styles.tallyCard}>
              <Text style={styles.tallyHeader}>Cash Drawer Tally (गल्ला मिलान)</Text>
              <View style={styles.tallyRow}>
                <Text style={styles.tallyLabel}>Opening Cash Float:</Text>
                <Text style={styles.tallyVal}>₹{openingCashVal}</Text>
              </View>
              <View style={styles.tallyRow}>
                <Text style={styles.tallyLabel}>+ Cash Sales Collected:</Text>
                <Text style={[styles.tallyVal, { color: '#16A34A' }]}>
                  +₹{cashSalesVal}
                </Text>
              </View>
              <View style={styles.tallyDivider} />
              <View style={styles.tallyRow}>
                <Text style={styles.tallyTotalLabel}>Expected Cash in Drawer:</Text>
                <Text style={styles.tallyTotalVal}>₹{expectedCash}</Text>
              </View>
            </View>

            {/* Shift Close & Handover Box */}
            <View style={styles.closeCard}>
              <Text style={styles.sectionHeader}>Handover & Close Shift (शिफ्ट क्लोज)</Text>
              <Text style={styles.fieldLabel}>PHYSICAL CASH COUNTED (गल्ला गिनें)</Text>
              <TextInput
                style={styles.cashInput}
                value={closingCash}
                onChangeText={setClosingCash}
                keyboardType="numeric"
                placeholder={`e.g. ${expectedCash}`}
                placeholderTextColor="#94A3B8"
              />

              {closingCash.trim() ? (
                <View
                  style={[
                    styles.varianceBox,
                    variance === 0
                      ? styles.varianceMatch
                      : variance > 0
                      ? styles.varianceSurplus
                      : styles.varianceShortage,
                  ]}
                >
                  <Text style={styles.varianceText}>
                    {variance === 0
                      ? 'Cash perfectly matches expected amount!'
                      : variance > 0
                      ? `Surplus: +₹${variance} extra in drawer`
                      : `Shortage: -₹${Math.abs(variance)} missing in drawer`}
                  </Text>
                </View>
              ) : null}

              <Text style={[styles.fieldLabel, { marginTop: 12 }]}>
                HANDOVER NOTES (REMARKS)
              </Text>
              <TextInput
                style={styles.notesInput}
                value={shiftNotes}
                onChangeText={setShiftNotes}
                placeholder="e.g. Handed over to Amit for evening shift"
                placeholderTextColor="#94A3B8"
              />

              <TouchableOpacity
                style={styles.closeBtn}
                activeOpacity={0.88}
                onPress={handleCloseShift}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Feather name="lock" size={15} color="#FFFFFF" />
                  <Text style={styles.closeBtnText}>
                    Complete Handover & Close Shift
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </>
        )}
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
  headerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusPillActive: {
    backgroundColor: '#DCFCE7',
  },
  statusPillClosed: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusTextActive: {
    color: '#15803D',
  },
  statusTextClosed: {
    color: '#DC2626',
  },
  staffCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  staffAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  staffName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  staffRole: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  changeCounterBtn: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  changeCounterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  metricVal: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginVertical: 4,
  },
  metricSub: {
    fontSize: 11,
    color: '#94A3B8',
  },
  tallyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  tallyHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10,
  },
  tallyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  tallyLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  tallyVal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  tallyDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 8,
  },
  tallyTotalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  tallyTotalVal: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
  closeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  cashInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  notesInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
    marginBottom: 14,
  },
  varianceBox: {
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  varianceMatch: {
    backgroundColor: '#DCFCE7',
  },
  varianceSurplus: {
    backgroundColor: '#FEF3C7',
  },
  varianceShortage: {
    backgroundColor: '#FEE2E2',
  },
  varianceText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  closeBtn: {
    backgroundColor: '#DC2626',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  newShiftBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.primary,
    marginBottom: 16,
  },
  counterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  counterBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  counterBtnSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  counterBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  counterBtnTextSelected: {
    color: '#FFFFFF',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: '#F1F5F9',
  },
  cancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  primaryBtn: {
    backgroundColor: colors.primary,
  },
  primaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
