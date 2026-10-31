import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Plus,
  Phone,
  MapPin,
  DollarSign,
  ArrowDownLeft,
  FileText,
  X,
  Check,
  Printer,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { db } from '../../services/db';
import { Customer, PaymentMethod, Sale } from '../../types';

export const CustomersView: React.FC = () => {
  const { activeBusiness, currentUser, setSelectedInvoice, lang, t, refreshData, showToast, dataVersion } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // Collect Due modal
  const [dueCustomer, setDueCustomer] = useState<Customer | null>(null);
  const [collectAmount, setCollectAmount] = useState<number>(0);
  const [collectMethod, setCollectMethod] = useState<PaymentMethod>('cash');
  const [collectNote, setCollectNote] = useState('Due payment cleared');

  // Customer Ledger modal
  const [ledgerCustomer, setLedgerCustomer] = useState<Customer | null>(null);

  // Raw data
  const customers = useMemo(() => db.getCustomers(activeBusiness.id), [activeBusiness.id, dataVersion]);
  const sales = useMemo(() => db.getSales(activeBusiness.id), [activeBusiness.id, dataVersion]);

  const filteredCustomers = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return customers.filter(
      (c) => c.name.toLowerCase().includes(term) || c.phone.includes(term) || c.address.toLowerCase().includes(term)
    );
  }, [customers, searchTerm]);

  const totalDueAmount = customers.reduce((sum, c) => sum + c.currentDue, 0);
  const totalSalesAll = customers.reduce((sum, c) => sum + c.totalPurchases, 0);

  const openAddModal = () => {
    setEditingCustomer(null);
    setName('');
    setPhone('017');
    setAddress('');
    setShowAddCustomerModal(true);
  };

  const openEditModal = (c: Customer) => {
    setEditingCustomer(c);
    setName(c.name);
    setPhone(c.phone);
    setAddress(c.address);
    setShowAddCustomerModal(true);
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const cust: Customer = {
      id: editingCustomer ? editingCustomer.id : 'cust-' + Date.now(),
      businessId: activeBusiness.id,
      name,
      phone,
      address,
      totalPurchases: editingCustomer ? editingCustomer.totalPurchases : 0,
      totalPaid: editingCustomer ? editingCustomer.totalPaid : 0,
      currentDue: editingCustomer ? editingCustomer.currentDue : 0,
      createdAt: editingCustomer ? editingCustomer.createdAt : new Date().toISOString(),
    };

    db.saveCustomer(cust);
    refreshData();
    setShowAddCustomerModal(false);
    showToast(editingCustomer ? 'Customer profile updated' : 'Customer profile created', 'success');
  };

  const handleCollectDue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dueCustomer || collectAmount <= 0) return;

    db.collectCustomerDue(
      activeBusiness.id,
      dueCustomer.id,
      collectAmount,
      collectMethod,
      collectNote,
      currentUser.id,
      currentUser.name
    );
    refreshData();
    setDueCustomer(null);
    showToast(`Collected ৳${collectAmount.toLocaleString()} from ${dueCustomer.name}`, 'success');
  };

  // Get combined ledger items of customer (sales invoices + due payments)
  const customerLedgerItems = useMemo(() => {
    if (!ledgerCustomer) return [];
    const custSales = sales
      .filter((s) => s.customerId === ledgerCustomer.id)
      .map((s) => ({
        id: s.id,
        date: s.date,
        type: 'INVOICE' as const,
        ref: s.invoiceNo,
        description: `Sales Invoice (${s.items.length} items)`,
        debit: s.grandTotal, // customer billed
        credit: s.paidAmount, // paid on spot
        dueImpact: s.dueAmount,
      }));

    const custPayments = db
      .getDuePayments(activeBusiness.id, ledgerCustomer.id)
      .map((dp) => ({
        id: dp.id,
        date: dp.date,
        type: 'DUE_PAYMENT' as const,
        ref: `REC-${dp.id.slice(-4)}`,
        description: `Due Collection: ${dp.note} (${dp.paymentMethod.toUpperCase()})`,
        debit: 0,
        credit: dp.amount,
        dueImpact: -dp.amount,
      }));

    return [...custSales, ...custPayments].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [ledgerCustomer, sales, activeBusiness.id, dataVersion]);

  return (
    <div className="space-y-5">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-[#EEEEEE]">
        <div>
          <h2 className="text-lg font-bold text-neutral-900">{t('customers')}</h2>
          <p className="text-xs text-neutral-500">
            {lang === 'bn'
              ? 'গ্রাহক তথ্য, বকেয়া পাওনা হিসাব ও লেজার স্টেটমেন্ট'
              : 'Customer accounts, credit receivables, and payment histories'}
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#E53935] hover:bg-[#C62828] text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Aggregate Receivable Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#FFF5F5] rounded-2xl p-4 border border-red-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#E53935]">{t('customerDue')}</p>
            <p className="text-xl sm:text-2xl font-black text-[#E53935] tabular-nums mt-1">
              {activeBusiness.currencySymbol}{totalDueAmount.toLocaleString()}
            </p>
          </div>
          <DollarSign className="w-6 h-6 text-[#E53935]" />
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#EEEEEE] flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-neutral-600">Total Customer Purchases</p>
            <p className="text-xl sm:text-2xl font-black text-neutral-900 tabular-nums mt-1">
              {activeBusiness.currencySymbol}{totalSalesAll.toLocaleString()}
            </p>
          </div>
          <Users className="w-6 h-6 text-neutral-400" />
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#EEEEEE] flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-neutral-600">Total Registered Customers</p>
            <p className="text-xl sm:text-2xl font-black text-neutral-900 tabular-nums mt-1">
              {customers.length}
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
            placeholder="Search by customer name or mobile..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-200 rounded-xl focus:outline-none focus:border-[#E53935]"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl p-5 border border-[#EEEEEE]">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-neutral-200 text-neutral-400 font-medium">
                <th className="py-2.5 px-3">Customer Name</th>
                <th className="py-2.5 px-3">Phone & Address</th>
                <th className="py-2.5 px-3 text-right">Total Purchases</th>
                <th className="py-2.5 px-3 text-right">Total Paid</th>
                <th className="py-2.5 px-3 text-right">Remaining Due</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredCustomers.map((cust) => (
                <tr key={cust.id} className="hover:bg-neutral-50/70 transition-colors">
                  <td className="py-3 px-3">
                    <p className="font-bold text-neutral-900">{cust.name}</p>
                    <p className="text-[10px] text-neutral-400">ID: {cust.id}</p>
                  </td>
                  <td className="py-3 px-3">
                    <p className="font-mono text-neutral-700">{cust.phone}</p>
                    <p className="text-[10px] text-neutral-400 truncate max-w-xs">{cust.address}</p>
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums text-neutral-700 font-medium">
                    ৳{cust.totalPurchases.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums text-emerald-700 font-semibold">
                    ৳{cust.totalPaid.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums">
                    {cust.currentDue > 0 ? (
                      <span className="font-black text-[#E53935] px-2 py-0.5 bg-red-50 rounded">
                        ৳{cust.currentDue.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-neutral-400 font-medium">Cleared</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right space-x-1.5">
                    {cust.currentDue > 0 && (
                      <button
                        onClick={() => {
                          setDueCustomer(cust);
                          setCollectAmount(cust.currentDue);
                        }}
                        className="px-2.5 py-1 text-[11px] font-bold bg-[#E53935] hover:bg-[#C62828] text-white rounded-lg transition-colors cursor-pointer"
                      >
                        {t('collectDue')}
                      </button>
                    )}
                    <button
                      onClick={() => setLedgerCustomer(cust)}
                      className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg cursor-pointer"
                      title="Customer Ledger"
                    >
                      <FileText className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => openEditModal(cust)}
                      className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg cursor-pointer"
                      title="Edit Profile"
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

      {/* Modal: Add / Edit Customer */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-neutral-200">
            <h3 className="text-base font-bold text-neutral-900 pb-2 border-b border-neutral-100">
              {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
            </h3>

            <form onSubmit={handleSaveCustomer} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mahfuzur Rahman"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Mobile Number (Bangladesh) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="01712-345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Address</label>
                <input
                  type="text"
                  placeholder="e.g. House 12, Road 4, Sector 7, Uttara, Dhaka"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="px-4 py-2 font-medium text-neutral-600 hover:bg-neutral-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-[#E53935] hover:bg-[#C62828] rounded-xl shadow-xs"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Collect Due Payment */}
      {dueCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-neutral-200">
            <h3 className="text-base font-bold text-neutral-900 pb-2 border-b border-neutral-100">
              {t('receivePayment')}: {dueCustomer.name}
            </h3>

            <form onSubmit={handleCollectDue} className="mt-4 space-y-3.5 text-xs">
              <div className="p-3 bg-[#FFF5F5] rounded-xl border border-red-100 flex justify-between items-center">
                <span className="text-neutral-600 font-medium">Total Current Due:</span>
                <span className="font-black text-base text-[#E53935] tabular-nums">
                  ৳{dueCustomer.currentDue.toLocaleString()}
                </span>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Collection Amount (৳) *
                </label>
                <input
                  type="number"
                  min="1"
                  max={dueCustomer.currentDue}
                  required
                  value={collectAmount}
                  onChange={(e) => setCollectAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-xl font-mono text-base font-bold text-neutral-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  {t('paymentMethod')}
                </label>
                <select
                  value={collectMethod}
                  onChange={(e) => setCollectMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-xl"
                >
                  <option value="cash">Cash</option>
                  <option value="bkash">bKash</option>
                  <option value="nagad">Nagad</option>
                  <option value="bank">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Remarks / Note</label>
                <input
                  type="text"
                  value={collectNote}
                  onChange={(e) => setCollectNote(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setDueCustomer(null)}
                  className="px-4 py-2 font-medium text-neutral-600 hover:bg-neutral-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-[#E53935] hover:bg-[#C62828] rounded-xl shadow-xs"
                >
                  Confirm Collection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Customer Ledger Statement */}
      {ledgerCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl p-6 shadow-2xl border border-neutral-200 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div>
                <h3 className="text-base font-bold text-neutral-900">
                  Customer Statement: {ledgerCustomer.name}
                </h3>
                <p className="text-xs text-neutral-500 font-mono">
                  {ledgerCustomer.phone} · Current Due: ৳{ledgerCustomer.currentDue.toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setLedgerCustomer(null)}
                className="text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto mt-3 flex-1 pr-1">
              {customerLedgerItems.length === 0 ? (
                <div className="py-12 text-center text-xs text-neutral-400">
                  No sales or payment records found for this customer.
                </div>
              ) : (
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-neutral-200 text-neutral-400 font-medium">
                      <th className="py-2 px-2">Date</th>
                      <th className="py-2 px-2">Type / Ref</th>
                      <th className="py-2 px-2">Particulars</th>
                      <th className="py-2 px-2 text-right">Debit (+)</th>
                      <th className="py-2 px-2 text-right">Credit (-)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {customerLedgerItems.map((item) => (
                      <tr key={item.id} className="hover:bg-neutral-50/70">
                        <td className="py-2.5 px-2 tabular-nums text-neutral-500">{item.date}</td>
                        <td className="py-2.5 px-2 font-mono font-bold text-neutral-800">{item.ref}</td>
                        <td className="py-2.5 px-2 text-neutral-600 max-w-xs truncate">{item.description}</td>
                        <td className="py-2.5 px-2 text-right font-black tabular-nums text-neutral-900">
                          {item.debit > 0 ? `৳${item.debit.toLocaleString()}` : '-'}
                        </td>
                        <td className="py-2.5 px-2 text-right font-black tabular-nums text-emerald-700">
                          {item.credit > 0 ? `৳${item.credit.toLocaleString()}` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="pt-3 border-t border-neutral-100 flex items-center justify-between text-xs font-bold">
              <span className="text-neutral-500">Net Due Balance:</span>
              <span className="text-base text-[#E53935] tabular-nums font-black">
                ৳{ledgerCustomer.currentDue.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
