import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { createStore } from '../../services/store';
import { StoreType } from '@kirana-pro/shared';
import { colors } from '../../theme';
import { Feather } from '@expo/vector-icons';

const STORE_TYPES: { label: string; value: StoreType; icon: keyof typeof Feather.glyphMap }[] = [
  { label: 'Kirana / Grocery', value: 'kirana', icon: 'shopping-bag' },
  { label: 'General Store', value: 'general', icon: 'archive' },
  { label: 'Dairy / Milk', value: 'dairy', icon: 'coffee' },
  { label: 'Medical / Chemist', value: 'medical', icon: 'plus-circle' },
  { label: 'Other Business', value: 'other', icon: 'briefcase' },
];

export const StoreSetupScreen: React.FC = () => {
  const { user } = useAuthStore();
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Form states
  const [name, setName] = useState('');
  const [type, setType] = useState<StoreType>('kirana');
  const [customType, setCustomType] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Rajasthan');
  const [pincode, setPincode] = useState('');
  const [gstNumber, setGstNumber] = useState('');

  const validateStep1 = () => {
    if (!name.trim()) {
      setErrorMsg('Please enter your store/dukaan name');
      return false;
    }
    setErrorMsg('');
    return true;
  };

  const validateStep2 = () => {
    if (type === 'other' && !customType.trim()) {
      setErrorMsg('Please describe your store type');
      return false;
    }
    setErrorMsg('');
    return true;
  };

  const validateStep3 = () => {
    if (!city.trim()) {
      setErrorMsg('Please enter your city/town');
      return false;
    }
    if (!/^\d{6}$/.test(pincode.trim())) {
      setErrorMsg('Please enter a valid 6-digit postal pincode');
      return false;
    }
    setErrorMsg('');
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
    else if (step === 3 && validateStep3()) setStep(4);
    else if (step === 4) setStep(5);
  };

  const handleBack = () => {
    setErrorMsg('');
    if (step > 1) setStep(step - 1);
  };

  const handleCreateStore = async () => {
    setLoading(true);
    setErrorMsg('');
    const currentUserId = user?.uid || (user as any)?.id || 'owner_default';

    try {
      await createStore(
        {
          name: name.trim() || 'My Kirana Store',
          type,
          customType: type === 'other' ? customType.trim() : undefined,
          address: {
            street: street.trim() || 'Main Market',
            city: city.trim() || 'Jaipur',
            state: state.trim() || 'Rajasthan',
            pincode: /^\d{6}$/.test(pincode.trim()) ? pincode.trim() : '302001',
          },
          gstNumber: gstNumber.trim() ? gstNumber.trim().toUpperCase() : null,
        },
        currentUserId
      );
    } catch (err: any) {
      console.error('Store creation error:', err);
      let msg = err.message || 'Failed to create store. Please try again.';
      try {
        const parsed = JSON.parse(err.message);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].message) {
          msg = `${parsed[0].path?.join('.') || 'Error'}: ${parsed[0].message}`;
        }
      } catch {}
      setErrorMsg(msg);
      setLoading(false);
    }
  };

  // Quick fill sample for fast testing
  const handleQuickFill = () => {
    setName('Ganesh Kirana Store');
    setType('kirana');
    setStreet('12 Gandhi Bazar');
    setCity('Jaipur');
    setState('Rajasthan');
    setPincode('302001');
    setStep(5);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Header & Step Indicator */}
          <View style={styles.header}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>Step {step} of 5</Text>
            </View>
            <TouchableOpacity onPress={handleQuickFill} style={styles.quickFillBtn}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Feather name="zap" size={13} color="#7367F0" />
                <Text style={styles.quickFillText}>Quick Fill</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Progress bar */}
          <View style={styles.progressTrack}>
            <View style={[styles.progressBar, { width: `${(step / 5) * 100}%` }]} />
          </View>

          {errorMsg ? (
            <View style={styles.errorBox}>
              <Feather name="alert-circle" size={14} color="#EA5455" style={{ marginRight: 6 }} />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          {/* Step 1: Store Name */}
          {step === 1 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>What is your Dukaan's Name?</Text>
              <Text style={styles.stepSub}>
                This name will appear on all bills, Taraju receipts, and stock reports.
              </Text>
              <View style={styles.inputCard}>
                <Text style={styles.inputLabel}>STORE NAME</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Laxmi Kirana Store"
                  placeholderTextColor="#94A3B8"
                  value={name}
                  onChangeText={setName}
                  autoFocus
                />
              </View>
            </View>
          )}

          {/* Step 2: Store Type */}
          {step === 2 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Select Store Category</Text>
              <Text style={styles.stepSub}>
                Helps configure initial tax rates and measuring scale defaults.
              </Text>
              <View style={styles.typesGrid}>
                {STORE_TYPES.map((t) => {
                  const selected = type === t.value;
                  return (
                    <TouchableOpacity
                      key={t.value}
                      style={[styles.typeCard, selected && styles.typeCardSelected]}
                      onPress={() => setType(t.value)}
                    >
                      <View style={{ marginBottom: 8 }}>
                        <Feather name={t.icon} size={26} color={selected ? '#7367F0' : '#6F6B7D'} />
                      </View>
                      <Text style={[styles.typeLabel, selected && styles.typeLabelSelected]}>
                        {t.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {type === 'other' && (
                <View style={[styles.inputCard, { marginTop: 12 }]}>
                  <Text style={styles.inputLabel}>CUSTOM CATEGORY</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Organic Produce"
                    placeholderTextColor="#94A3B8"
                    value={customType}
                    onChangeText={setCustomType}
                  />
                </View>
              )}
            </View>
          )}

          {/* Step 3: Address */}
          {step === 3 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Where is your Dukaan located?</Text>
              <Text style={styles.stepSub}>
                Pincode and city are required for your invoice header.
              </Text>

              <View style={styles.inputCard}>
                <Text style={styles.inputLabel}>STREET / LOCALITY (OPTIONAL)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Shop #4, Gandhi Chowk"
                  placeholderTextColor="#94A3B8"
                  value={street}
                  onChangeText={setStreet}
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.inputCard, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>CITY / TOWN</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Jaipur"
                    placeholderTextColor="#94A3B8"
                    value={city}
                    onChangeText={setCity}
                  />
                </View>

                <View style={[styles.inputCard, { width: 120 }]}>
                  <Text style={styles.inputLabel}>PINCODE</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="302001"
                    placeholderTextColor="#94A3B8"
                    keyboardType="number-pad"
                    maxLength={6}
                    value={pincode}
                    onChangeText={setPincode}
                  />
                </View>
              </View>
            </View>
          )}

          {/* Step 4: GST Number */}
          {step === 4 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>GSTIN (Optional)</Text>
              <Text style={styles.stepSub}>
                If your dukaan has a 15-digit GST number, enter it here. Otherwise, you can skip!
              </Text>
              <View style={styles.inputCard}>
                <Text style={styles.inputLabel}>15-DIGIT GST NUMBER</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. 08AAAAA0000A1Z5"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="characters"
                  maxLength={15}
                  value={gstNumber}
                  onChangeText={setGstNumber}
                />
              </View>
            </View>
          )}

          {/* Step 5: Review */}
          {step === 5 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Ready to launch your Dukaan!</Text>
              <Text style={styles.stepSub}>Review your details below before launching:</Text>

              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Store Name</Text>
                  <Text style={styles.summaryValue}>{name || 'Ganesh Kirana'}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Category</Text>
                  <Text style={styles.summaryValue}>{type.toUpperCase()}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Location</Text>
                  <Text style={styles.summaryValue}>{city || 'Jaipur'}, {pincode || '302001'}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>GSTIN</Text>
                  <Text style={styles.summaryValue}>{gstNumber || 'Not Registered (Exempt)'}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Action Footer */}
          <View style={styles.footer}>
            {step > 1 && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleBack}
                disabled={loading}
              >
                <Text style={styles.backButtonText}>← Back</Text>
              </TouchableOpacity>
            )}

            {step < 5 ? (
              <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                <Text style={styles.nextButtonText}>
                  {step === 4 && !gstNumber ? 'Skip & Review →' : 'Continue →'}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.createButton, loading && styles.disabledBtn]}
                onPress={handleCreateStore}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <Feather name="check" size={16} color="#FFFFFF" />
                    <Text style={styles.createButtonText}>Launch Dukaan</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
  },
  scroll: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  stepBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46',
  },
  quickFillBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  quickFillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7367F0',
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 24,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#7367F0',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FCE4E4',
    borderWidth: 1,
    borderColor: '#EA5455',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
  errorText: {
    color: '#EA5455',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  stepContent: {
    marginBottom: 28,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  stepSub: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 20,
  },
  inputCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  textInput: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    paddingVertical: 2,
  },
  row: {
    flexDirection: 'row',
  },
  typesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  typeCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  typeCardSelected: {
    borderColor: '#7367F0',
    backgroundColor: '#EDEBFD',
  },
  typeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6F6B7D',
    textAlign: 'center',
  },
  typeLabelSelected: {
    color: '#7367F0',
    fontWeight: '700',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
  },
  backButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#475569',
    fontSize: 15,
    fontWeight: '700',
  },
  nextButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#7367F0',
    alignItems: 'center',
    shadowColor: '#7367F0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 3,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  createButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#7367F0',
    alignItems: 'center',
    shadowColor: '#7367F0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 3,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  disabledBtn: {
    opacity: 0.6,
  },
});
