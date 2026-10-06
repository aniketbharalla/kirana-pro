'use client';

import React, { useState, useMemo } from 'react';
import { DASHBOARD_INVOICES } from '../../lib/mockInvoices';
import { INITIAL_DASHBOARD_PRODUCTS } from '../../lib/mockData';

export default function AnalyticsPage() {
  const [range, setRange] = useState<'today' | '7days' | '30days' | 'all'>('7days');

  // Compute metrics from invoices
  const metrics = useMemo(() => {
    let revenue = 0;
    let cost = 0;
    let cashSales = 0;
    let upiSales = 0;
    let creditSales = 0;

    const categoryMap: Record<string, { revenue: number; cost: number; qty: number }> = {};

    DASHBOARD_INVOICES.forEach((inv) => {
      revenue += inv.grandTotal;

      if (inv.paymentMode === 'cash') cashSales += inv.grandTotal;
      else if (inv.paymentMode === 'upi') upiSales += inv.grandTotal;
      else if (inv.paymentMode === 'credit') creditSales += inv.grandTotal;

      inv.items.forEach((item) => {
        const prod = INITIAL_DASHBOARD_PRODUCTS.find((p) => p.id === item.productId);
        const itemCost = (prod?.purchasePrice || item.unitPrice * 0.82) * item.quantity;
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
    const aov = DASHBOARD_INVOICES.length > 0 ? revenue / DASHBOARD_INVOICES.length : 0;

    const categories = Object.entries(categoryMap).map(([name, data]) => {
      const profit = data.revenue - data.cost;
      const margin = data.revenue > 0 ? (profit / data.revenue) * 100 : 0;
      return {
        name,
        revenue: data.revenue,
        profit,
        margin,
        qty: data.qty,
      };
    }).sort((a, b) => b.revenue - a.revenue);

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
  }, []);

  // Daily trend mock data for SVG bar chart
  const dailyData = [
    { day: 'Mon', date: 'Sep 29', rev: 5200, profit: 890 },
    { day: 'Tue', date: 'Sep 30', rev: 6400, profit: 1120 },
    { day: 'Wed', date: 'Oct 01', rev: 4900, profit: 840 },
    { day: 'Thu', date: 'Oct 02', rev: 7800, profit: 1450 },
    { day: 'Fri', date: 'Oct 03', rev: 8900, profit: 1680 },
    { day: 'Sat', date: 'Oct 04', rev: 11500, profit: 2100 },
    { day: 'Sun', date: 'Oct 05', rev: 13800, profit: 2540 },
  ];

  const maxDailyRev = Math.max(...dailyData.map((d) => d.rev));

  return (
    <div style={styles.container}>
      {/* Page Header */}
      <div style={styles.header}>
        <div>
          <div style={styles.badgeRow}>
            <span style={styles.analyticsBadge}>📈 BUSINESS INTELLIGENCE</span>
            <span style={styles.storeBadge}>Sharma Kirana Back-Office</span>
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
              {r === 'today' ? 'Today' : r === '7days' ? 'Last 7 Days' : r === '30days' ? 'Last 30 Days' : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={styles.kpiGrid}>
        <div style={styles.kpiCard}>
          <span style={styles.kpiLabel}>TOTAL GROSS REVENUE</span>
          <span style={styles.kpiVal}>₹{metrics.revenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
          <span style={styles.kpiSub}>Total counter billings</span>
        </div>

        <div style={styles.kpiCard}>
          <span style={styles.kpiLabel}>PURCHASE COST (COGS)</span>
          <span style={styles.kpiVal}>₹{metrics.cost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
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
              <span style={styles.chartSub}>Green bar = Total Revenue • Purple bar = Gross Profit</span>
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
              const revHeight = (d.rev / maxDailyRev) * 180;
              const profitHeight = (d.profit / maxDailyRev) * 180;
              return (
                <div key={d.day} style={styles.barCol}>
                  <div style={styles.barGroup}>
                    <div
                      style={{
                        ...styles.barRev,
                        height: `${revHeight}px`,
                      }}
                      title={`Revenue: ₹${d.rev}`}
                    />
                    <div
                      style={{
                        ...styles.barProfit,
                        height: `${profitHeight}px`,
                      }}
                      title={`Profit: ₹${d.profit}`}
                    />
                  </div>
                  <span style={styles.barDay}>{d.day}</span>
                  <span style={styles.barAmt}>₹{(d.rev / 1000).toFixed(1)}k</span>
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
                  {metrics.revenue > 0 ? ((metrics.cashSales / metrics.revenue) * 100).toFixed(0) : 0}%)
                </span>
              </div>
              <div style={styles.meterTrack}>
                <div
                  style={{
                    ...styles.meterFill,
                    backgroundColor: '#10B981',
                    width: `${metrics.revenue > 0 ? (metrics.cashSales / metrics.revenue) * 100 : 0}%`,
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
                  {metrics.revenue > 0 ? ((metrics.upiSales / metrics.revenue) * 100).toFixed(0) : 0}%)
                </span>
              </div>
              <div style={styles.meterTrack}>
                <div
                  style={{
                    ...styles.meterFill,
                    backgroundColor: '#3B82F6',
                    width: `${metrics.revenue > 0 ? (metrics.upiSales / metrics.revenue) * 100 : 0}%`,
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
                  {metrics.revenue > 0 ? ((metrics.creditSales / metrics.revenue) * 100).toFixed(0) : 0}%)
                </span>
              </div>
              <div style={styles.meterTrack}>
                <div
                  style={{
                    ...styles.meterFill,
                    backgroundColor: '#EF4444',
                    width: `${metrics.revenue > 0 ? (metrics.creditSales / metrics.revenue) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div style={styles.khataInsightBox}>
            <span style={styles.insightIcon}>💡</span>
            <p style={styles.insightText}>
              <strong>Khata Tip:</strong> 34% of your monthly sales come through loyal credit accounts. Reminders via WhatsApp help recover funds within 7 days.
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
              {metrics.categories.map((c) => {
                const profitShare = metrics.grossProfit > 0 ? (c.profit / metrics.grossProfit) * 100 : 0;
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
                          backgroundColor: c.margin >= 18 ? '#DCFCE7' : c.margin >= 10 ? '#FEF3C7' : '#FEE2E2',
                          color: c.margin >= 18 ? '#15803D' : c.margin >= 10 ? '#92400E' : '#B91C1C',
                        }}
                      >
                        {c.margin.toFixed(1)}%
                      </span>
                    </td>
                    <td style={{ ...styles.td, fontWeight: 800, color: '#047857' }}>
                      ₹{c.profit.toFixed(2)}
                    </td>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={styles.miniTrack}>
                          <div
                            style={{
                              ...styles.miniFill,
                              width: `${Math.min(100, Math.max(0, profitShare))}%`,
                            }}
                          />
                        </div>
                        <span style={{ fontSize: '11px', color: '#64748B' }}>
                          {profitShare.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
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
    color: '#1E40AF',
    backgroundColor: '#EFF6FF',
    padding: '3px 8px',
    borderRadius: '6px',
    letterSpacing: '0.5px',
  },
  storeBadge: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#475569',
    backgroundColor: '#F1F5F9',
    padding: '3px 8px',
    borderRadius: '6px',
  },
  title: {
    fontSize: '26px',
    fontWeight: 800,
    color: '#0F172A',
    letterSpacing: '-0.5px',
    margin: 0,
  },
  subtitle: {
    fontSize: '14px',
    color: '#64748B',
    marginTop: '4px',
    margin: 0,
  },
  rangeTabs: {
    display: 'flex',
    backgroundColor: '#FFFFFF',
    border: '1px solid #CBD5E1',
    borderRadius: '10px',
    padding: '4px',
    gap: '4px',
  },
  rangeBtn: {
    border: 'none',
    backgroundColor: 'transparent',
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 700,
    color: '#64748B',
    cursor: 'pointer',
  },
  rangeBtnActive: {
    backgroundColor: '#10B981',
    color: '#FFFFFF',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px',
  },
  kpiCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '14px',
    border: '1px solid #E2E8F0',
    padding: '18px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  kpiLabel: {
    fontSize: '11px',
    fontWeight: 800,
    color: '#64748B',
    letterSpacing: '0.5px',
  },
  kpiVal: {
    fontSize: '22px',
    fontWeight: 800,
    color: '#0F172A',
  },
  kpiSub: {
    fontSize: '11px',
    color: '#94A3B8',
    marginTop: '2px',
  },
  chartRow: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '20px',
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
  },
  chartHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
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
  },
  legendRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '12px',
    color: '#475569',
    fontWeight: 600,
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
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: '240px',
    paddingTop: '20px',
    borderBottom: '2px solid #E2E8F0',
    gap: '12px',
  },
  barCol: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
  },
  barGroup: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '4px',
    height: '180px',
  },
  barRev: {
    width: '16px',
    backgroundColor: '#10B981',
    borderRadius: '4px 4px 0 0',
    transition: 'all 0.2s ease',
  },
  barProfit: {
    width: '16px',
    backgroundColor: '#8B5CF6',
    borderRadius: '4px 4px 0 0',
    transition: 'all 0.2s ease',
  },
  barDay: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#475569',
  },
  barAmt: {
    fontSize: '10px',
    color: '#94A3B8',
  },
  sideCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
  },
  paymentMeterList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginTop: '20px',
    flex: 1,
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
  },
  meterLabel: {
    fontWeight: 700,
    color: '#334155',
  },
  meterVal: {
    fontWeight: 800,
    color: '#0F172A',
  },
  meterTrack: {
    height: '10px',
    backgroundColor: '#F1F5F9',
    borderRadius: '6px',
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    borderRadius: '6px',
  },
  khataInsightBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: '12px',
    padding: '12px',
    display: 'flex',
    gap: '10px',
    marginTop: '16px',
  },
  insightIcon: {
    fontSize: '18px',
  },
  insightText: {
    fontSize: '12px',
    color: '#92400E',
    margin: 0,
    lineHeight: 1.4,
  },
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
    overflow: 'hidden',
  },
  tableHeaderRow: {
    padding: '20px',
    borderBottom: '1px solid #F1F5F9',
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
    marginTop: '2px',
  },
  tableWrapper: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px',
  },
  th: {
    backgroundColor: '#F8FAFC',
    color: '#475569',
    fontWeight: 700,
    fontSize: '11px',
    letterSpacing: '0.5px',
    padding: '12px 18px',
    textAlign: 'left',
    borderBottom: '1px solid #E2E8F0',
  },
  tr: {
    borderBottom: '1px solid #F1F5F9',
  },
  td: {
    padding: '14px 18px',
    color: '#334155',
  },
  marginBadge: {
    padding: '3px 8px',
    borderRadius: '6px',
    fontWeight: 800,
    fontSize: '11px',
  },
  miniTrack: {
    width: '60px',
    height: '6px',
    backgroundColor: '#E2E8F0',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  miniFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: '4px',
  },
};
