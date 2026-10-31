import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Printer,
  RotateCcw,
  UserPlus,
  Check,
  CreditCard,
  Banknote,
  Smartphone,
  Building,
  Barcode,
  ShoppingBag,
  Eye,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { db } from '../../services/db';
import { Product, Sale, SaleItem, Customer, PaymentMethod, PaymentStatus } from '../../types';

export const SalesView: React.FC = () => {
  const {
    activeBusiness,
    currentUser,
    setSelectedInvoice,
    lang,
    t,
    refreshData,
    showToast,
    dataVersion,
  } = useApp();

  const [viewMode, setViewMode] = useState<'pos' | 'invoices'>('pos');

  // POS State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('walk-in');
  const [discountType, setDiscountType] = useState<'flat' | 'percent'>('flat');
  const [discountVal, setDiscountVal] = useState<number>(0);
  const [vatPercent, setVatPercent] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paidAmountInput, setPaidAmountInput] = useState<string>('');
  const [saleNote, setSaleNote] = useState('');

  // Modals
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');

  // Return modal
  const [saleToReturn, setSaleToReturn] = useState<Sale | null>(null);
  const [returnReason, setReturnReason] = useState('Customer Request / Item Exchanged');
  const [refundAmount, setRefundAmount] = useState<number>(0);

  // Raw data
  const products = useMemo(() => db.getProducts(activeBusiness.id), [activeBusiness.id, dataVersion]);
  const categories = useMemo(() => db.getCategories(activeBusiness.id), [activeBusiness.id, dataVersion]);
  const customers = useMemo(() => db.getCustomers(activeBusiness.id), [activeBusiness.id, dataVersion]);
  const sales = useMemo(() => db.getSales(activeBusiness.id), [activeBusiness.id, dataVersion]);

  // Filter products by search & category
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = selectedCategory === 'all' || p.categoryId === selectedCategory;
      const term = searchTerm.toLowerCase();
      const matchSearch =
        p.name.toLowerCase().includes(term) ||
        (p.nameBn && p.nameBn.includes(term)) ||
        p.sku.toLowerCase().includes(term) ||
        p.barcode.includes(term);
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchTerm]);

  // Cart operations
  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      showToast('Cannot add out of stock product!', 'error');
      return;
    }

    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          showToast(`Only ${product.stock} items available in stock`, 'error');
          return prevCart;
        }
        return prevCart.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.unitPrice }
            : item
        );
      } else {
        return [
          ...prevCart,
          {
            productId: product.id,
            productName: lang === 'bn' && product.nameBn ? product.nameBn : product.name,
            sku: product.sku,
            quantity: 1,
            unit: product.unit,
            unitPrice: product.sellingPrice,
            purchasePrice: product.purchasePrice,
            total: product.sellingPrice,
          },
        ];
      }
    });
  };

  const updateCartQty = (productId: string, newQty: number) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }

    if (newQty > product.stock) {
      showToast(`Only ${product.stock} items available in stock`, 'error');
      return;
    }

    setCart((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? { ...item, quantity: newQty, total: newQty * item.unitPrice }
          : item
      )
    );
  };

  const updateCartPrice = (productId: string, price: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? { ...item, unitPrice: Math.max(0, price), total: item.quantity * Math.max(0, price) }
          : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscountVal(0);
    setVatPercent(0);
    setPaidAmountInput('');
    setSaleNote('');
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const discountAmount =
    discountType === 'percent' ? Math.round((subtotal * discountVal) / 100) : discountVal;
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const vatAmount = Math.round((taxableAmount * vatPercent) / 100);
  const grandTotal = Math.max(0, taxableAmount + vatAmount);

  // If paidAmountInput is empty, assume full payment by default
  const effectivePaid =
    paidAmountInput === '' ? grandTotal : Math.min(grandTotal, Math.max(0, parseFloat(paidAmountInput) || 0));
  const dueAmount = Math.max(0, grandTotal - effectivePaid);

  let paymentStatus: PaymentStatus = 'paid';
  if (dueAmount === grandTotal && grandTotal > 0) paymentStatus = 'due';
  else if (dueAmount > 0) paymentStatus = 'partial';

  // Handle Checkout
  const handleCheckout = () => {
    if (cart.length === 0) {
      showToast('Please add products to cart first', 'error');
      return;
    }

    const customer = customers.find((c) => c.id === selectedCustomerId);
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(sales.length + 1).padStart(4, '0')}`;

    const newSale: Sale = {
      id: 'sale-' + Date.now(),
      businessId: activeBusiness.id,
      invoiceNo: invoiceNumber,
      customerId: selectedCustomerId,
      customerName: customer ? customer.name : 'Walk-in Customer (General)',
      customerPhone: customer ? customer.phone : '01700-000000',
      items: cart,
      subtotal,
      discount: discountAmount,
      vat: vatAmount,
      grandTotal,
      paidAmount: effectivePaid,
      dueAmount,
      paymentMethod,
      paymentStatus,
      note: saleNote,
      date: new Date().toISOString().split('T')[0],
      createdByName: currentUser.name,
      isSynced: true,
      createdAt: new Date().toISOString(),
    };

    db.createSale(newSale, currentUser.id, currentUser.name);
    refreshData();
    clearCart();
    setSelectedInvoice(newSale); // open printable invoice immediately
    showToast(`Invoice ${invoiceNumber} created successfully!`, 'success');
  };

  // Add Customer modal submit
  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;

    const newCust: Customer = {
      id: 'cust-' + Date.now(),
      businessId: activeBusiness.id,
      name: newCustName,
      phone: newCustPhone || '01700-000000',
      address: newCustAddress || 'Dhaka',
      totalPurchases: 0,
      totalPaid: 0,
      currentDue: 0,
      createdAt: new Date().toISOString(),
    };

    db.saveCustomer(newCust);
    refreshData();
    setSelectedCustomerId(newCust.id);
    setShowAddCustomerModal(false);
    setNewCustName('');
    setNewCustPhone('');
    setNewCustAddress('');
    showToast(`Customer ${newCust.name} added!`, 'success');
  };

  // Return sale handler
  const handleProcessReturn = () => {
    if (!saleToReturn) return;
    db.returnSale(
      saleToReturn.id,
      activeBusiness.id,
      returnReason,
      refundAmount,
      currentUser.id,
      currentUser.name
    );
    refreshData();
    setSaleToReturn(null);
    showToast(`Sales return processed for ${saleToReturn.invoiceNo}`, 'info');
  };

  return (
    <div className="space-y-4">
      {/* View Switcher: POS vs Invoice History */}
      <div className="flex items-center justify-between pb-2 border-b border-[#EEEEEE]">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('pos')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'pos'
                ? 'bg-[#E53935] text-white shadow-xs'
                : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-[#EEEEEE]'
            }`}
          >
            {t('posTitle')}
          </button>
          <button
            onClick={() => setViewMode('invoices')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'invoices'
                ? 'bg-[#E53935] text-white shadow-xs'
                : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-[#EEEEEE]'
            }`}
          >
            {t('invoiceList')} ({sales.length})
          </button>
        </div>

        {viewMode === 'pos' && (
          <span className="text-xs text-neutral-500 hidden sm:inline">
            Cashier: <strong>{currentUser.name}</strong> · {activeBusiness.currencySymbol} BDT
          </span>
        )}
      </div>

      {/* ======================= VIEW MODE A: POS WORKSPACE ======================= */}
      {viewMode === 'pos' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Product Selection & Catalog (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Search & Barcode input bar */}
            <div className="bg-white p-3.5 rounded-2xl border border-[#EEEEEE] flex items-center gap-2 shadow-2xs">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder={t('searchProducts')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-200 rounded-xl focus:outline-none focus:border-[#E53935]"
                />
              </div>
              <div className="flex items-center gap-1.5 px-3 py-2 bg-neutral-100 text-neutral-600 rounded-xl text-xs font-mono shrink-0">
                <Barcode className="w-4 h-4 text-[#E53935]" />
                <span className="hidden sm:inline">Scanner Active</span>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                  selectedCategory === 'all'
                    ? 'bg-[#E53935] text-white'
                    : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-[#EEEEEE]'
                }`}
              >
                {t('all')}
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                    selectedCategory === c.id
                      ? 'bg-[#E53935] text-white'
                      : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-[#EEEEEE]'
                  }`}
                >
                  {lang === 'bn' && c.nameBn ? c.nameBn : c.name}
                </button>
              ))}
            </div>

            {/* Product Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto max-h-[640px] pr-1">
              {filteredProducts.map((p) => {
                const isOutOfStock = p.stock <= 0;
                const inCart = cart.find((i) => i.productId === p.id);

                return (
                  <button
                    key={p.id}
                    onClick={() => addToCart(p)}
                    disabled={isOutOfStock}
                    className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between min-h-[110px] cursor-pointer ${
                      isOutOfStock
                        ? 'bg-neutral-100 border-neutral-200 opacity-60 cursor-not-allowed'
                        : inCart
                        ? 'bg-[#FFF5F5] border-red-300 shadow-2xs'
                        : 'bg-white border-[#EEEEEE] hover:border-red-200 hover:shadow-sm'
                    }`}
                  >
                    <div>
                      <p className="font-bold text-xs text-neutral-900 leading-tight line-clamp-2">
                        {lang === 'bn' && p.nameBn ? p.nameBn : p.name}
                      </p>
                      <p className="text-[10px] text-neutral-400 font-mono mt-1">
                        SKU: {p.sku}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs font-black text-[#E53935] tabular-nums">
                        {activeBusiness.currencySymbol}{p.sellingPrice.toLocaleString()}
                      </span>

                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          isOutOfStock
                            ? 'bg-red-100 text-[#E53935]'
                            : p.stock <= p.minStockAlert
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {isOutOfStock ? 'Out' : `${p.stock} ${p.unit}`}
                      </span>
                    </div>

                    {inCart && (
                      <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#E53935] text-white flex items-center justify-center text-[10px] font-black">
                        {inCart.quantity}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Active Cart & Billing Terminal (5 Cols) */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-[#EEEEEE] p-4 sm:p-5 flex flex-col justify-between shadow-xs">
            <div>
              {/* Customer Selection Row */}
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <div className="flex-1 mr-2">
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                    {t('selectCustomer')}
                  </label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full text-xs font-semibold py-1.5 px-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:border-[#E53935] bg-neutral-50"
                  >
                    <option value="walk-in">{t('walkInCustomer')}</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phone}) - Due: ৳{c.currentDue}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => setShowAddCustomerModal(true)}
                  className="mt-4 p-2 bg-[#FFF5F5] hover:bg-red-100 text-[#E53935] rounded-xl transition-colors cursor-pointer"
                  title="Add New Customer"
                >
                  <UserPlus className="w-4 h-4" />
                </button>
              </div>

              {/* Cart Items List */}
              <div className="mt-3 overflow-y-auto max-h-56 divide-y divide-neutral-100 pr-1">
                {cart.length === 0 ? (
                  <div className="py-12 text-center text-xs text-neutral-400">
                    <ShoppingBag className="w-8 h-8 mx-auto text-neutral-300 mb-2" />
                    <p>{t('cartEmpty')}</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.productId} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                      <div className="truncate flex-1">
                        <p className="font-bold text-neutral-800 truncate">{item.productName}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-neutral-400">Rate:</span>
                          <input
                            type="number"
                            min="0"
                            value={item.unitPrice}
                            onChange={(e) => updateCartPrice(item.productId, parseFloat(e.target.value) || 0)}
                            className="w-16 px-1.5 py-0.5 text-[11px] border border-neutral-200 rounded font-mono tabular-nums text-neutral-800"
                          />
                        </div>
                      </div>

                      {/* Quantity Stepper */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => updateCartQty(item.productId, item.quantity - 1)}
                          className="w-6 h-6 rounded-md bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-700 cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center font-bold tabular-nums text-xs">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateCartQty(item.productId, item.quantity + 1)}
                          className="w-6 h-6 rounded-md bg-[#FFF5F5] hover:bg-red-100 flex items-center justify-center text-[#E53935] font-bold cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Total & Remove */}
                      <div className="text-right shrink-0 w-20">
                        <p className="font-black text-neutral-900 tabular-nums">
                          ৳{item.total.toLocaleString()}
                        </p>
                        <button
                          onClick={() => removeFromCart(item.productId)}
                          className="text-[10px] text-neutral-400 hover:text-[#E53935] cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Cart Financial Summary & Checkout Options */}
            <div className="mt-4 pt-3 border-t border-neutral-200 space-y-3">
              {/* Discount and VAT fields */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase">{t('discount')}</span>
                    <button
                      type="button"
                      onClick={() => setDiscountType(discountType === 'flat' ? 'percent' : 'flat')}
                      className="text-[10px] font-bold text-[#E53935] hover:underline"
                    >
                      {discountType === 'flat' ? '৳ (Flat)' : '% (Percent)'}
                    </button>
                  </div>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={discountVal || ''}
                    onChange={(e) => setDiscountVal(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full px-2.5 py-1.5 border border-neutral-200 rounded-xl text-xs font-mono"
                  />
                </div>

                <div>
                  <span className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">
                    {t('vatTax')} (%)
                  </span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0%"
                    value={vatPercent || ''}
                    onChange={(e) => setVatPercent(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full px-2.5 py-1.5 border border-neutral-200 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <span className="block text-[10px] font-bold text-neutral-500 uppercase mb-1.5">
                  {t('paymentMethod')}
                </span>
                <div className="grid grid-cols-5 gap-1.5">
                  {(
                    [
                      { id: 'cash', label: 'Cash', icon: Banknote },
                      { id: 'bkash', label: 'bKash', icon: Smartphone },
                      { id: 'nagad', label: 'Nagad', icon: Smartphone },
                      { id: 'bank', label: 'Bank', icon: Building },
                      { id: 'card', label: 'Card', icon: CreditCard },
                    ] as const
                  ).map((m) => {
                    const Icon = m.icon;
                    return (
                      <button
                        key={m.id}
                        onClick={() => setPaymentMethod(m.id)}
                        className={`py-1.5 px-1 rounded-xl text-[11px] font-semibold flex flex-col items-center justify-center transition-all cursor-pointer ${
                          paymentMethod === m.id
                            ? 'bg-[#E53935] text-white shadow-2xs font-bold'
                            : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200/80'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 mb-0.5" />
                        <span>{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Amount Paid & Due breakdown */}
              <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                <div>
                  <span className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">
                    {t('paidAmount')}
                  </span>
                  <input
                    type="number"
                    min="0"
                    placeholder={`৳${grandTotal}`}
                    value={paidAmountInput}
                    onChange={(e) => setPaidAmountInput(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-neutral-200 rounded-xl text-xs font-mono font-bold text-neutral-900"
                  />
                </div>

                <div className="p-2 bg-neutral-50 rounded-xl border border-neutral-200 flex flex-col justify-center">
                  <div className="flex justify-between text-[11px] text-neutral-500">
                    <span>{t('dueAmount')}:</span>
                    <span className={`font-black tabular-nums ${dueAmount > 0 ? 'text-[#E53935]' : 'text-emerald-700'}`}>
                      ৳{dueAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Grand Total Bar */}
              <div className="flex items-center justify-between p-3 bg-[#FFF5F5] rounded-xl border border-red-100">
                <span className="text-xs font-bold text-neutral-800">{t('grandTotal')}:</span>
                <span className="text-xl font-black text-[#E53935] tabular-nums">
                  ৳{grandTotal.toLocaleString()}
                </span>
              </div>

              {/* Action Buttons: Checkout & Clear */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={clearCart}
                  disabled={cart.length === 0}
                  className="px-3 py-2.5 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl border border-neutral-200 transition-colors disabled:opacity-40 cursor-pointer"
                >
                  Clear
                </button>
                <button
                  onClick={handleCheckout}
                  disabled={cart.length === 0}
                  className="flex-1 py-2.5 text-xs font-bold text-white bg-[#E53935] hover:bg-[#C62828] rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{t('checkout')} (৳{grandTotal.toLocaleString()})</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================= VIEW MODE B: INVOICES LIST ======================= */}
      {viewMode === 'invoices' && (
        <div className="bg-white rounded-2xl p-5 border border-[#EEEEEE]">
          <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
            <div>
              <h3 className="text-sm font-bold text-neutral-900">{t('invoiceList')}</h3>
              <p className="text-xs text-neutral-500">
                {lang === 'bn' ? 'সকল বিক্রয় চালান, প্রিন্ট ও ফেরত ব্যবস্থাপনা' : 'Manage and search sales records'}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto mt-3">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-400 font-medium">
                  <th className="py-2.5 px-3">Invoice #</th>
                  <th className="py-2.5 px-3">{t('date')}</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3 text-right">Items</th>
                  <th className="py-2.5 px-3 text-right">{t('grandTotal')}</th>
                  <th className="py-2.5 px-3 text-right">{t('paidAmount')}</th>
                  <th className="py-2.5 px-3 text-right">{t('dueAmount')}</th>
                  <th className="py-2.5 px-3 text-center">{t('paymentMethod')}</th>
                  <th className="py-2.5 px-3 text-center">{t('status')}</th>
                  <th className="py-2.5 px-3 text-right">{t('action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-neutral-50/70 transition-colors">
                    <td className="py-3 px-3 font-bold text-neutral-900">
                      {sale.invoiceNo}
                      {sale.isReturned && (
                        <span className="block text-[9px] text-[#E53935] font-bold">Returned</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-neutral-500 tabular-nums">{sale.date}</td>
                    <td className="py-3 px-3">
                      <p className="font-semibold text-neutral-800">{sale.customerName}</p>
                      <p className="text-[10px] text-neutral-400">{sale.customerPhone}</p>
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums text-neutral-600">
                      {sale.items.length}
                    </td>
                    <td className="py-3 px-3 text-right font-black text-neutral-900 tabular-nums">
                      ৳{sale.grandTotal.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right text-emerald-700 font-semibold tabular-nums">
                      ৳{sale.paidAmount.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-bold tabular-nums">
                      {sale.dueAmount > 0 ? (
                        <span className="text-[#E53935]">৳{sale.dueAmount.toLocaleString()}</span>
                      ) : (
                        <span className="text-neutral-400">0</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded bg-neutral-100 text-neutral-700">
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          sale.paymentStatus === 'paid'
                            ? 'bg-emerald-50 text-emerald-700'
                            : sale.paymentStatus === 'partial'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-red-50 text-[#E53935]'
                        }`}
                      >
                        {t(sale.paymentStatus as any)}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right space-x-1">
                      <button
                        onClick={() => setSelectedInvoice(sale)}
                        className="p-1.5 text-neutral-600 hover:text-[#E53935] hover:bg-[#FFF5F5] rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1"
                        title="View / Print"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-semibold">{t('print')}</span>
                      </button>

                      {!sale.isReturned && (
                        <button
                          onClick={() => {
                            setSaleToReturn(sale);
                            setRefundAmount(sale.paidAmount);
                          }}
                          className="p-1.5 text-neutral-400 hover:text-[#E53935] hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Sales Return"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Quick Add Customer */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-neutral-200">
            <h3 className="text-base font-bold text-neutral-900 pb-2 border-b border-neutral-100">
              Add New Customer
            </h3>

            <form onSubmit={handleCreateCustomer} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tanvir Rahman"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:border-[#E53935]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Mobile Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="01712-345678"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:border-[#E53935]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sector 3, Uttara, Dhaka"
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:border-[#E53935]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="px-4 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#E53935] hover:bg-[#C62828] rounded-lg shadow-xs"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Process Sales Return */}
      {saleToReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-neutral-200">
            <h3 className="text-base font-bold text-neutral-900 pb-2 border-b border-neutral-100">
              {t('salesReturn')} - {saleToReturn.invoiceNo}
            </h3>

            <div className="mt-4 space-y-3 text-xs">
              <p className="text-neutral-600">
                Returning items will automatically restore product stock quantities back into your inventory.
              </p>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Return Reason</label>
                <input
                  type="text"
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Cash Refund Amount (৳)
                </label>
                <input
                  type="number"
                  min="0"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg font-mono font-bold"
                />
                <p className="text-[10px] text-neutral-400 mt-1">
                  Original Paid: ৳{saleToReturn.paidAmount}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setSaleToReturn(null)}
                  className="px-4 py-2 font-medium text-neutral-600 hover:bg-neutral-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleProcessReturn}
                  className="px-4 py-2 font-bold text-white bg-[#E53935] hover:bg-[#C62828] rounded-lg shadow-xs"
                >
                  Confirm Return & Restock
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
