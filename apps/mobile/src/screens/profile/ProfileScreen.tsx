import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, SafeAreaView, TouchableOpacity, ScrollView, Alert, Modal, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { DailyGallaScreen } from '../galla/DailyGallaScreen';
import { colors } from '../../theme';
import { getPendingSyncSummary, syncAllToCloud, PendingSyncSummary } from '../../services/localStore';

export const ProfileScreen: React.FC = () => {
  const { user, clearUser } = useAuthStore();
  const [showGallaModal, setShowGallaModal] = useState(false);
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
            'All Synced! 🟢',
            'All products, bills, and stock records are up-to-date with the cloud.'
          );
        } else {
          Alert.alert(
            'Cloud Sync Successful! ☁️',
            `Uploaded to cloud:\n• ${result.details.products} Products\n• ${result.details.invoices} Bills\n• ${result.details.stockMoves} Stock Movements`
          );
        }
      } else {
        Alert.alert(
          'Sync Notice ⚠️',
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
            <Text style={styles.avatarText}>
              {user?.displayName ? user.displayName.charAt(0).toUpperCase() : '🏪'}
            </Text>
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
          <Text style={styles.bannerEmoji}>🎉</Text>
          <View style={styles.bannerContent}>
            <Text style={styles.bannerTitle}>Kirana Pro Free Tier</Text>
            <Text style={styles.bannerSub}>100% Free Forever • Zero Subscription</Text>
          </View>
        </View>

        {/* Cloud Data Sync Section (Local-first with manual cloud push) */}
        <View style={styles.syncCard}>
          <View style={styles.syncHeaderRow}>
            <View>
              <Text style={styles.syncCardTitle}>☁️ Cloud Sync (क्लाउड सिंक)</Text>
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
              <Text
                style={[
                  styles.syncBadgeText,
                  pendingSummary.total > 0
                    ? styles.syncBadgeTextPending
                    : styles.syncBadgeTextSuccess,
                ]}
              >
                {pendingSummary.total > 0
                  ? `🟡 ${pendingSummary.total} Local Items`
                  : '🟢 All Synced'}
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
              <Text style={styles.syncedText}>
                ✓ Dukaan data is safely synced with the cloud.
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
              <Text style={styles.syncButtonText}>☁️ Sync with Cloud (क्लाउड से सिंक करें)</Text>
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
            <Text style={styles.infoLabel}>Taraju Calculator</Text>
            <Text style={[styles.infoValue, { color: colors.primary }]}>Active</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Barcode Lookup</Text>
            <Text style={[styles.infoValue, { color: colors.primary }]}>Open Food Facts Free API</Text>
          </View>
        </View>

        {/* Store Tools & Galla */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>Dukaan Tools & Galla</Text>
          <TouchableOpacity
            style={styles.gallaTile}
            onPress={() => setShowGallaModal(true)}
          >
            <View style={styles.gallaIconBg}>
              <Text style={{ fontSize: 24 }}>💰</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.gallaTileTitle}>Daily Galla (दैनिक गल्ला)</Text>
              <Text style={styles.gallaTileSubtitle}>
                Morning cash opening & night drawer closing settlement
              </Text>
            </View>
            <Text style={{ fontSize: 18, color: colors.primary }}>➔</Text>
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
                <Text style={styles.modalCloseText}>✕ Close</Text>
              </TouchableOpacity>
            </View>
            <DailyGallaScreen />
          </View>
        )}

        {/* App Version Info */}
        <View style={styles.appInfo}>
          <Text style={styles.versionText}>Kirana Pro v3.0.0 (Phase 3)</Text>
          <Text style={styles.copyrightText}>Designed for Indian Kirana Dukaan Owners</Text>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          style={styles.signOutButton}
          activeOpacity={0.85}
          onPress={handleSignOut}
        >
          <Text style={styles.signOutText}>🚪 Sign Out of Dukaan</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scroll: {
    padding: 20,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#059669',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  userPhone: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  freeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: 16,
  },
  bannerEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#065F46',
  },
  bannerSub: {
    fontSize: 12,
    color: '#047857',
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  appInfo: {
    alignItems: 'center',
    marginVertical: 12,
  },
  versionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  copyrightText: {
    fontSize: 11,
    color: '#CBD5E1',
    marginTop: 2,
  },
  signOutButton: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
    marginTop: 8,
    marginBottom: 30,
  },
  signOutText: {
    color: '#DC2626',
    fontSize: 15,
    fontWeight: '700',
  },
  gallaTile: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  gallaIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gallaTileTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  gallaTileSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  modalOverlay: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
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
    borderBottomColor: colors.divider,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  modalCloseBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  modalCloseText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  syncCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  syncHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  syncCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  syncCardSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    maxWidth: 210,
  },
  syncBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  syncBadgePending: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  syncBadgeSuccess: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  syncBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  syncBadgeTextPending: {
    color: '#B45309',
  },
  syncBadgeTextSuccess: {
    color: '#15803D',
  },
  breakdownBox: {
    backgroundColor: '#FFFBEB',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FEF3C7',
    marginBottom: 14,
  },
  breakdownText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '600',
  },
  syncedBox: {
    backgroundColor: '#F0FDF4',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    marginBottom: 14,
  },
  syncedText: {
    fontSize: 12,
    color: '#166534',
    fontWeight: '600',
  },
  syncButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  syncButtonDisabled: {
    opacity: 0.6,
  },
  syncButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
