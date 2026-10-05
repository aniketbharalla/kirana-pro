import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Share,
  Alert,
  Linking,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { useKhataStore } from '../../store/khataStore';
import { useProductStore } from '../../store/productStore';
import { useLanguageStore } from '../../store/languageStore';
import {
  generateUPILink,
  formatKhataUPIReminder,
  formatFestivalOfferMessage,
  formatDigitalCatalogBroadcast,
  formatRationPackageMessage,
  OfferItem,
} from '../../services/marketing';
import { colors } from '../../theme';

// ─── Tab Types ───────────────────────────────────────────────────────────────
type TabKey = 'khata' | 'festival' | 'catalog';

const TABS: { key: TabKey; icon: string; label: string }[] = [
  { key: 'khata', icon: '💳', label: 'UPI Recovery' },
  { key: 'festival', icon: '🎉', label: 'Festival Offers' },
  { key: 'catalog', icon: '📋', label: 'Digital Menu' },
];

// ─── Festival Offer Templates ────────────────────────────────────────────────
const FESTIVAL_TEMPLATES = [
  { title: '🪔 Diwali Grocery Special', description: 'Flat 10% off on daily essentials this Diwali!' },
  { title: '🌙 Eid Rashan Offer', description: 'Special bulk discount on grains & pulses for Eid.' },
  { title: '🎊 New Year Combo', description: 'Stock up for the new year with our bundle savings!' },
  { title: '🌾 Monthly Rashan Package', description: 'Complete month\'s grocery in one order – save big!' },
];

export const MarketingScreen: React.FC = () => {
  const { user } = useAuthStore();
  const { customers } = useKhataStore();
  const { products } = useProductStore();
  const { t } = useLanguageStore();

  const [activeTab, setActiveTab] = useState<TabKey>('khata');
  const [storeUpiId, setStoreUpiId] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(0);
  const [festivalPreview, setFestivalPreview] = useState('');

  const storeName = user?.displayName || 'Kirana Store';
  const storePhone = user?.phoneNumber || '';

  // ─── Khata debtors ────────────────────────────────────────────────────────
  // currentBalance > 0 means customer owes the store
  const debtors = customers
    ? customers.filter((c) => (c.currentBalance || 0) > 0).sort((a, b) => (b.currentBalance || 0) - (a.currentBalance || 0))
    : [];

  const handleSendUPIReminder = async (customer: any) => {
    if (!storeUpiId) {
      Alert.alert('UPI ID Required', 'Please enter your store UPI ID at the top to generate payment links.');
      return;
    }
    const amountDue = customer.currentBalance || 0;
    const message = formatKhataUPIReminder(customer.name, storeName, amountDue, storeUpiId);
    const whatsappUrl = `whatsapp://send?phone=${customer.phoneNumber?.replace(/\D/g, '')}&text=${encodeURIComponent(message)}`;
    const canOpen = await Linking.canOpenURL(whatsappUrl).catch(() => false);
    if (canOpen) {
      Linking.openURL(whatsappUrl);
    } else {
      Share.share({ message, title: `UPI Reminder – ${customer.name}` });
    }
  };

  // ─── Festival Offer Preview ───────────────────────────────────────────────
  const buildFestivalPreview = () => {
    const template = FESTIVAL_TEMPLATES[selectedTemplate];
    const sampleItems: OfferItem[] = [
      { name: 'Basmati Rice', originalPrice: 80, offerPrice: 68, unit: 'kg' },
      { name: 'Toor Dal', originalPrice: 140, offerPrice: 118, unit: 'kg' },
      { name: 'Refined Oil', originalPrice: 115, offerPrice: 99, unit: 'L' },
      { name: 'Sugar', originalPrice: 50, offerPrice: 43, unit: 'kg' },
    ];
    return formatFestivalOfferMessage(storeName, template.title, template.description, sampleItems, storePhone);
  };

  useEffect(() => {
    setFestivalPreview(buildFestivalPreview());
  }, [selectedTemplate, storeName]);

  const handleShareFestivalOffer = async () => {
    const msg = buildFestivalPreview();
    const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(msg)}`;
    const canOpen = await Linking.canOpenURL(whatsappUrl).catch(() => false);
    if (canOpen) {
      Linking.openURL(whatsappUrl);
    } else {
      Share.share({ message: msg, title: 'Festival Grocery Offer' });
    }
  };

  // ─── Digital Catalog ──────────────────────────────────────────────────────
  const catalogMsg = formatDigitalCatalogBroadcast(
    storeName,
    products.map((p) => ({
      name: p.name,
      price: p.sellingPrice,
      unit: p.unit,
      inStock: (p.stock || 0) > 0,
    })),
    storePhone
  );

  const handleShareCatalog = async () => {
    const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(catalogMsg)}`;
    const canOpen = await Linking.canOpenURL(whatsappUrl).catch(() => false);
    if (canOpen) {
      Linking.openURL(whatsappUrl);
    } else {
      Share.share({ message: catalogMsg, title: 'Digital Dukaan Catalog' });
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>📲 {t('customer_marketing')}</Text>
          <Text style={styles.headerSub}>WhatsApp UPI Recovery & Offers</Text>
        </View>
      </View>

      {/* UPI ID Input */}
      <View style={styles.upiRow}>
        <Text style={styles.upiLabel}>Your UPI ID:</Text>
        <TextInput
          style={styles.upiInput}
          value={storeUpiId}
          onChangeText={setStoreUpiId}
          placeholder="yourstore@upi"
          placeholderTextColor="#94A3B8"
          autoCapitalize="none"
          keyboardType="email-address"
        />
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
            activeOpacity={0.8}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* ── KHATA UPI RECOVERY ── */}
        {activeTab === 'khata' && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>💳 Overdue Khata Balances</Text>
              <Text style={styles.sectionSub}>{debtors.length} customers with pending udhar</Text>
            </View>

            {debtors.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🎉</Text>
                <Text style={styles.emptyTitle}>No Pending Udhar!</Text>
                <Text style={styles.emptySub}>All customer balances are cleared.</Text>
              </View>
            ) : (
              debtors.map((customer) => {
                const amountDue = customer.currentBalance || 0;
                return (
                  <View key={customer.id} style={styles.debtorCard}>
                    <View style={styles.debtorAvatar}>
                      <Text style={styles.debtorAvatarText}>
                        {(customer.name || 'U').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.debtorInfo}>
                      <Text style={styles.debtorName}>{customer.name}</Text>
                      <Text style={styles.debtorPhone}>{customer.phoneNumber || 'No phone'}</Text>
                    </View>
                    <View style={styles.debtorRight}>
                      <Text style={styles.debtorAmount}>₹{amountDue.toLocaleString('en-IN')}</Text>
                      <Text style={styles.debtorDue}>Udhar Due</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.whatsappBtn}
                      onPress={() => handleSendUPIReminder(customer)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.whatsappBtnText}>📲 Send</Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            )}

            {/* UPI Link Preview */}
            {storeUpiId.length > 3 && (
              <View style={styles.previewCard}>
                <Text style={styles.previewTitle}>🔗 Sample UPI Link</Text>
                <Text style={styles.previewText} selectable>
                  {generateUPILink(storeUpiId, storeName, 500, 'Khata Payment')}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ── FESTIVAL OFFERS ── */}
        {activeTab === 'festival' && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🎉 Festival Offer Templates</Text>
              <Text style={styles.sectionSub}>Select a template, preview & share via WhatsApp</Text>
            </View>

            <View style={styles.templateGrid}>
              {FESTIVAL_TEMPLATES.map((tpl, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.templateChip, selectedTemplate === idx && styles.templateChipActive]}
                  onPress={() => setSelectedTemplate(idx)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.templateChipText, selectedTemplate === idx && styles.templateChipTextActive]}>
                    {tpl.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.previewCard}>
              <Text style={styles.previewTitle}>📋 Message Preview</Text>
              <Text style={styles.previewText} selectable>
                {festivalPreview}
              </Text>
            </View>

            <TouchableOpacity style={styles.ctaBtn} onPress={handleShareFestivalOffer} activeOpacity={0.85}>
              <Text style={styles.ctaBtnText}>📲 Share on WhatsApp / Broadcast</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── DIGITAL CATALOG ── */}
        {activeTab === 'catalog' && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🏪 Digital Dukaan Menu</Text>
              <Text style={styles.sectionSub}>Share your full catalog with customers via WhatsApp</Text>
            </View>

            <View style={styles.catalogStat}>
              <View style={styles.catalogStatItem}>
                <Text style={styles.catalogStatValue}>{products.filter(p => (p.stock || 0) > 0).length}</Text>
                <Text style={styles.catalogStatLabel}>In Stock</Text>
              </View>
              <View style={styles.catalogStatItem}>
                <Text style={styles.catalogStatValue}>{products.length}</Text>
                <Text style={styles.catalogStatLabel}>Total Products</Text>
              </View>
            </View>

            <View style={styles.previewCard}>
              <Text style={styles.previewTitle}>📋 Catalog Preview</Text>
              <Text style={styles.previewText} selectable>
                {catalogMsg}
              </Text>
            </View>

            <TouchableOpacity style={styles.ctaBtn} onPress={handleShareCatalog} activeOpacity={0.85}>
              <Text style={styles.ctaBtnText}>📲 Share Digital Menu on WhatsApp</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
  upiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  upiLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginRight: 10,
    flexShrink: 0,
  },
  upiInput: {
    flex: 1,
    height: 38,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#1A202C',
    borderWidth: 1,
    borderColor: '#CBD5E0',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    gap: 4,
  },
  tabActive: {
    backgroundColor: `${colors.primary}18`,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  tabIcon: {
    fontSize: 14,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  tabLabelActive: {
    color: colors.primary,
  },
  body: {
    flex: 1,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A202C',
  },
  sectionSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#22C55E', marginTop: 12 },
  emptySub: { fontSize: 13, color: '#64748B', marginTop: 4 },
  debtorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#FEF9C3',
  },
  debtorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  debtorAvatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  debtorInfo: { flex: 1 },
  debtorName: { fontSize: 14, fontWeight: '700', color: '#1A202C' },
  debtorPhone: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  debtorRight: { alignItems: 'flex-end', marginRight: 10 },
  debtorAmount: { fontSize: 15, fontWeight: '800', color: '#EF4444' },
  debtorDue: { fontSize: 10, color: '#94A3B8' },
  whatsappBtn: {
    backgroundColor: '#25D366',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  whatsappBtnText: { fontSize: 12, fontWeight: '800', color: '#FFFFFF' },
  previewCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  previewTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
  },
  previewText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 19,
    fontFamily: 'monospace',
  },
  templateGrid: {
    paddingHorizontal: 16,
    gap: 8,
  },
  templateChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  templateChipActive: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}10`,
  },
  templateChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  templateChipTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  catalogStat: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  catalogStatItem: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  catalogStatValue: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.primary,
  },
  catalogStatLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  ctaBtn: {
    backgroundColor: '#25D366',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
