import React, { useState, useMemo } from 'react';
import {
  ShoppingBag,
  Plus,
  Trash2,
  Building2,
  Check,
  Calendar,
  Search,
  Truck,
  RotateCcw,
  Eye,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { db } from '../../services/db';
import { Purchase, PurchaseItem, Supplier, PaymentMethod, PaymentStatus } from '../../types';

export const PurchasesView: React.FC = () => {
  const { activeBusiness, currentUser, lang, t, refreshData, showToast, dataVersion } = useApp();

  const [isCreatingPurchase, setIsCreatingPurchase] = useState(false);

  // Form State
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paidAmountInput, setPaidAmountInput] = useState('');
  const [purchaseNote, setPurchaseNote] = useState('');

  // Line items
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [itemQty, setItemQty] = useState(1);
  const [itemCost, setItemCost] = useState(0);

  // Return state
  const [purchaseToReturn, setPurchaseToReturn] = useState<Purchase | null>(null);
  const [returnReason, setReturnReason] = useState('Damaged or Expired Stock Returned to Supplier');
  const [refundAmount, setRefundAmount] = useState<number>(0);

  // Raw data
  const purchases = useMemo(() => db.getPurchases(activeBusiness.id), [activeBusiness.id, dataVersion]);
  const suppliers = useMemo(() => db.getSuppliers(activeBusiness.id), [activeBusiness.id, dataVersion]);
  const products = useMemo(() => db.getProducts(activeBusiness.id), [activeBusiness.id, dataVersion]);

  // When a product is selected in line item adder, prefill cost
  const handleProductSelect = (prodId: string) => {
    setSelectedProductId(prodId);
    const prod = products.find((p) => p.id === prodId);
    if (prod) {
      setItemCost(prod.purchasePrice);
    }
  };

  const handleAddItem = () => {
    if (!selectedProductId || itemQty <= 0) {
      showToast('Select a product and valid quantity', 'error');
      return;
    }
    const prod = products.find((p) => p.id === selectedProductId);
    if (!prod) return;

    const total = itemQty * itemCost;
    setItems((prev) => [
      ...prev,
      {
        productId: prod.id,
        productName: prod.name,
        quantity: itemQty,
        costPrice: itemCost,
        total,
      },
    ]);
    setSelectedProductId('');
    setItemQty(1);
    setItemCost(0);
  };

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const grandTotal = items.reduce((sum, i) => sum + i.total, 0);
  const effectivePaid =
    paidAmountInput === '' ? grandTotal : Math.min(grandTotal, Math.max(0, parseFloat(paidAmountInput) || 0));
  const dueAmount = Math.max(0, grandTotal - effectivePaid);

  let paymentStatus: PaymentStatus = 'paid';
  if (dueAmount === grandTotal && grandTotal > 0) paymentStatus = 'due';
  else if (dueAmount > 0) paymentStatus = 'partial';

  const handleSavePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId) {
      showToast('Please select a supplier', 'error');
      return;
    }
    if (items.length === 0) {
      showToast('Please add at least one line item', 'error');
      return;
    }

    const supplier = suppliers.find((s) => s.id === selectedSupplierId);
    const purchaseNumber = `PUR-${new Date().getFullYear()}-${String(purchases.length + 1).padStart(4, '0')}`;

    const newPurchase: Purchase = {
      id: 'pur-' + Date.now(),
      businessId: activeBusiness.id,
      purchaseNo: purchaseNumber,
      supplierId: selectedSupplierId,
      supplierName: supplier ? supplier.name : 'General Supplier',
      supplierPhone: supplier ? supplier.phone : '',
      items,
      grandTotal,
      paidAmount: effectivePaid,
      dueAmount,
      paymentMethod,
      paymentStatus,
      date: purchaseDate,
      note: purchaseNote,
      isSynced: true,
      createdAt: new Date().toISOString(),
    };

    db.createPurchase(newPurchase, currentUser.id, currentUser.name);
    refreshData();
    setIsCreatingPurchase(false);
    setItems([]);
    setPaidAmountInput('');
    setPurchaseNote('');
    showToast(`Purchase ${purchaseNumber} recorded and inventory restocked!`, 'success');
  };

  const handleProcessReturn = () => {
    if (!purchaseToReturn) return;
    db.returnPurchase(
      purchaseToReturn.id,
      activeBusiness.id,
      returnReason,
      refundAmount,
      currentUser.id,
      currentUser.name
    );
    refreshData();
    setPurchaseToReturn(null);
    showToast(`Purchase return processed for ${purchaseToReturn.purchaseNo}`, 'info');
  };

  return (
    <div className="space-y-5">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-[#EEEEEE]">
        <div>
          <h2 className="text-lg font-bold text-neutral-900">{t('purchases')}</h2>
          <p className="text-xs text-neutral-500">
            {lang === 'bn'
              ? 'সাপ্লায়ার থেকে পণ্য ক্রয়, পেমেন্ট ও ইনভেন্টরি স্টক ইন'
              : 'Record product purchases, stock inflow, and supplier payables'}
          </p>
        </div>

        <button
          onClick={() => setIsCreatingPurchase(!isCreatingPurchase)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-[#E53935] hover:bg-[#C62828] text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{isCreatingPurchase ? 'View Purchase List' : t('recordPurchase')}</span>
        </button>
      </div>

      {/* ===================== FORM: CREATE NEW PURCHASE ===================== */}
      {isCreatingPurchase ? (
        <form onSubmit={handleSavePurchase} className="bg-white p-5 sm:p-6 rounded-2xl border border-[#EEEEEE] space-y-5 shadow-xs">
          <div className="border-b border-neutral-100 pb-3">
            <h3 className="text-sm font-bold text-neutral-900">{t('recordPurchase')}</h3>
            <p className="text-xs text-neutral-500">
              Purchased items will automatically be added to inventory stock counts.
            </p>
          </div>

          {/* Supplier, Date, Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                {t('selectSupplier')} *
              </label>
              <select
                required
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                className="w-full py-2 px-3 border border-neutral-200 rounded-xl focus:outline-none focus:border-[#E53935]"
              >
                <option value="">-- Choose Supplier --</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.company}) - Payable Due: ৳{s.currentDue}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">{t('date')}</label>
              <input
                type="date"
                required
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full py-2 px-3 border border-neutral-200 rounded-xl font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                {t('paymentMethod')}
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full py-2 px-3 border border-neutral-200 rounded-xl"
              >
                <option value="cash">Cash</option>
                <option value="bank">Bank Transfer</option>
                <option value="bkash">bKash</option>
                <option value="nagad">Nagad</option>
              </select>
            </div>
          </div>

          {/* Line Item Adder */}
          <div className="p-4 bg-[#FFF5F5] rounded-xl border border-red-100 space-y-3">
            <h4 className="text-xs font-bold text-[#E53935] uppercase tracking-wider">
              Add Products to Purchase Order
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs items-end">
              <div className="sm:col-span-6">
                <label className="block font-semibold text-neutral-700 mb-1">Select Product</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => handleProductSelect(e.target.value)}
                  className="w-full py-2 px-3 bg-white border border-neutral-200 rounded-xl"
                >
                  <option value="">-- Choose Product --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Current Stock: {p.stock} {p.unit}) - Cost: ৳{p.purchasePrice}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-neutral-700 mb-1">Qty</label>
                <input
                  type="number"
                  min="1"
                  value={itemQty}
                  onChange={(e) => setItemQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full py-2 px-3 bg-white border border-neutral-200 rounded-xl font-mono text-center font-bold"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-neutral-700 mb-1">Cost Rate (৳)</label>
                <input
                  type="number"
                  min="0"
                  value={itemCost}
                  onChange={(e) => setItemCost(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full py-2 px-3 bg-white border border-neutral-200 rounded-xl font-mono text-center font-bold"
                />
              </div>

              <div className="sm:col-span-2">
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="w-full py-2 bg-[#E53935] hover:bg-[#C62828] text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  + Add Item
                </button>
              </div>
            </div>
          </div>

          {/* Line items table */}
          {items.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-neutral-200 text-neutral-400 font-medium">
                    <th className="py-2 px-3">Product</th>
                    <th className="py-2 px-3 text-center">Quantity</th>
                    <th className="py-2 px-3 text-right">Unit Cost</th>
                    <th className="py-2 px-3 text-right">Total</th>
                    <th className="py-2 px-3 text-right">Remove</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-neutral-50/50">
                      <td className="py-2 px-3 font-semibold text-neutral-800">{item.productName}</td>
                      <td className="py-2 px-3 text-center tabular-nums font-bold">{item.quantity}</td>
                      <td className="py-2 px-3 text-right tabular-nums">৳{item.costPrice}</td>
                      <td className="py-2 px-3 text-right font-black tabular-nums">
                        ৳{item.total.toLocaleString()}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          className="text-neutral-400 hover:text-[#E53935] p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Financial summary & Payment breakdown */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-4 border-t border-neutral-200">
            <div className="w-full sm:w-1/2">
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Purchase Notes / Invoice Ref
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Supplier challan # 90412, delivered at godown"
                value={purchaseNote}
                onChange={(e) => setPurchaseNote(e.target.value)}
                className="w-full p-2.5 text-xs border border-neutral-200 rounded-xl"
              />
            </div>

            <div className="w-full sm:w-72 space-y-2 text-xs">
              <div className="flex justify-between text-neutral-700 font-medium">
                <span>Grand Total:</span>
                <span className="font-bold tabular-nums">৳{grandTotal.toLocaleString()}</span>
              </div>

              <div>
                <span className="block font-semibold text-neutral-700 mb-1">Amount Paid Now</span>
                <input
                  type="number"
                  min="0"
                  placeholder={`৳${grandTotal}`}
                  value={paidAmountInput}
                  onChange={(e) => setPaidAmountInput(e.target.value)}
                  className="w-full py-1.5 px-3 border border-neutral-200 rounded-xl font-mono font-bold"
                />
              </div>

              <div className="flex justify-between pt-1 border-t border-neutral-200 text-neutral-600">
                <span>Payable Remaining (Due):</span>
                <span className={`font-black tabular-nums ${dueAmount > 0 ? 'text-[#E53935]' : 'text-emerald-700'}`}>
                  ৳{dueAmount.toLocaleString()}
                </span>
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-2.5 bg-[#E53935] hover:bg-[#C62828] text-white font-bold rounded-xl text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Confirm Purchase & Add Stock</span>
              </button>
            </div>
          </div>
        </form>
      ) : (
        /* ===================== VIEW: PURCHASES LIST ===================== */
        <div className="bg-white rounded-2xl p-5 border border-[#EEEEEE]">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-400 font-medium">
                  <th className="py-2.5 px-3">Purchase #</th>
                  <th className="py-2.5 px-3">{t('date')}</th>
                  <th className="py-2.5 px-3">Supplier</th>
                  <th className="py-2.5 px-3 text-right">Items</th>
                  <th className="py-2.5 px-3 text-right">{t('grandTotal')}</th>
                  <th className="py-2.5 px-3 text-right">{t('paidAmount')}</th>
                  <th className="py-2.5 px-3 text-right">{t('dueAmount')}</th>
                  <th className="py-2.5 px-3 text-center">{t('paymentMethod')}</th>
                  <th className="py-2.5 px-3 text-center">{t('status')}</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {purchases.map((pur) => (
                  <tr key={pur.id} className="hover:bg-neutral-50/70 transition-colors">
                    <td className="py-3 px-3 font-bold text-neutral-900">
                      {pur.purchaseNo}
                      {pur.isReturned && (
                        <span className="block text-[9px] text-[#E53935] font-bold">Returned</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-neutral-500 tabular-nums">{pur.date}</td>
                    <td className="py-3 px-3">
                      <p className="font-semibold text-neutral-800">{pur.supplierName}</p>
                      <p className="text-[10px] text-neutral-400">{pur.supplierPhone}</p>
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums text-neutral-600">
                      {pur.items.length} items ({pur.items.reduce((s, i) => s + i.quantity, 0)} pcs)
                    </td>
                    <td className="py-3 px-3 text-right font-black text-neutral-900 tabular-nums">
                      ৳{pur.grandTotal.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right text-emerald-700 font-semibold tabular-nums">
                      ৳{pur.paidAmount.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-bold tabular-nums">
                      {pur.dueAmount > 0 ? (
                        <span className="text-[#E53935]">৳{pur.dueAmount.toLocaleString()}</span>
                      ) : (
                        <span className="text-neutral-400">0</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded bg-neutral-100 text-neutral-700">
                        {pur.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          pur.paymentStatus === 'paid'
                            ? 'bg-emerald-50 text-emerald-700'
                            : pur.paymentStatus === 'partial'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-red-50 text-[#E53935]'
                        }`}
                      >
                        {t(pur.paymentStatus as any)}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {!pur.isReturned ? (
                        <button
                          onClick={() => {
                            setPurchaseToReturn(pur);
                            setRefundAmount(pur.paidAmount);
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold text-neutral-600 hover:text-[#E53935] hover:bg-[#FFF5F5] border border-neutral-200 rounded-lg inline-flex items-center gap-1 transition-colors cursor-pointer"
                          title="Return Purchase"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Return</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-neutral-400 italic">Adjusted</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Process Purchase Return */}
      {purchaseToReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-neutral-200">
            <h3 className="text-base font-bold text-neutral-900 pb-2 border-b border-neutral-100">
              Return Purchase to Supplier ({purchaseToReturn.purchaseNo})
            </h3>

            <div className="mt-4 space-y-3.5 text-xs">
              <p className="text-neutral-600">
                Returning this purchase will reduce product inventory stock counts and adjust the supplier account balance.
              </p>

              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-1">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Supplier:</span>
                  <span className="font-semibold text-neutral-900">{purchaseToReturn.supplierName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Order Grand Total:</span>
                  <span className="font-bold tabular-nums">৳{purchaseToReturn.grandTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Amount Paid Originally:</span>
                  <span className="font-bold tabular-nums text-emerald-700">৳{purchaseToReturn.paidAmount.toLocaleString()}</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Return Reason</label>
                <input
                  type="text"
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Cash Refund Received from Supplier (৳)
                </label>
                <input
                  type="number"
                  min="0"
                  max={purchaseToReturn.paidAmount}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-xl font-mono font-bold"
                />
                <p className="text-[10px] text-neutral-400 mt-1">
                  If cash was refunded, it will be added back into the Cashbook.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setPurchaseToReturn(null)}
                  className="px-4 py-2 font-medium text-neutral-600 hover:bg-neutral-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleProcessReturn}
                  className="px-4 py-2 font-bold text-white bg-[#E53935] hover:bg-[#C62828] rounded-xl shadow-xs"
                >
                  Confirm Purchase Return
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
