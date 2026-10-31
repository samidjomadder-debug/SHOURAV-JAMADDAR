import React, { useState, useMemo } from 'react';
import { TrendingDown, Plus, Search, Calendar, DollarSign, X, PieChart } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { db } from '../../services/db';
import { Expense, PaymentMethod } from '../../types';

export const ExpensesView: React.FC = () => {
  const { activeBusiness, currentUser, lang, t, refreshData, showToast, dataVersion } = useApp();

  const [showAddModal, setShowAddModal] = useState(false);
  const [category, setCategory] = useState('Shop / Warehouse Rent');
  const [customCategory, setCustomCategory] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [voucherNo, setVoucherNo] = useState('');

  const expenses = useMemo(() => db.getExpenses(activeBusiness.id), [activeBusiness.id, dataVersion]);

  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Category breakdown calculation
  const categoryTotals = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [expenses]);

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      showToast('Please enter a valid expense amount', 'error');
      return;
    }

    const finalCategory = category === 'Other' && customCategory ? customCategory : category;

    const newExpense: Expense = {
      id: 'exp-' + Date.now(),
      businessId: activeBusiness.id,
      category: finalCategory,
      amount,
      paymentMethod,
      date,
      note,
      voucherNo: voucherNo || `VCH-${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString(),
    };

    db.createExpense(newExpense, currentUser.id, currentUser.name);
    refreshData();
    setShowAddModal(false);
    setAmount(0);
    setNote('');
    setVoucherNo('');
    showToast(`Expense of ৳${amount.toLocaleString()} recorded!`, 'success');
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-[#EEEEEE]">
        <div>
          <h2 className="text-lg font-bold text-neutral-900">{t('expenses')}</h2>
          <p className="text-xs text-neutral-500">
            {lang === 'bn'
              ? 'দোকান ভাড়া, বিদ্যুৎ বিল, কর্মচারীর বেতন ও অন্যান্য পরিচালন খরচ'
              : 'Track operational overheads, utility bills, rent, and staff payroll'}
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#E53935] hover:bg-[#C62828] text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t('recordExpense')}</span>
        </button>
      </div>

      {/* Aggregate Banner & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Total Expense Card */}
        <div className="bg-[#FFF5F5] rounded-2xl p-5 border border-red-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#E53935]">{t('totalExpenses')}</span>
              <TrendingDown className="w-5 h-5 text-[#E53935]" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-[#E53935] tabular-nums mt-3">
              {activeBusiness.currencySymbol}{totalExpense.toLocaleString()}
            </p>
          </div>
          <p className="text-xs text-neutral-500 mt-2">
            Total {expenses.length} expense vouchers recorded in this period.
          </p>
        </div>

        {/* Category Breakdown Progress Bars (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-[#EEEEEE]">
          <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider pb-2 border-b border-neutral-100">
            Expense Breakdown by Category
          </h3>

          <div className="mt-3 space-y-2.5 overflow-y-auto max-h-36 pr-1">
            {categoryTotals.length === 0 ? (
              <p className="text-xs text-neutral-400 py-4 text-center">No expenses recorded yet.</p>
            ) : (
              categoryTotals.map(([catName, catAmount]) => {
                const pct = totalExpense > 0 ? Math.round((catAmount / totalExpense) * 100) : 0;
                return (
                  <div key={catName} className="text-xs">
                    <div className="flex justify-between font-medium text-neutral-800 mb-1">
                      <span>{catName}</span>
                      <span className="tabular-nums font-bold">
                        ৳{catAmount.toLocaleString()} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${pct}%` }}
                        className="bg-[#E53935] h-full rounded-full transition-all"
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl p-5 border border-[#EEEEEE]">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-neutral-200 text-neutral-400 font-medium">
                <th className="py-2.5 px-3">{t('date')}</th>
                <th className="py-2.5 px-3">Voucher #</th>
                <th className="py-2.5 px-3">{t('expenseCategory')}</th>
                <th className="py-2.5 px-3">Description / Note</th>
                <th className="py-2.5 px-3 text-center">{t('paymentMethod')}</th>
                <th className="py-2.5 px-3 text-right">{t('amount')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {expenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-neutral-50/70 transition-colors">
                  <td className="py-3 px-3 tabular-nums text-neutral-500">{exp.date}</td>
                  <td className="py-3 px-3 font-mono font-bold text-neutral-700">{exp.voucherNo}</td>
                  <td className="py-3 px-3 font-semibold text-neutral-900">{exp.category}</td>
                  <td className="py-3 px-3 text-neutral-600 max-w-xs truncate">{exp.note || '-'}</td>
                  <td className="py-3 px-3 text-center">
                    <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded bg-neutral-100 text-neutral-700">
                      {exp.paymentMethod}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-black text-[#E53935] tabular-nums">
                    -৳{exp.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add Expense */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-neutral-200">
            <h3 className="text-base font-bold text-neutral-900 pb-2 border-b border-neutral-100">
              {t('recordExpense')}
            </h3>

            <form onSubmit={handleSaveExpense} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  {t('expenseCategory')}
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-xl"
                >
                  <option value="Shop / Warehouse Rent">{t('rent')}</option>
                  <option value="Staff Salary">{t('salary')}</option>
                  <option value="Electricity & Utilities">{t('electricity')}</option>
                  <option value="Transport & Delivery">{t('transport')}</option>
                  <option value="Packaging Materials">{t('packaging')}</option>
                  <option value="Entertainment / Tea">{t('teaSnacks')}</option>
                  <option value="Shop Maintenance">{t('maintenance')}</option>
                  <option value="Other">{t('other')}</option>
                </select>
              </div>

              {category === 'Other' && (
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Custom Category Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Municipal Trade Tax, Internet Bill"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-xl"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Amount (৳) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={amount || ''}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-xl font-mono text-base font-bold text-[#E53935]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">{t('date')}</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">{t('paymentMethod')}</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-xl"
                  >
                    <option value="cash">Cash</option>
                    <option value="bkash">bKash</option>
                    <option value="nagad">Nagad</option>
                    <option value="bank">Bank Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Voucher #</label>
                  <input
                    type="text"
                    placeholder="Optional Voucher"
                    value={voucherNo}
                    onChange={(e) => setVoucherNo(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Description / Memo</label>
                <textarea
                  rows={2}
                  placeholder="Details of expense"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full p-2.5 border border-neutral-200 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 font-medium text-neutral-600 hover:bg-neutral-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-[#E53935] hover:bg-[#C62828] rounded-xl shadow-xs"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
