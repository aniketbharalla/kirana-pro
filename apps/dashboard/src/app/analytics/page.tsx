'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Invoice, Product } from '@kirana-pro/shared';
import { useAuth } from '../../context/AuthContext';
import { subscribeStoreInvoices, subscribeStoreProducts } from '../../lib/storeService';

export default function AnalyticsPage() {
  const { store, storeId } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<'today' | '7days' | '30days' | 'all'>('7days');

  useEffect(() => {
    if (!storeId) return;

    let unsubProducts = subscribeStoreProducts(storeId, (prods) => {
      setProducts(prods);
    });

    let unsubInvoices = subscribeStoreInvoices(storeId, (invs) => {
      setInvoices(invs);
      setLoading(false);
    });

    return () => {
      unsubProducts();
      unsubInvoices();
    };
  }, [storeId]);

  // Filter invoices by selected date range
  const filteredInvoices = useMemo(() => {
    const now = new Date();
    return invoices.filter((inv) => {
      if (range === 'all') return true;
      const invDate = new Date(inv.createdAt);
      const diffMs = now.getTime() - invDate.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      if (range === 'today') return diffDays < 1;
      if (range === '7days') return diffDays <= 7;
      if (range === '30days') return diffDays <= 30;
      return true;
    });
  }, [invoices, range]);

  // Compute metrics from real store invoices
  const metrics = useMemo(() => {
    let revenue = 0;
    let cost = 0;
    let cashSales = 0;
    let upiSales = 0;
    let creditSales = 0;

    const categoryMap: Record<string, { revenue: number; cost: number; qty: number }> = {};

    filteredInvoices.forEach((inv) => {
      revenue += inv.grandTotal;

      if (inv.paymentMode === 'cash') cashSales += inv.grandTotal;
      else if (inv.paymentMode === 'upi') upiSales += inv.grandTotal;
      else if (inv.paymentMode === 'credit') creditSales += inv.grandTotal;

      inv.items.forEach((item) => {
        const prod = products.find((p) => p.id === item.productId);
        const itemCost = (prod?.purchasePrice || item.unitPrice * 0.85) * item.quantity;
        cost += itemCost;

        const cat = prod?.category || 'other';
        if (!categoryMap[cat]) {
          categoryMap[cat] = { revenue: 0, cost: 0, qty: 0 };
        }
        categoryMap[cat].revenue += item.totalAmount;
        categoryMap[cat].cost += itemCost;
        categoryMap[cat].qty += item.quantity;
      });
    });

    const grossProfit = Math.max(0, revenue - cost);
    const marginPercent = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
    const aov = filteredInvoices.length > 0 ? revenue / filteredInvoices.length : 0;

    const categories = Object.entries(categoryMap)
      .map(([name, data]) => {
        const profit = data.revenue - data.cost;
        const margin = data.revenue > 0 ? (profit / data.revenue) * 100 : 0;
        return {
          name,
          revenue: data.revenue,
          profit,
          margin,
          qty: data.qty,
        };
      })
      .sort((a, b) => b.revenue - a.revenue);

    return {
      revenue,
      cost,
      grossProfit,
      marginPercent,
      aov,
      cashSales,
      upiSales,
      creditSales,
      categories,
    };
  }, [filteredInvoices, products]);

  // Dynamic 7-day velocity computed from real invoices
  const dailyData = useMemo(() => {
    const days: { day: string; date: string; rev: number; profit: number }[] = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().slice(0, 10);
      const dayName = dayNames[d.getDay()];

      let dayRev = 0;
      let dayCost = 0;

      invoices.forEach((inv) => {
        if ((inv.createdAt || '').slice(0, 10) === dateKey) {
          dayRev += inv.grandTotal;
          inv.items.forEach((it) => {
            const p = products.find((x) => x.id === it.productId);
            dayCost += (p?.purchasePrice || it.unitPrice * 0.85) * it.quantity;
          });
        }
      });

      days.push({
        day: dayName,
        date: `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`,
        rev: dayRev,
        profit: Math.max(0, dayRev - dayCost),
      });
    }

    return days;
  }, [invoices, products]);

  const maxDailyRev = Math.max(...dailyData.map((d) => d.rev), 100);

  return (
    <div style={styles.container}>
      {/* Page Header */}
      <div style={styles.header}>
        <div>
          <div style={styles.badgeRow}>
            <span style={styles.analyticsBadge}>📈 BUSINESS INTELLIGENCE</span>
            <span style={styles.storeBadge}>{store?.name || 'My Kirana'}</span>
          </div>
          <h1 style={styles.title}>Dukaan Profit & Sales Analytics</h1>
          <p style={styles.subtitle}>
            Gross margin indicators, daily cash flow trend charts, and high-profit category breakdown.
          </p>
        </div>

        {/* Range Selector */}
        <div style={styles.rangeTabs}>
          {(['today', '7days', '30days', 'all'] as const).map((r) => (
            <button
              key={r}
              style={{ ...styles.rangeBtn, ...(range === r ? styles.rangeBtnActive : {}) }}
              onClick={() => setRange(r)}
            >
              {r === 'today'
                ? 'Today'
                : r === '7days'
                ? 'Last 7 Days'
                : r === '30days'
                ? 'Last 30 Days'
                : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={styles.loadingState}>
          <div style={styles.spinner} />
          <p style={styles.loadingText}>Calculating store analytics...</p>
        </div>
      ) : (
        <>
          {/* KPI Cards Grid */}
          <div style={styles.kpiGrid}>
            <div style={styles.kpiCard}>
              <span style={styles.kpiLabel}>TOTAL GROSS REVENUE</span>
              <span style={styles.kpiVal}>
                ₹{metrics.revenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </span>
              <span style={styles.kpiSub}>Total counter billings</span>
            </div>

            <div style={styles.kpiCard}>
              <span style={styles.kpiLabel}>PURCHASE COST (COGS)</span>
              <span style={styles.kpiVal}>
                ₹{metrics.cost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </span>
              <span style={styles.kpiSub}>Wholesale goods cost</span>
            </div>

            <div style={{ ...styles.kpiCard, borderLeft: '4px solid #10B981' }}>
              <span style={styles.kpiLabel}>NET GROSS PROFIT</span>
              <span style={{ ...styles.kpiVal, color: '#047857' }}>
                ₹{metrics.grossProfit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </span>
              <span style={styles.kpiSub}>Revenue minus COGS</span>
            </div>

            <div style={{ ...styles.kpiCard, borderLeft: '4px solid #3B82F6' }}>
              <span style={styles.kpiLabel}>GROSS MARGIN %</span>
              <span style={{ ...styles.kpiVal, color: '#1D4ED8' }}>
                {metrics.marginPercent.toFixed(1)}%
              </span>
              <span style={styles.kpiSub}>Target: 15% - 20% healthy</span>
            </div>

            <div style={styles.kpiCard}>
              <span style={styles.kpiLabel}>AVG BASKET VALUE</span>
              <span style={styles.kpiVal}>₹{metrics.aov.toFixed(0)}</span>
              <span style={styles.kpiSub}>Per customer transaction</span>
            </div>
          </div>

          {/* Main Charts Two-Column Section */}
          <div style={styles.chartRow}>
            {/* Left: Daily Revenue & Profit Trend Bar Chart (SVG) */}
            <div style={styles.chartCard}>
              <div style={styles.chartHeader}>
                <div>
                  <h2 style={styles.chartTitle}>7-Day Sales & Net Profit Velocity</h2>
                  <span style={styles.chartSub}>
                    Green bar = Total Revenue • Purple bar = Gross Profit
                  </span>
                </div>
                <div style={styles.legendRow}>
                  <div style={styles.legendItem}>
                    <span style={{ ...styles.legendDot, backgroundColor: '#10B981' }} />
                    <span>Revenue</span>
                  </div>
                  <div style={styles.legendItem}>
                    <span style={{ ...styles.legendDot, backgroundColor: '#8B5CF6' }} />
                    <span>Profit</span>
                  </div>
                </div>
              </div>

              {/* SVG Bar Chart */}
              <div style={styles.barChartContainer}>
                {dailyData.map((d) => {
                  const revHeight = maxDailyRev > 0 ? (d.rev / maxDailyRev) * 180 : 0;
                  const profitHeight = maxDailyRev > 0 ? (d.profit / maxDailyRev) * 180 : 0;
                  return (
                    <div key={d.day + d.date} style={styles.barCol}>
                      <div style={styles.barGroup}>
                        <div
                          style={{
                            ...styles.barRev,
                            height: `${Math.max(4, revHeight)}px`,
                          }}
                          title={`Revenue: ₹${d.rev}`}
                        />
                        <div
                          style={{
                            ...styles.barProfit,
                            height: `${Math.max(4, profitHeight)}px`,
                          }}
                          title={`Profit: ₹${d.profit}`}
                        />
                      </div>
                      <span style={styles.barDay}>{d.day}</span>
                      <span style={styles.barAmt}>
                        {d.rev >= 1000 ? `₹${(d.rev / 1000).toFixed(1)}k` : `₹${d.rev}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Payment Modes Distribution */}
            <div style={styles.sideCard}>
              <h2 style={styles.chartTitle}>Payment Method Split</h2>
              <span style={styles.chartSub}>Digital UPI vs Cash vs Customer Khata</span>

              <div style={styles.paymentMeterList}>
                {/* Cash */}
                <div style={styles.meterItem}>
                  <div style={styles.meterInfo}>
                    <span style={styles.meterLabel}>💵 Cash (नकद)</span>
                    <span style={styles.meterVal}>
                      ₹{metrics.cashSales.toFixed(0)} (
                      {metrics.revenue > 0
                        ? ((metrics.cashSales / metrics.revenue) * 100).toFixed(0)
                        : 0}
                      %)
                    </span>
                  </div>
                  <div style={styles.meterTrack}>
                    <div
                      style={{
                        ...styles.meterFill,
                        backgroundColor: '#10B981',
                        width: `${
                          metrics.revenue > 0 ? (metrics.cashSales / metrics.revenue) * 100 : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                {/* UPI */}
                <div style={styles.meterItem}>
                  <div style={styles.meterInfo}>
                    <span style={styles.meterLabel}>📲 UPI QR (डिजिटल)</span>
                    <span style={styles.meterVal}>
                      ₹{metrics.upiSales.toFixed(0)} (
                      {metrics.revenue > 0
                        ? ((metrics.upiSales / metrics.revenue) * 100).toFixed(0)
                        : 0}
                      %)
                    </span>
                  </div>
                  <div style={styles.meterTrack}>
                    <div
                      style={{
                        ...styles.meterFill,
                        backgroundColor: '#3B82F6',
                        width: `${
                          metrics.revenue > 0 ? (metrics.upiSales / metrics.revenue) * 100 : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                {/* Khata */}
                <div style={styles.meterItem}>
                  <div style={styles.meterInfo}>
                    <span style={styles.meterLabel}>📒 Khata (उधार)</span>
                    <span style={styles.meterVal}>
                      ₹{metrics.creditSales.toFixed(0)} (
                      {metrics.revenue > 0
                        ? ((metrics.creditSales / metrics.revenue) * 100).toFixed(0)
                        : 0}
                      %)
                    </span>
                  </div>
                  <div style={styles.meterTrack}>
                    <div
                      style={{
                        ...styles.meterFill,
                        backgroundColor: '#EF4444',
                        width: `${
                          metrics.revenue > 0 ? (metrics.creditSales / metrics.revenue) * 100 : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div style={styles.khataInsightBox}>
                <span style={styles.insightIcon}>💡</span>
                <p style={styles.insightText}>
                  <strong>Khata Tip:</strong> Regular credit customers boost lifetime loyalty. Track
                  due accounts in Khata tab for zero defaults.
                </p>
              </div>
            </div>
          </div>

          {/* Category Performance Breakdown */}
          <div style={styles.tableCard}>
            <div style={styles.tableHeaderRow}>
              <div>
                <h2 style={styles.tableTitle}>Category Profitability Matrix</h2>
                <span style={styles.tableSubtitle}>
                  Which sections of your dukaan generate the highest margins and cash flow.
                </span>
              </div>
            </div>

            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>CATEGORY</th>
                    <th style={styles.th}>REVENUE (₹)</th>
                    <th style={styles.th}>MARGIN %</th>
                    <th style={styles.th}>GROSS PROFIT (₹)</th>
                    <th style={styles.th}>PROFIT SHARE</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.categories.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ ...styles.td, textAlign: 'center', padding: '36px' }}>
                        No categorized sales recorded for this period yet.
                      </td>
                    </tr>
                  ) : (
                    metrics.categories.map((c) => {
                      const profitShare =
                        metrics.grossProfit > 0 ? (c.profit / metrics.grossProfit) * 100 : 0;
                      return (
                        <tr key={c.name} style={styles.tr}>
                          <td style={{ ...styles.td, fontWeight: 700, textTransform: 'capitalize' }}>
                            {c.name.replace('-', ' ')}
                          </td>
                          <td style={styles.td}>₹{c.revenue.toFixed(2)}</td>
                          <td style={styles.td}>
                            <span
                              style={{
                                ...styles.marginBadge,
                                backgroundColor:
                                  c.margin >= 18 ? '#DCFCE7' : c.margin >= 10 ? '#FEF3C7' : '#FEE2E2',
                                color:
                                  c.margin >= 18 ? '#15803D' : c.margin >= 10 ? '#92400E' : '#B91C1C',
                              }}
                            >
                              {c.margin.toFixed(1)}%
                            </span>
                          </td>
                          <td style={{ ...styles.td, fontWeight: 800, color: '#047857' }}>
                            ₹{c.profit.toFixed(2)}
                          </td>
                          <td style={styles.td}>
                            <div style={styles.shareBlock}>
                              <div style={styles.shareTrack}>
                                <div
                                  style={{
                                    ...styles.shareFill,
                                    width: `${Math.min(100, Math.max(0, profitShare))}%`,
                                  }}
                                />
                              </div>
                              <span style={styles.shareText}>{profitShare.toFixed(1)}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    paddingBottom: '40px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '16px',
  },
  badgeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '6px',
  },
  analyticsBadge: {
    fontSize: '11px',
    fontWeight: 800,
    letterSpacing: '0.5px',
    color: '#7C3AED',
    backgroundColor: '#F5F3FF',
    padding: '3px 8px',
    borderRadius: '6px',
  },
  storeBadge: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#64748B',
    backgroundColor: '#F1F5F9',
    padding: '3px 8px',
    borderRadius: '6px',
  },
  title: {
    fontSize: '26px',
    fontWeight: 800,
    color: '#0F172A',
    margin: 0,
    letterSpacing: '-0.5px',
  },
  subtitle: {
    fontSize: '14px',
    color: '#64748B',
    marginTop: '4px',
    margin: 0,
  },
  rangeTabs: {
    display: 'flex',
    backgroundColor: '#F1F5F9',
    padding: '4px',
    borderRadius: '10px',
    gap: '4px',
  },
  rangeBtn: {
    border: 'none',
    background: 'none',
    padding: '6px 14px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#64748B',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  rangeBtnActive: {
    backgroundColor: '#FFFFFF',
    color: '#0F172A',
    fontWeight: 700,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
  },
  loadingState: {
    padding: '60px 20px',
    textAlign: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid #E2E8F0',
    borderTopColor: '#7C3AED',
    borderRadius: '50%',
    margin: '0 auto 12px',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: {
    fontSize: '14px',
    color: '#64748B',
    margin: 0,
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
  },
  kpiCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '16px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
  },
  kpiLabel: {
    fontSize: '11px',
    fontWeight: 800,
    color: '#64748B',
    letterSpacing: '0.5px',
    marginBottom: '8px',
  },
  kpiVal: {
    fontSize: '26px',
    fontWeight: 800,
    color: '#0F172A',
    marginBottom: '4px',
  },
  kpiSub: {
    fontSize: '12px',
    color: '#94A3B8',
  },
  chartRow: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '20px',
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '16px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  chartHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
  },
  chartTitle: {
    fontSize: '16px',
    fontWeight: 800,
    color: '#0F172A',
    margin: 0,
  },
  chartSub: {
    fontSize: '12px',
    color: '#64748B',
    marginTop: '2px',
    display: 'block',
  },
  legendRow: {
    display: 'flex',
    gap: '16px',
    fontSize: '12px',
    color: '#475569',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  legendDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  barChartContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: '220px',
    paddingTop: '20px',
    borderBottom: '1.5px solid #F1F5F9',
  },
  barCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    flex: 1,
  },
  barGroup: {
    display: 'flex',
    gap: '4px',
    alignItems: 'flex-end',
    height: '180px',
  },
  barRev: {
    width: '18px',
    backgroundColor: '#10B981',
    borderRadius: '4px 4px 0 0',
    transition: 'height 0.3s ease',
  },
  barProfit: {
    width: '18px',
    backgroundColor: '#8B5CF6',
    borderRadius: '4px 4px 0 0',
    transition: 'height 0.3s ease',
  },
  barDay: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#475569',
  },
  barAmt: {
    fontSize: '10px',
    fontWeight: 600,
    color: '#94A3B8',
  },
  sideCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '16px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  paymentMeterList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginTop: '20px',
  },
  meterItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  meterInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    fontWeight: 600,
  },
  meterLabel: {
    color: '#334155',
  },
  meterVal: {
    color: '#0F172A',
    fontWeight: 700,
  },
  meterTrack: {
    height: '8px',
    backgroundColor: '#F1F5F9',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    borderRadius: '4px',
  },
  khataInsightBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: '12px',
    padding: '14px',
    display: 'flex',
    gap: '10px',
    alignItems: 'flex-start',
    marginTop: '20px',
  },
  insightIcon: {
    fontSize: '16px',
  },
  insightText: {
    fontSize: '12px',
    color: '#92400E',
    margin: 0,
    lineHeight: 1.4,
  },
  tableCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '16px',
    padding: '24px',
    overflow: 'hidden',
  },
  tableHeaderRow: {
    marginBottom: '18px',
  },
  tableTitle: {
    fontSize: '16px',
    fontWeight: 800,
    color: '#0F172A',
    margin: 0,
  },
  tableSubtitle: {
    fontSize: '12px',
    color: '#64748B',
    marginTop: '4px',
    display: 'block',
  },
  tableWrapper: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  th: {
    padding: '12px 16px',
    fontSize: '11px',
    fontWeight: 800,
    color: '#64748B',
    letterSpacing: '0.5px',
    borderBottom: '1px solid #E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  tr: {
    borderBottom: '1px solid #F1F5F9',
  },
  td: {
    padding: '14px 16px',
    fontSize: '13px',
    color: '#334155',
  },
  marginBadge: {
    padding: '3px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 800,
    display: 'inline-block',
  },
  shareBlock: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  shareTrack: {
    flex: 1,
    height: '6px',
    backgroundColor: '#F1F5F9',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  shareFill: {
    height: '100%',
    backgroundColor: '#059669',
    borderRadius: '3px',
  },
  shareText: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#64748B',
    minWidth: '35px',
  },
};
