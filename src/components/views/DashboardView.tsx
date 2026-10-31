import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  ShoppingBag,
  DollarSign,
  AlertTriangle,
  Package,
  Users,
  Truck,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Calendar,
  Filter,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { db } from '../../services/db';
import { Sale } from '../../types';

export const DashboardView: React.FC = () => {
  const { activeBusiness, setActiveTab, setSelectedInvoice, lang, t, dataVersion } = useApp();

  // Date filter state
  const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | 'week' | 'month' | 'year' | 'all'>('month');
  const [chartMetric, setChartMetric] = useState<'sales' | 'profit'>('sales');

  // Load raw data
  const sales = useMemo(() => db.getSales(activeBusiness.id), [activeBusiness.id, dataVersion]);
  const purchases = useMemo(() => db.getPurchases(activeBusiness.id), [activeBusiness.id, dataVersion]);
  const expenses = useMemo(() => db.getExpenses(activeBusiness.id), [activeBusiness.id, dataVersion]);
  const incomes = useMemo(() => db.getIncomes(activeBusiness.id), [activeBusiness.id, dataVersion]);
  const products = useMemo(() => db.getProducts(activeBusiness.id), [activeBusiness.id, dataVersion]);
  const customers = useMemo(() => db.getCustomers(activeBusiness.id), [activeBusiness.id, dataVersion]);
  const suppliers = useMemo(() => db.getSuppliers(activeBusiness.id), [activeBusiness.id, dataVersion]);

  // Date filter helpers
  const todayStr = new Date().toISOString().split('T')[0];
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const thisMonthPrefix = todayStr.substring(0, 7); // YYYY-MM
  const thisYearPrefix = todayStr.substring(0, 4); // YYYY

  // Filter transactions based on selected date
  const isDateMatch = (dateStr: string) => {
    if (dateFilter === 'all') return true;
    if (dateFilter === 'today') return dateStr === todayStr;
    if (dateFilter === 'yesterday') return dateStr === yesterdayStr;
    if (dateFilter === 'month') return dateStr.startsWith(thisMonthPrefix);
    if (dateFilter === 'year') return dateStr.startsWith(thisYearPrefix);
    if (dateFilter === 'week') {
      const d = new Date(dateStr).getTime();
      const now = Date.now();
      return now - d <= 7 * 86400000;
    }
    return true;
  };

  const filteredSales = sales.filter((s) => isDateMatch(s.date));
  const filteredPurchases = purchases.filter((p) => isDateMatch(p.date));
  const filteredExpenses = expenses.filter((e) => isDateMatch(e.date));
  const filteredIncomes = incomes.filter((i) => isDateMatch(i.date));

  // Financial aggregates
  const totalSalesAmount = filteredSales.reduce((sum, s) => sum + s.grandTotal, 0);
  const totalPurchasesAmount = filteredPurchases.reduce((sum, p) => sum + p.grandTotal, 0);
  const totalIncomeAmount = filteredIncomes.reduce((sum, i) => sum + i.amount, 0);
  const totalExpenseAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Profit calculation (Revenue - Cost of Goods Sold)
  const totalCOGS = filteredSales.reduce((cogs, s) => {
    const saleCost = s.items.reduce(
      (itemCost, item) => itemCost + item.quantity * (item.purchasePrice || item.unitPrice * 0.8),
      0
    );
    return cogs + saleCost;
  }, 0);

  const grossProfit = totalSalesAmount - totalCOGS;
  const netProfit = grossProfit + totalIncomeAmount - totalExpenseAmount;

  // Receivables & Payables
  const totalCustomerDue = customers.reduce((sum, c) => sum + c.currentDue, 0);
  const totalSupplierDue = suppliers.reduce((sum, s) => sum + s.currentDue, 0);

  // Low stock products
  const lowStockProducts = products.filter((p) => p.stock <= p.minStockAlert);

  // Daily sales chart data points (last 7 days)
  const chartDays = useMemo(() => {
    const days: { label: string; date: string; sales: number; profit: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const dateStr = d.toISOString().split('T')[0];
      const daySales = sales.filter((s) => s.date === dateStr);
      const dayTotal = daySales.reduce((sum, s) => sum + s.grandTotal, 0);
      const dayCost = daySales.reduce(
        (sum, s) =>
          sum +
          s.items.reduce((ic, item) => ic + item.quantity * (item.purchasePrice || item.unitPrice * 0.8), 0),
        0
      );
      const dayName = d.toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', { weekday: 'short' });
      days.push({
        label: `${dayName} ${d.getDate()}`,
        date: dateStr,
        sales: dayTotal,
        profit: dayTotal - dayCost,
      });
    }
    return days;
  }, [sales, lang]);

  const maxChartVal = Math.max(1, ...chartDays.map((d) => (chartMetric === 'sales' ? d.sales : d.profit)));

  return (
    <div className="space-y-6">
      {/* Top Banner: Date filter bar and Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-[#EEEEEE]">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-neutral-900 tracking-tight">
            {lang === 'bn' ? 'ব্যবসায়িক ড্যাশবোর্ড' : 'Executive Business Overview'}
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            {lang === 'bn'
              ? 'দৈনিক ও মাসিক আর্থিক গতিবিধি, মজুদ এবং বকেয়া হিসাব'
              : 'Real-time sales, profitability, cash flow, and stock monitoring'}
          </p>
        </div>

        {/* Date Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-xl overflow-x-auto text-xs font-medium">
          {(['today', 'yesterday', 'week', 'month', 'year', 'all'] as const).map((filterKey) => (
            <button
              key={filterKey}
              onClick={() => setDateFilter(filterKey)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                dateFilter === filterKey
                  ? 'bg-white text-[#E53935] font-bold shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              {t(filterKey as any)}
            </button>
          ))}
        </div>
      </div>

      {/* Main KPI Stat Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Total Sales */}
        <div className="bg-[#FFF5F5] rounded-2xl p-4 sm:p-5 border border-red-100 transition-all hover:border-red-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-600">{t('totalSales')}</span>
            <div className="w-8 h-8 rounded-lg bg-red-100 text-[#E53935] flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-3 text-lg sm:text-2xl font-black text-neutral-900 tabular-nums">
            {activeBusiness.currencySymbol}{totalSalesAmount.toLocaleString()}
          </p>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>{filteredSales.length} {lang === 'bn' ? 'টি চালান' : 'Invoices'}</span>
          </div>
        </div>

        {/* Total Purchases */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#EEEEEE] transition-all hover:border-neutral-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-600">{t('totalPurchases')}</span>
            <div className="w-8 h-8 rounded-lg bg-neutral-100 text-neutral-700 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-3 text-lg sm:text-2xl font-black text-neutral-900 tabular-nums">
            {activeBusiness.currencySymbol}{totalPurchasesAmount.toLocaleString()}
          </p>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-neutral-500">
            <span>{filteredPurchases.length} {lang === 'bn' ? 'টি অর্ডার' : 'Purchases'}</span>
          </div>
        </div>

        {/* Net Profit */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#EEEEEE] transition-all hover:border-neutral-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-600">{t('netProfit')}</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              netProfit >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-[#E53935]'
            }`}>
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className={`mt-3 text-lg sm:text-2xl font-black tabular-nums ${
            netProfit >= 0 ? 'text-emerald-600' : 'text-[#E53935]'
          }`}>
            {activeBusiness.currencySymbol}{netProfit.toLocaleString()}
          </p>
          <div className="mt-1 text-[11px] text-neutral-500">
            <span>{t('grossProfit')}: {activeBusiness.currencySymbol}{grossProfit.toLocaleString()}</span>
          </div>
        </div>

        {/* Customer Due (Receivable) */}
        <div className="bg-[#FFF5F5] rounded-2xl p-4 sm:p-5 border border-red-100 transition-all hover:border-red-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#E53935]">{t('customerDue')}</span>
            <div className="w-8 h-8 rounded-lg bg-[#E53935] text-white flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-3 text-lg sm:text-2xl font-black text-[#E53935] tabular-nums">
            {activeBusiness.currencySymbol}{totalCustomerDue.toLocaleString()}
          </p>
          <button
            onClick={() => setActiveTab('customers')}
            className="mt-1 text-[11px] font-semibold text-[#E53935] hover:underline cursor-pointer flex items-center gap-1"
          >
            <span>{t('collectDue')}</span>
            <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Secondary Metric Strip: Supplier Due, Total Products, Expenses, Incomes */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Supplier Due */}
        <div className="bg-white rounded-xl p-3.5 border border-[#EEEEEE] flex items-center justify-between">
          <div>
            <p className="text-[11px] text-neutral-500">{t('supplierDue')}</p>
            <p className="text-base font-bold text-neutral-900 tabular-nums mt-0.5">
              {activeBusiness.currencySymbol}{totalSupplierDue.toLocaleString()}
            </p>
          </div>
          <Truck className="w-4 h-4 text-neutral-400" />
        </div>

        {/* Total Products & Low stock badge */}
        <div className="bg-white rounded-xl p-3.5 border border-[#EEEEEE] flex items-center justify-between">
          <div>
            <p className="text-[11px] text-neutral-500">{t('totalProducts')}</p>
            <p className="text-base font-bold text-neutral-900 tabular-nums mt-0.5">
              {products.length} {lang === 'bn' ? 'টি আইটেম' : 'Items'}
            </p>
          </div>
          {lowStockProducts.length > 0 ? (
            <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
              {lowStockProducts.length} {lang === 'bn' ? 'স্বল্প' : 'Low'}
            </span>
          ) : (
            <Package className="w-4 h-4 text-neutral-400" />
          )}
        </div>

        {/* Total Other Income */}
        <div className="bg-white rounded-xl p-3.5 border border-[#EEEEEE] flex items-center justify-between">
          <div>
            <p className="text-[11px] text-neutral-500">{t('totalIncome')}</p>
            <p className="text-base font-bold text-emerald-600 tabular-nums mt-0.5">
              +{activeBusiness.currencySymbol}{totalIncomeAmount.toLocaleString()}
            </p>
          </div>
          <TrendingUp className="w-4 h-4 text-emerald-500" />
        </div>

        {/* Total Expenses */}
        <div className="bg-white rounded-xl p-3.5 border border-[#EEEEEE] flex items-center justify-between">
          <div>
            <p className="text-[11px] text-neutral-500">{t('totalExpenses')}</p>
            <p className="text-base font-bold text-neutral-900 tabular-nums mt-0.5">
              -{activeBusiness.currencySymbol}{totalExpenseAmount.toLocaleString()}
            </p>
          </div>
          <TrendingDown className="w-4 h-4 text-[#E53935]" />
        </div>
      </div>

      {/* Charts & Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Sales & Profit Visual Bar Chart (2 columns) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 sm:p-6 border border-[#EEEEEE]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-100">
            <div>
              <h3 className="text-sm font-bold text-neutral-900">{t('salesOverview')} (7 Days)</h3>
              <p className="text-xs text-neutral-500">
                {lang === 'bn' ? 'গত ৭ দিনের বিক্রয় এবং মুনাফার চিত্র' : 'Daily revenue performance and margins'}
              </p>
            </div>

            <div className="flex items-center gap-1.5 bg-neutral-100 p-1 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setChartMetric('sales')}
                className={`px-3 py-1 rounded-md transition-all ${
                  chartMetric === 'sales'
                    ? 'bg-white text-[#E53935] shadow-xs font-bold'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Revenue (৳)
              </button>
              <button
                onClick={() => setChartMetric('profit')}
                className={`px-3 py-1 rounded-md transition-all ${
                  chartMetric === 'profit'
                    ? 'bg-white text-[#E53935] shadow-xs font-bold'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Profit (৳)
              </button>
            </div>
          </div>

          {/* Interactive Chart Canvas Simulation using Styled SVG */}
          <div className="mt-6 h-64 flex items-end justify-between gap-2 sm:gap-4 pt-6 pb-2 px-2 border-b border-neutral-200">
            {chartDays.map((d, idx) => {
              const val = chartMetric === 'sales' ? d.sales : d.profit;
              const heightPct = Math.max(8, Math.round((val / maxChartVal) * 100));

              return (
                <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-10 bg-neutral-900 text-white text-[10px] py-1 px-2 rounded font-mono pointer-events-none whitespace-nowrap z-10 shadow-lg">
                    {d.label}: ৳{val.toLocaleString()}
                  </div>

                  {/* Bar */}
                  <div
                    style={{ height: `${heightPct}%` }}
                    className={`w-full max-w-[42px] rounded-t-lg transition-all duration-300 ${
                      chartMetric === 'sales'
                        ? 'bg-[#E53935] group-hover:bg-[#C62828]'
                        : 'bg-emerald-500 group-hover:bg-emerald-600'
                    }`}
                  />
                  <span className="text-[10px] text-neutral-500 mt-2 font-medium truncate">
                    {d.label}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-4 text-xs text-neutral-500">
            <span className="flex items-center gap-1.5">
              <span className={`w-3 h-3 rounded-sm ${chartMetric === 'sales' ? 'bg-[#E53935]' : 'bg-emerald-500'}`} />
              <span>{chartMetric === 'sales' ? 'Gross Revenue' : 'Calculated Gross Profit'}</span>
            </span>
            <span className="font-mono">
              Peak: ৳{maxChartVal.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Low Stock Alerts Widget (1 column) */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#EEEEEE] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-neutral-900">{t('lowStockAlerts')}</h3>
              </div>
              <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                {lowStockProducts.length} {lang === 'bn' ? 'টি আইটেম' : 'Items'}
              </span>
            </div>

            <div className="mt-3 divide-y divide-neutral-100 overflow-y-auto max-h-56">
              {lowStockProducts.length === 0 ? (
                <div className="py-8 text-center text-xs text-neutral-400">
                  {lang === 'bn' ? 'সকল পণ্যের মজুদ পর্যাপ্ত রয়েছে।' : 'All products have adequate stock.'}
                </div>
              ) : (
                lowStockProducts.map((p) => (
                  <div key={p.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="truncate pr-2">
                      <p className="font-semibold text-neutral-800 truncate">{p.name}</p>
                      <p className="text-[10px] text-neutral-400 font-mono">
                        SKU: {p.sku} · Min: {p.minStockAlert} {p.unit}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="inline-block px-2 py-0.5 bg-red-50 text-[#E53935] font-black rounded text-[11px] tabular-nums">
                        {p.stock} {p.unit}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={() => setActiveTab('inventory')}
            className="mt-4 w-full py-2 text-xs font-semibold text-[#E53935] bg-[#FFF5F5] hover:bg-red-100/70 rounded-xl transition-colors text-center cursor-pointer"
          >
            {lang === 'bn' ? 'ইনভেন্টরি ও স্টক পরিচালনা করুন' : 'Manage Stock & Reorders'}
          </button>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#EEEEEE]">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
          <div>
            <h3 className="text-sm font-bold text-neutral-900">{t('recentTransactions')}</h3>
            <p className="text-xs text-neutral-500">
              {lang === 'bn' ? 'সর্বশেষ বিক্রয় চালানের বিস্তারিত বিবরণ' : 'Latest processed customer sales'}
            </p>
          </div>

          <button
            onClick={() => setActiveTab('sales')}
            className="text-xs font-semibold text-[#E53935] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>{t('invoiceList')}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto mt-2">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-neutral-200 text-neutral-400 font-medium">
                <th className="py-2.5 px-3">Invoice #</th>
                <th className="py-2.5 px-3">{t('date')}</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3 text-right">{t('amount')}</th>
                <th className="py-2.5 px-3 text-center">{t('paymentMethod')}</th>
                <th className="py-2.5 px-3 text-center">{t('status')}</th>
                <th className="py-2.5 px-3 text-right">{t('action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {sales.slice(0, 5).map((sale) => (
                <tr key={sale.id} className="hover:bg-neutral-50/60 transition-colors">
                  <td className="py-3 px-3 font-semibold text-neutral-900">{sale.invoiceNo}</td>
                  <td className="py-3 px-3 text-neutral-500 tabular-nums">{sale.date}</td>
                  <td className="py-3 px-3">
                    <p className="font-medium text-neutral-800">{sale.customerName}</p>
                    <p className="text-[10px] text-neutral-400">{sale.customerPhone || 'Walk-in'}</p>
                  </td>
                  <td className="py-3 px-3 text-right font-black text-neutral-900 tabular-nums">
                    {activeBusiness.currencySymbol}{sale.grandTotal.toLocaleString()}
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
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => setSelectedInvoice(sale)}
                      className="p-1.5 text-neutral-600 hover:text-[#E53935] hover:bg-[#FFF5F5] rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1"
                      title="View & Print Invoice"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline text-[11px] font-medium">{t('view')}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
