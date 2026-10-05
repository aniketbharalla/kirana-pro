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
import { useGallaStore } from '../../store/gallaStore';
import { useAuthStore } from '../../store/authStore';
import { saveGallaSession } from '../../services/galla';
import { colors } from '../../theme';

export const DailyGallaScreen = ({ navigation }: any) => {
  const { user } = useAuthStore();
  const storeId = user?.storeId || 'dev_store_001';
  const {
    currentSession,
    openSession,
    recordPettyExpense,
    closeSession,
  } = useGallaStore();

  const [openingCashInput, setOpeningCashInput] = useState('2000');
  const [actualCashInput, setActualCashInput] = useState('');
  const [expenseInput, setExpenseInput] = useState('');
  const [expenseNote, setExpenseNote] = useState('');
  const [closeNote, setCloseNote] = useState('');

  const handleOpenGalla = () => {
    const val = parseFloat(openingCashInput) || 0;
    openSession(val, storeId);
  };

  const handleAddExpense = () => {
    const val = parseFloat(expenseInput) || 0;
    if (val <= 0) return;
    recordPettyExpense(val);
    setExpenseInput('');
    setExpenseNote('');
    Alert.alert('Expense Recorded', `₹${val} deducted from drawer cash.`);
  };

  const handleCloseGalla = async () => {
    const actual = parseFloat(actualCashInput);
    if (isNaN(actual) || actual < 0) {
      Alert.alert('Error', 'Please enter physical cash counted in drawer.');
      return;
    }

    closeSession(actual, closeNote);
    const session = useGallaStore.getState().currentSession;
    if (session) {
      await saveGallaSession(storeId, session);
    }

    const diff = session?.cashDifference || 0;
    const diffMsg =
      diff === 0
        ? 'Perfect Match! Exact cash in drawer.'
        : diff > 0
        ? `Surplus: ₹${diff.toFixed(2)} extra in drawer.`
        : `Shortage: ₹${Math.abs(diff).toFixed(2)} less in drawer.`;

    Alert.alert('Day-End Galla Closed 🔒', diffMsg);
  };

  if (!currentSession || currentSession.status === 'CLOSED') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.openGallaCard}>
          <Text style={styles.cardIcon}>💰</Text>
          <Text style={styles.cardTitle}>Daily Galla (दैनिक गल्ला)</Text>
          <Text style={styles.cardDesc}>
            Start your day by recording the opening cash kept in the drawer for change (chutta).
          </Text>

          <Text style={styles.inputLabel}>Opening Drawer Cash (₹) *</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={openingCashInput}
            onChangeText={setOpeningCashInput}
            placeholder="e.g. 2000"
            placeholderTextColor={colors.textMuted}
          />

          <TouchableOpacity style={styles.openBtn} onPress={handleOpenGalla}>
            <Text style={styles.openBtnText}>Open Morning Galla ☀️</Text>
          </TouchableOpacity>
        </View>

        {currentSession?.status === 'CLOSED' ? (
          <View style={styles.lastClosedCard}>
            <Text style={styles.lastClosedTitle}>Last Session Summary</Text>
            <Text style={styles.lastClosedRow}>
              Actual Counted: ₹{currentSession.actualClosingCash?.toFixed(2)}
            </Text>
            <Text
              style={[
                styles.lastClosedRow,
                (currentSession.cashDifference || 0) < 0
                  ? styles.shortageText
                  : styles.surplusText,
              ]}
            >
              Difference: ₹{currentSession.cashDifference?.toFixed(2)}
            </Text>
          </View>
        ) : null}
      </ScrollView>
    );
  }

  // Active Session View
  const diffPreview = actualCashInput
    ? parseFloat(actualCashInput) - currentSession.expectedClosingCash
    : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Live Drawer Summary Banner */}
      <View style={styles.activeBanner}>
        <Text style={styles.activeDate}>Session: {currentSession.date}</Text>
        <Text style={styles.expectedLabel}>Expected Cash in Drawer Right Now</Text>
        <Text style={styles.expectedAmount}>
          ₹{currentSession.expectedClosingCash.toFixed(2)}
        </Text>
      </View>

      {/* Breakdown Grid */}
      <View style={styles.grid}>
        <View style={styles.gridItem}>
          <Text style={styles.gridLabel}>Opening Cash</Text>
          <Text style={styles.gridVal}>₹{currentSession.openingCash.toFixed(2)}</Text>
        </View>
        <View style={styles.gridItem}>
          <Text style={styles.gridLabel}>Cash Sales (+)</Text>
          <Text style={[styles.gridVal, styles.surplusText]}>
            +₹{currentSession.systemSalesCash.toFixed(2)}
          </Text>
        </View>
        <View style={styles.gridItem}>
          <Text style={styles.gridLabel}>UPI Sales (Bank)</Text>
          <Text style={styles.gridVal}>₹{currentSession.systemSalesUPI.toFixed(2)}</Text>
        </View>
        <View style={styles.gridItem}>
          <Text style={styles.gridLabel}>Khata Collected (+)</Text>
          <Text style={[styles.gridVal, styles.surplusText]}>
            +₹{currentSession.systemUdharRepaid.toFixed(2)}
          </Text>
        </View>
        <View style={styles.gridItem}>
          <Text style={styles.gridLabel}>Petty Expenses (-)</Text>
          <Text style={[styles.gridVal, styles.shortageText]}>
            -₹{currentSession.expenses.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Petty Expense Section */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Add Cash Drawer Expense (खर्च)</Text>
        <View style={styles.expenseRow}>
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0 }]}
            placeholder="Amount (₹)"
            keyboardType="numeric"
            value={expenseInput}
            onChangeText={setExpenseInput}
          />
          <TextInput
            style={[styles.input, { flex: 2, marginBottom: 0 }]}
            placeholder="Note (Chai, Cleaning...)"
            value={expenseNote}
            onChangeText={setExpenseNote}
          />
          <TouchableOpacity style={styles.addExpenseBtn} onPress={handleAddExpense}>
            <Text style={styles.addExpenseBtnText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Day-End Settlement Card */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Night Drawer Closing (गल्ला मिलाना)</Text>
        <Text style={styles.sectionDesc}>
          Count the physical currency notes and coins in your drawer and enter below.
        </Text>

        <Text style={styles.inputLabel}>Physical Cash Counted (₹) *</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          placeholder="e.g. 3850"
          value={actualCashInput}
          onChangeText={setActualCashInput}
        />

        {diffPreview !== null ? (
          <View
            style={[
              styles.diffBanner,
              diffPreview < 0 ? styles.diffShortage : styles.diffSurplus,
            ]}
          >
            <Text style={styles.diffBannerText}>
              {diffPreview === 0
                ? '✓ 100% Perfect Match (₹0.00 difference)'
                : diffPreview > 0
                ? `▲ Surplus: ₹${diffPreview.toFixed(2)} extra in drawer`
                : `▼ Shortage: ₹${Math.abs(diffPreview).toFixed(2)} less in drawer`}
            </Text>
          </View>
        ) : null}

        <TextInput
          style={[styles.input, { marginTop: 8 }]}
          placeholder="Closing notes / Remarks (optional)"
          value={closeNote}
          onChangeText={setCloseNote}
        />

        <TouchableOpacity style={styles.closeBtn} onPress={handleCloseGalla}>
          <Text style={styles.closeBtnText}>Close & Lock Day's Galla 🌙</Text>
        </TouchableOpacity>
      </View>
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
  openGallaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  cardDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    marginBottom: 20,
  },
  inputLabel: {
    alignSelf: 'flex-start',
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  input: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    marginBottom: 16,
  },
  openBtn: {
    width: '100%',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  openBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  lastClosedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  lastClosedTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  lastClosedRow: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  activeBanner: {
    backgroundColor: '#0F172A',
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
  },
  activeDate: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  expectedLabel: {
    color: '#E2E8F0',
    fontSize: 13,
    marginTop: 8,
  },
  expectedAmount: {
    color: '#F59E0B',
    fontSize: 32,
    fontWeight: '900',
    marginTop: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  gridItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  gridLabel: {
    fontSize: 11,
    color: colors.textMuted,
  },
  gridVal: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    marginTop: 4,
  },
  surplusText: {
    color: colors.primaryDark,
  },
  shortageText: {
    color: colors.danger,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  sectionDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: 12,
    lineHeight: 16,
  },
  expenseRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  addExpenseBtn: {
    backgroundColor: colors.text,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
  },
  addExpenseBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  diffBanner: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  diffShortage: {
    backgroundColor: '#FEF2F2',
  },
  diffSurplus: {
    backgroundColor: '#ECFDF5',
  },
  diffBannerText: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    color: colors.text,
  },
  closeBtn: {
    backgroundColor: '#0F172A',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  closeBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
});
