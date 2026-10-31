import React, { useState } from 'react';
import { X, Printer, Download, Share2, FileText, Receipt, CheckCircle } from 'lucide-react';
import { Sale, Business } from '../../types';
import { useApp } from '../../context/AppContext';

interface InvoiceModalProps {
  sale: Sale;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ sale, onClose }) => {
  const { activeBusiness, lang, t } = useApp();
  const [printFormat, setPrintFormat] = useState<'a4' | 'thermal'>(
    activeBusiness.receiptType.includes('thermal') ? 'thermal' : 'a4'
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Controls Header */}
        <div className="no-print flex items-center justify-between px-5 py-3.5 border-b border-neutral-200 bg-neutral-50/70">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-sm text-neutral-900">
              {t('invoiceNumber')} {sale.invoiceNo}
            </h3>

            {/* Toggle format: A4 vs Thermal */}
            <div className="flex items-center p-0.5 bg-neutral-200/80 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setPrintFormat('a4')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all ${
                  printFormat === 'a4'
                    ? 'bg-white text-[#E53935] shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>A4 Invoice</span>
              </button>
              <button
                onClick={() => setPrintFormat('thermal')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all ${
                  printFormat === 'thermal'
                    ? 'bg-white text-[#E53935] shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Thermal 80mm</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-[#E53935] hover:bg-[#C62828] rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{t('print')}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice Body Viewport */}
        <div className="overflow-y-auto p-4 sm:p-8 bg-neutral-100/60 flex justify-center">
          {/* ===================== FORMAT A: STANDARD A4 ===================== */}
          {printFormat === 'a4' && (
            <div
              id="printable-invoice"
              className="w-full max-w-[700px] bg-white p-6 sm:p-8 border border-neutral-200 shadow-sm text-neutral-900"
            >
              {/* Top Business Header */}
              <div className="flex items-start justify-between border-b-2 border-[#E53935] pb-5">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-[#E53935] tracking-tight">
                    {lang === 'bn' && activeBusiness.nameBn ? activeBusiness.nameBn : activeBusiness.name}
                  </h2>
                  <p className="text-xs text-neutral-600 mt-1 max-w-sm">
                    {lang === 'bn' && activeBusiness.addressBn ? activeBusiness.addressBn : activeBusiness.address}
                  </p>
                  <p className="text-xs text-neutral-600 mt-0.5">
                    Phone: {activeBusiness.phone} · Email: {activeBusiness.email}
                  </p>
                  {activeBusiness.binNumber && (
                    <p className="text-xs font-semibold text-neutral-700 mt-0.5">
                      BIN: {activeBusiness.binNumber}
                    </p>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <span className="inline-block px-3 py-1 bg-red-50 text-[#E53935] font-black text-xs uppercase tracking-wider rounded-md border border-red-200">
                    TAX INVOICE
                  </span>
                  <p className="text-xs font-bold text-neutral-800 mt-2">
                    {sale.invoiceNo}
                  </p>
                  <p className="text-xs text-neutral-500 tabular-nums">
                    Date: {sale.date}
                  </p>
                  <p className="text-[11px] text-neutral-400">
                    Served by: {sale.createdByName}
                  </p>
                </div>
              </div>

              {/* Bill To & Payment Info */}
              <div className="grid grid-cols-2 gap-4 my-5 p-3.5 bg-[#FFF5F5] rounded-xl border border-red-100 text-xs">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#E53935]">
                    Customer Information
                  </p>
                  <p className="font-bold text-neutral-900 mt-1 text-sm">{sale.customerName}</p>
                  <p className="text-neutral-600">{sale.customerPhone || 'N/A'}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#E53935]">
                    Payment Mode
                  </p>
                  <p className="font-bold uppercase text-neutral-900 mt-1">
                    {sale.paymentMethod} · {sale.paymentStatus.toUpperCase()}
                  </p>
                  <p className="text-neutral-500 text-[11px]">
                    Status:{' '}
                    <span
                      className={`font-semibold ${
                        sale.dueAmount > 0 ? 'text-[#E53935]' : 'text-emerald-700'
                      }`}
                    >
                      {sale.dueAmount > 0 ? `Due: ৳${sale.dueAmount}` : 'Fully Settled'}
                    </span>
                  </p>
                </div>
              </div>

              {/* Line Items Table */}
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-300 bg-neutral-50 text-neutral-600 font-bold">
                    <th className="py-2 px-2 w-10 text-center">#</th>
                    <th className="py-2 px-2">Item Description</th>
                    <th className="py-2 px-2 text-right">Unit Rate</th>
                    <th className="py-2 px-2 text-center">Qty</th>
                    <th className="py-2 px-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {sale.items.map((item, idx) => (
                    <tr key={item.productId + idx} className="hover:bg-neutral-50/50">
                      <td className="py-2.5 px-2 text-center text-neutral-400 tabular-nums">{idx + 1}</td>
                      <td className="py-2.5 px-2 font-medium text-neutral-900">
                        {item.productName}
                        {item.sku && (
                          <span className="block text-[10px] text-neutral-400 font-mono">
                            SKU: {item.sku}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-2 text-right tabular-nums">
                        {activeBusiness.currencySymbol}{item.unitPrice.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-2 text-center tabular-nums font-semibold">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="py-2.5 px-2 text-right tabular-nums font-bold">
                        {activeBusiness.currencySymbol}{item.total.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Summary Totals */}
              <div className="flex justify-between items-start mt-6 pt-4 border-t border-neutral-200">
                <div className="max-w-xs text-xs text-neutral-500">
                  <p className="font-semibold text-neutral-800">Terms & Notes:</p>
                  <p className="mt-0.5">
                    {lang === 'bn' && activeBusiness.invoiceNoteBn
                      ? activeBusiness.invoiceNoteBn
                      : activeBusiness.invoiceNote}
                  </p>
                  {sale.note && (
                    <p className="mt-2 text-neutral-600 bg-neutral-50 p-2 rounded border border-neutral-200">
                      <strong>Sale Remark:</strong> {sale.note}
                    </p>
                  )}
                </div>

                <div className="w-56 space-y-1.5 text-xs text-right">
                  <div className="flex justify-between text-neutral-600">
                    <span>Subtotal:</span>
                    <span className="tabular-nums font-medium">
                      {activeBusiness.currencySymbol}{sale.subtotal.toLocaleString()}
                    </span>
                  </div>
                  {sale.discount > 0 && (
                    <div className="flex justify-between text-[#E53935]">
                      <span>Discount:</span>
                      <span className="tabular-nums font-semibold">
                        -{activeBusiness.currencySymbol}{sale.discount.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {sale.vat > 0 && (
                    <div className="flex justify-between text-neutral-600">
                      <span>VAT / Tax:</span>
                      <span className="tabular-nums font-medium">
                        +{activeBusiness.currencySymbol}{sale.vat.toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-black text-neutral-900 pt-2 border-t border-neutral-300">
                    <span>Grand Total:</span>
                    <span className="tabular-nums text-[#E53935]">
                      {activeBusiness.currencySymbol}{sale.grandTotal.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-neutral-700 font-semibold pt-1">
                    <span>Paid Amount:</span>
                    <span className="tabular-nums">
                      {activeBusiness.currencySymbol}{sale.paidAmount.toLocaleString()}
                    </span>
                  </div>
                  {sale.dueAmount > 0 && (
                    <div className="flex justify-between text-[#E53935] font-black pt-1 border-t border-dashed border-red-200">
                      <span>Remaining Due:</span>
                      <span className="tabular-nums">
                        {activeBusiness.currencySymbol}{sale.dueAmount.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Signatures & Barcode footer */}
              <div className="mt-12 pt-6 border-t border-neutral-200 flex items-end justify-between text-[11px] text-neutral-500">
                <div className="text-center">
                  <div className="w-36 border-b border-neutral-400 mb-1"></div>
                  <span>Customer Signature</span>
                </div>
                <div className="text-center">
                  <p className="font-mono text-[9px] tracking-widest text-neutral-400">
                    * {sale.invoiceNo} *
                  </p>
                  <p className="text-[10px] text-neutral-400">Powered by HisabKhatiyan</p>
                </div>
                <div className="text-center">
                  <div className="w-36 border-b border-neutral-400 mb-1"></div>
                  <span>Authorized Signature</span>
                </div>
              </div>
            </div>
          )}

          {/* ===================== FORMAT B: THERMAL 80MM RECEIPT ===================== */}
          {printFormat === 'thermal' && (
            <div
              id="printable-invoice"
              className="w-full max-w-[340px] bg-white p-5 border border-dashed border-neutral-300 shadow-sm text-neutral-900 font-mono text-xs"
            >
              {/* Centered Thermal Header */}
              <div className="text-center pb-3 border-b border-dashed border-neutral-400">
                <h3 className="text-base font-black tracking-tight text-neutral-900">
                  {lang === 'bn' && activeBusiness.nameBn ? activeBusiness.nameBn : activeBusiness.name}
                </h3>
                <p className="text-[10px] mt-0.5 leading-tight">{activeBusiness.address}</p>
                <p className="text-[10px] mt-0.5">Tel: {activeBusiness.phone}</p>
                {activeBusiness.binNumber && (
                  <p className="text-[10px] font-bold">BIN: {activeBusiness.binNumber}</p>
                )}
                <div className="mt-2 pt-1 border-t border-dashed border-neutral-300 flex justify-between text-[10px]">
                  <span>Inv: {sale.invoiceNo}</span>
                  <span className="tabular-nums">{sale.date}</span>
                </div>
                <div className="flex justify-between text-[10px] text-neutral-600">
                  <span>Cust: {sale.customerName}</span>
                  <span>{sale.customerPhone || ''}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="py-3 border-b border-dashed border-neutral-400 space-y-2">
                {sale.items.map((item, idx) => (
                  <div key={idx} className="text-[11px]">
                    <div className="font-semibold">{item.productName}</div>
                    <div className="flex justify-between text-neutral-600 text-[10px] tabular-nums">
                      <span>
                        {item.quantity} {item.unit} x ৳{item.unitPrice}
                      </span>
                      <span className="font-bold text-neutral-900">
                        ৳{item.total.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="py-2.5 border-b border-dashed border-neutral-400 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="tabular-nums font-semibold">৳{sale.subtotal.toLocaleString()}</span>
                </div>
                {sale.discount > 0 && (
                  <div className="flex justify-between text-[#E53935]">
                    <span>Discount:</span>
                    <span className="tabular-nums">-৳{sale.discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-sm pt-1 border-t border-dashed border-neutral-300">
                  <span>TOTAL:</span>
                  <span className="tabular-nums">৳{sale.grandTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>PAID ({sale.paymentMethod.toUpperCase()}):</span>
                  <span className="tabular-nums">৳{sale.paidAmount.toLocaleString()}</span>
                </div>
                {sale.dueAmount > 0 && (
                  <div className="flex justify-between text-[#E53935] font-black">
                    <span>DUE:</span>
                    <span className="tabular-nums">৳{sale.dueAmount.toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Thermal Receipt Footer */}
              <div className="text-center pt-3 text-[10px] space-y-1 text-neutral-600">
                <p>
                  {lang === 'bn' && activeBusiness.invoiceNoteBn
                    ? activeBusiness.invoiceNoteBn
                    : activeBusiness.invoiceNote}
                </p>
                <p className="font-bold pt-1">*** THANK YOU ***</p>
                <div className="pt-2 font-mono text-[9px] tracking-widest text-neutral-400">
                  ||| | || ||||| | ||| |||| |
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
