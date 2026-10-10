import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useHardwareStore } from '../../store/hardwareStore';
import { useStoreStore } from '../../store/storeStore';
import { printTestReceipt, kickCashDrawer } from '../../services/printerService';
import { connectSerialScale, disconnectScale, startSimulatedScale } from '../../services/scaleService';
import { colors } from '../../theme';
import { PrinterWidth, PrinterConnectionType } from '@kirana-pro/shared';

export const PrinterSettingsScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const {
    printerWidth,
    connectionType,
    printerName,
    autoCut,
    autoKickDrawer,
    isScaleConnected,
    scaleWeight,
    isScaleStable,
    isSimulatedScale,
    setPrinterWidth,
    setConnectionType,
    setPrinterName,
    setAutoCut,
    setAutoKickDrawer,
    tareScale,
  } = useHardwareStore();

  const { store } = useStoreStore();
  const [printing, setPrinting] = useState(false);
  const [simWeightInput, setSimWeightInput] = useState('1.500');

  const storeInfo = {
    name: store?.name || 'Kirana Pro Dukaan',
    address: typeof store?.address === 'string' ? store.address : store?.address?.street ? `${store.address.street}, ${store.address.city}` : 'Main Market, Delhi',
    phone: (store as any)?.phoneNumber || (store as any)?.phone || '9876543210',
    gstin: store?.gstNumber || '07AABCK1234F1Z5',
  };

  const handleTestPrint = async () => {
    setPrinting(true);
    const settings = useHardwareStore.getState().getPrinterSettings();
    const result = await printTestReceipt(storeInfo, settings);
    setPrinting(false);

    Alert.alert(
      result.success ? 'Print Success' : 'Print Error',
      result.message
    );
  };

  const handleTestDrawerKick = async () => {
    const settings = useHardwareStore.getState().getPrinterSettings();
    await kickCashDrawer(settings);
    Alert.alert('Drawer Pulse Sent', 'Triggered pulse to open physical cash drawer.');
  };

  const handleConnectScale = async () => {
    const res = await connectSerialScale();
    Alert.alert(res.success ? 'Scale Connected' : 'Scale Notice', res.message);
  };

  const handleToggleSimulatedScale = () => {
    if (isSimulatedScale) {
      disconnectScale();
      Alert.alert('Scale Disconnected', 'Turned off digital weighing scale.');
    } else {
      const w = parseFloat(simWeightInput) || 1.25;
      startSimulatedScale(w);
      Alert.alert('Simulated Scale Active', `Simulating scale streaming at ${w.toFixed(3)} kg.`);
    }
  };

  const handleUpdateSimWeight = () => {
    const w = parseFloat(simWeightInput);
    if (!isNaN(w) && w >= 0) {
      startSimulatedScale(w);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Hardware & Counter Peripherals</Text>
          <Text style={styles.sub}>
            Thermal receipt printers, automatic cash drawer & digital weighing scales
          </Text>
        </View>

        {/* SECTION 1: ESC/POS Thermal Receipt Printer */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Feather name="printer" size={18} color="#7367F0" />
              <Text style={styles.cardTitle}>Thermal Receipt Printer</Text>
            </View>
            <View style={styles.badgeSuccess}>
              <Text style={styles.badgeText}>Ready</Text>
            </View>
          </View>

          {/* Roll Width Selection (58mm vs 80mm) */}
          <Text style={styles.label}>PAPER ROLL WIDTH (कागज़ की चौड़ाई)</Text>
          <View style={styles.toggleRow}>
            {(['58mm', '80mm'] as PrinterWidth[]).map((w) => (
              <TouchableOpacity
                key={w}
                style={[styles.toggleBtn, printerWidth === w && styles.toggleBtnActive]}
                onPress={() => setPrinterWidth(w)}
              >
                <Text style={[styles.toggleText, printerWidth === w && styles.toggleTextActive]}>
                  {w} ({w === '58mm' ? '32 chars/line • Standard' : '48 chars/line • Wide'})
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Connection Type */}
          <Text style={[styles.label, { marginTop: 14 }]}>CONNECTION TYPE (कनेक्शन प्रकार)</Text>
          <View style={styles.toggleRow}>
            {(['system', 'bluetooth', 'usb'] as PrinterConnectionType[]).map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.toggleBtn, connectionType === c && styles.toggleBtnActive]}
                onPress={() => setConnectionType(c)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Feather
                    name={c === 'system' ? 'monitor' : c === 'bluetooth' ? 'radio' : 'cpu'}
                    size={14}
                    color={connectionType === c ? '#FFFFFF' : '#6F6B7D'}
                  />
                  <Text style={[styles.toggleText, connectionType === c && styles.toggleTextActive]}>
                    {c === 'system' ? 'System' : c === 'bluetooth' ? 'Bluetooth' : 'USB'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Device Model Label */}
          <Text style={[styles.label, { marginTop: 14 }]}>PRINTER MODEL NAME</Text>
          <TextInput
            style={styles.input}
            value={printerName}
            onChangeText={setPrinterName}
            placeholder="e.g. Everycom POS 58 or NGX NXR-80"
            placeholderTextColor="#A8AAAE"
          />

          {/* Toggles */}
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchTitle}>Auto Paper Cut (कागज़ ऑटो-कट)</Text>
              <Text style={styles.switchSub}>Sends GS V command after bill footer</Text>
            </View>
            <Switch
              value={autoCut}
              onValueChange={setAutoCut}
              trackColor={{ false: '#DBDADE', true: '#7367F0' }}
            />
          </View>

          <View style={[styles.switchRow, { borderBottomWidth: 0 }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchTitle}>Auto Cash Drawer Kick (गल्ला ऑटो-ओपन)</Text>
              <Text style={styles.switchSub}>Pops open cash drawer on cash invoice payment</Text>
            </View>
            <Switch
              value={autoKickDrawer}
              onValueChange={setAutoKickDrawer}
              trackColor={{ false: '#DBDADE', true: '#7367F0' }}
            />
          </View>

          {/* Test Buttons */}
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.testPrintBtn]}
              activeOpacity={0.85}
              onPress={handleTestPrint}
              disabled={printing}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Feather name="printer" size={14} color="#7367F0" />
                <Text style={styles.testPrintText}>
                  {printing ? 'Printing...' : 'Print Test Receipt'}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.testKickBtn]}
              activeOpacity={0.85}
              onPress={handleTestDrawerKick}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Feather name="dollar-sign" size={14} color="#7367F0" />
                <Text style={styles.testKickText}>Test Drawer Kick</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* SECTION 2: Electronic Weighing Scale (Taraju) */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Feather name="sliders" size={18} color="#7367F0" />
              <Text style={styles.cardTitle}>Electronic Weighing Scale (तराजू)</Text>
            </View>
            <View style={isScaleConnected ? styles.badgeSuccess : styles.badgeOffline}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Feather
                  name={isScaleConnected ? "check-circle" : "circle"}
                  size={10}
                  color={isScaleConnected ? "#28C76F" : "#6F6B7D"}
                />
                <Text style={[styles.badgeText, !isScaleConnected && { color: '#6F6B7D' }]}>
                  {isScaleConnected ? 'Live Connected' : 'Disconnected'}
                </Text>
              </View>
            </View>
          </View>

          {/* Live Weight Display Card */}
          <View style={styles.scaleDisplayBox}>
            <View>
              <Text style={styles.scaleDisplayLabel}>LIVE SENSOR WEIGHT</Text>
              <Text style={styles.scaleDisplayVal}>
                {scaleWeight.toFixed(3)} <Text style={{ fontSize: 18, color: '#A8AAAE' }}>kg</Text>
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 6 }}>
              <View style={[styles.stablePill, isScaleStable ? styles.stablePillOn : styles.stablePillOff]}>
                <Text style={styles.stableText}>
                  {isScaleStable ? 'STABLE' : 'UNSTABLE'}
                </Text>
              </View>
              <TouchableOpacity style={styles.tareBtn} onPress={tareScale}>
                <Text style={styles.tareBtnText}>TARE (0.000)</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.scaleProtocolsText}>
            Supports standard RS-232 / USB / Bluetooth ASCII continuous streams (Essae, Phoenix, Eagle, Toledo at 9600 baud).
          </Text>

          {/* Scale Connect Buttons */}
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.connectScaleBtn]}
              onPress={handleConnectScale}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Feather name="link" size={14} color="#7367F0" />
                <Text style={styles.connectScaleText}>Connect USB / Serial Scale</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Simulation Box for Dev / Testing */}
          <View style={styles.simBox}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.simTitle}>Hardware Simulator (Test Mode)</Text>
              <TouchableOpacity
                style={[styles.simToggleBtn, isSimulatedScale && styles.simToggleBtnActive]}
                onPress={handleToggleSimulatedScale}
              >
                <Text style={[styles.simToggleText, isSimulatedScale && styles.simToggleTextActive]}>
                  {isSimulatedScale ? 'Turn Off Simulator' : 'Start Simulator'}
                </Text>
              </TouchableOpacity>
            </View>

            {isSimulatedScale && (
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, alignItems: 'center' }}>
                <Text style={{ fontSize: 12, color: '#6F6B7D' }}>Set Weight (kg):</Text>
                <TextInput
                  style={styles.simInput}
                  value={simWeightInput}
                  onChangeText={setSimWeightInput}
                  keyboardType="numeric"
                  placeholder="1.500"
                  placeholderTextColor="#A8AAAE"
                />
                <TouchableOpacity style={styles.applyBtn} onPress={handleUpdateSimWeight}>
                  <Text style={styles.applyBtnText}>Set Weight</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F7FA',
  },
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2F2B3D',
  },
  sub: {
    fontSize: 12,
    color: '#6F6B7D',
    marginTop: 2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#DBDADE',
    marginBottom: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2F2B3D',
  },
  badgeSuccess: {
    backgroundColor: '#DDF6E8',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeOffline: {
    backgroundColor: '#F1F0F5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#28C76F',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6F6B7D',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleBtn: {
    flex: 1,
    backgroundColor: '#F8F7FA',
    borderWidth: 1,
    borderColor: '#DBDADE',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleBtnActive: {
    backgroundColor: '#7367F0',
    borderColor: '#7367F0',
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6F6B7D',
    textAlign: 'center',
  },
  toggleTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#F8F7FA',
    borderWidth: 1,
    borderColor: '#DBDADE',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#2F2B3D',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F0F5',
  },
  switchTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2F2B3D',
  },
  switchSub: {
    fontSize: 11,
    color: '#6F6B7D',
    marginTop: 1,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  testPrintBtn: {
    backgroundColor: '#EDEBFD',
    borderWidth: 1,
    borderColor: 'rgba(115, 103, 240, 0.25)',
  },
  testPrintText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7367F0',
  },
  testKickBtn: {
    backgroundColor: '#EDEBFD',
    borderWidth: 1,
    borderColor: 'rgba(115, 103, 240, 0.25)',
  },
  testKickText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7367F0',
  },
  scaleDisplayBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2F2B3D',
    borderRadius: 10,
    padding: 16,
    marginVertical: 10,
  },
  scaleDisplayLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#A8AAAE',
    letterSpacing: 0.5,
  },
  scaleDisplayVal: {
    fontSize: 28,
    fontWeight: '800',
    color: '#7367F0',
    marginTop: 2,
  },
  stablePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  stablePillOn: {
    backgroundColor: '#28C76F',
  },
  stablePillOff: {
    backgroundColor: '#FF9F43',
  },
  stableText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  tareBtn: {
    backgroundColor: '#4B465C',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  tareBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  scaleProtocolsText: {
    fontSize: 11,
    color: '#6F6B7D',
    marginTop: 4,
    lineHeight: 16,
  },
  connectScaleBtn: {
    backgroundColor: '#EDEBFD',
    borderWidth: 1,
    borderColor: 'rgba(115, 103, 240, 0.25)',
  },
  connectScaleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7367F0',
  },
  simBox: {
    backgroundColor: '#F8F7FA',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#DBDADE',
    marginTop: 12,
  },
  simTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2F2B3D',
  },
  simToggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#F1F0F5',
  },
  simToggleBtnActive: {
    backgroundColor: '#7367F0',
  },
  simToggleText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6F6B7D',
  },
  simToggleTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  simInput: {
    width: 80,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DBDADE',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 13,
    color: '#2F2B3D',
  },
  applyBtn: {
    backgroundColor: '#7367F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
