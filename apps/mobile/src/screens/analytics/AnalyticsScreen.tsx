import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useProductStore } from '../../store/productStore';
import { useAuthStore } from '../../store/authStore';
import {
  filterInvoicesByDateRange,
  computeSalesAndProfitSummary,
  computePaymentBreakdown,
  computeTopAndSlowProducts,
  computeGSTTaxReport,
  AnalyticsDateRange,
} from '../../services/analytics';
import { Invoice } from '@kirana-pro/shared';
import { Feather } from '@expo/vector-icons';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { getFirestoreDb } from '@kirana-pro/shared';

export const AnalyticsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const { products } = useProductStore();

  const [dateRange, setDateRange] = useState<AnalyticsDateRange>('today');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchInvoices = async () => {
      if (!user?.storeId) return;
      setLoading(true);
      try {
        const db = getFirestoreDb();
        const invCol = collection(db, 'stores', user.storeId, 'invoices');
        const q = query(invCol, orderBy('createdAt', 'desc'), limit(200));
        const snap = await getDocs(q);
        const list = snap.docs.map((d) => d.data() as Invoice);
        setInvoices(list);
      } catch (e) {
        console.warn('Could not fetch invoices for analytics:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [user?.storeId]);

  // Compute metrics for active date range
  const filteredInvoices = filterInvoicesByDateRange(invoices, dateRange);
  const financialSummary = computeSalesAndProfitSummary(filteredInvoices, products);
  const paymentBreakdown = computePaymentBreakdown(filteredInvoices);
  const { topSelling, slowMoving } = computeTopAndSlowProducts(filteredInvoices, products, 5);
  const gstReport = computeGSTTaxReport(filteredInvoices);

  // Share CA / Accountant Statement
  const handleShareSummary = async () => {
    const periodLabel =
      dateRange === 'today'
        ? 'Today'
        : dateRange === 'week'
        ? 'Last 7 Days'
        : dateRange === 'month'
        ? 'This Month'
        : 'All Time';

    const text = `*${user?.displayName || 'Kirana Store'} - Business Summary*\nPeriod: ${periodLabel}\n----------------------------------\nGross Revenue: ₹${financialSummary.grossSales}\nCost of Goods (COGS): ₹${financialSummary.totalCOGS}\nNet Profit: ₹${financialSummary.netProfit} (${financialSummary.profitMarginPercent}% Margin)\nTotal Bills: ${financialSummary.invoiceCount} (Avg: ₹${financialSummary.averageBillValue})\n\nPayment Split:\n• Cash: ₹${paymentBreakdown.cash} (${paymentBreakdown.cashPercent}%)\n• UPI: ₹${paymentBreakdown.upi} (${paymentBreakdown.upiPercent}%)\n• Khata Udhar: ₹${paymentBreakdown.credit} (${paymentBreakdown.creditPercent}%)\n\nGST Tax Collected: ₹${gstReport.totalTaxCollected}\n(CGST: ₹${gstReport.totalCGST} + SGST: ₹${gstReport.totalSGST})\n\nGenerated via Kirana Pro ERP.`;

    try {
      await Share.share({ message: text });
    } catch {
      Alert.alert('Share', 'Could not open share dialogue.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Dukaan Analytics & Reports</Text>
          <Text style={styles.headerSub}>
            Real-time profit, payment collection & GST summary
          </Text>
        </View>

        <TouchableOpacity style={styles.shareBtn} onPress={handleShareSummary}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Feather name="share-2" size={13} color="#7367F0" />
            <Text style={styles.shareBtnText}>Share</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Date Range Selector */}
      <View style={styles.dateRangeRow}>
        {(['today', 'week', 'month', 'all'] as AnalyticsDateRange[]).map((range) => {
          const isSelected = dateRange === range;
          const label =
            range === 'today'
              ? 'Today'
              : range === 'week'
              ? 'Last 7 Days'
              : range === 'month'
              ? 'This Month'
              : 'All Time';

          return (
            <TouchableOpacity
              key={range}
              style={[styles.rangePill, isSelected && styles.rangePillActive]}
              onPress={() => setDateRange(range)}
            >
              <Text
                style={[styles.rangePillText, isSelected && styles.rangePillTextActive]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <ActivityIndicator size="large" color="#7367F0" style={{ marginVertical: 30 }} />
        ) : (
          <>
            {/* Main Financial KPI Grid */}
            <View style={styles.kpiGrid}>
              {/* Gross Revenue */}
              <View style={[styles.kpiCard, { borderColor: '#E2E8F0' }]}>
                <Text style={styles.kpiLabel}>Total Revenue (बिक्री)</Text>
                <Text style={styles.kpiValue}>
                  ₹{financialSummary.grossSales.toLocaleString('en-IN')}
                </Text>
                <Text style={styles.kpiSub}>
                  {financialSummary.invoiceCount} bills • Avg ₹{financialSummary.averageBillValue}
                </Text>
              </View>

              {/* Net Profit */}
              <View style={[styles.kpiCard, { borderColor: '#A7F3D0', backgroundColor: '#ECFDF5' }]}>
                <Text style={[styles.kpiLabel, { color: '#065F46' }]}>Net Profit (शुद्ध मुनाफा)</Text>
                <Text style={[styles.kpiValue, { color: '#059669' }]}>
                  +₹{financialSummary.netProfit.toLocaleString('en-IN')}
                </Text>
                <View style={styles.marginBadge}>
                  <Text style={styles.marginBadgeText}>
                    {financialSummary.profitMarginPercent}% Net Margin
                  </Text>
                </View>
              </View>

              {/* COGS (Inventory Cost) */}
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>Cost of Goods (लागत)</Text>
                <Text style={[styles.kpiValue, { color: '#475569' }]}>
                  ₹{financialSummary.totalCOGS.toLocaleString('en-IN')}
                </Text>
                <Text style={styles.kpiSub}>Wholesale buying value</Text>
              </View>

              {/* Tax Collected */}
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>GST Tax Collected</Text>
                <Text style={[styles.kpiValue, { color: '#0284C7' }]}>
                  ₹{financialSummary.totalTax.toLocaleString('en-IN')}
                </Text>
                <Text style={styles.kpiSub}>CGST + SGST</Text>
              </View>
            </View>

            {/* Payment Method Split Card */}
            <View style={styles.card}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Feather name="pie-chart" size={16} color="#7367F0" />
                <Text style={styles.cardTitle}>Payment Modes Collection</Text>
              </View>
              <Text style={styles.cardSub}>Where your customers paid</Text>

              {/* Progress Bars */}
              <View style={styles.paymentBarContainer}>
                <View
                  style={[
                    styles.paymentBarSegment,
                    { flex: Math.max(1, paymentBreakdown.cash), backgroundColor: '#28C76F' },
                  ]}
                />
                <View
                  style={[
                    styles.paymentBarSegment,
                    { flex: Math.max(1, paymentBreakdown.upi), backgroundColor: '#7367F0' },
                  ]}
                />
                <View
                  style={[
                    styles.paymentBarSegment,
                    { flex: Math.max(1, paymentBreakdown.credit), backgroundColor: '#FF9F43' },
                  ]}
                />
              </View>

              {/* Legend Row */}
              <View style={styles.legendRow}>
                <View style={styles.legendCol}>
                  <View style={[styles.legendDot, { backgroundColor: '#28C76F' }]} />
                  <Text style={styles.legendLabel}>Cash in Galla</Text>
                  <Text style={styles.legendValue}>
                    ₹{paymentBreakdown.cash.toLocaleString('en-IN')} ({paymentBreakdown.cashPercent}%)
                  </Text>
                </View>

                <View style={styles.legendCol}>
                  <View style={[styles.legendDot, { backgroundColor: '#7367F0' }]} />
                  <Text style={styles.legendLabel}>UPI / QR</Text>
                  <Text style={styles.legendValue}>
                    ₹{paymentBreakdown.upi.toLocaleString('en-IN')} ({paymentBreakdown.upiPercent}%)
                  </Text>
                </View>

                <View style={styles.legendCol}>
                  <View style={[styles.legendDot, { backgroundColor: '#FF9F43' }]} />
                  <Text style={styles.legendLabel}>Khata Udhar</Text>
                  <Text style={styles.legendValue}>
                    ₹{paymentBreakdown.credit.toLocaleString('en-IN')} ({paymentBreakdown.creditPercent}%)
                  </Text>
                </View>
              </View>
            </View>

            {/* Top 5 Bestsellers vs Dead Stock */}
            <View style={styles.card}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Feather name="award" size={16} color="#FF9F43" />
                <Text style={styles.cardTitle}>Top Bestsellers (सर्वाधिक बिकने वाले)</Text>
              </View>
              {topSelling.length === 0 ? (
                <Text style={styles.emptyNote}>No sales recorded for this period.</Text>
              ) : (
                topSelling.map((item, idx) => (
                  <View key={item.productId} style={styles.productRow}>
                    <View style={styles.rankBadge}>
                      <Text style={styles.rankText}>#{idx + 1}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.prodName}>{item.name}</Text>
                      <Text style={styles.prodSub}>
                        {item.unitsSold} units sold • ₹{item.revenue.toLocaleString('en-IN')} sales
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.prodProfit}>+₹{item.profit.toLocaleString('en-IN')}</Text>
                      <Text style={styles.prodProfitLabel}>profit</Text>
                    </View>
                  </View>
                ))
              )}
            </View>

            {/* Slow Moving / Dead Stock Alert */}
            <View style={styles.card}>
              <View style={styles.deadStockHeader}>
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Feather name="alert-triangle" size={15} color="#EA5455" />
                    <Text style={styles.cardTitle}>Slow-Moving / Dead Stock</Text>
                  </View>
                  <Text style={styles.cardSub}>Items with 0 or low sales tying up cash</Text>
                </View>
                <TouchableOpacity
                  style={styles.reorderLinkBtn}
                  onPress={() => navigation.navigate('SmartReorder')}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={styles.reorderLinkText}>Reorder Hub</Text>
                    <Feather name="arrow-right" size={12} color="#7367F0" />
                  </View>
                </TouchableOpacity>
              </View>

              {slowMoving.slice(0, 3).map((item) => (
                <View key={item.productId} style={styles.slowRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.slowName}>{item.name}</Text>
                    <Text style={styles.slowSub}>
                      {item.unitsSold} sold in period • Current Stock: {item.currentStock}
                    </Text>
                  </View>
                  <View style={styles.tiedUpBadge}>
                    <Text style={styles.tiedUpText}>
                      ₹{(item.currentStock * (products.find((p) => p.id === item.productId)?.purchasePrice || 0)).toLocaleString('en-IN')} tied up
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {/* GST Summary Report Table */}
            <View style={styles.card}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Feather name="file-text" size={16} color="#7367F0" />
                <Text style={styles.cardTitle}>GST Filing Summary (CA / Accountant)</Text>
              </View>
              <Text style={styles.cardSub}>Taxable value & tax collected by slab</Text>

              <View style={styles.gstTable}>
                <View style={styles.gstTableHeader}>
                  <Text style={[styles.gstHeadCell, { flex: 1 }]}>Slab</Text>
                  <Text style={[styles.gstHeadCell, { flex: 2 }]}>Taxable</Text>
                  <Text style={[styles.gstHeadCell, { flex: 1.5 }]}>CGST</Text>
                  <Text style={[styles.gstHeadCell, { flex: 1.5 }]}>SGST</Text>
                  <Text style={[styles.gstHeadCell, { flex: 1.5 }]}>Total Tax</Text>
                </View>

                {gstReport.slabs.map((slab) => (
                  <View key={slab.gstRate} style={styles.gstTableRow}>
                    <Text style={[styles.gstCell, { flex: 1, fontWeight: '700' }]}>
                      {slab.gstRate}%
                    </Text>
                    <Text style={[styles.gstCell, { flex: 2 }]}>
                      ₹{slab.taxableValue.toFixed(1)}
                    </Text>
                    <Text style={[styles.gstCell, { flex: 1.5, color: '#64748B' }]}>
                      ₹{slab.cgst.toFixed(1)}
                    </Text>
                    <Text style={[styles.gstCell, { flex: 1.5, color: '#64748B' }]}>
                      ₹{slab.sgst.toFixed(1)}
                    </Text>
                    <Text style={[styles.gstCell, { flex: 1.5, fontWeight: '700', color: '#0F172A' }]}>
                      ₹{slab.totalTax.toFixed(1)}
                    </Text>
                  </View>
                ))}

                <View style={[styles.gstTableRow, styles.gstTableTotalRow]}>
                  <Text style={[styles.gstCell, { flex: 1, fontWeight: '800' }]}>Total</Text>
                  <Text style={[styles.gstCell, { flex: 2, fontWeight: '800' }]}>
                    ₹{gstReport.totalTaxable.toFixed(1)}
                  </Text>
                  <Text style={[styles.gstCell, { flex: 1.5, fontWeight: '800', color: '#64748B' }]}>
                    ₹{gstReport.totalCGST.toFixed(1)}
                  </Text>
                  <Text style={[styles.gstCell, { flex: 1.5, fontWeight: '800', color: '#64748B' }]}>
                    ₹{gstReport.totalSGST.toFixed(1)}
                  </Text>
                  <Text style={[styles.gstCell, { flex: 1.5, fontWeight: '800', color: '#059669' }]}>
                    ₹{gstReport.totalTaxCollected.toFixed(1)}
                  </Text>
                </View>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  shareBtn: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
  },
  shareBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  dateRangeRow: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 12,
    padding: 3,
  },
  rangePill: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 10,
  },
  rangePillActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  rangePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  rangePillTextActive: {
    fontWeight: '800',
    color: '#0F172A',
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  kpiCard: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 4,
  },
  kpiSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
  },
  marginBadge: {
    backgroundColor: '#D1FAE5',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 6,
  },
  marginBadgeText: {
    color: '#065F46',
    fontWeight: '800',
    fontSize: 11,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  cardSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 12,
  },
  paymentBarContainer: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 12,
    gap: 2,
  },
  paymentBarSegment: {
    height: '100%',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  legendCol: {
    alignItems: 'center',
    flex: 1,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  legendLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  legendValue: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
    textAlign: 'center',
  },
  emptyNote: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 10,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  prodName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  prodSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  prodProfit: {
    fontSize: 13,
    fontWeight: '800',
    color: '#059669',
  },
  prodProfitLabel: {
    fontSize: 9,
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  deadStockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  reorderLinkBtn: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  reorderLinkText: {
    color: '#065F46',
    fontWeight: '700',
    fontSize: 11,
  },
  slowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  slowName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  slowSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  tiedUpBadge: {
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tiedUpText: {
    color: '#B45309',
    fontSize: 11,
    fontWeight: '700',
  },
  gstTable: {
    marginTop: 6,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  gstTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  gstHeadCell: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
    textTransform: 'uppercase',
  },
  gstTableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  gstTableTotalRow: {
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 0,
  },
  gstCell: {
    fontSize: 11,
    color: '#334155',
  },
});
