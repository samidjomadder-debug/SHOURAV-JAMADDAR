import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  Building,
  Smartphone,
  Scale,
  Calendar,
  Filter,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { db } from '../../services/db';
import { CashbookEntry } from '../../types';

export const AccountingView: React.FC = () => {
  const { activeBusiness, lang, t, dataVersion } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'cashbook' | 'journal' | 'balances'>('cashbook');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'month'>('all');

  const cashbook = useMemo(() => db.getCashbook(activeBusiness.id), [activeBusiness.id, dataVersion]);
  const customers = useMemo(() => db.getCustomers(activeBusiness.id), [activeBusiness.id, dataVersion]);
  const suppliers = useMemo(() => db.getSuppliers(activeBusiness.id), [activeBusiness.id, dataVersion]);

  const todayStr = new Date().toISOString().split('T')[0];
  const thisMonthStr = todayStr.substring(0, 7);

  const filteredCashbook = useMemo(() => {
    if (dateFilter === 'today') return cashbook.filter((c) => c.date === todayStr);
    if (dateFilter === 'month') return cashbook.filter((c) => c.date.startsWith(thisMonthStr));
    return cashbook;
  }, [cashbook, dateFilter, todayStr, thisMonthStr]);

  // Aggregate stats
  const totalCashIn = filteredCashbook
    .filter((c) => c.type === 'in')
    .reduce((sum, c) => sum + c.amount, 0);

  const totalCashOut = filteredCashbook
    .filter((c) => c.type === 'out')
    .reduce((sum, c) => sum + c.amount, 0);

  const currentDrawerBalance = db.getLatestCashBalance(activeBusiness.id);

  // Receivables & Payables
  const totalReceivables = customers.reduce((sum, c) => sum + c.currentDue, 0);
  const totalPayables = suppliers.reduce((sum, s) => sum + s.currentDue, 0);

  // Payment channel balances simulation
  const channelBalances = useMemo(() => {
    const cashTotal = cashbook
      .filter((c) => c.paymentMethod === 'cash')
      .reduce((sum, c) => sum + (c.type === 'in' ? c.amount : -c.amount), 0);
    const bkashTotal = cashbook
      .filter((c) => c.paymentMethod === 'bkash')
      .reduce((sum, c) => sum + (c.type === 'in' ? c.amount : -c.amount), 0);
    const nagadTotal = cashbook
      .filter((c) => c.paymentMethod === 'nagad')
      .reduce((sum, c) => sum + (c.type === 'in' ? c.amount : -c.amount), 0);
    const bankTotal = cashbook
      .filter((c) => c.paymentMethod === 'bank')
      .reduce((sum, c) => sum + (c.type === 'in' ? c.amount : -c.amount), 0);

    return {
      cash: Math.max(0, cashTotal),
      bkash: Math.max(0, bkashTotal),
      nagad: Math.max(0, nagadTotal),
      bank: Math.max(0, bankTotal),
    };
  }, [cashbook]);

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-[#EEEEEE]">
        <div>
          <h2 className="text-lg font-bold text-neutral-900">{t('accounting')}</h2>
          <p className="text-xs text-neutral-500">
            {lang === 'bn'
              ? 'দৈনিক ক্যাশবই, জাবেদা খতিয়ান ও হিসাব নিকাশ'
              : 'Daily cashbook registers, double-entry journal, and ledger balances'}
          </p>
        </div>

        {/* Sub-tab pills */}
        <div className="flex items-center p-1 bg-neutral-100 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveSubTab('cashbook')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeSubTab === 'cashbook'
                ? 'bg-white text-[#E53935] shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            {t('cashbook')}
          </button>
          <button
            onClick={() => setActiveSubTab('journal')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeSubTab === 'journal'
                ? 'bg-white text-[#E53935] shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            {t('generalLedger')}
          </button>
          <button
            onClick={() => setActiveSubTab('balances')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeSubTab === 'balances'
                ? 'bg-white text-[#E53935] shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            {t('bankAccounts')}
          </button>
        </div>
      </div>

      {/* Aggregate KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Cash Balance */}
        <div className="bg-[#FFF5F5] rounded-2xl p-4 border border-red-100">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#E53935]">{t('netCashBalance')}</span>
            <Wallet className="w-4 h-4 text-[#E53935]" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-[#E53935] tabular-nums mt-2">
            {activeBusiness.currencySymbol}{currentDrawerBalance.toLocaleString()}
          </p>
          <p className="text-[10px] text-neutral-500 mt-0.5">Live Cash Drawer Float</p>
        </div>

        {/* Total Cash In */}
        <div className="bg-white rounded-2xl p-4 border border-[#EEEEEE]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-600">{t('cashIn')}</span>
            <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-emerald-600 tabular-nums mt-2">
            +{activeBusiness.currencySymbol}{totalCashIn.toLocaleString()}
          </p>
          <p className="text-[10px] text-neutral-400 mt-0.5">Sales & Due Inflow</p>
        </div>

        {/* Total Cash Out */}
        <div className="bg-white rounded-2xl p-4 border border-[#EEEEEE]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-600">{t('cashOut')}</span>
            <ArrowUpRight className="w-4 h-4 text-[#E53935]" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-neutral-900 tabular-nums mt-2">
            -{activeBusiness.currencySymbol}{totalCashOut.toLocaleString()}
          </p>
          <p className="text-[10px] text-neutral-400 mt-0.5">Purchases & Expenses</p>
        </div>

        {/* Net Receivables - Payables */}
        <div className="bg-white rounded-2xl p-4 border border-[#EEEEEE]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-600">Net Due Position</span>
            <Scale className="w-4 h-4 text-neutral-500" />
          </div>
          <p className={`text-xl sm:text-2xl font-black tabular-nums mt-2 ${
            totalReceivables >= totalPayables ? 'text-emerald-700' : 'text-[#E53935]'
          }`}>
            {activeBusiness.currencySymbol}{(totalReceivables - totalPayables).toLocaleString()}
          </p>
          <p className="text-[10px] text-neutral-400 mt-0.5">
            Rec: ৳{totalReceivables.toLocaleString()} · Pay: ৳{totalPayables.toLocaleString()}
          </p>
        </div>
      </div>

      {/* ===================== SUB-TAB 1: DAILY CASHBOOK ===================== */}
      {activeSubTab === 'cashbook' && (
        <div className="bg-white rounded-2xl p-5 border border-[#EEEEEE] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100">
            <div>
              <h3 className="text-sm font-bold text-neutral-900">{t('cashbook')}</h3>
              <p className="text-xs text-neutral-500">Chronological transaction flow of all cash inflows and outflows</p>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-medium">
              <span className="text-neutral-400 mr-1">Filter:</span>
              {(['all', 'today', 'month'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setDateFilter(mode)}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer capitalize ${
                    dateFilter === mode
                      ? 'bg-[#E53935] text-white font-bold'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-400 font-medium">
                  <th className="py-2.5 px-3">{t('date')}</th>
                  <th className="py-2.5 px-3">Description / Party</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3 text-center">Channel</th>
                  <th className="py-2.5 px-3 text-right">Cash In (+)</th>
                  <th className="py-2.5 px-3 text-right">Cash Out (-)</th>
                  <th className="py-2.5 px-3 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredCashbook.map((entry) => (
                  <tr key={entry.id} className="hover:bg-neutral-50/70 transition-colors">
                    <td className="py-3 px-3 text-neutral-500 tabular-nums">{entry.date}</td>
                    <td className="py-3 px-3 font-semibold text-neutral-900 max-w-xs truncate">
                      {entry.description}
                    </td>
                    <td className="py-3 px-3 text-neutral-600">{entry.category}</td>
                    <td className="py-3 px-3 text-center">
                      <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded bg-neutral-100 text-neutral-700">
                        {entry.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-black text-emerald-600 tabular-nums">
                      {entry.type === 'in' ? `+৳${entry.amount.toLocaleString()}` : '-'}
                    </td>
                    <td className="py-3 px-3 text-right font-black text-[#E53935] tabular-nums">
                      {entry.type === 'out' ? `-৳${entry.amount.toLocaleString()}` : '-'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-neutral-900 tabular-nums">
                      ৳{entry.balanceAfter.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================== SUB-TAB 2: GENERAL JOURNAL / LEDGER ===================== */}
      {activeSubTab === 'journal' && (
        <div className="bg-white rounded-2xl p-5 border border-[#EEEEEE] space-y-4">
          <div className="pb-3 border-b border-neutral-100">
            <h3 className="text-sm font-bold text-neutral-900">{t('generalLedger')}</h3>
            <p className="text-xs text-neutral-500">
              Double-entry bookkeeping journal entries showing corresponding Debit and Credit transactions
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-400 font-medium">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Account & Explanation</th>
                  <th className="py-2.5 px-3 text-right">Debit (৳)</th>
                  <th className="py-2.5 px-3 text-right">Credit (৳)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {cashbook.map((entry) => (
                  <tr key={entry.id} className="hover:bg-neutral-50/70">
                    <td className="py-3 px-3 text-neutral-500 tabular-nums align-top">{entry.date}</td>
                    <td className="py-3 px-3">
                      {entry.type === 'in' ? (
                        <>
                          <p className="font-bold text-neutral-900">
                            Cash / {entry.paymentMethod.toUpperCase()} Account (Dr)
                          </p>
                          <p className="pl-4 text-neutral-600 font-medium">
                            To {entry.category} (Cr)
                          </p>
                          <p className="text-[10px] text-neutral-400 pl-4 mt-0.5">
                            ({entry.description})
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="font-bold text-neutral-900">
                            {entry.category} Expense / Payable (Dr)
                          </p>
                          <p className="pl-4 text-neutral-600 font-medium">
                            To Cash / {entry.paymentMethod.toUpperCase()} Account (Cr)
                          </p>
                          <p className="text-[10px] text-neutral-400 pl-4 mt-0.5">
                            ({entry.description})
                          </p>
                        </>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-black font-mono tabular-nums text-neutral-900 align-top">
                      ৳{entry.amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-black font-mono tabular-nums text-neutral-900 align-top">
                      ৳{entry.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================== SUB-TAB 3: CHANNEL BALANCES ===================== */}
      {activeSubTab === 'balances' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-[#EEEEEE] flex flex-col justify-between shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-neutral-800">Physical Cash Drawer</span>
              <Wallet className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="mt-4">
              <p className="text-2xl font-black text-neutral-900 tabular-nums font-mono">
                ৳{channelBalances.cash.toLocaleString()}
              </p>
              <p className="text-[11px] text-neutral-400 mt-1">Cash in hand float</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#EEEEEE] flex flex-col justify-between shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-neutral-800">bKash Merchant</span>
              <Smartphone className="w-5 h-5 text-pink-600" />
            </div>
            <div className="mt-4">
              <p className="text-2xl font-black text-neutral-900 tabular-nums font-mono">
                ৳{channelBalances.bkash.toLocaleString()}
              </p>
              <p className="text-[11px] text-neutral-400 mt-1">bKash Wallet balance</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#EEEEEE] flex flex-col justify-between shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-neutral-800">Nagad Merchant</span>
              <Smartphone className="w-5 h-5 text-orange-600" />
            </div>
            <div className="mt-4">
              <p className="text-2xl font-black text-neutral-900 tabular-nums font-mono">
                ৳{channelBalances.nagad.toLocaleString()}
              </p>
              <p className="text-[11px] text-neutral-400 mt-1">Nagad Wallet balance</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#EEEEEE] flex flex-col justify-between shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-neutral-800">Bank Accounts</span>
              <Building className="w-5 h-5 text-blue-600" />
            </div>
            <div className="mt-4">
              <p className="text-2xl font-black text-neutral-900 tabular-nums font-mono">
                ৳{channelBalances.bank.toLocaleString()}
              </p>
              <p className="text-[11px] text-neutral-400 mt-1">City Bank / BRAC Bank</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
