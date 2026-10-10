import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Share,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import {
  Invoice,
  GSTTaxSummary,
  generateGSTTaxSummary,
  generateGSTR1JSON,
  exportGSTReportCSV,
} from '@kirana-pro/shared';
import { fetchInvoices } from '../../services/invoice';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../theme';

// Mock initial invoices if local store is empty for instant demonstration
const SAMPLE_TAX_INVOICES: Invoice[] = [
  {
    id: 'inv_101',
    invoiceNumber: 'INV-2026-001',
    storeId: 'demo_store_1',
    items: [
      {
        productId: 'p1',
        name: 'Aashirvaad Atta 5kg',
        unit: 'packet',
        isLoose: false,
        quantity: 10,
        unitPrice: 250,
        discount: 0,
        gstRate: 0,
        hsnCode: '1101',
        taxableAmount: 2500,
        gstAmount: 0,
        totalAmount: 2500,
      },
    ],
    subtotal: 2500,
    discountTotal: 0,
    taxTotal: 0,
    grandTotal: 2500,
    paymentMode: 'cash',
    paymentStatus: 'paid',
    amountPaid: 2500,
    amountDue: 0,
    customer: { name: 'Ramesh Sharma' },
    createdAt: new Date().toISOString(),
    createdBy: 'owner',
    counterNumber: 1,
    staffName: 'Owner',
  },
  {
    id: 'inv_102',
    invoiceNumber: 'INV-2026-002',
    storeId: 'demo_store_1',
    items: [
      {
        productId: 'p2',
        name: 'Tata Salt 1kg (x20)',
        unit: 'packet',
        isLoose: false,
        quantity: 20,
        unitPrice: 28,
        discount: 0,
        gstRate: 5,
        hsnCode: '2501',
        taxableAmount: 533.33,
        gstAmount: 26.67,
        totalAmount: 560,
      },
      {
        productId: 'p3',
        name: 'Detergent Powder 5kg (x5)',
        unit: 'packet',
        isLoose: false,
        quantity: 5,
        unitPrice: 350,
        discount: 0,
        gstRate: 18,
        hsnCode: '3402',
        taxableAmount: 1483.05,
        gstAmount: 266.95,
        totalAmount: 1750,
      },
    ],
    subtotal: 2016.38,
    discountTotal: 0,
    taxTotal: 293.62,
    grandTotal: 2310,
    paymentMode: 'upi',
    paymentStatus: 'paid',
    amountPaid: 2310,
    amountDue: 0,
    customer: {
      name: 'Krishna Dhaba & Caterers',
      phoneNumber: '9876543210',
      gstin: '07AABCK1234F1Z5',
    },
    customerGstin: '07AABCK1234F1Z5',
    isB2B: true,
    createdAt: new Date().toISOString(),
    createdBy: 'owner',
    counterNumber: 1,
    staffName: 'Owner',
  },
  {
    id: 'inv_103',
    invoiceNumber: 'INV-2026-003',
    storeId: 'demo_store_1',
    items: [
      {
        productId: 'p4',
        name: 'Basmati Chawal (Loose 30kg)',
        unit: 'kg',
        isLoose: true,
        quantity: 30,
        unitPrice: 60,
        discount: 0,
        gstRate: 5,
        hsnCode: '1006',
        taxableAmount: 1714.28,
        gstAmount: 85.72,
        totalAmount: 1800,
      },
    ],
    subtotal: 1714.28,
    discountTotal: 0,
    taxTotal: 85.72,
    grandTotal: 1800,
    paymentMode: 'cash',
    paymentStatus: 'paid',
    amountPaid: 1800,
    amountDue: 0,
    customer: { name: 'Walk-in Customer' },
    createdAt: new Date().toISOString(),
    createdBy: 'cashier',
    counterNumber: 2,
    staffName: 'Rohan Sharma',
  },
];

export const GSTReportScreen: React.FC = () => {
  const { user } = useAuthStore();
  const storeId = user?.storeId || 'demo_store_1';

  const [period, setPeriod] = useState<'month' | 'last_month' | 'quarter'>('month');
  const [invoices, setInvoices] = useState<Invoice[]>(SAMPLE_TAX_INVOICES);
  const [summary, setSummary] = useState<GSTTaxSummary>(
    generateGSTTaxSummary(SAMPLE_TAX_INVOICES, 'October 2026')
  );

  useEffect(() => {
    fetchInvoices(storeId)
      .then((invs) => {
        if (invs && invs.length > 0) {
          setInvoices(invs);
          setSummary(generateGSTTaxSummary(invs, 'October 2026'));
        }
      })
      .catch(() => {});
  }, [storeId]);

  const handleExportGSTR1JSON = () => {
    const periodStr = '102026'; // October 2026
    const gstr1 = generateGSTR1JSON(
      { gstin: '07AABCK9999F1Z1', stateCode: '07' },
      invoices,
      periodStr
    );
    const jsonStr = JSON.stringify(gstr1, null, 2);

    if (Platform.OS === 'web') {
      try {
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `GSTR1_${periodStr}_07AABCK9999F1Z1.json`;
        a.click();
        URL.revokeObjectURL(url);
        Alert.alert('GSTR-1 Exported', 'Downloaded official GSTR-1 JSON file.');
      } catch {
        Alert.alert('GSTR-1 JSON Ready', `JSON Generated (${invoices.length} invoices).`);
      }
    } else {
      Share.share({
        title: 'GSTR-1 Return JSON',
        message: jsonStr,
      });
    }
  };

  const handleExportCSV = () => {
    const csvStr = exportGSTReportCSV(invoices);

    if (Platform.OS === 'web') {
      try {
        const blob = new Blob([csvStr], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `KiranaPro_GST_Report_Oct2026.csv`;
        a.click();
        URL.revokeObjectURL(url);
        Alert.alert('Tax Report CSV Downloaded', 'Downloaded CSV for CA / Accountant.');
      } catch {
        Alert.alert('CSV Ready', 'Tax report CSV generated successfully.');
      }
    } else {
      Share.share({
        title: 'Kirana Pro GST Report',
        message: csvStr,
      });
    }
  };

  const handleShareToCA = () => {
    const msg = `*Kirana Pro - GST Tax Report*\nPeriod: ${summary.periodLabel}\n• Total Turnover: ₹${summary.totalGrossSales}\n• Taxable Turnover: ₹${summary.totalTaxable}\n• Total GST: ₹${summary.totalTax} (CGST: ₹${summary.totalCgst}, SGST: ₹${summary.totalSgst})\n• B2B Bills: ${summary.b2bCount} (Taxable: ₹${summary.b2bTaxable})\n• B2C Bills: ${summary.b2cCount} (Taxable: ₹${summary.b2cTaxable})\nGenerated via Kirana Pro SaaS`;
    Share.share({ message: msg });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>GST Reports & Tax Filing</Text>
          <Text style={styles.sub}>
            GSTR-1 JSON export, HSN summary & CA accountant reports
          </Text>
        </View>

        {/* Period Selector Tabs */}
        <View style={styles.periodTabs}>
          {[
            { id: 'month', label: 'This Month (Oct 2026)' },
            { id: 'last_month', label: 'Last Month' },
            { id: 'quarter', label: 'Q3 (Oct-Dec)' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, period === tab.id && styles.tabActive]}
              onPress={() => setPeriod(tab.id as any)}
            >
              <Text style={[styles.tabText, period === tab.id && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Primary Tax Metrics Banner */}
        <View style={styles.bannerCard}>
          <View style={styles.bannerRow}>
            <View>
              <Text style={styles.bannerLabel}>TOTAL GST LIABILITY</Text>
              <Text style={styles.bannerVal}>₹{summary.totalTax.toFixed(2)}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.bannerLabel}>GROSS TURNOVER</Text>
              <Text style={styles.turnoverVal}>₹{summary.totalGrossSales.toFixed(2)}</Text>
            </View>
          </View>

          <View style={styles.taxSplitRow}>
            <View style={styles.splitBox}>
              <Text style={styles.splitLabel}>CGST (CENTRAL 50%)</Text>
              <Text style={styles.splitVal}>₹{summary.totalCgst.toFixed(2)}</Text>
            </View>
            <View style={styles.splitBox}>
              <Text style={styles.splitLabel}>SGST (STATE 50%)</Text>
              <Text style={styles.splitVal}>₹{summary.totalSgst.toFixed(2)}</Text>
            </View>
            <View style={styles.splitBox}>
              <Text style={styles.splitLabel}>IGST (INTERSTATE)</Text>
              <Text style={styles.splitVal}>₹{summary.totalIgst.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* B2B vs B2C Split Card */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>B2B vs B2C Invoice Breakdown</Text>
          <View style={styles.b2bRow}>
            <View style={[styles.typeCard, styles.b2bCard]}>
              <Text style={styles.typeTag}>B2B TAX INVOICES</Text>
              <Text style={styles.typeCount}>{summary.b2bCount} Bills</Text>
              <Text style={styles.typeDetail}>
                Taxable: ₹{summary.b2bTaxable.toFixed(2)}
              </Text>
              <Text style={styles.typeTax}>Tax: ₹{summary.b2bTax.toFixed(2)}</Text>
            </View>

            <View style={[styles.typeCard, styles.b2cCard]}>
              <Text style={styles.typeTag}>B2C RETAIL INVOICES</Text>
              <Text style={styles.typeCount}>{summary.b2cCount} Bills</Text>
              <Text style={styles.typeDetail}>
                Taxable: ₹{summary.b2cTaxable.toFixed(2)}
              </Text>
              <Text style={styles.typeTax}>Tax: ₹{summary.b2cTax.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* HSN Summary Table */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>HSN/SAC Summary (Table 12)</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, { width: 55 }]}>HSN</Text>
            <Text style={[styles.th, { flex: 1 }]}>Description</Text>
            <Text style={[styles.th, { width: 45 }]}>UQC</Text>
            <Text style={[styles.th, { width: 45, textAlign: 'right' }]}>Qty</Text>
            <Text style={[styles.th, { width: 75, textAlign: 'right' }]}>Taxable</Text>
            <Text style={[styles.th, { width: 65, textAlign: 'right' }]}>GST</Text>
          </View>

          {summary.hsnSummary.map((hsn) => (
            <View key={hsn.hsnCode} style={styles.tableRow}>
              <Text style={[styles.td, styles.hsnCode]}>{hsn.hsnCode}</Text>
              <Text style={[styles.td, { flex: 1 }]} numberOfLines={1}>
                {hsn.description}
              </Text>
              <Text style={[styles.td, { width: 45 }]}>{hsn.uqc}</Text>
              <Text style={[styles.td, { width: 45, textAlign: 'right' }]}>
                {hsn.totalQty}
              </Text>
              <Text style={[styles.td, { width: 75, textAlign: 'right' }]}>
                ₹{hsn.taxableValue.toFixed(0)}
              </Text>
              <Text style={[styles.td, { width: 65, textAlign: 'right', fontWeight: '700' }]}>
                ₹{(hsn.cgstAmount + hsn.sgstAmount).toFixed(0)}
              </Text>
            </View>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsCard}>
          <Text style={styles.sectionHeader}>Government Return & CA Exports</Text>

          <TouchableOpacity
            style={[styles.exportBtn, styles.jsonBtn]}
            activeOpacity={0.85}
            onPress={handleExportGSTR1JSON}
          >
            <View style={styles.btnIconContainer}>
              <Feather name="file-text" size={20} color="#7367F0" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.btnTitle}>Export GSTR-1 JSON (Govt Portal)</Text>
              <Text style={styles.btnSub}>
                Upload directly to gst.gov.in portal for offline return filing
              </Text>
            </View>
            <Feather name="chevron-right" size={18} color="#82808B" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.exportBtn, styles.csvBtn]}
            activeOpacity={0.85}
            onPress={handleExportCSV}
          >
            <View style={styles.btnIconContainer}>
              <Feather name="bar-chart-2" size={20} color="#7367F0" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.btnTitle}>Download CA Report (CSV / Excel)</Text>
              <Text style={styles.btnSub}>
                Invoice-level ledger for Chartered Accountant reconciliation
              </Text>
            </View>
            <Feather name="chevron-right" size={18} color="#82808B" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.exportBtn, styles.waBtn]}
            activeOpacity={0.85}
            onPress={handleShareToCA}
          >
            <View style={[styles.btnIconContainer, { backgroundColor: '#E8FADF' }]}>
              <Feather name="share-2" size={20} color="#28C76F" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.btnTitle}>Share Tax Summary on WhatsApp</Text>
              <Text style={styles.btnSub}>
                Send monthly turnover and tax snapshot to your CA
              </Text>
            </View>
            <Feather name="chevron-right" size={18} color="#82808B" />
          </TouchableOpacity>
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
    fontSize: 20,
    fontWeight: '700',
    color: '#4B465C',
  },
  sub: {
    fontSize: 13,
    color: '#82808B',
    marginTop: 2,
  },
  periodTabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DBDADE',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#7367F0',
    borderColor: '#7367F0',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5D596C',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  bannerCard: {
    backgroundColor: '#2F2B3D',
    borderRadius: 12,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#2F2B3D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  bannerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  bannerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#A8AAAE',
    letterSpacing: 0.5,
  },
  bannerVal: {
    fontSize: 26,
    fontWeight: '700',
    color: '#7367F0',
    marginTop: 4,
  },
  turnoverVal: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 4,
  },
  taxSplitRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    padding: 10,
    gap: 8,
  },
  splitBox: {
    flex: 1,
  },
  splitLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#A8AAAE',
  },
  splitVal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: '#DBDADE',
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4B465C',
    marginBottom: 12,
  },
  b2bRow: {
    flexDirection: 'row',
    gap: 12,
  },
  typeCard: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  b2bCard: {
    backgroundColor: '#E8FADF',
    borderColor: '#28C76F',
  },
  b2cCard: {
    backgroundColor: '#EDEBFD',
    borderColor: '#7367F0',
  },
  typeTag: {
    fontSize: 10,
    fontWeight: '700',
    color: '#5D596C',
  },
  typeCount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4B465C',
    marginVertical: 4,
  },
  typeDetail: {
    fontSize: 11,
    color: '#82808B',
  },
  typeTax: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7367F0',
    marginTop: 2,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#DBDADE',
    paddingBottom: 8,
    marginBottom: 8,
  },
  th: {
    fontSize: 11,
    fontWeight: '700',
    color: '#82808B',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F0F2',
  },
  td: {
    fontSize: 12,
    color: '#5D596C',
  },
  hsnCode: {
    width: 55,
    fontWeight: '700',
    color: '#7367F0',
  },
  actionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: '#DBDADE',
    marginBottom: 20,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
  },
  jsonBtn: {
    backgroundColor: '#F8F7FA',
    borderColor: '#DBDADE',
  },
  csvBtn: {
    backgroundColor: '#F8F7FA',
    borderColor: '#DBDADE',
  },
  waBtn: {
    backgroundColor: '#F8F7FA',
    borderColor: '#DBDADE',
    marginBottom: 0,
  },
  btnIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#EDEBFD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B465C',
  },
  btnSub: {
    fontSize: 11,
    color: '#82808B',
    marginTop: 2,
  },
});

