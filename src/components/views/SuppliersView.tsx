import React, { useState, useMemo } from 'react';
import {
  Truck,
  Search,
  Plus,
  Phone,
  Building,
  DollarSign,
  FileText,
  X,
  Check,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { db } from '../../services/db';
import { Supplier, PaymentMethod } from '../../types';

export const SuppliersView: React.FC = () => {
  const { activeBusiness, currentUser, lang, t, refreshData, showToast, dataVersion } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // Pay Supplier modal
  const [payingSupplier, setPayingSupplier] = useState<Supplier | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('cash');
  const [payNote, setPayNote] = useState('Supplier bill clearance');

  // Supplier Statement Ledger modal
  const [ledgerSupplier, setLedgerSupplier] = useState<Supplier | null>(null);

  // Raw data
  const suppliers = useMemo(() => db.getSuppliers(activeBusiness.id), [activeBusiness.id, dataVersion]);
  const purchases = useMemo(() => db.getPurchases(activeBusiness.id), [activeBusiness.id, dataVersion]);
  const cashbook = useMemo(() => db.getCashbook(activeBusiness.id), [activeBusiness.id, dataVersion]);

  // Combined ledger items for supplier
  const supplierLedgerItems = useMemo(() => {
    if (!ledgerSupplier) return [];

    // Purchases from this supplier
    const supPurchases = purchases
      .filter((p) => p.supplierId === ledgerSupplier.id)
      .map((p) => ({
        id: p.id,
        date: p.date,
        type: 'PURCHASE' as const,
        ref: p.purchaseNo,
        description: `Purchase Order (${p.items.length} items)`,
        debit: p.paidAmount,
        credit: p.grandTotal,
        dueImpact: p.dueAmount,
      }));

    // Direct due payments made to this supplier from cashbook
    const supPayments = cashbook
      .filter((c) => c.referenceType === 'supplier_due' && c.referenceId === ledgerSupplier.id)
      .map((cb) => ({
        id: cb.id,
        date: cb.date,
        type: 'DUE_PAYMENT' as const,
        ref: `PAY-${cb.id.slice(-4)}`,
        description: cb.description,
        debit: cb.amount,
        credit: 0,
        dueImpact: -cb.amount,
      }));

    return [...supPurchases, ...supPayments].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [ledgerSupplier, purchases, cashbook]);

  const filteredSuppliers = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(term) ||
        s.company.toLowerCase().includes(term) ||
        s.phone.includes(term)
    );
  }, [suppliers, searchTerm]);

  const totalPayableDue = suppliers.reduce((sum, s) => sum + s.currentDue, 0);

  const openAddModal = () => {
    setEditingSupplier(null);
    setName('');
    setCompany('');
    setPhone('017');
    setAddress('');
    setShowAddSupplierModal(true);
  };

  const openEditModal = (s: Supplier) => {
    setEditingSupplier(s);
    setName(s.name);
    setCompany(s.company);
    setPhone(s.phone);
    setAddress(s.address);
    setShowAddSupplierModal(true);
  };

  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const sup: Supplier = {
      id: editingSupplier ? editingSupplier.id : 'sup-' + Date.now(),
      businessId: activeBusiness.id,
      name,
      company: company || name,
      phone,
      address,
      totalPurchases: editingSupplier ? editingSupplier.totalPurchases : 0,
      totalPaid: editingSupplier ? editingSupplier.totalPaid : 0,
      currentDue: editingSupplier ? editingSupplier.currentDue : 0,
      createdAt: editingSupplier ? editingSupplier.createdAt : new Date().toISOString(),
    };

    db.saveSupplier(sup);
    refreshData();
    setShowAddSupplierModal(false);
    showToast(editingSupplier ? 'Supplier updated' : 'Supplier added', 'success');
  };

  const handlePaySupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingSupplier || payAmount <= 0) return;

    db.paySupplierDue(
      activeBusiness.id,
      payingSupplier.id,
      payAmount,
      payMethod,
      payNote,
      currentUser.id,
      currentUser.name
    );
    refreshData();
    setPayingSupplier(null);
    showToast(`Paid ৳${payAmount.toLocaleString()} to ${payingSupplier.name}`, 'success');
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-[#EEEEEE]">
        <div>
          <h2 className="text-lg font-bold text-neutral-900">{t('suppliers')}</h2>
          <p className="text-xs text-neutral-500">
            {lang === 'bn'
              ? 'মহাজন ও সাপ্লায়ার কোম্পানি, প্রদেয় বকেয়া ও পেমেন্ট রেকর্ড'
              : 'Supplier companies, purchase payables, and payment settlements'}
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#E53935] hover:bg-[#C62828] text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Supplier</span>
        </button>
      </div>

      {/* Payable Stat Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-[#EEEEEE] flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-neutral-600">{t('supplierDue')}</p>
            <p className="text-xl sm:text-2xl font-black text-neutral-900 tabular-nums mt-1">
              {activeBusiness.currencySymbol}{totalPayableDue.toLocaleString()}
            </p>
          </div>
          <Truck className="w-6 h-6 text-[#E53935]" />
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#EEEEEE] flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-neutral-600">Total Sourced Volume</p>
            <p className="text-xl sm:text-2xl font-black text-neutral-900 tabular-nums mt-1">
              {activeBusiness.currencySymbol}
              {suppliers.reduce((sum, s) => sum + s.totalPurchases, 0).toLocaleString()}
            </p>
          </div>
          <Building className="w-6 h-6 text-neutral-400" />
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#EEEEEE] flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-neutral-600">Active Suppliers</p>
            <p className="text-xl sm:text-2xl font-black text-neutral-900 tabular-nums mt-1">
              {suppliers.length}
            </p>
          </div>
          <Phone className="w-6 h-6 text-neutral-400" />
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-[#EEEEEE]">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by supplier or company name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-200 rounded-xl focus:outline-none focus:border-[#E53935]"
          />
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="bg-white rounded-2xl p-5 border border-[#EEEEEE]">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-neutral-200 text-neutral-400 font-medium">
                <th className="py-2.5 px-3">Supplier & Company</th>
                <th className="py-2.5 px-3">Contact & Address</th>
                <th className="py-2.5 px-3 text-right">Total Purchases</th>
                <th className="py-2.5 px-3 text-right">Total Paid</th>
                <th className="py-2.5 px-3 text-right">Payable Balance</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredSuppliers.map((sup) => (
                <tr key={sup.id} className="hover:bg-neutral-50/70 transition-colors">
                  <td className="py-3 px-3">
                    <p className="font-bold text-neutral-900">{sup.name}</p>
                    <p className="text-[11px] text-neutral-500">{sup.company}</p>
                  </td>
                  <td className="py-3 px-3">
                    <p className="font-mono text-neutral-700">{sup.phone}</p>
                    <p className="text-[10px] text-neutral-400 truncate max-w-xs">{sup.address}</p>
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums text-neutral-700 font-medium">
                    ৳{sup.totalPurchases.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums text-emerald-700 font-semibold">
                    ৳{sup.totalPaid.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums">
                    {sup.currentDue > 0 ? (
                      <span className="font-black text-[#E53935] px-2 py-0.5 bg-red-50 rounded">
                        ৳{sup.currentDue.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-neutral-400 font-medium">Cleared</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right space-x-1.5">
                    {sup.currentDue > 0 && (
                      <button
                        onClick={() => {
                          setPayingSupplier(sup);
                          setPayAmount(sup.currentDue);
                        }}
                        className="px-2.5 py-1 text-[11px] font-bold bg-[#E53935] hover:bg-[#C62828] text-white rounded-lg transition-colors cursor-pointer"
                      >
                        {t('paySupplier')}
                      </button>
                    )}
                    <button
                      onClick={() => setLedgerSupplier(sup)}
                      className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg cursor-pointer"
                      title="Supplier Statement"
                    >
                      <FileText className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => openEditModal(sup)}
                      className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg cursor-pointer"
                      title="Edit Supplier"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add / Edit Supplier */}
      {showAddSupplierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-neutral-200">
            <h3 className="text-base font-bold text-neutral-900 pb-2 border-b border-neutral-100">
              {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
            </h3>

            <form onSubmit={handleSaveSupplier} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Contact Person *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Asaduzzaman"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Company / Firm Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Meghna Group Distribution"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Phone Number *</label>
                <input
                  type="text"
                  required
                  placeholder="01713-998877"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Address / Depot</label>
                <input
                  type="text"
                  placeholder="e.g. Tejgaon Industrial Area, Dhaka"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddSupplierModal(false)}
                  className="px-4 py-2 font-medium text-neutral-600 hover:bg-neutral-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-[#E53935] hover:bg-[#C62828] rounded-xl shadow-xs"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Pay Supplier */}
      {payingSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-neutral-200">
            <h3 className="text-base font-bold text-neutral-900 pb-2 border-b border-neutral-100">
              {t('paySupplier')}: {payingSupplier.company}
            </h3>

            <form onSubmit={handlePaySupplier} className="mt-4 space-y-3.5 text-xs">
              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex justify-between items-center">
                <span className="text-neutral-600 font-medium">Total Balance Payable:</span>
                <span className="font-black text-base text-[#E53935] tabular-nums">
                  ৳{payingSupplier.currentDue.toLocaleString()}
                </span>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Payment Amount (৳) *</label>
                <input
                  type="number"
                  min="1"
                  max={payingSupplier.currentDue}
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-xl font-mono text-base font-bold text-neutral-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Payment Method</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-xl"
                >
                  <option value="cash">Cash</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="bkash">bKash</option>
                  <option value="nagad">Nagad</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Remarks</label>
                <input
                  type="text"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setPayingSupplier(null)}
                  className="px-4 py-2 font-medium text-neutral-600 hover:bg-neutral-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-[#E53935] hover:bg-[#C62828] rounded-xl shadow-xs"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Supplier Statement Ledger */}
      {ledgerSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl p-6 shadow-2xl border border-neutral-200 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div>
                <h3 className="text-base font-bold text-neutral-900">
                  Supplier Statement: {ledgerSupplier.company} ({ledgerSupplier.name})
                </h3>
                <p className="text-xs text-neutral-500 font-mono">
                  {ledgerSupplier.phone} · Payable Due: ৳{ledgerSupplier.currentDue.toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setLedgerSupplier(null)}
                className="text-neutral-400 hover:text-neutral-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto mt-3 flex-1 pr-1">
              {supplierLedgerItems.length === 0 ? (
                <div className="py-12 text-center text-xs text-neutral-400">
                  No purchase or settlement records found for this supplier.
                </div>
              ) : (
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-neutral-200 text-neutral-400 font-medium">
                      <th className="py-2 px-2">Date</th>
                      <th className="py-2 px-2">Type / Ref</th>
                      <th className="py-2 px-2">Particulars</th>
                      <th className="py-2 px-2 text-right">Debit (- Due)</th>
                      <th className="py-2 px-2 text-right">Credit (+ Due)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {supplierLedgerItems.map((item) => (
                      <tr key={item.id} className="hover:bg-neutral-50/70">
                        <td className="py-2.5 px-2 tabular-nums text-neutral-500">{item.date}</td>
                        <td className="py-2.5 px-2 font-mono font-bold text-neutral-800">{item.ref}</td>
                        <td className="py-2.5 px-2 text-neutral-600 max-w-xs truncate">{item.description}</td>
                        <td className="py-2.5 px-2 text-right font-black tabular-nums text-emerald-700">
                          {item.debit > 0 ? `৳${item.debit.toLocaleString()}` : '-'}
                        </td>
                        <td className="py-2.5 px-2 text-right font-black tabular-nums text-neutral-900">
                          {item.credit > 0 ? `৳${item.credit.toLocaleString()}` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="pt-3 border-t border-neutral-100 flex items-center justify-between text-xs font-bold">
              <span className="text-neutral-500">Net Payable Balance:</span>
              <span className="text-base text-[#E53935] tabular-nums font-black">
                ৳{ledgerSupplier.currentDue.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
