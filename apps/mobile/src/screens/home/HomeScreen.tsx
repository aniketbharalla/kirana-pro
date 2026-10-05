import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { useProductStore } from '../../store/productStore';
import { StatCard } from '../../components/common/StatCard';
import { colors } from '../../theme';

export interface HomeScreenProps {
  onNavigateToProducts?: () => void;
  onNavigateToTaraju?: () => void;
  onNavigateToScanner?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigateToProducts,
  onNavigateToTaraju,
  onNavigateToScanner,
}) => {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const { products, getLowStockProducts, getLooseProducts } = useProductStore();

  const handleGoToProducts = () => {
    if (onNavigateToProducts) onNavigateToProducts();
    else navigation.navigate('Products');
  };

  const handleGoToTaraju = () => {
    if (onNavigateToTaraju) onNavigateToTaraju();
    else navigation.navigate('Taraju');
  };

  const handleGoToScanner = () => {
    if (onNavigateToScanner) onNavigateToScanner();
    else navigation.navigate('Products', { screen: 'BarcodeScanner' });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Top Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Namaste 🙏</Text>
            <Text style={styles.storeName}>
              {user?.displayName ? `${user.displayName}'s Dukaan` : 'Sharma Kirana Store'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.scannerBadge}
            activeOpacity={0.8}
            onPress={handleGoToScanner}
          >
            <Text style={styles.scannerEmoji}>📷</Text>
            <Text style={styles.scannerBadgeText}>Scan</Text>
          </TouchableOpacity>
        </View>

        {/* Hero Card / Taraju Spotlight Banner */}
        <TouchableOpacity
          style={styles.tarajuHeroBanner}
          activeOpacity={0.9}
          onPress={handleGoToTaraju}
        >
          <View style={styles.tarajuContent}>
            <View style={styles.tarajuTag}>
              <Text style={styles.tarajuTagText}>⚡ INSTANT CALCULATOR</Text>
            </View>
            <Text style={styles.tarajuTitle}>Taraju Smart Scale</Text>
            <Text style={styles.tarajuSubtitle}>
              Customer asked ₹5 ka chawal? Tap to get exact grams instantly!
            </Text>
          </View>
          <View style={styles.tarajuIconBox}>
            <Text style={styles.tarajuIcon}>⚖️</Text>
          </View>
        </TouchableOpacity>

        {/* Quick Action Grid */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleGoToScanner}
            activeOpacity={0.85}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#ECFDF5' }]}>
              <Text style={styles.actionEmoji}>📷</Text>
            </View>
            <Text style={styles.actionLabel}>Barcode Scan</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleGoToTaraju}
            activeOpacity={0.85}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#FEF3C7' }]}>
              <Text style={styles.actionEmoji}>⚖️</Text>
            </View>
            <Text style={styles.actionLabel}>Taraju</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleGoToProducts}
            activeOpacity={0.85}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#EFF6FF' }]}>
              <Text style={styles.actionEmoji}>📦</Text>
            </View>
            <Text style={styles.actionLabel}>Products</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('Bills')}
            activeOpacity={0.85}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#F3E8FF' }]}>
              <Text style={styles.actionEmoji}>🧾</Text>
            </View>
            <Text style={styles.actionLabel}>New Bill</Text>
          </TouchableOpacity>
        </View>

        {/* Stock & Store Overview Stats */}
        <Text style={styles.sectionTitle}>Store Inventory</Text>
        <View style={styles.statsGrid}>
          <StatCard
            title="Total Items"
            value={products.length}
            icon="📦"
            color={colors.primary}
            subtext="In active catalog"
            onPress={handleGoToProducts}
          />
          <StatCard
            title="Low Stock"
            value={getLowStockProducts().length}
            icon="⚠️"
            color={colors.accent}
            subtext="Needs restock"
            onPress={handleGoToProducts}
          />
          <StatCard
            title="Out of Stock"
            value={products.filter((p) => p.currentStock === 0).length}
            icon="❌"
            color={colors.danger}
            subtext="Depleted items"
            onPress={handleGoToProducts}
          />
          <StatCard
            title="Loose (Taraju)"
            value={getLooseProducts().length}
            icon="⚖️"
            color="#6366F1"
            subtext="By weight (kg/g)"
            onPress={handleGoToTaraju}
          />
        </View>

        {/* Free Cloud Sync Status */}
        <View style={styles.cloudBadge}>
          <Text style={styles.cloudEmoji}>☁️</Text>
          <Text style={styles.cloudText}>
            Cloud Sync Active • Firebase Free Tier (0 ₹)
          </Text>
        </View>
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
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  storeName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  scannerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  scannerEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  scannerBadgeText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  tarajuHeroBanner: {
    backgroundColor: '#065F46',
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    shadowColor: '#065F46',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  tarajuContent: {
    flex: 1,
    paddingRight: 10,
  },
  tarajuTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'flex-start',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 6,
  },
  tarajuTagText: {
    color: '#A7F3D0',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  tarajuTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  tarajuSubtitle: {
    fontSize: 12,
    color: '#D1FAE5',
    lineHeight: 17,
  },
  tarajuIconBox: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tarajuIcon: {
    fontSize: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  actionBtn: {
    alignItems: 'center',
    width: '23%',
  },
  actionIconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 6,
  },
  actionEmoji: {
    fontSize: 24,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    marginBottom: 20,
  },
  cloudBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 10,
    marginTop: 10,
  },
  cloudEmoji: {
    fontSize: 14,
    marginRight: 6,
  },
  cloudText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
});
