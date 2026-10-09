'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import {
  subscribeStoreProducts,
  subscribeStoreCustomers,
  recordStoreSale,
  autoDiscoverAndMigrateProducts,
  seedStarterProducts,
} from '../../lib/storeService';
import { Product, CustomerKhata, Invoice, InvoiceItem, PaymentMode, PRODUCT_CATEGORIES } from '@kirana-pro/shared';

export default function PosBillingPage() {
  const { store, profile, storeId, activeStaff, activeShift } = useAuth();

  // Products & Customers
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<CustomerKhata[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Search & Filter
  const [barcodeInput, setBarcodeInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showTarajuModal, setShowTarajuModal] = useState(false);
  const [selectedLooseProduct, setSelectedLooseProduct] = useState<Product | null>(null);
  const [tarajuWeightGrams, setTarajuWeightGrams] = useState<string>('500');
  const [tarajuRupees, setTarajuRupees] = useState<string>('');

  // Cart / Bill State
  const [cartItems, setCartItems] = useState<InvoiceItem[]>([]);
  const [billDiscount, setBillDiscount] = useState<string>('0');
  const [selectedCustomer, setSelectedCustomer] = useState<{ id?: string; name: string; phoneNumber?: string }>({
    name: 'Walk-in Customer (नकद)',
  });
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  // Checkout Modal State
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash');
  const [cashTendered, setCashTendered] = useState<string>('');
  const [processingSale, setProcessingSale] = useState(false);

  // Success / Receipt State
  const [completedInvoice, setCompletedInvoice] = useState<Invoice | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // 1. Subscribe to Store Products & Khata Customers
  useEffect(() => {
    if (!storeId) {
      setLoadingProducts(false);
      return;
    }

    const unsubProducts = subscribeStoreProducts(storeId, (data) => {
      setProducts(data);
      setLoadingProducts(false);
    });

    const unsubCustomers = subscribeStoreCustomers(storeId, (data) => {
      setCustomers(data);
    });

    return () => {
      unsubProducts();
      unsubCustomers();
    };
  }, [storeId]);

  // Focus barcode input on mount and on modal close
  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, [showCheckoutModal, showReceiptModal, showTarajuModal]);

  // Keyboard shortcut listener (F2: barcode, F4: checkout, Esc: close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        barcodeInputRef.current?.focus();
      } else if (e.key === 'F4') {
        e.preventDefault();
        if (cartItems.length > 0 && !showCheckoutModal) {
          handleOpenCheckout();
        }
      } else if (e.key === 'Escape') {
        if (showCheckoutModal) setShowCheckoutModal(false);
        if (showReceiptModal) setShowReceiptModal(false);
        if (showTarajuModal) setShowTarajuModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cartItems, showCheckoutModal, showReceiptModal, showTarajuModal]);

  // Filtered Products for Picker
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (p.isActive === false) return false;
      if (selectedCategory !== 'all' && p.category !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchName = (p.name || '').toLowerCase().includes(q);
        const matchHindi = p.nameHindi ? p.nameHindi.toLowerCase().includes(q) : false;
        const matchBarcode = p.barcode ? p.barcode.toLowerCase().includes(q) : false;
        return matchName || matchHindi || matchBarcode;
      }
      return true;
    });
  }, [products, selectedCategory, searchQuery]);

  // 2. Barcode Scanner submission handler
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = barcodeInput.trim();
    if (!code) return;

    // Search product by barcode or exact name
    const match = products.find(
      (p) =>
        p.isActive !== false &&
        ((p.barcode && p.barcode.toLowerCase() === code.toLowerCase()) ||
          p.name.toLowerCase() === code.toLowerCase())
    );

    if (match) {
      addItemToCart(match, 1);
      setBarcodeInput('');
    } else {
      alert(`No product found with barcode: ${code}. You can add it from catalog or type name to search.`);
    }
  };

  // 3. Add Item to Cart
  const addItemToCart = (product: Product, qty: number = 1, customPrice?: number) => {
    const unitPrice = customPrice !== undefined ? customPrice : product.sellingPrice;
    const gstRate = product.gstRate || 0;

    setCartItems((prev) => {
      const existingIdx = prev.findIndex((item) => item.productId === product.id && item.unitPrice === unitPrice);

      if (existingIdx > -1) {
        // Increment quantity
        const updated = [...prev];
        const existing = updated[existingIdx];
        const newQty = existing.quantity + qty;
        const taxable = (newQty * unitPrice) / (1 + gstRate / 100);
        const gstAmount = newQty * unitPrice - taxable;

        updated[existingIdx] = {
          ...existing,
          quantity: newQty,
          taxableAmount: parseFloat(taxable.toFixed(2)),
          gstAmount: parseFloat(gstAmount.toFixed(2)),
          totalAmount: parseFloat((newQty * unitPrice - (existing.discount || 0)).toFixed(2)),
        };
        return updated;
      } else {
        // Add new line item
        const taxable = (qty * unitPrice) / (1 + gstRate / 100);
        const gstAmount = qty * unitPrice - taxable;

        const newItem: InvoiceItem = {
          productId: product.id,
          name: product.name,
          nameHindi: product.nameHindi,
          unit: product.unit || 'packet',
          isLoose: Boolean(product.isLoose),
          quantity: qty,
          unitPrice: unitPrice,
          discount: 0,
          gstRate,
          hsnCode: (product as any).hsnCode || '2106',
          taxableAmount: parseFloat(taxable.toFixed(2)),
          gstAmount: parseFloat(gstAmount.toFixed(2)),
          totalAmount: parseFloat((qty * unitPrice).toFixed(2)),
        };
        return [...prev, newItem];
      }
    });

    barcodeInputRef.current?.focus();
  };

  // 4. Update Cart Item Quantity
  const updateItemQty = (index: number, newQty: number) => {
    if (newQty <= 0) {
      removeCartItem(index);
      return;
    }

    setCartItems((prev) => {
      const updated = [...prev];
      const item = updated[index];
      const taxable = (newQty * item.unitPrice) / (1 + item.gstRate / 100);
      const gstAmount = newQty * item.unitPrice - taxable;

      updated[index] = {
        ...item,
        quantity: newQty,
        taxableAmount: parseFloat(taxable.toFixed(2)),
        gstAmount: parseFloat(gstAmount.toFixed(2)),
        totalAmount: parseFloat((newQty * item.unitPrice - item.discount).toFixed(2)),
      };
      return updated;
    });
  };

  // 5. Update Item Discount
  const updateItemDiscount = (index: number, discountAmt: number) => {
    setCartItems((prev) => {
      const updated = [...prev];
      const item = updated[index];
      const validDiscount = Math.max(0, Math.min(item.quantity * item.unitPrice, discountAmt));

      updated[index] = {
        ...item,
        discount: validDiscount,
        totalAmount: parseFloat((item.quantity * item.unitPrice - validDiscount).toFixed(2)),
      };
      return updated;
    });
  };

  // 6. Remove item from cart
  const removeCartItem = (index: number) => {
    setCartItems((prev) => prev.filter((_, i) => i !== index));
  };

  // 7. Clear entire cart
  const handleClearCart = () => {
    if (cartItems.length === 0) return;
    if (confirm('Clear all items from current bill?')) {
      setCartItems([]);
      setBillDiscount('0');
      setSelectedCustomer({ name: 'Walk-in Customer (नकद)' });
      barcodeInputRef.current?.focus();
    }
  };

  // 8. Calculations
  const subtotal = cartItems.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
  const itemsDiscountTotal = cartItems.reduce((acc, item) => acc + (item.discount || 0), 0);
  const parsedBillDiscount = Math.max(0, parseFloat(billDiscount) || 0);
  const totalDiscounts = itemsDiscountTotal + parsedBillDiscount;
  const taxableTotal = cartItems.reduce((acc, item) => acc + item.taxableAmount, 0);
  const gstTaxTotal = cartItems.reduce((acc, item) => acc + item.gstAmount, 0);
  const rawGrandTotal = Math.max(0, subtotal - totalDiscounts);
  const roundOff = Math.round(rawGrandTotal) - rawGrandTotal;
  const grandTotal = Math.round(rawGrandTotal);

  // 9. Smart Taraju Loose Item Calculation
  const handleOpenTaraju = (prod?: Product) => {
    const target = prod || products.find((p) => p.isLoose) || products[0];
    if (!target) {
      alert('Please add products first before using Taraju loose scale.');
      return;
    }
    setSelectedLooseProduct(target);
    setTarajuWeightGrams('500');
    setTarajuRupees((target.sellingPrice * 0.5).toFixed(2));
    setShowTarajuModal(true);
  };

  const handleTarajuWeightChange = (grams: string) => {
    setTarajuWeightGrams(grams);
    if (!selectedLooseProduct) return;
    const g = parseFloat(grams) || 0;
    const kg = g / 1000;
    const price = kg * selectedLooseProduct.sellingPrice;
    setTarajuRupees(price.toFixed(2));
  };

  const handleTarajuRupeesChange = (rupees: string) => {
    setTarajuRupees(rupees);
    if (!selectedLooseProduct || selectedLooseProduct.sellingPrice <= 0) return;
    const amt = parseFloat(rupees) || 0;
    const kg = amt / selectedLooseProduct.sellingPrice;
    const g = Math.round(kg * 1000);
    setTarajuWeightGrams(g.toString());
  };

  const handleAddTarajuToCart = () => {
    if (!selectedLooseProduct) return;
    const g = parseFloat(tarajuWeightGrams) || 0;
    const kg = parseFloat((g / 1000).toFixed(3));
    if (kg <= 0) {
      alert('Please enter a valid weight');
      return;
    }
    addItemToCart(selectedLooseProduct, kg);
    setShowTarajuModal(false);
  };

  // 10. Open Checkout Modal
  const handleOpenCheckout = () => {
    if (cartItems.length === 0) {
      alert('Cart is empty. Add products before checkout.');
      return;
    }
    setCashTendered(grandTotal.toString());
    setShowCheckoutModal(true);
  };

  // 11. Complete Sale Execution
  const handleExecuteCheckout = async () => {
    if (!storeId) {
      alert('Store not found. Please log in.');
      return;
    }
    setProcessingSale(true);

    try {
      const parsedCash = parseFloat(cashTendered) || 0;
      const changeDue = Math.max(0, parsedCash - grandTotal);
      const isCredit = paymentMode === 'credit';
      const amountPaid = isCredit ? 0 : grandTotal;
      const amountDue = isCredit ? grandTotal : 0;

      const cashierName = activeStaff ? activeStaff.name : profile?.displayName || 'Store Owner';
      const cashierId = activeStaff ? activeStaff.id : profile?.uid || 'owner';
      const counterNum = activeShift?.counterNumber || 1;

      const invoice = await recordStoreSale(storeId, {
        items: cartItems,
        subtotal,
        discountTotal: totalDiscounts,
        taxTotal: gstTaxTotal,
        grandTotal,
        paymentMode,
        amountPaid,
        amountDue,
        customer: selectedCustomer.id || selectedCustomer.name !== 'Walk-in Customer (नकद)' ? selectedCustomer : undefined,
        counterNumber: counterNum,
        staffId: cashierId,
        staffName: cashierName,
        cashTendered: paymentMode === 'cash' ? parsedCash : grandTotal,
        changeDue: paymentMode === 'cash' ? changeDue : 0,
        notes: `POS Bill Counter ${counterNum}`,
        createdBy: cashierId,
      });

      setCompletedInvoice(invoice);
      setShowCheckoutModal(false);
      setShowReceiptModal(true);

      // Reset cart for next customer
      setCartItems([]);
      setBillDiscount('0');
      setSelectedCustomer({ name: 'Walk-in Customer (नकद)' });
    } catch (err: any) {
      console.error('Checkout error:', err);
      alert(`Sale failed: ${err.message}`);
    } finally {
      setProcessingSale(false);
    }
  };

  // UPI QR Code URI Generator
  const storeVpa = store?.gstNumber ? `${store.id}@upi` : '9876543210@paytm';
  const upiIntentUri = `upi://pay?pa=${encodeURIComponent(storeVpa)}&pn=${encodeURIComponent(store?.name || 'Kirana Store')}&am=${grandTotal.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Bill Payment`)}`;
  const upiQrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiIntentUri)}`;

  return (
    <div style={styles.container}>
      {/* Top POS Header Toolbar */}
      <div style={styles.topToolbar}>
        <div style={styles.brandGroup}>
          <span style={styles.posBadge}>⚡ POS QUICK BILLING</span>
          <h1 style={styles.storeName}>{store?.name || 'Kirana Pro Counter'}</h1>
          <span style={styles.counterBadge}>
            Counter {activeShift?.counterNumber || 1} • {activeStaff ? `Cashier: ${activeStaff.name}` : (profile?.displayName || 'Owner')}
          </span>
        </div>

        {/* Global Quick Shortcuts Strip */}
        <div style={styles.shortcutsStrip}>
          <span style={styles.shortcutPill}><strong>F2</strong> Scan Barcode</span>
          <span style={styles.shortcutPill}><strong>F4</strong> Pay Bill</span>
          <span style={styles.shortcutPill}><strong>ESC</strong> Close</span>
          <Link href="/bills" style={styles.historyLink}>
            🧾 Sales History
          </Link>
        </div>
      </div>

      {/* Main POS Split Layout */}
      <div style={styles.mainGrid}>
        {/* ============================================================== */}
        {/* LEFT PANEL: PRODUCT CATALOG & BARCODE SCANNER */}
        {/* ============================================================== */}
        <div style={styles.catalogPanel}>
          {/* Barcode & Search Bar */}
          <div style={styles.searchHeader}>
            <form onSubmit={handleBarcodeSubmit} style={styles.barcodeForm}>
              <span style={styles.barcodeIcon}>📷</span>
              <input
                ref={barcodeInputRef}
                style={styles.barcodeInput}
                type="text"
                placeholder="Scan Barcode (F2) or Press Enter to Add..."
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
              />
              <button type="submit" style={styles.scanSubmitBtn}>
                Add ➔
              </button>
            </form>

            <div style={styles.searchRow}>
              <div style={styles.textSearchWrapper}>
                <span style={styles.searchIcon}>🔍</span>
                <input
                  style={styles.textSearchInput}
                  type="text"
                  placeholder="Search item in English, Hindi (उदा. आटा, दाल, Maggi)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <button
                type="button"
                style={styles.tarajuQuickBtn}
                onClick={() => handleOpenTaraju()}
                title="Open Smart Taraju Scale for Loose Dal, Rice, Sugar, Spices"
              >
                ⚖️ Loose / तराजू
              </button>
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div style={styles.categoryTabs}>
            <button
              style={{
                ...styles.catTab,
                ...(selectedCategory === 'all' ? styles.catTabActive : {}),
              }}
              onClick={() => setSelectedCategory('all')}
            >
              All Items ({products.length})
            </button>
            {PRODUCT_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                style={{
                  ...styles.catTab,
                  ...(selectedCategory === cat.id ? styles.catTabActive : {}),
                }}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Product Cards Grid */}
          <div style={styles.productsScrollArea}>
            {loadingProducts ? (
              <div style={styles.centerLoading}>
                <div style={styles.spinner} />
                <p>Loading Store Catalog...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div style={styles.emptyCatalogCard}>
                <div style={styles.emptyIcon}>📦</div>
                <h3>No Products Found</h3>
                <p>Add products to your catalog or click below to populate the standard Indian Kirana staples.</p>
                <div style={styles.catalogRecoveryButtons}>
                  <button
                    style={styles.recoverBtn}
                    onClick={() => {
                      if (!storeId) return;
                      autoDiscoverAndMigrateProducts(storeId).then((prods) => {
                        if (prods.length > 0) setProducts(prods);
                      });
                    }}
                  >
                    🔄 Discover Existing Products
                  </button>
                  <button
                    style={styles.seedBtn}
                    onClick={() => {
                      if (!storeId) return;
                      seedStarterProducts(storeId).then((prods) => {
                        setProducts(prods);
                      });
                    }}
                  >
                    ✨ Load 12 Indian Kirana Staples
                  </button>
                </div>
              </div>
            ) : (
              <div style={styles.productGrid}>
                {filteredProducts.map((p) => {
                  const isOutOfStock = p.currentStock === 0;
                  const isLowStock = !isOutOfStock && p.currentStock <= p.minStockAlert;

                  return (
                    <div
                      key={p.id}
                      style={{
                        ...styles.productCard,
                        ...(isOutOfStock ? styles.productCardOut : {}),
                      }}
                      onClick={() => {
                        if (p.isLoose) {
                          handleOpenTaraju(p);
                        } else {
                          addItemToCart(p, 1);
                        }
                      }}
                    >
                      <div style={styles.cardTopRow}>
                        <span style={styles.cardCategory}>{p.category}</span>
                        {p.isLoose && <span style={styles.cardLoosePill}>⚖️ Loose</span>}
                        {p.barcode && <span style={styles.cardBarcode}>#{p.barcode.slice(-4)}</span>}
                      </div>

                      <h4 style={styles.cardName}>{p.name}</h4>
                      {p.nameHindi && <span style={styles.cardHindi}>{p.nameHindi}</span>}

                      <div style={styles.cardBottomRow}>
                        <div style={styles.priceContainer}>
                          <span style={styles.priceSymbol}>₹</span>
                          <span style={styles.priceValue}>{p.sellingPrice}</span>
                          <span style={styles.priceUnit}>/{p.unit}</span>
                        </div>

                        <span
                          style={{
                            ...styles.stockPill,
                            ...(isOutOfStock
                              ? styles.stockOut
                              : isLowStock
                              ? styles.stockLow
                              : styles.stockOk),
                          }}
                        >
                          {p.currentStock} {p.unit}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ============================================================== */}
        {/* RIGHT PANEL: ACTIVE BILL / CART SHEET */}
        {/* ============================================================== */}
        <div style={styles.cartPanel}>
          {/* Customer Selection Banner */}
          <div style={styles.customerBar}>
            <div style={styles.customerSelector}>
              <span style={styles.customerIcon}>👤</span>
              <div style={styles.customerInfo}>
                <span style={styles.customerTitle}>{selectedCustomer.name}</span>
                {selectedCustomer.phoneNumber && <span style={styles.customerPhone}>+91 {selectedCustomer.phoneNumber}</span>}
              </div>
            </div>

            <div style={styles.customerActions}>
              <button
                type="button"
                style={styles.changeCustBtn}
                onClick={() => setShowCustomerDropdown(!showCustomerDropdown)}
              >
                {showCustomerDropdown ? '✕ Close' : '📒 Select Customer'}
              </button>
            </div>
          </div>

          {/* Customer Search / Pick Dropdown */}
          {showCustomerDropdown && (
            <div style={styles.customerDropdownCard}>
              <input
                style={styles.custSearchInput}
                type="text"
                placeholder="Search Khata customer by name or mobile..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                autoFocus
              />
              <div style={styles.custList}>
                <div
                  style={styles.custRow}
                  onClick={() => {
                    setSelectedCustomer({ name: 'Walk-in Customer (नकद)' });
                    setShowCustomerDropdown(false);
                  }}
                >
                  <strong>Walk-in Customer (नकद ग्राहक)</strong>
                </div>
                {customers
                  .filter((c) =>
                    !customerSearch.trim() ||
                    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
                    (c.phoneNumber && c.phoneNumber.includes(customerSearch))
                  )
                  .slice(0, 8)
                  .map((c) => (
                    <div
                      key={c.id}
                      style={styles.custRow}
                      onClick={() => {
                        setSelectedCustomer({ id: c.id, name: c.name, phoneNumber: c.phoneNumber });
                        setShowCustomerDropdown(false);
                      }}
                    >
                      <div>
                        <div style={styles.custRowName}>{c.name}</div>
                        <div style={styles.custRowPhone}>{c.phoneNumber}</div>
                      </div>
                      <span
                        style={{
                          fontWeight: 700,
                          color: (c.currentBalance || 0) > 0 ? '#DC2626' : '#059669',
                        }}
                      >
                        ₹{c.currentBalance || 0} Udhar
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Cart Items Table Header */}
          <div style={styles.cartTableHeader}>
            <span style={{ flex: 3 }}>ITEM</span>
            <span style={{ flex: 1.5, textAlign: 'center' }}>RATE</span>
            <span style={{ flex: 2, textAlign: 'center' }}>QTY</span>
            <span style={{ flex: 1.5, textAlign: 'right' }}>TOTAL</span>
            <span style={{ width: 28, textAlign: 'center' }}></span>
          </div>

          {/* Cart Items Scrollable List */}
          <div style={styles.cartItemsScroll}>
            {cartItems.length === 0 ? (
              <div style={styles.emptyCartBox}>
                <span style={styles.emptyCartIcon}>🛒</span>
                <h4 style={styles.emptyCartHeading}>Cart is Empty</h4>
                <p style={styles.emptyCartSub}>
                  Scan barcodes with a reader gun, press <strong>F2</strong>, or click items on the left to add to bill.
                </p>
              </div>
            ) : (
              cartItems.map((item, idx) => (
                <div key={`${item.productId}_${idx}`} style={styles.cartItemRow}>
                  {/* Name */}
                  <div style={{ flex: 3 }}>
                    <div style={styles.itemNameText}>{item.name}</div>
                    {item.nameHindi && <div style={styles.itemHindiText}>{item.nameHindi}</div>}
                    <div style={styles.itemTaxMeta}>
                      GST {item.gstRate}% • ₹{item.unitPrice}/{item.unit}
                    </div>
                  </div>

                  {/* Rate */}
                  <div style={{ flex: 1.5, textAlign: 'center', fontWeight: 600 }}>
                    ₹{item.unitPrice}
                  </div>

                  {/* Quantity Stepper */}
                  <div style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <button
                      type="button"
                      style={styles.qtyBtn}
                      onClick={() => updateItemQty(idx, item.isLoose ? parseFloat((item.quantity - 0.25).toFixed(3)) : item.quantity - 1)}
                    >
                      −
                    </button>
                    <input
                      style={styles.qtyInput}
                      type="number"
                      step={item.isLoose ? '0.05' : '1'}
                      value={item.quantity}
                      onChange={(e) => updateItemQty(idx, parseFloat(e.target.value) || 0)}
                    />
                    <button
                      type="button"
                      style={styles.qtyBtn}
                      onClick={() => updateItemQty(idx, item.isLoose ? parseFloat((item.quantity + 0.25).toFixed(3)) : item.quantity + 1)}
                    >
                      +
                    </button>
                  </div>

                  {/* Line Total */}
                  <div style={{ flex: 1.5, textAlign: 'right', fontWeight: 700, color: '#0F172A' }}>
                    ₹{item.totalAmount.toFixed(2)}
                  </div>

                  {/* Delete Item */}
                  <div style={{ width: 28, textAlign: 'center' }}>
                    <button
                      type="button"
                      style={styles.delItemBtn}
                      onClick={() => removeCartItem(idx)}
                      title="Remove item"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart Summary & Total Calculations */}
          <div style={styles.cartSummary}>
            <div style={styles.summaryRow}>
              <span>Items Subtotal ({cartItems.length} items)</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>

            <div style={styles.summaryRow}>
              <span>GST Tax (Included)</span>
              <span>₹{gstTaxTotal.toFixed(2)}</span>
            </div>

            <div style={styles.summaryRow}>
              <span>Bill Discount (₹)</span>
              <input
                style={styles.discountInput}
                type="number"
                placeholder="0"
                value={billDiscount}
                onChange={(e) => setBillDiscount(e.target.value)}
              />
            </div>

            {roundOff !== 0 && (
              <div style={styles.summaryRow}>
                <span>Round Off Adjustment</span>
                <span>{roundOff > 0 ? `+₹${roundOff.toFixed(2)}` : `-₹${Math.abs(roundOff).toFixed(2)}`}</span>
              </div>
            )}

            {/* Grand Total Hero Box */}
            <div style={styles.grandTotalHero}>
              <div>
                <span style={styles.grandTotalLabel}>TOTAL PAYABLE</span>
                <div style={styles.grandTotalHindi}>कुल देय राशि</div>
              </div>
              <div style={styles.grandTotalAmount}>₹{grandTotal.toLocaleString('en-IN')}</div>
            </div>

            {/* Action Buttons */}
            <div style={styles.cartActionButtons}>
              <button
                type="button"
                style={styles.clearCartBtn}
                onClick={handleClearCart}
                disabled={cartItems.length === 0}
              >
                🗑️ Clear
              </button>
              <button
                type="button"
                style={{
                  ...styles.checkoutBtn,
                  opacity: cartItems.length === 0 ? 0.6 : 1,
                }}
                disabled={cartItems.length === 0}
                onClick={handleOpenCheckout}
              >
                ⚡ PAY & BILL (F4) ➔
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL 1: CHECKOUT & PAYMENT MODE */}
      {/* ============================================================== */}
      {showCheckoutModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.checkoutModalCard}>
            <div style={styles.modalHeader}>
              <div>
                <span style={styles.modalSub}>CHECKOUT REGISTER</span>
                <h2 style={styles.modalTitle}>Complete POS Sale</h2>
              </div>
              <button style={styles.closeBtn} onClick={() => setShowCheckoutModal(false)}>
                ✕
              </button>
            </div>

            {/* Big Amount To Pay Display */}
            <div style={styles.checkoutAmountBox}>
              <span style={styles.checkoutAmountLabel}>FINAL BILL AMOUNT</span>
              <div style={styles.checkoutAmountBig}>₹{grandTotal.toLocaleString('en-IN')}</div>
              <span style={styles.checkoutCustomerName}>{selectedCustomer.name}</span>
            </div>

            {/* Payment Mode Selector Tabs */}
            <div style={styles.paymentModeTabs}>
              <button
                type="button"
                style={{
                  ...styles.payTab,
                  ...(paymentMode === 'cash' ? styles.payTabActive : {}),
                }}
                onClick={() => setPaymentMode('cash')}
              >
                💵 Cash (नकद)
              </button>
              <button
                type="button"
                style={{
                  ...styles.payTab,
                  ...(paymentMode === 'upi' ? styles.payTabActive : {}),
                }}
                onClick={() => setPaymentMode('upi')}
              >
                📱 UPI QR (PhonePe/GPay)
              </button>
              <button
                type="button"
                style={{
                  ...styles.payTab,
                  ...(paymentMode === 'credit' ? styles.payTabActive : {}),
                }}
                onClick={() => setPaymentMode('credit')}
              >
                📒 Khata Udhar (उधार)
              </button>
            </div>

            {/* A. Cash Payment Panel */}
            {paymentMode === 'cash' && (
              <div style={styles.payBody}>
                <label style={styles.inputLabel}>CASH TENDERED BY CUSTOMER (ग्राहक ने दिया)</label>
                <div style={styles.currencyInputRow}>
                  <span style={styles.currencySym}>₹</span>
                  <input
                    style={styles.cashInput}
                    type="number"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    autoFocus
                  />
                </div>

                {/* Quick Cash Buttons */}
                <div style={styles.quickCashButtons}>
                  <button type="button" style={styles.qcBtn} onClick={() => setCashTendered(grandTotal.toString())}>
                    Exact ₹{grandTotal}
                  </button>
                  <button type="button" style={styles.qcBtn} onClick={() => setCashTendered((Math.ceil(grandTotal / 50) * 50 || grandTotal).toString())}>
                    +₹50
                  </button>
                  <button type="button" style={styles.qcBtn} onClick={() => setCashTendered((Math.ceil(grandTotal / 100) * 100 || grandTotal).toString())}>
                    +₹100
                  </button>
                  <button type="button" style={styles.qcBtn} onClick={() => setCashTendered((Math.ceil(grandTotal / 500) * 500 || 500).toString())}>
                    ₹500 Note
                  </button>
                  <button type="button" style={styles.qcBtn} onClick={() => setCashTendered('2000')}>
                    ₹2000
                  </button>
                </div>

                {/* Change Due Display */}
                <div style={styles.changeDueBox}>
                  <span style={styles.changeDueLabel}>CHANGE TO RETURN (वापसी):</span>
                  <span style={styles.changeDueValue}>
                    ₹{Math.max(0, (parseFloat(cashTendered) || 0) - grandTotal).toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {/* B. UPI Payment Panel */}
            {paymentMode === 'upi' && (
              <div style={styles.payBodyUPI}>
                <div style={styles.upiQrBox}>
                  <img
                    src={upiQrImageUrl}
                    alt="UPI Payment QR Code"
                    style={styles.qrImage}
                  />
                  <div style={styles.upiInstructions}>
                    <div style={styles.upiStoreText}>Scan & Pay with any UPI App</div>
                    <div style={styles.upiAmountBadge}>₹{grandTotal.toFixed(2)}</div>
                    <div style={styles.upiVpaText}>VPA: {storeVpa}</div>
                  </div>
                </div>
              </div>
            )}

            {/* C. Khata Udhar Payment Panel */}
            {paymentMode === 'credit' && (
              <div style={styles.payBody}>
                <div style={styles.khataWarningBox}>
                  <span style={styles.khataWarningIcon}>📒</span>
                  <div>
                    <h4 style={styles.khataHeading}>Record Udhar in Customer Khata</h4>
                    <p style={styles.khataText}>
                      This sale of <strong>₹{grandTotal}</strong> will be debited to <strong>{selectedCustomer.name}</strong>’s ledger account.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Checkout Action Button */}
            <button
              type="button"
              style={styles.finalizeBtn}
              onClick={handleExecuteCheckout}
              disabled={processingSale}
            >
              {processingSale ? 'Processing Sale...' : `✓ Complete Sale & Print Bill (₹${grandTotal})`}
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: 58MM / 80MM THERMAL RECEIPT & PRINT MODAL */}
      {/* ============================================================== */}
      {showReceiptModal && completedInvoice && (
        <div style={styles.modalOverlay}>
          <div style={styles.receiptModalCard}>
            <div style={styles.modalHeader}>
              <div>
                <span style={styles.modalSub}>SALE COMPLETED ✓</span>
                <h3 style={styles.modalTitle}>Invoice #{completedInvoice.invoiceNumber}</h3>
              </div>
              <button style={styles.closeBtn} onClick={() => setShowReceiptModal(false)}>
                ✕
              </button>
            </div>

            {/* Printable Thermal Receipt Container */}
            <div style={styles.thermalReceipt} id="printable-receipt">
              <div style={styles.receiptStore}>{store?.name || 'KIRANA PRO STORE'}</div>
              <div style={styles.receiptSub}>
                {store?.address?.street}, {store?.address?.city}
                {store?.gstNumber ? ` • GSTIN: ${store.gstNumber}` : ''}
              </div>
              <div style={styles.receiptDivider}>--------------------------------</div>
              <div style={styles.receiptMeta}>
                <span>Inv: {completedInvoice.invoiceNumber}</span>
                <span>{new Date(completedInvoice.createdAt).toLocaleDateString('en-IN')}</span>
              </div>
              <div style={styles.receiptMeta}>
                <span>Cashier: {completedInvoice.staffName || 'Counter 1'}</span>
                <span>{new Date(completedInvoice.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              {completedInvoice.customer && (
                <div style={styles.receiptCust}>Cust: {completedInvoice.customer.name}</div>
              )}
              <div style={styles.receiptDivider}>--------------------------------</div>

              <div style={styles.receiptItemsList}>
                {completedInvoice.items.map((item, i) => (
                  <div key={i} style={styles.receiptItemRow}>
                    <div style={{ flex: 2 }}>
                      <div>{item.name}</div>
                      <div style={{ fontSize: '10px', color: '#666' }}>
                        {item.quantity} x ₹{item.unitPrice}
                      </div>
                    </div>
                    <div style={{ fontWeight: 700 }}>₹{item.totalAmount.toFixed(2)}</div>
                  </div>
                ))}
              </div>

              <div style={styles.receiptDivider}>--------------------------------</div>
              <div style={styles.receiptTotalRow}>
                <span>Subtotal:</span>
                <span>₹{completedInvoice.subtotal.toFixed(2)}</span>
              </div>
              {completedInvoice.discountTotal > 0 && (
                <div style={styles.receiptTotalRow}>
                  <span>Discount:</span>
                  <span>-₹{completedInvoice.discountTotal.toFixed(2)}</span>
                </div>
              )}
              <div style={styles.receiptTotalRow}>
                <span>GST Tax:</span>
                <span>₹{completedInvoice.taxTotal.toFixed(2)}</span>
              </div>
              <div style={styles.receiptGrandRow}>
                <span>GRAND TOTAL:</span>
                <span>₹{completedInvoice.grandTotal.toFixed(2)}</span>
              </div>
              <div style={styles.receiptDivider}>--------------------------------</div>
              <div style={styles.receiptTotalRow}>
                <span>Payment Mode:</span>
                <span>{completedInvoice.paymentMode.toUpperCase()}</span>
              </div>
              {completedInvoice.paymentMode === 'cash' && completedInvoice.cashTendered && (
                <>
                  <div style={styles.receiptTotalRow}>
                    <span>Cash Tendered:</span>
                    <span>₹{completedInvoice.cashTendered.toFixed(2)}</span>
                  </div>
                  <div style={styles.receiptTotalRow}>
                    <span>Change Due:</span>
                    <span>₹{(completedInvoice.changeDue || 0).toFixed(2)}</span>
                  </div>
                </>
              )}
              <div style={styles.receiptFooter}>धन्यवाद! फिर पधारें! Thank You!</div>
            </div>

            {/* Receipt Modal Buttons */}
            <div style={styles.receiptActions}>
              <button
                type="button"
                style={styles.printThermalBtn}
                onClick={() => window.print()}
              >
                🖨️ Print 58mm Thermal Receipt
              </button>
              <button
                type="button"
                style={styles.nextBillBtn}
                onClick={() => {
                  setShowReceiptModal(false);
                  barcodeInputRef.current?.focus();
                }}
              >
                ➕ New Bill (F2)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: SMART TARAJU SCALE CALCULATOR */}
      {/* ============================================================== */}
      {showTarajuModal && selectedLooseProduct && (
        <div style={styles.modalOverlay}>
          <div style={styles.tarajuModalCard}>
            <div style={styles.modalHeader}>
              <div>
                <span style={styles.modalSub}>SMART SCALE CALCULATOR</span>
                <h3 style={styles.modalTitle}>⚖️ Taraju Loose Item Calculator</h3>
              </div>
              <button style={styles.closeBtn} onClick={() => setShowTarajuModal(false)}>
                ✕
              </button>
            </div>

            <div style={styles.tarajuProductStrip}>
              <div>
                <h4 style={styles.tarajuProdName}>{selectedLooseProduct.name}</h4>
                {selectedLooseProduct.nameHindi && <span style={styles.tarajuProdHindi}>{selectedLooseProduct.nameHindi}</span>}
              </div>
              <div style={styles.tarajuRateBadge}>
                Rate: ₹{selectedLooseProduct.sellingPrice}/kg
              </div>
            </div>

            <div style={styles.tarajuDualInputs}>
              <div style={styles.tarajuInputCol}>
                <label style={styles.inputLabel}>WEIGHT (वजन - GRAMS)</label>
                <div style={styles.currencyInputRow}>
                  <input
                    style={styles.cashInput}
                    type="number"
                    value={tarajuWeightGrams}
                    onChange={(e) => handleTarajuWeightChange(e.target.value)}
                    autoFocus
                  />
                  <span style={styles.tarajuUnitLabel}>g</span>
                </div>
                <div style={styles.quickGramsRow}>
                  {['100', '250', '500', '1000', '2000', '5000'].map((g) => (
                    <button
                      key={g}
                      type="button"
                      style={styles.gramPill}
                      onClick={() => handleTarajuWeightChange(g)}
                    >
                      {parseFloat(g) >= 1000 ? `${parseFloat(g) / 1000}kg` : `${g}g`}
                    </button>
                  ))}
                </div>
              </div>

              <div style={styles.tarajuInputCol}>
                <label style={styles.inputLabel}>AMOUNT (रुपये - RUPEES)</label>
                <div style={styles.currencyInputRow}>
                  <span style={styles.currencySym}>₹</span>
                  <input
                    style={styles.cashInput}
                    type="number"
                    value={tarajuRupees}
                    onChange={(e) => handleTarajuRupeesChange(e.target.value)}
                  />
                </div>
                <div style={styles.quickGramsRow}>
                  {['10', '20', '50', '100', '200'].map((r) => (
                    <button
                      key={r}
                      type="button"
                      style={styles.gramPill}
                      onClick={() => handleTarajuRupeesChange(r)}
                    >
                      ₹{r}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={styles.tarajuResultCard}>
              <span>Calculated Quantity:</span>
              <strong>{(parseFloat(tarajuWeightGrams) / 1000).toFixed(3)} kg</strong>
              <span>Total Price:</span>
              <strong style={{ color: '#059669', fontSize: 18 }}>₹{tarajuRupees}</strong>
            </div>

            <button
              type="button"
              style={styles.finalizeBtn}
              onClick={handleAddTarajuToCart}
            >
              ➕ Add to Bill ({(parseFloat(tarajuWeightGrams) / 1000).toFixed(3)} kg = ₹{tarajuRupees})
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: 'calc(100vh - 84px)',
    gap: '12px',
  },
  topToolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: '10px 18px',
    borderRadius: '16px',
    border: '1px solid rgba(0, 0, 0, 0.06)',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
  },
  brandGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  posBadge: {
    backgroundColor: '#ECFDF5',
    color: '#065F46',
    border: '1px solid #A7F3D0',
    fontSize: '11px',
    fontWeight: 800,
    padding: '3px 10px',
    borderRadius: '999px',
    letterSpacing: '0.04em',
  },
  storeName: {
    fontSize: '18px',
    fontWeight: 800,
    color: '#0F172A',
    margin: 0,
    letterSpacing: '-0.02em',
  },
  counterBadge: {
    fontSize: '12px',
    color: '#64748B',
    backgroundColor: '#F1F5F9',
    padding: '3px 10px',
    borderRadius: '8px',
    fontWeight: 600,
  },
  shortcutsStrip: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  shortcutPill: {
    fontSize: '11px',
    color: '#475569',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    padding: '3px 8px',
    borderRadius: '6px',
  },
  historyLink: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#4F46E5',
    textDecoration: 'none',
    backgroundColor: '#EEF2FF',
    padding: '4px 10px',
    borderRadius: '8px',
  },
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: '1.45fr 1fr',
    gap: '14px',
    flex: 1,
    minHeight: 0,
  },

  // Left Catalog Panel
  catalogPanel: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
  },
  searchHeader: {
    padding: '14px 16px 10px',
    borderBottom: '1px solid #F1F5F9',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  barcodeForm: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#F8FAFC',
    border: '2px solid #4F46E5',
    borderRadius: '12px',
    padding: '4px 12px',
  },
  barcodeIcon: {
    fontSize: '18px',
  },
  barcodeInput: {
    flex: 1,
    border: 'none',
    backgroundColor: 'transparent',
    fontSize: '15px',
    fontWeight: 600,
    color: '#0F172A',
    outline: 'none',
  },
  scanSubmitBtn: {
    backgroundColor: '#4F46E5',
    color: '#FFFFFF',
    border: 'none',
    padding: '6px 14px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  searchRow: {
    display: 'flex',
    gap: '8px',
  },
  textSearchWrapper: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: '10px',
    padding: '6px 12px',
    gap: '8px',
  },
  searchIcon: {
    fontSize: '14px',
    color: '#94A3B8',
  },
  textSearchInput: {
    border: 'none',
    backgroundColor: 'transparent',
    fontSize: '13px',
    width: '100%',
    outline: 'none',
    color: '#0F172A',
  },
  tarajuQuickBtn: {
    backgroundColor: '#FEF3C7',
    border: '1px solid #F59E0B',
    color: '#B45309',
    fontWeight: 700,
    fontSize: '12px',
    padding: '6px 12px',
    borderRadius: '10px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },

  categoryTabs: {
    display: 'flex',
    overflowX: 'auto',
    padding: '8px 16px',
    gap: '6px',
    borderBottom: '1px solid #F1F5F9',
  },
  catTab: {
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    color: '#64748B',
    fontSize: '12px',
    fontWeight: 600,
    padding: '5px 12px',
    borderRadius: '20px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  catTabActive: {
    backgroundColor: '#0F172A',
    color: '#FFFFFF',
    borderColor: '#0F172A',
  },

  productsScrollArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '14px',
  },
  productGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: '10px',
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    border: '1.5px solid #E2E8F0',
    borderRadius: '14px',
    padding: '12px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    transition: 'all 0.15s ease',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)',
  },
  productCardOut: {
    opacity: 0.6,
    backgroundColor: '#F8FAFC',
  },
  cardTopRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
  },
  cardCategory: {
    fontSize: '10px',
    fontWeight: 700,
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  cardLoosePill: {
    fontSize: '10px',
    backgroundColor: '#FEF3C7',
    color: '#B45309',
    padding: '2px 6px',
    borderRadius: '4px',
    fontWeight: 700,
  },
  cardBarcode: {
    fontSize: '10px',
    color: '#94A3B8',
    fontFamily: 'monospace',
  },
  cardName: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#0F172A',
    margin: '0 0 2px 0',
    lineHeight: 1.3,
  },
  cardHindi: {
    fontSize: '11px',
    color: '#64748B',
    marginBottom: '8px',
  },
  cardBottomRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 'auto',
    paddingTop: '8px',
    borderTop: '1px dashed #F1F5F9',
  },
  priceContainer: {
    display: 'flex',
    alignItems: 'baseline',
  },
  priceSymbol: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#0F172A',
  },
  priceValue: {
    fontSize: '17px',
    fontWeight: 800,
    color: '#0F172A',
    letterSpacing: '-0.5px',
  },
  priceUnit: {
    fontSize: '11px',
    color: '#64748B',
    marginLeft: '2px',
  },
  stockPill: {
    fontSize: '10px',
    fontWeight: 700,
    padding: '2px 6px',
    borderRadius: '6px',
  },
  stockOk: {
    backgroundColor: '#ECFDF5',
    color: '#065F46',
  },
  stockLow: {
    backgroundColor: '#FFFBEB',
    color: '#B45309',
  },
  stockOut: {
    backgroundColor: '#FEF2F2',
    color: '#DC2626',
  },

  // Right Cart Panel
  cartPanel: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
  },
  customerBar: {
    padding: '12px 16px',
    borderBottom: '1px solid #F1F5F9',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  customerSelector: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  customerIcon: {
    fontSize: '18px',
  },
  customerInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  customerTitle: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#0F172A',
  },
  customerPhone: {
    fontSize: '11px',
    color: '#64748B',
  },
  customerActions: {},
  changeCustBtn: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #CBD5E1',
    color: '#334155',
    fontSize: '11px',
    fontWeight: 700,
    padding: '4px 10px',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  customerDropdownCard: {
    padding: '12px',
    backgroundColor: '#FFFFFF',
    borderBottom: '2px solid #4F46E5',
    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.08)',
  },
  custSearchInput: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #CBD5E1',
    borderRadius: '8px',
    fontSize: '13px',
    outline: 'none',
    boxSizing: 'border-box',
    marginBottom: '8px',
  },
  custList: {
    maxHeight: '160px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  custRow: {
    padding: '8px 10px',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '12px',
    border: '1px solid #F1F5F9',
  },
  custRowName: {
    fontWeight: 700,
    color: '#0F172A',
  },
  custRowPhone: {
    fontSize: '11px',
    color: '#64748B',
  },

  cartTableHeader: {
    display: 'flex',
    padding: '8px 16px',
    backgroundColor: '#F8FAFC',
    fontSize: '11px',
    fontWeight: 700,
    color: '#64748B',
    borderBottom: '1px solid #E2E8F0',
    letterSpacing: '0.04em',
  },
  cartItemsScroll: {
    flex: 1,
    overflowY: 'auto',
    padding: '8px 12px',
  },
  cartItemRow: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 6px',
    borderBottom: '1px solid #F1F5F9',
    gap: '6px',
    fontSize: '13px',
  },
  itemNameText: {
    fontWeight: 700,
    color: '#0F172A',
    fontSize: '13px',
  },
  itemHindiText: {
    fontSize: '11px',
    color: '#64748B',
  },
  itemTaxMeta: {
    fontSize: '10px',
    color: '#94A3B8',
  },
  qtyBtn: {
    width: '24px',
    height: '24px',
    borderRadius: '6px',
    border: '1px solid #CBD5E1',
    backgroundColor: '#F8FAFC',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyInput: {
    width: '38px',
    textAlign: 'center',
    border: '1px solid #E2E8F0',
    borderRadius: '6px',
    padding: '2px 0',
    fontSize: '13px',
    fontWeight: 700,
  },
  delItemBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#94A3B8',
    cursor: 'pointer',
    fontSize: '14px',
    padding: '2px',
  },
  emptyCartBox: {
    padding: '48px 24px',
    textAlign: 'center',
    color: '#94A3B8',
  },
  emptyCartIcon: {
    fontSize: '44px',
    marginBottom: '8px',
  },
  emptyCartHeading: {
    fontSize: '16px',
    fontWeight: 700,
    color: '#334155',
    margin: '0 0 6px',
  },
  emptyCartSub: {
    fontSize: '12px',
    maxWidth: '280px',
    margin: '0 auto',
    lineHeight: 1.5,
  },

  cartSummary: {
    backgroundColor: '#F8FAFC',
    borderTop: '1px solid #E2E8F0',
    padding: '14px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    color: '#64748B',
    fontWeight: 600,
  },
  discountInput: {
    width: '60px',
    textAlign: 'right',
    padding: '2px 6px',
    borderRadius: '4px',
    border: '1px solid #CBD5E1',
    fontSize: '12px',
    fontWeight: 700,
  },
  grandTotalHero: {
    backgroundColor: '#0F172A',
    color: '#FFFFFF',
    borderRadius: '14px',
    padding: '12px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '6px',
  },
  grandTotalLabel: {
    fontSize: '11px',
    fontWeight: 800,
    letterSpacing: '0.05em',
    color: '#94A3B8',
  },
  grandTotalHindi: {
    fontSize: '12px',
    color: '#CBD5E1',
  },
  grandTotalAmount: {
    fontSize: '28px',
    fontWeight: 900,
    color: '#10B981',
    letterSpacing: '-1px',
  },
  cartActionButtons: {
    display: 'flex',
    gap: '10px',
    marginTop: '8px',
  },
  clearCartBtn: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #CBD5E1',
    color: '#64748B',
    fontWeight: 700,
    fontSize: '13px',
    padding: '12px 16px',
    borderRadius: '12px',
    cursor: 'pointer',
  },
  checkoutBtn: {
    flex: 1,
    backgroundColor: '#10B981',
    color: '#FFFFFF',
    border: 'none',
    fontWeight: 800,
    fontSize: '15px',
    padding: '12px 20px',
    borderRadius: '12px',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
  },

  // Modals
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    backdropFilter: 'blur(6px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '16px',
  },
  checkoutModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '24px',
    width: '100%',
    maxWidth: '520px',
    padding: '26px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  },
  receiptModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '24px',
    width: '100%',
    maxWidth: '440px',
    padding: '24px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  },
  tarajuModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '24px',
    width: '100%',
    maxWidth: '480px',
    padding: '24px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px',
  },
  modalSub: {
    fontSize: '10px',
    fontWeight: 800,
    color: '#4F46E5',
    letterSpacing: '0.05em',
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: 800,
    color: '#0F172A',
    margin: '2px 0 0',
  },
  closeBtn: {
    backgroundColor: '#F1F5F9',
    border: 'none',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    color: '#64748B',
  },

  checkoutAmountBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: '16px',
    padding: '16px',
    textAlign: 'center',
    border: '1.5px solid #E2E8F0',
    marginBottom: '16px',
  },
  checkoutAmountLabel: {
    fontSize: '11px',
    fontWeight: 800,
    color: '#64748B',
    letterSpacing: '0.04em',
  },
  checkoutAmountBig: {
    fontSize: '34px',
    fontWeight: 900,
    color: '#0F172A',
    margin: '4px 0',
  },
  checkoutCustomerName: {
    fontSize: '12px',
    color: '#4F46E5',
    fontWeight: 700,
  },

  paymentModeTabs: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px',
    marginBottom: '16px',
  },
  payTab: {
    backgroundColor: '#F1F5F9',
    border: '1.5px solid transparent',
    padding: '10px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 700,
    color: '#475569',
    cursor: 'pointer',
    textAlign: 'center',
  },
  payTabActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
    color: '#065F46',
  },

  payBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginBottom: '18px',
  },
  payBodyUPI: {
    textAlign: 'center',
    marginBottom: '18px',
  },
  inputLabel: {
    fontSize: '11px',
    fontWeight: 800,
    color: '#475569',
  },
  currencyInputRow: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    border: '2px solid #CBD5E1',
    borderRadius: '12px',
    padding: '6px 14px',
  },
  currencySym: {
    fontSize: '20px',
    fontWeight: 800,
    color: '#0F172A',
    marginRight: '6px',
  },
  cashInput: {
    border: 'none',
    backgroundColor: 'transparent',
    fontSize: '22px',
    fontWeight: 800,
    color: '#0F172A',
    width: '100%',
    outline: 'none',
  },
  quickCashButtons: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
  },
  qcBtn: {
    backgroundColor: '#F1F5F9',
    border: '1px solid #CBD5E1',
    color: '#334155',
    fontWeight: 700,
    fontSize: '12px',
    padding: '6px 10px',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  changeDueBox: {
    backgroundColor: '#EFF6FF',
    border: '1px solid #BFDBFE',
    borderRadius: '12px',
    padding: '12px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  changeDueLabel: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#1E40AF',
  },
  changeDueValue: {
    fontSize: '20px',
    fontWeight: 900,
    color: '#1D4ED8',
  },
  upiQrBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '12px',
    backgroundColor: '#F8FAFC',
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
  },
  qrImage: {
    width: '180px',
    height: '180px',
    borderRadius: '12px',
    backgroundColor: '#FFFFFF',
    padding: '6px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
  },
  upiInstructions: {
    marginTop: '10px',
  },
  upiStoreText: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#475569',
  },
  upiAmountBadge: {
    fontSize: '18px',
    fontWeight: 900,
    color: '#059669',
    margin: '2px 0',
  },
  upiVpaText: {
    fontSize: '11px',
    color: '#94A3B8',
    fontFamily: 'monospace',
  },
  khataWarningBox: {
    display: 'flex',
    gap: '12px',
    backgroundColor: '#FEF2F2',
    border: '1px solid #FECACA',
    borderRadius: '14px',
    padding: '14px',
  },
  khataWarningIcon: {
    fontSize: '24px',
  },
  khataHeading: {
    margin: '0 0 4px',
    fontSize: '14px',
    fontWeight: 700,
    color: '#991B1B',
  },
  khataText: {
    margin: 0,
    fontSize: '12px',
    color: '#B91C1C',
    lineHeight: 1.4,
  },

  finalizeBtn: {
    width: '100%',
    backgroundColor: '#10B981',
    color: '#FFFFFF',
    border: 'none',
    padding: '14px',
    borderRadius: '14px',
    fontWeight: 800,
    fontSize: '16px',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
  },

  // Thermal Receipt
  thermalReceipt: {
    backgroundColor: '#FFFDF9',
    border: '1px solid #E5E7EB',
    borderRadius: '12px',
    padding: '14px',
    fontFamily: 'monospace',
    fontSize: '11px',
    color: '#1F2937',
    maxHeight: '360px',
    overflowY: 'auto',
  },
  receiptStore: {
    textAlign: 'center',
    fontWeight: 900,
    fontSize: '15px',
  },
  receiptSub: {
    textAlign: 'center',
    fontSize: '10px',
    color: '#6B7280',
    marginTop: '2px',
  },
  receiptDivider: {
    textAlign: 'center',
    color: '#9CA3AF',
    margin: '4px 0',
  },
  receiptMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '10px',
  },
  receiptCust: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#374151',
  },
  receiptItemsList: {
    margin: '6px 0',
  },
  receiptItemRow: {
    display: 'flex',
    justifyContent: 'space-between',
    margin: '3px 0',
  },
  receiptTotalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '11px',
  },
  receiptGrandRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontWeight: 900,
    fontSize: '14px',
    color: '#059669',
    margin: '4px 0',
  },
  receiptFooter: {
    textAlign: 'center',
    marginTop: '8px',
    fontWeight: 700,
    color: '#4B5563',
  },
  receiptActions: {
    display: 'flex',
    gap: '10px',
    marginTop: '16px',
  },
  printThermalBtn: {
    flex: 1,
    backgroundColor: '#0F172A',
    color: '#FFFFFF',
    border: 'none',
    padding: '12px',
    borderRadius: '12px',
    fontWeight: 700,
    fontSize: '13px',
    cursor: 'pointer',
  },
  nextBillBtn: {
    flex: 1,
    backgroundColor: '#10B981',
    color: '#FFFFFF',
    border: 'none',
    padding: '12px',
    borderRadius: '12px',
    fontWeight: 800,
    fontSize: '13px',
    cursor: 'pointer',
  },

  // Taraju Modal
  tarajuProductStrip: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: '12px',
    borderRadius: '12px',
    marginBottom: '16px',
    border: '1px solid #E2E8F0',
  },
  tarajuProdName: {
    margin: 0,
    fontSize: '14px',
    fontWeight: 700,
    color: '#0F172A',
  },
  tarajuProdHindi: {
    fontSize: '12px',
    color: '#64748B',
  },
  tarajuRateBadge: {
    backgroundColor: '#ECFDF5',
    color: '#065F46',
    fontWeight: 800,
    fontSize: '12px',
    padding: '4px 8px',
    borderRadius: '6px',
  },
  tarajuDualInputs: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginBottom: '16px',
  },
  tarajuInputCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  tarajuUnitLabel: {
    fontSize: '16px',
    fontWeight: 700,
    color: '#64748B',
  },
  quickGramsRow: {
    display: 'flex',
    gap: '4px',
    flexWrap: 'wrap',
  },
  gramPill: {
    backgroundColor: '#F1F5F9',
    border: '1px solid #CBD5E1',
    color: '#475569',
    fontSize: '10px',
    fontWeight: 700,
    padding: '3px 6px',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  tarajuResultCard: {
    backgroundColor: '#EFF6FF',
    border: '1px solid #BFDBFE',
    borderRadius: '12px',
    padding: '12px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    fontSize: '13px',
  },

  // Catalog Recovery Empty State
  emptyCatalogCard: {
    textAlign: 'center',
    padding: '40px 20px',
    color: '#64748B',
  },
  emptyIcon: {
    fontSize: '44px',
    marginBottom: '10px',
  },
  catalogRecoveryButtons: {
    display: 'flex',
    justifyContent: 'center',
    gap: '10px',
    marginTop: '16px',
    flexWrap: 'wrap',
  },
  recoverBtn: {
    backgroundColor: '#4F46E5',
    color: '#FFFFFF',
    border: 'none',
    padding: '10px 16px',
    borderRadius: '10px',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  seedBtn: {
    backgroundColor: '#ECFDF5',
    color: '#065F46',
    border: '1px solid #10B981',
    padding: '10px 16px',
    borderRadius: '10px',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  centerLoading: {
    textAlign: 'center',
    padding: '60px',
    color: '#64748B',
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid rgba(0, 0, 0, 0.1)',
    borderTopColor: '#4F46E5',
    borderRadius: '50%',
    margin: '0 auto 10px',
    animation: 'spin 0.8s linear infinite',
  },
};
