import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  FileSpreadsheet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Users,
  Truck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { db } from '../../services/db';

type ReportType =
  | 'pnl'
  | 'daily_sales'
  | 'purchases'
  | 'stock_valuation'
  | 'customer_dues'
  | 'supplier_dues'
  | 'cash_flow';

export const ReportsView: React.FC = () => {
  const { activeBusiness, lang, t, dataVersion, showToast } = useApp();

  const [activeReport, setActiveReport] = useState<ReportType>('pnl');

  // Raw data
  const sales = useMemo(() => db.getSales(activeBusiness.id), [activeBusiness.id, dataVersion]);
  const purchases = useMemo(() => db.getPurchases(activeBusiness.id), [activeBusiness.id, dataVersion]);
  const expenses = useMemo(() => db.getExpenses(activeBusiness.id), [activeBusiness.id, dataVersion]);
  const incomes = useMemo(() => db.getIncomes(activeBusiness.id), [activeBusiness.id, dataVersion]);
  const products = useMemo(() => db.getProducts(activeBusiness.id), [activeBusiness.id, dataVersion]);
  const customers = useMemo(() => db.getCustomers(activeBusiness.id), [activeBusiness.id, dataVersion]);
  const suppliers = useMemo(() => db.getSuppliers(activeBusiness.id), [activeBusiness.id, dataVersion]);
  const cashbook = useMemo(() => db.getCashbook(activeBusiness.id), [activeBusiness.id, dataVersion]);

  // Financial aggregates
  const totalRevenue = sales.reduce((sum, s) => sum + s.grandTotal, 0);
  const totalCOGS = sales.reduce((cogs, s) => {
    return (
      cogs +
      s.items.reduce(
        (ic, item) => ic + item.quantity * (item.purchasePrice || item.unitPrice * 0.8),
        0
      )
    );
  }, 0);
  const grossProfit = totalRevenue - totalCOGS;
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
  const netProfit = grossProfit + totalIncome - totalExpenses;

  // Stock valuation
  const stockCostValue = products.reduce((sum, p) => sum + p.stock * p.purchasePrice, 0);
  const stockRetailValue = products.reduce((sum, p) => sum + p.stock * p.sellingPrice, 0);
  const projectedInventoryMargin = stockRetailValue - stockCostValue;

  // Receivables & Payables
  const totalCustomerDues = customers.reduce((sum, c) => sum + c.currentDue, 0);
  const totalSupplierDues = suppliers.reduce((sum, s) => sum + s.currentDue, 0);

  // Aggregate metrics
  const totalSalesPaid = sales.reduce((sum, s) => sum + s.paidAmount, 0);
  const totalSalesDue = sales.reduce((sum, s) => sum + s.dueAmount, 0);
  const totalItemsSold = sales.reduce((sum, s) => sum + s.items.reduce((acc, it) => acc + it.quantity, 0), 0);
  const totalPurchasesAmount = purchases.reduce((sum, p) => sum + p.grandTotal, 0);
  const totalPurchasesPaid = purchases.reduce((sum, p) => sum + p.paidAmount, 0);
  const totalPurchasesDue = purchases.reduce((sum, p) => sum + p.dueAmount, 0);
  const cashInTotal = cashbook.filter((c) => c.type === 'in').reduce((sum, c) => sum + c.amount, 0);
  const cashOutTotal = cashbook.filter((c) => c.type === 'out').reduce((sum, c) => sum + c.amount, 0);
  const netCashDelta = cashInTotal - cashOutTotal;

  // Export to CSV helper
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';

    if (activeReport === 'pnl') {
      csvContent += 'Financial Metric,Amount (BDT)\n';
      csvContent += `Sales Revenue,${totalRevenue}\n`;
      csvContent += `Cost of Goods Sold (COGS),${totalCOGS}\n`;
      csvContent += `Gross Profit,${grossProfit}\n`;
      csvContent += `Operating Expenses,${totalExpenses}\n`;
      csvContent += `Other Income,${totalIncome}\n`;
      csvContent += `Net Profit,${netProfit}\n`;
    } else if (activeReport === 'daily_sales') {
      csvContent += 'Invoice No,Date,Customer Name,Items Count,Subtotal,Discount,VAT,Grand Total,Paid,Due,Payment Method\n';
      sales.forEach((s) => {
        csvContent += `"${s.invoiceNo}","${s.date}","${s.customerName || 'Walk-in'}",${s.items.length},${s.subtotal},${s.discount},${s.vat},${s.grandTotal},${s.paidAmount},${s.dueAmount},"${s.paymentMethod}"\n`;
      });
    } else if (activeReport === 'purchases') {
      csvContent += 'Purchase No,Date,Supplier,Items Count,Total Amount,Paid Amount,Due Amount\n';
      purchases.forEach((p) => {
        csvContent += `"${p.purchaseNo}","${p.date}","${p.supplierName}",${p.items.length},${p.grandTotal},${p.paidAmount},${p.dueAmount}\n`;
      });
    } else if (activeReport === 'stock_valuation') {
      csvContent += 'Product Name,SKU,Stock,Cost Price,Retail Price,Total Cost Value,Total Retail Value\n';
      products.forEach((p) => {
        csvContent += `"${p.name}","${p.sku}",${p.stock},${p.purchasePrice},${p.sellingPrice},${
          p.stock * p.purchasePrice
        },${p.stock * p.sellingPrice}\n`;
      });
    } else if (activeReport === 'customer_dues') {
      csvContent += 'Customer Name,Phone,Address,Total Purchases,Total Paid,Current Due\n';
      customers.forEach((c) => {
        csvContent += `"${c.name}","${c.phone}","${c.address}",${c.totalPurchases},${c.totalPaid},${c.currentDue}\n`;
      });
    } else if (activeReport === 'supplier_dues') {
      csvContent += 'Supplier Name,Company,Phone,Address,Total Purchases,Total Paid,Current Due\n';
      suppliers.forEach((s) => {
        csvContent += `"${s.name}","${s.company}","${s.phone}","${s.address}",${s.totalPurchases},${s.totalPaid},${s.currentDue}\n`;
      });
    } else if (activeReport === 'cash_flow') {
      csvContent += 'Date,Type,Particulars,Category,Payment Channel,Inflow,Outflow\n';
      cashbook.forEach((c) => {
        csvContent += `"${c.date}","${c.type.toUpperCase()}","${c.description}","${c.category}","${c.paymentMethod}",${
          c.type === 'in' ? c.amount : 0
        },${c.type === 'out' ? c.amount : 0}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${activeReport}_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Report CSV downloaded!', 'success');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-[#EEEEEE]">
        <div>
          <h2 className="text-lg font-bold text-neutral-900">{t('reports')}</h2>
          <p className="text-xs text-neutral-500">
            {lang === 'bn'
              ? 'লাভ-ক্ষতি, বিক্রয়, স্টক মূল্যায়ন ও বকেয়া রিপোর্ট'
              : 'Exportable audits, profit & loss statements, stock valuation, and balance sheets'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t('exportExcel')}</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#E53935] hover:bg-[#C62828] text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{t('print')}</span>
          </button>
        </div>
      </div>

      {/* Report Selector Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {(
          [
            { id: 'pnl', label: 'Profit & Loss (P&L)' },
            { id: 'daily_sales', label: 'Daily Sales Report' },
            { id: 'purchases', label: 'Purchase Report' },
            { id: 'stock_valuation', label: 'Stock Valuation' },
            { id: 'customer_dues', label: 'Customer Due Statement' },
            { id: 'supplier_dues', label: 'Supplier Payables' },
            { id: 'cash_flow', label: 'Cash Flow Register' },
          ] as const
        ).map((r) => (
          <button
            key={r.id}
            onClick={() => setActiveReport(r.id)}
            className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeReport === r.id
                ? 'bg-[#E53935] text-white shadow-xs'
                : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-[#EEEEEE]'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* ===================== REPORT 1: PROFIT & LOSS STATEMENT ===================== */}
      {activeReport === 'pnl' && (
        <div className="bg-white rounded-2xl p-6 border border-[#EEEEEE] space-y-6">
          <div className="border-b border-neutral-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-neutral-900">{t('profitLossStatement')}</h3>
              <p className="text-xs text-neutral-500">
                Period: Fiscal Year 2026 · {activeBusiness.name}
              </p>
            </div>
            <span className="font-mono text-xs text-neutral-400">Currency: BDT (৳)</span>
          </div>

          <div className="max-w-2xl mx-auto space-y-4 text-xs">
            {/* 1. Operating Revenue */}
            <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
              <div className="flex justify-between items-center text-sm font-bold text-neutral-900 pb-2 border-b border-neutral-200">
                <span>1. Operating Revenue</span>
                <span className="tabular-nums font-mono">৳{totalRevenue.toLocaleString()}</span>
              </div>
              <div className="mt-2 space-y-1.5 pl-4 text-neutral-600">
                <div className="flex justify-between">
                  <span>Gross Sales Invoices ({sales.length} orders)</span>
                  <span className="tabular-nums">৳{totalRevenue.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* 2. Cost of Goods Sold */}
            <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
              <div className="flex justify-between items-center text-sm font-bold text-neutral-900 pb-2 border-b border-neutral-200">
                <span>2. Cost of Goods Sold (COGS)</span>
                <span className="tabular-nums font-mono text-[#E53935]">
                  -৳{totalCOGS.toLocaleString()}
                </span>
              </div>
              <div className="mt-2 space-y-1.5 pl-4 text-neutral-600">
                <div className="flex justify-between">
                  <span>Purchase & Acquisition Cost of Sold Items</span>
                  <span className="tabular-nums">৳{totalCOGS.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Gross Profit Callout */}
            <div className="p-4 bg-[#FFF5F5] rounded-xl border border-red-200 flex justify-between items-center text-sm font-black text-neutral-900">
              <span>GROSS PROFIT (Margin: {totalRevenue > 0 ? Math.round((grossProfit / totalRevenue) * 100) : 0}%)</span>
              <span className="tabular-nums font-mono text-[#E53935] text-base">
                ৳{grossProfit.toLocaleString()}
              </span>
            </div>

            {/* 3. Operating Expenses */}
            <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
              <div className="flex justify-between items-center text-sm font-bold text-neutral-900 pb-2 border-b border-neutral-200">
                <span>3. Operating Overheads & Expenses</span>
                <span className="tabular-nums font-mono text-[#E53935]">
                  -৳{totalExpenses.toLocaleString()}
                </span>
              </div>
              <div className="mt-2 space-y-1.5 pl-4 text-neutral-600">
                {expenses.map((e) => (
                  <div key={e.id} className="flex justify-between">
                    <span>{e.category} ({e.date})</span>
                    <span className="tabular-nums">৳{e.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Non-Operating Income */}
            <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
              <div className="flex justify-between items-center text-sm font-bold text-neutral-900 pb-2 border-b border-neutral-200">
                <span>4. Other Non-Operating Incomes</span>
                <span className="tabular-nums font-mono text-emerald-600">
                  +৳{totalIncome.toLocaleString()}
                </span>
              </div>
              <div className="mt-2 space-y-1.5 pl-4 text-neutral-600">
                {incomes.map((i) => (
                  <div key={i.id} className="flex justify-between">
                    <span>{i.category} ({i.date})</span>
                    <span className="tabular-nums">৳{i.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Net Profit Final Bottom Line */}
            <div className="p-5 bg-neutral-900 text-white rounded-2xl flex justify-between items-center shadow-lg">
              <div>
                <span className="text-xs uppercase tracking-widest text-neutral-400 font-bold block">
                  Net Bottom Line
                </span>
                <span className="text-base font-black">NET PROFIT / (LOSS)</span>
              </div>
              <span className={`text-2xl font-black font-mono tabular-nums ${
                netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}>
                ৳{netProfit.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ===================== REPORT 2: STOCK VALUATION ===================== */}
      {activeReport === 'stock_valuation' && (
        <div className="bg-white rounded-2xl p-6 border border-[#EEEEEE] space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
              <p className="text-xs text-neutral-500 font-medium">Inventory Cost Asset Value</p>
              <p className="text-xl font-black text-neutral-900 tabular-nums mt-1">
                ৳{stockCostValue.toLocaleString()}
              </p>
            </div>
            <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
              <p className="text-xs text-neutral-500 font-medium">Expected Retail Value</p>
              <p className="text-xl font-black text-neutral-900 tabular-nums mt-1">
                ৳{stockRetailValue.toLocaleString()}
              </p>
            </div>
            <div className="p-4 bg-[#FFF5F5] rounded-xl border border-red-100">
              <p className="text-xs text-[#E53935] font-medium">Projected Margin</p>
              <p className="text-xl font-black text-[#E53935] tabular-nums mt-1">
                +৳{projectedInventoryMargin.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-400 font-medium">
                  <th className="py-2.5 px-3">Product</th>
                  <th className="py-2.5 px-3">SKU</th>
                  <th className="py-2.5 px-3 text-center">In Stock</th>
                  <th className="py-2.5 px-3 text-right">Cost Price</th>
                  <th className="py-2.5 px-3 text-right">Selling Price</th>
                  <th className="py-2.5 px-3 text-right">Valuation at Cost</th>
                  <th className="py-2.5 px-3 text-right">Valuation at Retail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-neutral-50/70">
                    <td className="py-3 px-3 font-bold text-neutral-900">{p.name}</td>
                    <td className="py-3 px-3 font-mono text-neutral-500">{p.sku}</td>
                    <td className="py-3 px-3 text-center tabular-nums font-bold">
                      {p.stock} {p.unit}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums">৳{p.purchasePrice}</td>
                    <td className="py-3 px-3 text-right tabular-nums">৳{p.sellingPrice}</td>
                    <td className="py-3 px-3 text-right font-bold tabular-nums text-neutral-800">
                      ৳{(p.stock * p.purchasePrice).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-black tabular-nums text-[#E53935]">
                      ৳{(p.stock * p.sellingPrice).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================== REPORT 3: CUSTOMER DUES ===================== */}
      {activeReport === 'customer_dues' && (
        <div className="bg-white rounded-2xl p-6 border border-[#EEEEEE] space-y-4">
          <div className="p-4 bg-[#FFF5F5] rounded-xl border border-red-100 flex justify-between items-center">
            <div>
              <p className="text-xs font-bold text-[#E53935] uppercase">Total Market Receivables</p>
              <p className="text-2xl font-black text-[#E53935] tabular-nums mt-0.5">
                ৳{totalCustomerDues.toLocaleString()}
              </p>
            </div>
            <Users className="w-6 h-6 text-[#E53935]" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-400 font-medium">
                  <th className="py-2.5 px-3">Customer Name</th>
                  <th className="py-2.5 px-3">Mobile</th>
                  <th className="py-2.5 px-3">Address</th>
                  <th className="py-2.5 px-3 text-right">Purchased</th>
                  <th className="py-2.5 px-3 text-right">Paid</th>
                  <th className="py-2.5 px-3 text-right">Current Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-neutral-50/70">
                    <td className="py-3 px-3 font-bold text-neutral-900">{c.name}</td>
                    <td className="py-3 px-3 font-mono text-neutral-600">{c.phone}</td>
                    <td className="py-3 px-3 text-neutral-500">{c.address}</td>
                    <td className="py-3 px-3 text-right tabular-nums">৳{c.totalPurchases.toLocaleString()}</td>
                    <td className="py-3 px-3 text-right tabular-nums text-emerald-700">
                      ৳{c.totalPaid.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums font-black text-[#E53935]">
                      ৳{c.currentDue.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================== REPORT 4: DAILY SALES REPORT ===================== */}
      {activeReport === 'daily_sales' && (
        <div className="bg-white rounded-2xl p-6 border border-[#EEEEEE] space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
              <p className="text-xs text-neutral-500 font-medium">Total Invoiced Sales</p>
              <p className="text-xl font-black text-neutral-900 tabular-nums mt-1">
                ৳{totalRevenue.toLocaleString()}
              </p>
            </div>
            <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
              <p className="text-xs text-neutral-500 font-medium">Spot Cash Collected</p>
              <p className="text-xl font-black text-emerald-700 tabular-nums mt-1">
                ৳{totalSalesPaid.toLocaleString()}
              </p>
            </div>
            <div className="p-4 bg-[#FFF5F5] rounded-xl border border-red-100">
              <p className="text-xs text-[#E53935] font-medium">Due Receivables Created</p>
              <p className="text-xl font-black text-[#E53935] tabular-nums mt-1">
                ৳{totalSalesDue.toLocaleString()}
              </p>
            </div>
            <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
              <p className="text-xs text-neutral-500 font-medium">Total Quantity Sold</p>
              <p className="text-xl font-black text-neutral-900 tabular-nums mt-1">
                {totalItemsSold.toLocaleString()} pcs
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-400 font-medium">
                  <th className="py-2.5 px-3">Invoice No</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3 text-center">Items</th>
                  <th className="py-2.5 px-3 text-center">Channel</th>
                  <th className="py-2.5 px-3 text-right">Grand Total</th>
                  <th className="py-2.5 px-3 text-right">Paid</th>
                  <th className="py-2.5 px-3 text-right">Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {sales.map((s) => (
                  <tr key={s.id} className="hover:bg-neutral-50/70">
                    <td className="py-3 px-3 font-mono font-bold text-neutral-900">{s.invoiceNo}</td>
                    <td className="py-3 px-3 tabular-nums text-neutral-500">{s.date}</td>
                    <td className="py-3 px-3 font-medium text-neutral-800">{s.customerName || 'Walk-in Customer'}</td>
                    <td className="py-3 px-3 text-center tabular-nums">{s.items.length}</td>
                    <td className="py-3 px-3 text-center uppercase font-mono text-[10px] text-neutral-600">
                      {s.paymentMethod}
                    </td>
                    <td className="py-3 px-3 text-right font-bold tabular-nums text-neutral-900">
                      ৳{s.grandTotal.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-bold tabular-nums text-emerald-700">
                      ৳{s.paidAmount.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums">
                      {s.dueAmount > 0 ? (
                        <span className="font-bold text-[#E53935]">৳{s.dueAmount.toLocaleString()}</span>
                      ) : (
                        <span className="text-neutral-400">Paid</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================== REPORT 5: PURCHASES REPORT ===================== */}
      {activeReport === 'purchases' && (
        <div className="bg-white rounded-2xl p-6 border border-[#EEEEEE] space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
              <p className="text-xs text-neutral-500 font-medium">Total Sourced Volume</p>
              <p className="text-xl font-black text-neutral-900 tabular-nums mt-1">
                ৳{totalPurchasesAmount.toLocaleString()}
              </p>
            </div>
            <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
              <p className="text-xs text-neutral-500 font-medium">Paid to Suppliers</p>
              <p className="text-xl font-black text-emerald-700 tabular-nums mt-1">
                ৳{totalPurchasesPaid.toLocaleString()}
              </p>
            </div>
            <div className="p-4 bg-[#FFF5F5] rounded-xl border border-red-100">
              <p className="text-xs text-[#E53935] font-medium">Outstanding Payables</p>
              <p className="text-xl font-black text-[#E53935] tabular-nums mt-1">
                ৳{totalPurchasesDue.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-400 font-medium">
                  <th className="py-2.5 px-3">Purchase No</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Supplier & Firm</th>
                  <th className="py-2.5 px-3 text-center">Items</th>
                  <th className="py-2.5 px-3 text-right">Total Bill</th>
                  <th className="py-2.5 px-3 text-right">Paid</th>
                  <th className="py-2.5 px-3 text-right">Remaining Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {purchases.map((p) => (
                  <tr key={p.id} className="hover:bg-neutral-50/70">
                    <td className="py-3 px-3 font-mono font-bold text-neutral-900">{p.purchaseNo}</td>
                    <td className="py-3 px-3 tabular-nums text-neutral-500">{p.date}</td>
                    <td className="py-3 px-3 font-medium text-neutral-800">{p.supplierName}</td>
                    <td className="py-3 px-3 text-center tabular-nums">{p.items.length}</td>
                    <td className="py-3 px-3 text-right font-bold tabular-nums text-neutral-900">
                      ৳{p.grandTotal.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-bold tabular-nums text-emerald-700">
                      ৳{p.paidAmount.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums">
                      {p.dueAmount > 0 ? (
                        <span className="font-bold text-[#E53935]">৳{p.dueAmount.toLocaleString()}</span>
                      ) : (
                        <span className="text-neutral-400">Paid in Full</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================== REPORT 6: SUPPLIER DUES REPORT ===================== */}
      {activeReport === 'supplier_dues' && (
        <div className="bg-white rounded-2xl p-6 border border-[#EEEEEE] space-y-4">
          <div className="p-4 bg-[#FFF5F5] rounded-xl border border-red-100 flex justify-between items-center">
            <div>
              <p className="text-xs font-bold text-[#E53935] uppercase">Total Outstanding Supplier Payables</p>
              <p className="text-2xl font-black text-[#E53935] tabular-nums mt-0.5">
                ৳{totalSupplierDues.toLocaleString()}
              </p>
            </div>
            <Truck className="w-6 h-6 text-[#E53935]" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-400 font-medium">
                  <th className="py-2.5 px-3">Supplier Name & Company</th>
                  <th className="py-2.5 px-3">Phone</th>
                  <th className="py-2.5 px-3">Depot / Address</th>
                  <th className="py-2.5 px-3 text-right">Total Sourced</th>
                  <th className="py-2.5 px-3 text-right">Total Paid</th>
                  <th className="py-2.5 px-3 text-right">Payable Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {suppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-neutral-50/70">
                    <td className="py-3 px-3">
                      <p className="font-bold text-neutral-900">{s.name}</p>
                      <p className="text-[11px] text-neutral-500">{s.company}</p>
                    </td>
                    <td className="py-3 px-3 font-mono text-neutral-600">{s.phone}</td>
                    <td className="py-3 px-3 text-neutral-500">{s.address}</td>
                    <td className="py-3 px-3 text-right tabular-nums">৳{s.totalPurchases.toLocaleString()}</td>
                    <td className="py-3 px-3 text-right tabular-nums text-emerald-700">
                      ৳{s.totalPaid.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums font-black text-[#E53935]">
                      ৳{s.currentDue.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================== REPORT 7: CASH FLOW REGISTER ===================== */}
      {activeReport === 'cash_flow' && (
        <div className="bg-white rounded-2xl p-6 border border-[#EEEEEE] space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
              <p className="text-xs text-emerald-700 font-medium">Total Cash Inflow (+)</p>
              <p className="text-xl font-black text-emerald-700 tabular-nums mt-1">
                +৳{cashInTotal.toLocaleString()}
              </p>
            </div>
            <div className="p-4 bg-red-50 rounded-xl border border-red-100">
              <p className="text-xs text-red-700 font-medium">Total Cash Outflow (-)</p>
              <p className="text-xl font-black text-red-700 tabular-nums mt-1">
                -৳{cashOutTotal.toLocaleString()}
              </p>
            </div>
            <div className="p-4 bg-neutral-900 text-white rounded-xl shadow-xs">
              <p className="text-xs text-neutral-400 font-medium">Net Operating Cash Balance</p>
              <p className={`text-xl font-black tabular-nums mt-1 ${netCashDelta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {netCashDelta >= 0 ? '+' : ''}৳{netCashDelta.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-400 font-medium">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Particulars / Party</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3 text-center">Payment Channel</th>
                  <th className="py-2.5 px-3 text-right">Inflow (+)</th>
                  <th className="py-2.5 px-3 text-right">Outflow (-)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {cashbook.map((cb) => (
                  <tr key={cb.id} className="hover:bg-neutral-50/70">
                    <td className="py-3 px-3 tabular-nums text-neutral-500">{cb.date}</td>
                    <td className="py-3 px-3 font-semibold text-neutral-900">{cb.description}</td>
                    <td className="py-3 px-3 text-neutral-600">{cb.category}</td>
                    <td className="py-3 px-3 text-center uppercase font-mono text-[10px] text-neutral-700">
                      {cb.paymentMethod}
                    </td>
                    <td className="py-3 px-3 text-right font-black tabular-nums text-emerald-600">
                      {cb.type === 'in' ? `+৳${cb.amount.toLocaleString()}` : '-'}
                    </td>
                    <td className="py-3 px-3 text-right font-black tabular-nums text-[#E53935]">
                      {cb.type === 'out' ? `-৳${cb.amount.toLocaleString()}` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
