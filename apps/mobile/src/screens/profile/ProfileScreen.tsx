import React from 'react';
import { View, StyleSheet, Text, SafeAreaView, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../theme';

export const ProfileScreen: React.FC = () => {
  const { user, clearUser } = useAuthStore();

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

        {/* App Version Info */}
        <View style={styles.appInfo}>
          <Text style={styles.versionText}>Kirana Pro v1.0.0 (Phase 1)</Text>
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
});
