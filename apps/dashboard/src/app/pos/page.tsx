'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  subscribeStoreProducts,
  subscribeStoreCustomers,
  recordStoreSale,
  autoDiscoverAndMigrateProducts,
  seedStarterProducts,
} from '../../lib/storeService';
import { Product, CustomerKhata, Invoice, InvoiceItem, PaymentMode, PRODUCT_CATEGORIES } from '@kirana-pro/shared';
import {
  Barcode,
  Search,
  Scale,
  Package,
  RefreshCw,
  Sparkles,
  User,
  Users,
  X,
  ShoppingCart,
  Minus,
  Plus,
  Trash2,
  Zap,
  Banknote,
  QrCode,
  BookOpen,
  AlertCircle,
  Check,
  CheckCircle2,
  Printer,
  Receipt,
  ArrowRight,
} from 'lucide-react';

export default function PosBillingPage() {
  const { store, profile, storeId, activeStaff, activeShift } = useAuth();
  const toast = useToast();

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
      toast.error('Product Not Found', `No item matches "${code}". Add it from catalog or search by name.`);
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
      toast.error('Invalid Weight', 'Please place the item on scale or enter a valid weight in kg.');
      return;
    }
    addItemToCart(selectedLooseProduct, kg);
    toast.success('Added to Bill', `${selectedLooseProduct.name} (${kg} kg) added to cart.`);
    setShowTarajuModal(false);
  };

  // 10. Open Checkout Modal
  const handleOpenCheckout = () => {
    if (cartItems.length === 0) {
      toast.error('Cart is Empty', 'Please add products to the bill before proceeding to checkout.');
      return;
    }
    setCashTendered(grandTotal.toString());
    setShowCheckoutModal(true);
  };

  // 11. Complete Sale Execution
  const handleExecuteCheckout = async () => {
    if (!storeId) {
      toast.error('Store Not Found', 'Active store session missing. Please log in.');
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

      toast.success(
        'Bill Generated Successfully',
        `Invoice #${invoice.invoiceNumber} recorded for ₹${invoice.grandTotal.toFixed(2)}.`
      );

      // Reset cart for next customer
      setCartItems([]);
      setBillDiscount('0');
      setSelectedCustomer({ name: 'Walk-in Customer (नकद)' });
    } catch (err: any) {
      console.error('Checkout error:', err);
      toast.error('Sale Failed', err.message || 'Could not complete transaction.');
    } finally {
      setProcessingSale(false);
    }
  };

  // UPI QR Code URI Generator
  const storeVpa = store?.gstNumber ? `${store.id}@upi` : '9876543210@paytm';
  const upiIntentUri = `upi://pay?pa=${encodeURIComponent(storeVpa)}&pn=${encodeURIComponent(store?.name || 'Kirana Store')}&am=${grandTotal.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Bill Payment`)}`;
  const upiQrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiIntentUri)}`;

  return (
    <div className="pos-container" style={styles.container}>
      {/* Top POS Header Toolbar */}
      <div style={styles.topToolbar}>
        <div style={styles.brandGroup}>
          <span style={styles.posBadge}>
            <Zap size={13} style={{ marginRight: 4 }} /> POS QUICK BILLING
          </span>
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
            <Receipt size={14} style={{ marginRight: 6 }} /> Sales History
          </Link>
        </div>
      </div>

      {/* Main POS Split Layout */}
      <div className="pos-main-grid" style={styles.mainGrid}>
        {/* ============================================================== */}
        {/* LEFT PANEL: PRODUCT CATALOG & BARCODE SCANNER */}
        {/* ============================================================== */}
        <div style={styles.catalogPanel}>
          {/* Barcode & Search Bar */}
          <div style={styles.searchHeader}>
            <form onSubmit={handleBarcodeSubmit} style={styles.barcodeForm}>
              <Barcode size={18} color="#7367F0" />
              <input
                ref={barcodeInputRef}
                style={styles.barcodeInput}
                type="text"
                placeholder="Scan Barcode (F2) or Press Enter to Add..."
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
              />
              <button type="submit" style={styles.scanSubmitBtn}>
                Add <ArrowRight size={14} style={{ marginLeft: 4 }} />
              </button>
            </form>

            <div style={styles.searchRow}>
              <div style={styles.textSearchWrapper}>
                <Search size={16} color="#6F6B7D" />
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
                <Scale size={14} style={{ marginRight: 6 }} /> Loose / तराजू
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
                <div style={styles.emptyIcon}>
                  <Package size={44} color="#A8AAAE" />
                </div>
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
                    <RefreshCw size={14} style={{ marginRight: 6 }} /> Discover Existing Products
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
                    <Sparkles size={14} style={{ marginRight: 6 }} /> Load 12 Indian Kirana Staples
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
                        {p.isLoose && (
                          <span style={styles.cardLoosePill}>
                            <Scale size={11} style={{ marginRight: 3 }} /> Loose
                          </span>
                        )}
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
              <div style={styles.customerIconWrapper}>
                <User size={16} color="#7367F0" />
              </div>
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
                {showCustomerDropdown ? (
                  <>
                    <X size={14} style={{ marginRight: 4 }} /> Close
                  </>
                ) : (
                  <>
                    <Users size={14} style={{ marginRight: 6 }} /> Select Customer
                  </>
                )}
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
                          color: (c.currentBalance || 0) > 0 ? '#EA5455' : '#28C76F',
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
                <div style={styles.emptyCartIcon}>
                  <ShoppingCart size={40} color="#A8AAAE" />
                </div>
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
                      <Minus size={11} strokeWidth={2.5} />
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
                      <Plus size={11} strokeWidth={2.5} />
                    </button>
                  </div>

                  {/* Line Total */}
                  <div style={{ flex: 1.5, textAlign: 'right', fontWeight: 700, color: '#2F2B3D' }}>
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
                      <Trash2 size={15} color="#EA5455" />
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
                <Trash2 size={14} style={{ marginRight: 4 }} /> Clear
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
                <Zap size={16} style={{ marginRight: 6 }} /> PAY & BILL (F4)
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
                <X size={16} />
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
                <Banknote size={15} style={{ marginRight: 6 }} /> Cash (नकद)
              </button>
              <button
                type="button"
                style={{
                  ...styles.payTab,
                  ...(paymentMode === 'upi' ? styles.payTabActive : {}),
                }}
                onClick={() => setPaymentMode('upi')}
              >
                <QrCode size={15} style={{ marginRight: 6 }} /> UPI QR
              </button>
              <button
                type="button"
                style={{
                  ...styles.payTab,
                  ...(paymentMode === 'credit' ? styles.payTabActive : {}),
                }}
                onClick={() => setPaymentMode('credit')}
              >
                <BookOpen size={15} style={{ marginRight: 6 }} /> Khata Udhar
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
                  <AlertCircle size={22} color="#EA5455" style={{ flexShrink: 0 }} />
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
              {processingSale ? 'Processing Sale...' : (
                <>
                  <Check size={18} style={{ marginRight: 6 }} /> Complete Sale & Print Bill (₹{grandTotal})
                </>
              )}
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
                <span style={styles.modalSub}>
                  <CheckCircle2 size={13} style={{ marginRight: 4 }} /> SALE COMPLETED
                </span>
                <h3 style={styles.modalTitle}>Invoice #{completedInvoice.invoiceNumber}</h3>
              </div>
              <button style={styles.closeBtn} onClick={() => setShowReceiptModal(false)}>
                <X size={16} />
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
                <Printer size={16} style={{ marginRight: 6 }} /> Print 58mm Thermal Receipt
              </button>
              <button
                type="button"
                style={styles.nextBillBtn}
                onClick={() => {
                  setShowReceiptModal(false);
                  barcodeInputRef.current?.focus();
                }}
              >
                <Plus size={16} style={{ marginRight: 6 }} /> New Bill (F2)
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
                <h3 style={styles.modalTitle}>
                  <Scale size={20} color="#7367F0" style={{ marginRight: 6, verticalAlign: 'middle' }} />
                  Taraju Loose Item Calculator
                </h3>
              </div>
              <button style={styles.closeBtn} onClick={() => setShowTarajuModal(false)}>
                <X size={16} />
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
              <strong style={{ color: '#28C76F', fontSize: 18 }}>₹{tarajuRupees}</strong>
            </div>

            <button
              type="button"
              style={styles.finalizeBtn}
              onClick={handleAddTarajuToCart}
            >
              <Plus size={16} style={{ marginRight: 6 }} /> Add to Bill ({(parseFloat(tarajuWeightGrams) / 1000).toFixed(3)} kg = ₹{tarajuRupees})
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
    fontFamily: 'var(--font-body)',
  },
  topToolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: '10px 18px',
    borderRadius: '16px',
    border: '1px solid #DBDADE',
    boxShadow: '0 2px 6px rgba(47, 43, 61, 0.06)',
    flexWrap: 'wrap',
    gap: '10px',
  },
  brandGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  posBadge: {
    backgroundColor: '#EDEBFD',
    color: '#7367F0',
    border: '1px solid rgba(115, 103, 240, 0.3)',
    fontSize: '11px',
    fontWeight: 800,
    padding: '3px 10px',
    borderRadius: '999px',
    letterSpacing: '0.04em',
    display: 'inline-flex',
    alignItems: 'center',
  },
  storeName: {
    fontSize: '18px',
    fontWeight: 800,
    color: '#2F2B3D',
    margin: 0,
    letterSpacing: '-0.02em',
  },
  counterBadge: {
    fontSize: '12px',
    color: '#6F6B7D',
    backgroundColor: '#F8F7FA',
    border: '1px solid #DBDADE',
    padding: '3px 10px',
    borderRadius: '8px',
    fontWeight: 600,
  },
  shortcutsStrip: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
  },
  shortcutPill: {
    fontSize: '11px',
    color: '#6F6B7D',
    backgroundColor: '#F8F7FA',
    border: '1px solid #DBDADE',
    padding: '4px 8px',
    borderRadius: '6px',
  },
  historyLink: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#7367F0',
    textDecoration: 'none',
    backgroundColor: '#EDEBFD',
    padding: '5px 12px',
    borderRadius: '8px',
    display: 'inline-flex',
    alignItems: 'center',
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
    border: '1px solid #DBDADE',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 2px 6px rgba(47, 43, 61, 0.06)',
  },
  searchHeader: {
    padding: '14px 16px 10px',
    borderBottom: '1px solid #DBDADE',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  barcodeForm: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#F8F7FA',
    border: '2px solid #7367F0',
    borderRadius: '12px',
    padding: '4px 12px',
  },
  barcodeInput: {
    flex: 1,
    border: 'none',
    backgroundColor: 'transparent',
    fontSize: '14px',
    fontWeight: 600,
    color: '#2F2B3D',
    outline: 'none',
  },
  scanSubmitBtn: {
    backgroundColor: '#7367F0',
    color: '#FFFFFF',
    border: 'none',
    padding: '6px 14px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    boxShadow: '0 2px 8px rgba(115, 103, 240, 0.3)',
  },
  searchRow: {
    display: 'flex',
    gap: '8px',
  },
  textSearchWrapper: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#F8F7FA',
    border: '1px solid #DBDADE',
    borderRadius: '10px',
    padding: '6px 12px',
    gap: '8px',
  },
  textSearchInput: {
    border: 'none',
    backgroundColor: 'transparent',
    fontSize: '13px',
    width: '100%',
    outline: 'none',
    color: '#2F2B3D',
  },
  tarajuQuickBtn: {
    backgroundColor: '#EDEBFD',
    border: '1px solid #7367F0',
    color: '#7367F0',
    fontWeight: 700,
    fontSize: '12px',
    padding: '6px 12px',
    borderRadius: '10px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    display: 'inline-flex',
    alignItems: 'center',
  },

  categoryTabs: {
    display: 'flex',
    overflowX: 'auto',
    padding: '8px 16px',
    gap: '6px',
    borderBottom: '1px solid #DBDADE',
  },
  catTab: {
    backgroundColor: '#F8F7FA',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#DBDADE',
    color: '#6F6B7D',
    fontSize: '12px',
    fontWeight: 600,
    padding: '5px 12px',
    borderRadius: '20px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  catTabActive: {
    backgroundColor: '#7367F0',
    color: '#FFFFFF',
    borderColor: '#7367F0',
    boxShadow: '0 2px 8px rgba(115, 103, 240, 0.25)',
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
    border: '1px solid #DBDADE',
    borderRadius: '14px',
    padding: '12px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    transition: 'all 0.15s ease',
    boxShadow: '0 2px 4px rgba(47, 43, 61, 0.04)',
  },
  productCardOut: {
    opacity: 0.6,
    backgroundColor: '#F8F7FA',
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
    color: '#A8AAAE',
    textTransform: 'uppercase',
  },
  cardLoosePill: {
    fontSize: '10px',
    backgroundColor: '#EDEBFD',
    color: '#7367F0',
    padding: '2px 6px',
    borderRadius: '4px',
    fontWeight: 700,
    display: 'inline-flex',
    alignItems: 'center',
  },
  cardBarcode: {
    fontSize: '10px',
    color: '#A8AAAE',
    fontFamily: 'monospace',
  },
  cardName: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#2F2B3D',
    margin: '0 0 2px 0',
    lineHeight: 1.3,
  },
  cardHindi: {
    fontSize: '11px',
    color: '#6F6B7D',
    marginBottom: '8px',
  },
  cardBottomRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 'auto',
    paddingTop: '8px',
    borderTop: '1px dashed #DBDADE',
  },
  priceContainer: {
    display: 'flex',
    alignItems: 'baseline',
  },
  priceSymbol: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#2F2B3D',
  },
  priceValue: {
    fontSize: '17px',
    fontWeight: 800,
    color: '#2F2B3D',
    letterSpacing: '-0.5px',
  },
  priceUnit: {
    fontSize: '11px',
    color: '#6F6B7D',
    marginLeft: '2px',
  },
  stockPill: {
    fontSize: '10px',
    fontWeight: 700,
    padding: '2px 6px',
    borderRadius: '6px',
  },
  stockOk: {
    backgroundColor: '#DDF6E8',
    color: '#28C76F',
  },
  stockLow: {
    backgroundColor: '#FFF1E3',
    color: '#FF9F43',
  },
  stockOut: {
    backgroundColor: '#FCE4E4',
    color: '#EA5455',
  },

  // Right Cart Panel
  cartPanel: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    border: '1px solid #DBDADE',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 2px 6px rgba(47, 43, 61, 0.06)',
  },
  customerBar: {
    padding: '12px 16px',
    borderBottom: '1px solid #DBDADE',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F7FA',
  },
  customerSelector: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  customerIconWrapper: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    backgroundColor: '#EDEBFD',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  customerInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  customerTitle: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#2F2B3D',
  },
  customerPhone: {
    fontSize: '11px',
    color: '#6F6B7D',
  },
  customerActions: {},
  changeCustBtn: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #DBDADE',
    color: '#2F2B3D',
    fontSize: '11px',
    fontWeight: 700,
    padding: '5px 10px',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
  },
  customerDropdownCard: {
    padding: '12px',
    backgroundColor: '#FFFFFF',
    borderBottom: '2px solid #7367F0',
    boxShadow: '0 8px 16px rgba(47, 43, 61, 0.08)',
  },
  custSearchInput: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #DBDADE',
    borderRadius: '8px',
    fontSize: '13px',
    outline: 'none',
    boxSizing: 'border-box',
    marginBottom: '8px',
    backgroundColor: '#F8F7FA',
    color: '#2F2B3D',
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
    border: '1px solid #DBDADE',
    backgroundColor: '#FFFFFF',
  },
  custRowName: {
    fontWeight: 700,
    color: '#2F2B3D',
  },
  custRowPhone: {
    fontSize: '11px',
    color: '#6F6B7D',
  },

  cartTableHeader: {
    display: 'flex',
    padding: '8px 16px',
    backgroundColor: '#F8F7FA',
    fontSize: '11px',
    fontWeight: 700,
    color: '#6F6B7D',
    borderBottom: '1px solid #DBDADE',
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
    borderBottom: '1px solid #DBDADE',
    gap: '6px',
    fontSize: '13px',
  },
  itemNameText: {
    fontWeight: 700,
    color: '#2F2B3D',
    fontSize: '13px',
  },
  itemHindiText: {
    fontSize: '11px',
    color: '#6F6B7D',
  },
  itemTaxMeta: {
    fontSize: '10px',
    color: '#A8AAAE',
  },
  qtyBtn: {
    width: '24px',
    height: '24px',
    borderRadius: '6px',
    border: '1px solid #DBDADE',
    backgroundColor: '#F8F7FA',
    color: '#2F2B3D',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyInput: {
    width: '38px',
    textAlign: 'center',
    border: '1px solid #DBDADE',
    borderRadius: '6px',
    padding: '2px 0',
    fontSize: '13px',
    fontWeight: 700,
    color: '#2F2B3D',
    backgroundColor: '#FFFFFF',
  },
  delItemBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '2px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCartBox: {
    padding: '48px 24px',
    textAlign: 'center',
    color: '#A8AAAE',
  },
  emptyCartIcon: {
    marginBottom: '8px',
    display: 'flex',
    justifyContent: 'center',
  },
  emptyCartHeading: {
    fontSize: '16px',
    fontWeight: 700,
    color: '#2F2B3D',
    margin: '0 0 6px',
  },
  emptyCartSub: {
    fontSize: '12px',
    maxWidth: '280px',
    margin: '0 auto',
    lineHeight: 1.5,
    color: '#6F6B7D',
  },

  cartSummary: {
    backgroundColor: '#F8F7FA',
    borderTop: '1px solid #DBDADE',
    padding: '14px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    color: '#6F6B7D',
    fontWeight: 600,
  },
  discountInput: {
    width: '60px',
    textAlign: 'right',
    padding: '2px 6px',
    borderRadius: '4px',
    border: '1px solid #DBDADE',
    fontSize: '12px',
    fontWeight: 700,
    color: '#2F2B3D',
    backgroundColor: '#FFFFFF',
  },
  grandTotalHero: {
    backgroundColor: '#2F2B3D',
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
    color: '#A8AAAE',
  },
  grandTotalHindi: {
    fontSize: '12px',
    color: '#DBDADE',
  },
  grandTotalAmount: {
    fontSize: '28px',
    fontWeight: 900,
    color: '#28C76F',
    letterSpacing: '-1px',
  },
  cartActionButtons: {
    display: 'flex',
    gap: '10px',
    marginTop: '8px',
  },
  clearCartBtn: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #DBDADE',
    color: '#6F6B7D',
    fontWeight: 700,
    fontSize: '13px',
    padding: '12px 16px',
    borderRadius: '12px',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
  },
  checkoutBtn: {
    flex: 1,
    backgroundColor: '#7367F0',
    color: '#FFFFFF',
    border: 'none',
    fontWeight: 800,
    fontSize: '15px',
    padding: '12px 20px',
    borderRadius: '12px',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(115, 103, 240, 0.38)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Modals
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(47, 43, 61, 0.55)',
    backdropFilter: 'blur(6px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '16px',
  },
  checkoutModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '20px',
    width: '100%',
    maxWidth: '520px',
    padding: '24px',
    boxShadow: '0 16px 36px rgba(47, 43, 61, 0.16)',
    border: '1px solid #DBDADE',
  },
  receiptModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '20px',
    width: '100%',
    maxWidth: '440px',
    padding: '24px',
    boxShadow: '0 16px 36px rgba(47, 43, 61, 0.16)',
    border: '1px solid #DBDADE',
  },
  tarajuModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '20px',
    width: '100%',
    maxWidth: '480px',
    padding: '24px',
    boxShadow: '0 16px 36px rgba(47, 43, 61, 0.16)',
    border: '1px solid #DBDADE',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px',
  },
  modalSub: {
    fontSize: '11px',
    fontWeight: 800,
    color: '#7367F0',
    letterSpacing: '0.05em',
    display: 'inline-flex',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: 800,
    color: '#2F2B3D',
    margin: '2px 0 0',
  },
  closeBtn: {
    backgroundColor: '#F8F7FA',
    border: '1px solid #DBDADE',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    cursor: 'pointer',
    color: '#6F6B7D',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  checkoutAmountBox: {
    backgroundColor: '#F8F7FA',
    borderRadius: '16px',
    padding: '16px',
    textAlign: 'center',
    border: '1px solid #DBDADE',
    marginBottom: '16px',
  },
  checkoutAmountLabel: {
    fontSize: '11px',
    fontWeight: 800,
    color: '#6F6B7D',
    letterSpacing: '0.04em',
  },
  checkoutAmountBig: {
    fontSize: '34px',
    fontWeight: 900,
    color: '#2F2B3D',
    margin: '4px 0',
  },
  checkoutCustomerName: {
    fontSize: '12px',
    color: '#7367F0',
    fontWeight: 700,
  },

  paymentModeTabs: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px',
    marginBottom: '16px',
  },
  payTab: {
    backgroundColor: '#F8F7FA',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#DBDADE',
    padding: '10px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 700,
    color: '#6F6B7D',
    cursor: 'pointer',
    textAlign: 'center',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  payTabActive: {
    backgroundColor: '#EDEBFD',
    borderColor: '#7367F0',
    color: '#7367F0',
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
    color: '#6F6B7D',
  },
  currencyInputRow: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#F8F7FA',
    border: '1px solid #DBDADE',
    borderRadius: '12px',
    padding: '6px 14px',
  },
  currencySym: {
    fontSize: '20px',
    fontWeight: 800,
    color: '#2F2B3D',
    marginRight: '6px',
  },
  cashInput: {
    border: 'none',
    backgroundColor: 'transparent',
    fontSize: '22px',
    fontWeight: 800,
    color: '#2F2B3D',
    width: '100%',
    outline: 'none',
  },
  quickCashButtons: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
  },
  qcBtn: {
    backgroundColor: '#F8F7FA',
    border: '1px solid #DBDADE',
    color: '#2F2B3D',
    fontWeight: 700,
    fontSize: '12px',
    padding: '6px 10px',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  changeDueBox: {
    backgroundColor: '#EDEBFD',
    border: '1px solid rgba(115, 103, 240, 0.3)',
    borderRadius: '12px',
    padding: '12px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  changeDueLabel: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#7367F0',
  },
  changeDueValue: {
    fontSize: '20px',
    fontWeight: 900,
    color: '#5E50EE',
  },
  upiQrBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '12px',
    backgroundColor: '#F8F7FA',
    borderRadius: '16px',
    border: '1px solid #DBDADE',
  },
  qrImage: {
    width: '180px',
    height: '180px',
    borderRadius: '12px',
    backgroundColor: '#FFFFFF',
    padding: '6px',
    boxShadow: '0 4px 12px rgba(47, 43, 61, 0.05)',
  },
  upiInstructions: {
    marginTop: '10px',
  },
  upiStoreText: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#6F6B7D',
  },
  upiAmountBadge: {
    fontSize: '18px',
    fontWeight: 900,
    color: '#28C76F',
    margin: '2px 0',
  },
  upiVpaText: {
    fontSize: '11px',
    color: '#A8AAAE',
    fontFamily: 'monospace',
  },
  khataWarningBox: {
    display: 'flex',
    gap: '12px',
    backgroundColor: '#FCE4E4',
    border: '1px solid rgba(234, 84, 85, 0.25)',
    borderRadius: '14px',
    padding: '14px',
  },
  khataHeading: {
    margin: '0 0 4px',
    fontSize: '14px',
    fontWeight: 700,
    color: '#EA5455',
  },
  khataText: {
    margin: 0,
    fontSize: '12px',
    color: '#EA5455',
    lineHeight: 1.4,
  },

  finalizeBtn: {
    width: '100%',
    backgroundColor: '#7367F0',
    color: '#FFFFFF',
    border: 'none',
    padding: '14px',
    borderRadius: '14px',
    fontWeight: 800,
    fontSize: '16px',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(115, 103, 240, 0.38)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Thermal Receipt
  thermalReceipt: {
    backgroundColor: '#FFFDF9',
    border: '1px solid #DBDADE',
    borderRadius: '12px',
    padding: '14px',
    fontFamily: 'monospace',
    fontSize: '11px',
    color: '#2F2B3D',
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
    color: '#6F6B7D',
    marginTop: '2px',
  },
  receiptDivider: {
    textAlign: 'center',
    color: '#DBDADE',
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
    color: '#2F2B3D',
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
    color: '#28C76F',
    margin: '4px 0',
  },
  receiptFooter: {
    textAlign: 'center',
    marginTop: '8px',
    fontWeight: 700,
    color: '#6F6B7D',
  },
  receiptActions: {
    display: 'flex',
    gap: '10px',
    marginTop: '16px',
  },
  printThermalBtn: {
    flex: 1,
    backgroundColor: '#2F2B3D',
    color: '#FFFFFF',
    border: 'none',
    padding: '12px',
    borderRadius: '12px',
    fontWeight: 700,
    fontSize: '13px',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBillBtn: {
    flex: 1,
    backgroundColor: '#7367F0',
    color: '#FFFFFF',
    border: 'none',
    padding: '12px',
    borderRadius: '12px',
    fontWeight: 800,
    fontSize: '13px',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(115, 103, 240, 0.38)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Taraju Modal
  tarajuProductStrip: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F7FA',
    padding: '12px',
    borderRadius: '12px',
    marginBottom: '16px',
    border: '1px solid #DBDADE',
  },
  tarajuProdName: {
    margin: 0,
    fontSize: '14px',
    fontWeight: 700,
    color: '#2F2B3D',
  },
  tarajuProdHindi: {
    fontSize: '12px',
    color: '#6F6B7D',
  },
  tarajuRateBadge: {
    backgroundColor: '#EDEBFD',
    color: '#7367F0',
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
    color: '#6F6B7D',
  },
  quickGramsRow: {
    display: 'flex',
    gap: '4px',
    flexWrap: 'wrap',
  },
  gramPill: {
    backgroundColor: '#F8F7FA',
    border: '1px solid #DBDADE',
    color: '#2F2B3D',
    fontSize: '10px',
    fontWeight: 700,
    padding: '3px 6px',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  tarajuResultCard: {
    backgroundColor: '#EDEBFD',
    border: '1px solid rgba(115, 103, 240, 0.3)',
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
    color: '#6F6B7D',
  },
  emptyIcon: {
    marginBottom: '10px',
    display: 'flex',
    justifyContent: 'center',
  },
  catalogRecoveryButtons: {
    display: 'flex',
    justifyContent: 'center',
    gap: '10px',
    marginTop: '16px',
    flexWrap: 'wrap',
  },
  recoverBtn: {
    backgroundColor: '#7367F0',
    color: '#FFFFFF',
    border: 'none',
    padding: '10px 16px',
    borderRadius: '10px',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    boxShadow: '0 4px 14px rgba(115, 103, 240, 0.38)',
  },
  seedBtn: {
    backgroundColor: '#EDEBFD',
    color: '#7367F0',
    border: '1px solid #7367F0',
    padding: '10px 16px',
    borderRadius: '10px',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
  },
  centerLoading: {
    textAlign: 'center',
    padding: '60px',
    color: '#6F6B7D',
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid #DBDADE',
    borderTopColor: '#7367F0',
    borderRadius: '50%',
    margin: '0 auto 10px',
    animation: 'spin 0.8s linear infinite',
  },
};

