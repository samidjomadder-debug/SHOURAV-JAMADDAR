import React, { useState, useMemo } from 'react';
import { TrendingUp, Plus, Search, Calendar, DollarSign, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { db } from '../../services/db';
import { Income, PaymentMethod } from '../../types';

export const IncomeView: React.FC = () => {
  const { activeBusiness, currentUser, lang, t, refreshData, showToast, dataVersion } = useApp();

  const [showAddModal, setShowAddModal] = useState(false);
  const [category, setCategory] = useState('Delivery Charge Collection');
  const [customCategory, setCustomCategory] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [receiptNo, setReceiptNo] = useState('');

  const incomes = useMemo(() => db.getIncomes(activeBusiness.id), [activeBusiness.id, dataVersion]);

  const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);

  const handleSaveIncome = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      showToast('Please enter a valid income amount', 'error');
      return;
    }

    const finalCategory = category === 'Other' && customCategory ? customCategory : category;

    const newIncome: Income = {
      id: 'inc-' + Date.now(),
      businessId: activeBusiness.id,
      category: finalCategory,
      amount,
      paymentMethod,
      date,
      note,
      receiptNo: receiptNo || `RC-${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString(),
    };

    db.createIncome(newIncome, currentUser.id, currentUser.name);
    refreshData();
    setShowAddModal(false);
    setAmount(0);
    setNote('');
    setReceiptNo('');
    showToast(`Income of ৳${amount.toLocaleString()} recorded!`, 'success');
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-[#EEEEEE]">
        <div>
          <h2 className="text-lg font-bold text-neutral-900">{t('income')}</h2>
          <p className="text-xs text-neutral-500">
            {lang === 'bn'
              ? 'বিক্রয় বহির্ভূত অন্যান্য আয় (ডেলিভারি চার্জ, স্ক্র্যাপ বিক্রি ইত্যাদি)'
              : 'Record additional non-retail revenues, delivery fees, and commissions'}
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#E53935] hover:bg-[#C62828] text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t('recordIncome')}</span>
        </button>
      </div>

      {/* Aggregate Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-[#EEEEEE] flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-neutral-600">{t('totalIncome')}</p>
            <p className="text-2xl font-black text-emerald-600 tabular-nums mt-1">
              +{activeBusiness.currencySymbol}{totalIncome.toLocaleString()}
            </p>
          </div>
          <TrendingUp className="w-6 h-6 text-emerald-500" />
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#EEEEEE] flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-neutral-600">Total Entries</p>
            <p className="text-2xl font-black text-neutral-900 tabular-nums mt-1">
              {incomes.length}
            </p>
          </div>
          <DollarSign className="w-6 h-6 text-neutral-400" />
        </div>
      </div>

      {/* Income Records Table */}
      <div className="bg-white rounded-2xl p-5 border border-[#EEEEEE]">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-neutral-200 text-neutral-400 font-medium">
                <th className="py-2.5 px-3">{t('date')}</th>
                <th className="py-2.5 px-3">Receipt / Ref</th>
                <th className="py-2.5 px-3">{t('incomeCategory')}</th>
                <th className="py-2.5 px-3">Description / Note</th>
                <th className="py-2.5 px-3 text-center">{t('paymentMethod')}</th>
                <th className="py-2.5 px-3 text-right">{t('amount')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {incomes.map((inc) => (
                <tr key={inc.id} className="hover:bg-neutral-50/70 transition-colors">
                  <td className="py-3 px-3 tabular-nums text-neutral-500">{inc.date}</td>
                  <td className="py-3 px-3 font-mono font-bold text-neutral-700">{inc.receiptNo}</td>
                  <td className="py-3 px-3 font-semibold text-neutral-900">{inc.category}</td>
                  <td className="py-3 px-3 text-neutral-600 max-w-xs truncate">{inc.note || '-'}</td>
                  <td className="py-3 px-3 text-center">
                    <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded bg-neutral-100 text-neutral-700">
                      {inc.paymentMethod}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-black text-emerald-600 tabular-nums">
                    +৳{inc.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Record Income */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-neutral-200">
            <h3 className="text-base font-bold text-neutral-900 pb-2 border-b border-neutral-100">
              {t('recordIncome')}
            </h3>

            <form onSubmit={handleSaveIncome} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">{t('incomeCategory')}</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-xl"
                >
                  <option value="Delivery Charge Collection">Delivery Charge Collection</option>
                  <option value="Carton & Scrap Box Sale">Carton & Scrap Box Sale</option>
                  <option value="Service & Installation Fee">Service & Installation Fee</option>
                  <option value="Commission / Rebate Received">Commission / Rebate Received</option>
                  <option value="Owner Capital Inflow">Owner Capital Inflow</option>
                  <option value="Other">Other / Custom</option>
                </select>
              </div>

              {category === 'Other' && (
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Custom Category Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter category name"
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
                    className="w-full px-3 py-2 border border-neutral-200 rounded-xl font-mono text-base font-bold text-emerald-600"
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
                  <label className="block font-semibold text-neutral-700 mb-1">Receipt / Ref #</label>
                  <input
                    type="text"
                    placeholder="Optional reference"
                    value={receiptNo}
                    onChange={(e) => setReceiptNo(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Notes / Description</label>
                <textarea
                  rows={2}
                  placeholder="Details about this income"
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
                  Save Income
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
