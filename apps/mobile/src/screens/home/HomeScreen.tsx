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
import { CounterHeaderPill } from '../../components/staff/CounterHeaderPill';
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
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>Namaste 🙏</Text>
            <Text style={styles.storeName} numberOfLines={1}>
              {user?.displayName ? `${user.displayName}'s Dukaan` : 'Sharma Kirana Store'}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <CounterHeaderPill />
            <TouchableOpacity
              style={styles.scannerBadge}
              activeOpacity={0.8}
              onPress={handleGoToScanner}
            >
              <Text style={styles.scannerEmoji}>📷</Text>
              <Text style={styles.scannerBadgeText}>Scan</Text>
            </TouchableOpacity>
          </View>
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

        {/* Business Intelligence & Smart Procurement Banners */}
        <View style={styles.promoRow}>
          <TouchableOpacity
            style={[styles.promoCard, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}
            activeOpacity={0.88}
            onPress={() => navigation.navigate('Bills', { screen: 'Analytics' })}
          >
            <Text style={styles.promoEmoji}>📊</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.promoTitle, { color: '#065F46' }]}>Dukaan Profit & GST</Text>
              <Text style={styles.promoSub}>Daily sales, net margins & CA tax report</Text>
            </View>
            <Text style={styles.promoArrow}>➔</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.promoCard, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}
            activeOpacity={0.88}
            onPress={() => navigation.navigate('Purchases', { screen: 'SmartReorder' })}
          >
            <Text style={styles.promoEmoji}>⚡</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.promoTitle, { color: '#1E40AF' }]}>Smart AI Reorder</Text>
              <Text style={styles.promoSub}>Burn velocity & 1-tap WhatsApp order</Text>
            </View>
            <Text style={styles.promoArrow}>➔</Text>
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
            onPress={() => navigation.navigate('Purchases', { screen: 'SmartReorder' })}
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
    backgroundColor: '#F2F2F7',
  },
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  storeName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1C1C1E',
    letterSpacing: -0.5,
    marginTop: 2,
  },
  scannerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  scannerEmoji: {
    fontSize: 15,
    marginRight: 6,
  },
  scannerBadgeText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  tarajuHeroBanner: {
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 4,
  },
  tarajuContent: {
    flex: 1,
    paddingRight: 12,
  },
  tarajuTag: {
    backgroundColor: 'rgba(52, 199, 89, 0.18)',
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
    marginBottom: 8,
  },
  tarajuTagText: {
    color: '#34C759',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  tarajuTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  tarajuSubtitle: {
    fontSize: 13,
    color: '#A1A1A6',
    lineHeight: 18,
  },
  tarajuIconBox: {
    width: 58,
    height: 58,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tarajuIcon: {
    fontSize: 30,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  promoRow: {
    flexDirection: 'column',
    gap: 10,
    marginBottom: 24,
  },
  promoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  promoEmoji: {
    fontSize: 24,
  },
  promoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  promoSub: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  promoArrow: {
    fontSize: 14,
    fontWeight: '700',
    color: '#C7C7CC',
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
    borderColor: 'rgba(60, 60, 67, 0.1)',
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  actionEmoji: {
    fontSize: 24,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1C1C1E',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(60, 60, 67, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
  },
  cloudEmoji: {
    fontSize: 14,
    marginRight: 6,
  },
  cloudText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
  },
});
