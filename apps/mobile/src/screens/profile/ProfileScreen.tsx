import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, SafeAreaView, TouchableOpacity, ScrollView, Alert, Modal, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { DailyGallaScreen } from '../galla/DailyGallaScreen';
import { GSTReportScreen } from '../gst/GSTReportScreen';
import { CounterShiftScreen } from '../staff/CounterShiftScreen';
import { StaffManagementScreen } from '../staff/StaffManagementScreen';
import { PrinterSettingsScreen } from '../hardware/PrinterSettingsScreen';
import { colors } from '../../theme';
import { getPendingSyncSummary, syncAllToCloud, PendingSyncSummary } from '../../services/localStore';

export const ProfileScreen: React.FC = () => {
  const { user, clearUser } = useAuthStore();
  const [showGallaModal, setShowGallaModal] = useState(false);
  const [showGSTModal, setShowGSTModal] = useState(false);
  const [showCounterModal, setShowCounterModal] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showHardwareModal, setShowHardwareModal] = useState(false);
  const effectiveStoreId = user?.storeId || 'demo_store_1';

  const [syncing, setSyncing] = useState(false);
  const [pendingSummary, setPendingSummary] = useState<PendingSyncSummary>({
    total: 0,
    products: 0,
    invoices: 0,
    stockMoves: 0,
  });

  const loadPendingCount = async () => {
    try {
      const summary = await getPendingSyncSummary(effectiveStoreId);
      setPendingSummary(summary);
    } catch {}
  };

  useEffect(() => {
    loadPendingCount();
    const interval = setInterval(loadPendingCount, 3000);
    return () => clearInterval(interval);
  }, [effectiveStoreId]);

  const handleSyncToCloud = async () => {
    setSyncing(true);
    try {
      const result = await syncAllToCloud(effectiveStoreId);
      await loadPendingCount();
      if (result.success) {
        if (result.syncedCount === 0) {
          Alert.alert(
            'All Synced',
            'All products, bills, and stock records are up-to-date with the cloud.'
          );
        } else {
          Alert.alert(
            'Cloud Sync Successful',
            `Uploaded to cloud:\n• ${result.details.products} Products\n• ${result.details.invoices} Bills\n• ${result.details.stockMoves} Stock Movements`
          );
        }
      } else {
        Alert.alert(
          'Sync Notice',
          result.error || 'Could not sync to cloud. Data is safely stored locally on your device.'
        );
      }
    } catch (err: any) {
      Alert.alert('Sync Error', err.message || 'Network error. Data remains safely on phone.');
    } finally {
      setSyncing(false);
    }
  };

  const handleSignOut = () => {
    clearUser();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Feather name="user" size={24} color="#7367F0" />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.displayName || 'Store Owner'}</Text>
            <Text style={styles.userPhone}>{user?.phoneNumber || user?.email || 'Logged In'}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Owner • {user?.storeId ? 'Active Store' : 'No Store'}</Text>
            </View>
          </View>
        </View>

        {/* Free Tier Info Banner */}
        <View style={styles.freeBanner}>
          <View style={styles.bannerIconBox}>
            <Feather name="award" size={20} color="#7367F0" />
          </View>
          <View style={styles.bannerContent}>
            <Text style={styles.bannerTitle}>Kirana Pro Enterprise Tier</Text>
            <Text style={styles.bannerSub}>Active License • Local-First Offline & Cloud Sync</Text>
          </View>
        </View>

        {/* Cloud Data Sync Section (Local-first with manual cloud push) */}
        <View style={styles.syncCard}>
          <View style={styles.syncHeaderRow}>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Feather name="cloud" size={16} color="#7367F0" />
                <Text style={styles.syncCardTitle}>Cloud Sync (क्लाउड सिंक)</Text>
              </View>
              <Text style={styles.syncCardSub}>
                Data is saved locally first. Tap below to upload to cloud.
              </Text>
            </View>
            <View
              style={[
                styles.syncBadge,
                pendingSummary.total > 0 ? styles.syncBadgePending : styles.syncBadgeSuccess,
              ]}
            >
              <Feather
                name={pendingSummary.total > 0 ? "alert-circle" : "check-circle"}
                size={12}
                color={pendingSummary.total > 0 ? "#FF9F43" : "#28C76F"}
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  styles.syncBadgeText,
                  pendingSummary.total > 0
                    ? styles.syncBadgeTextPending
                    : styles.syncBadgeTextSuccess,
                ]}
              >
                {pendingSummary.total > 0
                  ? `${pendingSummary.total} Local Items`
                  : 'All Synced'}
              </Text>
            </View>
          </View>

          {pendingSummary.total > 0 ? (
            <View style={styles.breakdownBox}>
              <Text style={styles.breakdownText}>
                Pending Sync: {pendingSummary.products} Products • {pendingSummary.invoices} Bills •{' '}
                {pendingSummary.stockMoves} Stock Updates
              </Text>
            </View>
          ) : (
            <View style={styles.syncedBox}>
              <Feather name="check" size={14} color="#28C76F" style={{ marginRight: 6 }} />
              <Text style={styles.syncedText}>
                Dukaan data is safely synced with the cloud.
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.syncButton, syncing && styles.syncButtonDisabled]}
            activeOpacity={0.85}
            onPress={handleSyncToCloud}
            disabled={syncing}
          >
            {syncing ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Feather name="upload-cloud" size={16} color="#FFFFFF" />
                <Text style={styles.syncButtonText}>Sync with Cloud (क्लाउड से सिंक करें)</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Store Information */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>Dukaan Details</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Store ID</Text>
            <Text style={styles.infoValue}>{user?.storeId || 'Not Configured'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Role</Text>
            <Text style={styles.infoValue}>{user?.role || 'owner'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Taraju Scale Calculator</Text>
            <Text style={[styles.infoValue, { color: '#7367F0' }]}>Active</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Barcode Lookup</Text>
            <Text style={[styles.infoValue, { color: '#7367F0' }]}>Open Food Facts API</Text>
          </View>
        </View>

        {/* Store Tools & Galla */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>Dukaan Tools & Management</Text>
          <TouchableOpacity
            style={styles.gallaTile}
            onPress={() => setShowGallaModal(true)}
          >
            <View style={styles.gallaIconBg}>
              <Feather name="dollar-sign" size={20} color="#7367F0" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.gallaTileTitle}>Daily Galla (दैनिक गल्ला)</Text>
              <Text style={styles.gallaTileSubtitle}>
                Morning cash opening & night drawer closing settlement
              </Text>
            </View>
            <Feather name="chevron-right" size={18} color="#6F6B7D" />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* GST Reports & Tax Filing */}
          <TouchableOpacity
            style={styles.gallaTile}
            onPress={() => setShowGSTModal(true)}
          >
            <View style={[styles.gallaIconBg, { backgroundColor: '#EDEBFD' }]}>
              <Feather name="file-text" size={20} color="#7367F0" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.gallaTileTitle}>GST Reports & GSTR-1 (जीएसटी रिपोर्ट)</Text>
              <Text style={styles.gallaTileSubtitle}>
                GSTR-1 JSON return export, HSN summary & CA accountant reports
              </Text>
            </View>
            <Feather name="chevron-right" size={18} color="#6F6B7D" />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Counter Shifts & Register */}
          <TouchableOpacity
            style={styles.gallaTile}
            onPress={() => setShowCounterModal(true)}
          >
            <View style={[styles.gallaIconBg, { backgroundColor: '#EDEBFD' }]}>
              <Feather name="clock" size={20} color="#7367F0" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.gallaTileTitle}>Counter Shifts & Register (काउंटर व शिफ्ट)</Text>
              <Text style={styles.gallaTileSubtitle}>
                Opening drawer float, cashier sales tally & shift handover
              </Text>
            </View>
            <Feather name="chevron-right" size={18} color="#6F6B7D" />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Staff & Cashier PINs */}
          <TouchableOpacity
            style={styles.gallaTile}
            onPress={() => setShowStaffModal(true)}
          >
            <View style={[styles.gallaIconBg, { backgroundColor: '#EDEBFD' }]}>
              <Feather name="users" size={20} color="#7367F0" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.gallaTileTitle}>Staff & Cashier PINs (स्टाफ व पिन)</Text>
              <Text style={styles.gallaTileSubtitle}>
                4-digit login PINs, staff directory & role permissions
              </Text>
            </View>
            <Feather name="chevron-right" size={18} color="#6F6B7D" />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Hardware & Thermal Printer */}
          <TouchableOpacity
            style={styles.gallaTile}
            onPress={() => setShowHardwareModal(true)}
          >
            <View style={[styles.gallaIconBg, { backgroundColor: '#EDEBFD' }]}>
              <Feather name="printer" size={20} color="#7367F0" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.gallaTileTitle}>Hardware & Printers (हार्डवेयर व तराजू)</Text>
              <Text style={styles.gallaTileSubtitle}>
                58mm/80mm thermal receipt printer, drawer kick & digital scale
              </Text>
            </View>
            <Feather name="chevron-right" size={18} color="#6F6B7D" />
          </TouchableOpacity>
        </View>

        {/* Modal for Daily Galla */}
        {showGallaModal && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Daily Galla Settlement</Text>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setShowGallaModal(false)}
              >
                <Feather name="x" size={16} color="#6F6B7D" />
                <Text style={styles.modalCloseText}>Close</Text>
              </TouchableOpacity>
            </View>
            <DailyGallaScreen />
          </View>
        )}

        {/* Modal for GST Reports */}
        {showGSTModal && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>GST Reports & Returns</Text>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setShowGSTModal(false)}
              >
                <Feather name="x" size={16} color="#6F6B7D" />
                <Text style={styles.modalCloseText}>Close</Text>
              </TouchableOpacity>
            </View>
            <GSTReportScreen />
          </View>
        )}

        {/* Modal for Counter Shift */}
        {showCounterModal && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Counter Shift Register</Text>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setShowCounterModal(false)}
              >
                <Feather name="x" size={16} color="#6F6B7D" />
                <Text style={styles.modalCloseText}>Close</Text>
              </TouchableOpacity>
            </View>
            <CounterShiftScreen />
          </View>
        )}

        {/* Modal for Staff Management */}
        {showStaffModal && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Staff & Cashiers</Text>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setShowStaffModal(false)}
              >
                <Feather name="x" size={16} color="#6F6B7D" />
                <Text style={styles.modalCloseText}>Close</Text>
              </TouchableOpacity>
            </View>
            <StaffManagementScreen />
          </View>
        )}

        {/* Modal for Hardware & Printer Settings */}
        {showHardwareModal && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Hardware & Printer Settings</Text>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setShowHardwareModal(false)}
              >
                <Feather name="x" size={16} color="#6F6B7D" />
                <Text style={styles.modalCloseText}>Close</Text>
              </TouchableOpacity>
            </View>
            <PrinterSettingsScreen />
          </View>
        )}

        {/* App Version Info */}
        <View style={styles.appInfo}>
          <Text style={styles.versionText}>Kirana Pro Enterprise v3.0.0</Text>
          <Text style={styles.copyrightText}>Designed for Indian Kirana Dukaan Owners</Text>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          style={styles.signOutButton}
          activeOpacity={0.85}
          onPress={handleSignOut}
        >
          <Feather name="log-out" size={16} color="#EA5455" style={{ marginRight: 8 }} />
          <Text style={styles.signOutText}>Sign Out of Dukaan</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F7FA',
  },
  scroll: {
    padding: 16,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#DBDADE',
    marginBottom: 14,
    shadowColor: '#2F2B3D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: '#EDEBFD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2F2B3D',
  },
  userPhone: {
    fontSize: 13,
    color: '#6F6B7D',
    marginTop: 2,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EDEBFD',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7367F0',
  },
  freeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#DBDADE',
    marginBottom: 14,
  },
  bannerIconBox: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#EDEBFD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2F2B3D',
  },
  bannerSub: {
    fontSize: 12,
    color: '#6F6B7D',
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#DBDADE',
    marginBottom: 16,
    shadowColor: '#2F2B3D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2F2B3D',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  infoLabel: {
    fontSize: 13,
    color: '#6F6B7D',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2F2B3D',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F0F5',
  },
  appInfo: {
    alignItems: 'center',
    marginVertical: 12,
  },
  versionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A8AAAE',
  },
  copyrightText: {
    fontSize: 11,
    color: '#A8AAAE',
    marginTop: 2,
  },
  signOutButton: {
    backgroundColor: '#FCE4E4',
    paddingVertical: 14,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(234, 84, 85, 0.25)',
    marginTop: 8,
    marginBottom: 30,
  },
  signOutText: {
    color: '#EA5455',
    fontSize: 14,
    fontWeight: '700',
  },
  gallaTile: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  gallaIconBg: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#EDEBFD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gallaTileTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2F2B3D',
  },
  gallaTileSubtitle: {
    fontSize: 12,
    color: '#6F6B7D',
    marginTop: 2,
  },
  modalOverlay: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DBDADE',
    padding: 16,
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F0F5',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2F2B3D',
  },
  modalCloseBtn: {
    backgroundColor: '#F1F0F5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  modalCloseText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6F6B7D',
  },
  syncCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#DBDADE',
    marginBottom: 16,
    shadowColor: '#2F2B3D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  syncHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  syncCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2F2B3D',
  },
  syncCardSub: {
    fontSize: 12,
    color: '#6F6B7D',
    marginTop: 2,
    maxWidth: 210,
  },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  syncBadgePending: {
    backgroundColor: '#FFF1E3',
    borderWidth: 1,
    borderColor: 'rgba(255, 159, 67, 0.3)',
  },
  syncBadgeSuccess: {
    backgroundColor: '#DDF6E8',
    borderWidth: 1,
    borderColor: 'rgba(40, 199, 111, 0.3)',
  },
  syncBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  syncBadgeTextPending: {
    color: '#FF9F43',
  },
  syncBadgeTextSuccess: {
    color: '#28C76F',
  },
  breakdownBox: {
    backgroundColor: '#FFF1E3',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 159, 67, 0.25)',
    marginBottom: 14,
  },
  breakdownText: {
    fontSize: 12,
    color: '#FF9F43',
    fontWeight: '600',
  },
  syncedBox: {
    backgroundColor: '#DDF6E8',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(40, 199, 111, 0.25)',
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncedText: {
    fontSize: 12,
    color: '#28C76F',
    fontWeight: '600',
  },
  syncButton: {
    backgroundColor: '#7367F0',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7367F0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  syncButtonDisabled: {
    opacity: 0.6,
  },
  syncButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
