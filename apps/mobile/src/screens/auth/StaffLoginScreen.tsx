import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { useStaffStore, DEFAULT_STARTER_STAFF } from '../../store/staffStore';
import { useAuthStore } from '../../store/authStore';
import { useStoreStore } from '../../store/storeStore';
import { StaffMember, Store, getFirestoreDb } from '@kirana-pro/shared';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { colors, typography } from '../../theme';
import { Feather } from '@expo/vector-icons';

export const StaffLoginScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();

  // Form State (Only Phone + PIN required)
  const [phoneInput, setPhoneInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Step 2 Shift Register State
  const [verifiedStaff, setVerifiedStaff] = useState<StaffMember | null>(null);
  const [verifiedStore, setVerifiedStore] = useState<Store | null>(null);
  const [counterNumber, setCounterNumber] = useState<number>(1);
  const [openingCash, setOpeningCash] = useState<string>('500');

  const { staffList, setActiveStaff, openShift } = useStaffStore();
  const { setUser } = useAuthStore();
  const { setStore } = useStoreStore();

  // Preset demo cashiers for quick testing
  const handleQuickFill = (staff: StaffMember) => {
    setPhoneInput(staff.phone || '');
    setPinInput(staff.pin);
    setErrorMessage('');
  };

  const handleVerifyStaff = async () => {
    setErrorMessage('');
    const cleanPhone = phoneInput.trim().replace(/\D/g, '');
    const cleanPin = pinInput.trim();

    if (cleanPhone.length !== 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (cleanPin.length !== 4) {
      setErrorMessage('Please enter your 4-digit staff PIN.');
      return;
    }

    setIsLoading(true);

    try {
      let matchedStaff: StaffMember | null = null;
      let matchedStore: Store | null = null;

      const cleanPhone10 = cleanPhone.slice(-10);

      // 1. First attempt Cloud Firestore lookup across stores
      try {
        const db = getFirestoreDb();
        const allStores = await getDocs(collection(db, 'stores'));
        for (const s of allStores.docs) {
          try {
            const staffSnap = await getDocs(collection(db, 'stores', s.id, 'staff'));
            for (const docSnap of staffSnap.docs) {
              const data = docSnap.data();
              const sPhone = String(data.phone || '').replace(/\D/g, '').slice(-10);
              const sPin = String(data.pin || '').trim();
              if (sPhone === cleanPhone10 && sPin === cleanPin && data.isActive !== false) {
                matchedStore = s.data() as Store;
                matchedStaff = { ...data, id: docSnap.id, storeId: s.id } as StaffMember;
                break;
              }
            }
          } catch {}
          if (matchedStaff) break;
        }
      } catch (cloudErr) {
        console.log('Cloud staff check note:', cloudErr);
      }

      // 2. Local starter staff fallback (works 100% offline & in demo mode)
      if (!matchedStaff) {
        const allKnownStaff = [...staffList, ...DEFAULT_STARTER_STAFF];
        const localMatch = allKnownStaff.find((s) => {
          const sPhone = String(s.phone || '').replace(/\D/g, '').slice(-10);
          const sPin = String(s.pin || '').trim();
          return sPhone === cleanPhone10 && sPin === cleanPin && s.isActive !== false;
        });

        if (localMatch) {
          matchedStaff = localMatch;
          matchedStore = {
            id: localMatch.storeId || 'demo_store_1',
            name: 'Kirana Pro Store',
            type: 'kirana',
            address: { street: 'Main Market Road', city: 'Mumbai', state: 'MH', pincode: '400001' },
            gstNumber: null,
            logoURL: null,
            ownerId: 'owner_default',
            staffIds: ['staff_owner', 'staff_cashier_1', 'staff_cashier_2'],
            settings: {
              currency: 'INR',
              weightUnit: 'kg',
              defaultTaxRate: 0,
              invoicePrefix: 'INV',
              invoiceCounter: 1,
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        }
      }

      if (!matchedStaff) {
        setErrorMessage('Invalid Mobile Number or 4-Digit PIN. Please check with store owner.');
        setIsLoading(false);
        return;
      }

      setVerifiedStaff(matchedStaff);
      setVerifiedStore(matchedStore);
      setCounterNumber(matchedStaff.counterAssigned || 1);
    } catch (err: any) {
      setErrorMessage(err.message || 'Staff verification failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartShiftAndOpenPOS = () => {
    if (!verifiedStaff) return;

    const openingCashNum = parseFloat(openingCash) || 0;

    // 1. Activate Staff in Zustand
    setActiveStaff(verifiedStaff);

    // 2. Open Cashier Counter Session
    openShift(counterNumber, openingCashNum);

    // 3. Set Active Store
    if (verifiedStore) {
      setStore(verifiedStore);
    }

    // 4. Authenticate session in AuthStore so RootNavigator automatically transitions to MainTabs
    setUser({
      uid: verifiedStaff.id,
      phoneNumber: verifiedStaff.phone,
      displayName: verifiedStaff.name,
      storeId: verifiedStaff.storeId || 'demo_store_1',
      role: verifiedStaff.role,
      createdAt: verifiedStaff.createdAt,
      updatedAt: verifiedStaff.updatedAt,
    } as any);

    // Alert / Toast
    Alert.alert(
      'Shift Activated',
      `Welcome ${verifiedStaff.name}!\nCounter ${counterNumber} register opened with ₹${openingCashNum} cash.`
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F2F7" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Apple Navigation Header */}
          <View style={styles.navHeader}>
            <TouchableOpacity
              style={styles.backButton}
              activeOpacity={0.7}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backButtonText}>‹ Back</Text>
            </TouchableOpacity>
            <View style={styles.headerTitleBox}>
              <Text style={styles.headerEyebrow}>POINT OF SALE</Text>
              <Text style={styles.headerTitle}>Staff & Cashier Register</Text>
            </View>
          </View>

          {!verifiedStaff ? (
            /* STEP 1: Identification & PIN */
            <View style={styles.formCard}>
              <View style={styles.cardHeader}>
                <View style={styles.cardBadge}>
                  <Text style={styles.cardBadgeText}>STEP 1 OF 2</Text>
                </View>
                <Text style={styles.cardTitle}>Enter Your Credentials</Text>
                <Text style={styles.cardSubtitle}>
                  Authenticate with your registered mobile and 4-digit security PIN.
                </Text>
              </View>

              {errorMessage ? (
                <View style={styles.errorBanner}>
                  <Feather name="alert-circle" size={14} color="#EA5455" style={{ marginRight: 6 }} />
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              ) : null}

              {/* Staff Mobile Number */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Staff Mobile Number</Text>
                <View style={styles.phoneInputRow}>
                  <View style={styles.phonePrefix}>
                    <Text style={styles.phonePrefixText}>+91</Text>
                  </View>
                  <TextInput
                    style={[styles.textInput, styles.phoneTextInput]}
                    value={phoneInput}
                    onChangeText={setPhoneInput}
                    placeholder="10-digit mobile"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="phone-pad"
                    maxLength={10}
                  />
                </View>
              </View>

              {/* 4-Digit Security PIN */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>4-Digit Security PIN</Text>
                <TextInput
                  style={[styles.textInput, styles.pinInput]}
                  value={pinInput}
                  onChangeText={setPinInput}
                  placeholder="••••"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                  maxLength={4}
                  secureTextEntry
                />
                <Text style={styles.inputHint}>
                  Set by store owner in Staff & Shift Register settings.
                </Text>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.primaryButton, isLoading && { opacity: 0.7 }]}
                activeOpacity={0.85}
                disabled={isLoading}
                onPress={handleVerifyStaff}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <View style={styles.btnRow}>
                    <Text style={styles.primaryButtonText}>Verify Staff PIN</Text>
                    <Feather name="arrow-right" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            /* STEP 2: Shift Registration & Opening Cash */
            <View style={styles.formCard}>
              <View style={styles.cardHeader}>
                <View style={styles.cardBadgeSuccess}>
                  <Feather name="check" size={11} color="#28C76F" style={{ marginRight: 4 }} />
                  <Text style={styles.cardBadgeSuccessText}>VERIFIED</Text>
                </View>
                <Text style={styles.cardTitle}>Open Shift Register</Text>
                <Text style={styles.cardSubtitle}>
                  Set your counter number and opening cash balance in the galla.
                </Text>
              </View>

              {/* Verified Staff Profile Badge */}
              <View style={styles.profileBadgeCard}>
                <View style={styles.profileAvatar}>
                  <Feather
                    name={verifiedStaff.role === 'owner' ? 'shield' : 'user'}
                    size={20}
                    color="#7367F0"
                  />
                </View>
                <View style={styles.profileMeta}>
                  <Text style={styles.profileName}>{verifiedStaff.name}</Text>
                  <Text style={styles.profileSub}>
                    Role: <Text style={styles.boldText}>{verifiedStaff.role.toUpperCase()}</Text> • Store: {verifiedStore?.name || 'Kirana Pro'}
                  </Text>
                </View>
              </View>

              {/* Counter Selection */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Assigned Counter Number</Text>
                <View style={styles.segmentedRow}>
                  {[1, 2, 3].map((num) => (
                    <TouchableOpacity
                      key={num}
                      style={[
                        styles.segmentBtn,
                        counterNumber === num && styles.segmentBtnActive,
                      ]}
                      activeOpacity={0.8}
                      onPress={() => setCounterNumber(num)}
                    >
                      <Text
                        style={[
                          styles.segmentText,
                          counterNumber === num && styles.segmentTextActive,
                        ]}
                      >
                        Counter #{num}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Opening Galla Cash */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Opening Galla Cash (₹)</Text>
                <View style={styles.cashInputRow}>
                  <Text style={styles.currencySymbol}>₹</Text>
                  <TextInput
                    style={[styles.textInput, styles.cashTextInput]}
                    value={openingCash}
                    onChangeText={setOpeningCash}
                    placeholder="500"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                  />
                </View>

                {/* Quick Cash Chips */}
                <View style={styles.chipsRow}>
                  {['200', '500', '1000', '2000'].map((val) => (
                    <TouchableOpacity
                      key={val}
                      style={[
                        styles.chipPill,
                        openingCash === val && styles.chipPillActive,
                      ]}
                      onPress={() => setOpeningCash(val)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          openingCash === val && styles.chipTextActive,
                        ]}
                      >
                        ₹{val}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Action Buttons */}
              <TouchableOpacity
                style={styles.primaryButton}
                activeOpacity={0.85}
                onPress={handleStartShiftAndOpenPOS}
              >
                <View style={styles.btnRow}>
                  <Feather name="play" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.primaryButtonText}>
                    Start Counter Shift & Open Billing POS
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.textBtn}
                onPress={() => {
                  setVerifiedStaff(null);
                  setPinInput('');
                }}
              >
                <Text style={styles.textBtnLabel}>Switch Staff Member</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Footer Security Note */}
          <View style={styles.footerNoteBox}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 4 }}>
              <Feather name="shield" size={12} color="#8E8E93" />
              <Text style={styles.footerNoteText}>Tamper-Proof Shift Audit</Text>
            </View>
            <Text style={styles.footerNoteText}>
              Kirana Pro Shift Register logs opening/closing cash, cashier bills,
              and cash discrepancies with complete audit tracking.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },
  navHeader: {
    marginBottom: 16,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  backButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#7367F0',
  },
  headerTitleBox: {},
  headerEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7367F0',
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1C1C1E',
    letterSpacing: -0.5,
    marginTop: 2,
  },
  quickFillCard: {
    backgroundColor: 'rgba(115, 103, 240, 0.08)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  quickFillLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46',
    marginBottom: 8,
  },
  quickFillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickFillPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  quickFillPillEmoji: {
    fontSize: 13,
    marginRight: 4,
  },
  quickFillPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#065F46',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(60, 60, 67, 0.08)',
    marginBottom: 16,
  },
  cardHeader: {
    marginBottom: 18,
  },
  cardBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  cardBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8E8E93',
    letterSpacing: 0.6,
  },
  cardBadgeSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#E8FADF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  cardBadgeSuccessText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#28C76F',
    letterSpacing: 0.6,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1C1C1E',
    letterSpacing: -0.3,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#636366',
    marginTop: 4,
    lineHeight: 18,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FCE4E4',
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
  },
  errorText: {
    color: '#EA5455',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 6,
  },
  inputHint: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 4,
  },
  textInput: {
    backgroundColor: '#F8F7FA',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#2F2B3D',
    borderWidth: 1,
    borderColor: '#DBDADE',
  },
  phoneInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  phonePrefix: {
    backgroundColor: '#EDEBFD',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  phonePrefixText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#7367F0',
  },
  phoneTextInput: {
    flex: 1,
    letterSpacing: 1,
    fontWeight: '600',
  },
  pinInput: {
    letterSpacing: 8,
    fontWeight: '800',
    fontSize: 18,
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: '#7367F0',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#7367F0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  profileBadgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F7FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DBDADE',
  },
  profileAvatar: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#EDEBFD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileAvatarText: {
    fontSize: 22,
  },
  profileMeta: {
    flex: 1,
  },
  profileName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  profileSub: {
    fontSize: 12,
    color: '#636366',
    marginTop: 2,
  },
  boldText: {
    fontWeight: '700',
    color: '#7367F0',
  },
  segmentedRow: {
    flexDirection: 'row',
    backgroundColor: '#F8F7FA',
    padding: 3,
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: '#DBDADE',
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  segmentBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#2F2B3D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6F6B7D',
  },
  segmentTextActive: {
    color: '#7367F0',
    fontWeight: '700',
  },
  cashInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  currencySymbol: {
    position: 'absolute',
    left: 14,
    zIndex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#7367F0',
  },
  cashTextInput: {
    flex: 1,
    paddingLeft: 32,
    fontSize: 18,
    fontWeight: '700',
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  chipPill: {
    backgroundColor: '#F8F7FA',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DBDADE',
  },
  chipPillActive: {
    backgroundColor: '#EDEBFD',
    borderColor: '#7367F0',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6F6B7D',
  },
  chipTextActive: {
    color: '#7367F0',
    fontWeight: '700',
  },
  textBtn: {
    alignItems: 'center',
    marginTop: 14,
    paddingVertical: 6,
  },
  textBtnLabel: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '600',
  },
  footerNoteBox: {
    paddingHorizontal: 8,
  },
  footerNoteText: {
    fontSize: 11,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 16,
  },
});
