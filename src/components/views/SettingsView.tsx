import React, { useState } from 'react';
import {
  Settings,
  Store,
  Receipt,
  Download,
  Upload,
  RefreshCw,
  Smartphone,
  Save,
  Check,
  Globe,
  Database,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { db } from '../../services/db';
import { Business } from '../../types';

export const SettingsView: React.FC = () => {
  const { activeBusiness, setActiveBusiness, lang, t, refreshData, showToast } = useApp();

  const [name, setName] = useState(activeBusiness.name);
  const [nameBn, setNameBn] = useState(activeBusiness.nameBn || '');
  const [phone, setPhone] = useState(activeBusiness.phone);
  const [email, setEmail] = useState(activeBusiness.email);
  const [address, setAddress] = useState(activeBusiness.address);
  const [addressBn, setAddressBn] = useState(activeBusiness.addressBn || '');
  const [currencySymbol, setCurrencySymbol] = useState(activeBusiness.currencySymbol || '৳');
  const [binNumber, setBinNumber] = useState(activeBusiness.binNumber || '');
  const [receiptType, setReceiptType] = useState<'a4' | 'thermal-80mm' | 'thermal-58mm'>(
    activeBusiness.receiptType || 'thermal-80mm'
  );
  const [invoiceNote, setInvoiceNote] = useState(activeBusiness.invoiceNote || '');
  const [invoiceNoteBn, setInvoiceNoteBn] = useState(activeBusiness.invoiceNoteBn || '');

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: Business = {
      ...activeBusiness,
      name,
      nameBn: nameBn || name,
      phone,
      email,
      address,
      addressBn: addressBn || address,
      currencySymbol,
      binNumber,
      receiptType,
      invoiceNote,
      invoiceNoteBn: invoiceNoteBn || invoiceNote,
    };

    db.saveBusiness(updated);
    setActiveBusiness(updated);
    refreshData();
    showToast('Business settings saved successfully!', 'success');
  };

  const handleDownloadBackup = () => {
    const jsonStr = db.exportFullDatabase();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `HisabKhatiyan_Backup_${activeBusiness.id}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Database backup downloaded successfully!', 'success');
  };

  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = db.importFullDatabase(content);
      if (success) {
        refreshData();
        showToast('Database successfully restored from backup!', 'success');
      } else {
        showToast('Failed to restore database. Invalid file format.', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleResetDemoData = () => {
    if (confirm('Are you sure you want to re-seed the sample retail and electronics demo business data?')) {
      db.resetToDefaults();
      refreshData();
      showToast('Demo business database re-seeded!', 'info');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-[#EEEEEE] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-neutral-900">{t('settings')}</h2>
          <p className="text-xs text-neutral-500">
            {lang === 'bn'
              ? 'প্রতিষ্ঠানের প্রোফাইল, প্রিন্টার ফরম্যাট, মুদ্রা এবং ব্যাকআপ রিস্টোর'
              : 'Configure business identity, thermal invoice preferences, and offline data backups'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-[#FFF5F5] text-[#E53935] border border-red-200 rounded-xl text-xs font-bold">
            100% Free Forever SaaS
          </span>
        </div>
      </div>

      {/* Free SaaS Commitment Banner */}
      <div className="bg-[#FFF5F5] p-5 rounded-2xl border border-red-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase text-[#E53935] tracking-wider">
              Free Community SaaS Architecture
            </span>
            <span className="text-[11px] px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold">
              No Subscriptions · No Paywalls
            </span>
          </div>
          <p className="text-xs text-neutral-700">
            All accounting, POS, customer dues, and inventory features are 100% free with unlimited user registration.
          </p>
          <p className="text-[11px] text-neutral-500 font-medium">
            <strong>Zero Silent Deletion Guarantee:</strong> Approaching storage limits shows transparent warnings and will never automatically delete user records.
          </p>
        </div>
      </div>

      {/* Business Profile Form */}
      <form onSubmit={handleSaveProfile} className="bg-white p-6 rounded-2xl border border-[#EEEEEE] space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-neutral-100">
          <Store className="w-5 h-5 text-[#E53935]" />
          <h3 className="text-sm font-bold text-neutral-900">{t('businessSettings')}</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-neutral-700 mb-1">
              {t('businessName')} (English) *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block font-semibold text-neutral-700 mb-1 font-bengali">
              {t('banglaName')} (বাংলা)
            </label>
            <input
              type="text"
              value={nameBn}
              onChange={(e) => setNameBn(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-200 rounded-xl font-bengali"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-neutral-700 mb-1">Phone Number *</label>
            <input
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-200 rounded-xl font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-neutral-700 mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block font-semibold text-neutral-700 mb-1">{t('binOrVat')}</label>
            <input
              type="text"
              placeholder="e.g. BIN-948172635-001"
              value={binNumber}
              onChange={(e) => setBinNumber(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-200 rounded-xl font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-neutral-700 mb-1">
              Shop Address (English) *
            </label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block font-semibold text-neutral-700 mb-1 font-bengali">
              ঠিকানা (বাংলা)
            </label>
            <input
              type="text"
              value={addressBn}
              onChange={(e) => setAddressBn(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-200 rounded-xl font-bengali"
            />
          </div>
        </div>

        {/* Currency & Receipt Customization */}
        <div className="pt-4 border-t border-neutral-100">
          <div className="flex items-center gap-2 mb-3">
            <Receipt className="w-4 h-4 text-[#E53935]" />
            <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
              POS & Receipt Configuration
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                {t('receiptFormat')}
              </label>
              <select
                value={receiptType}
                onChange={(e) => setReceiptType(e.target.value as any)}
                className="w-full px-3 py-2 border border-neutral-200 rounded-xl font-semibold"
              >
                <option value="thermal-80mm">Thermal Roll (80mm standard)</option>
                <option value="thermal-58mm">Thermal Roll (58mm mini mobile)</option>
                <option value="a4">Standard Full-Page A4 Invoice</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                {t('currencySetting')}
              </label>
              <input
                type="text"
                value={currencySymbol}
                onChange={(e) => setCurrencySymbol(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-200 rounded-xl font-bold font-mono text-center text-sm"
              />
            </div>
          </div>

          <div className="mt-3 text-xs">
            <label className="block font-semibold text-neutral-700 mb-1">
              {t('invoiceFooterNote')}
            </label>
            <input
              type="text"
              value={invoiceNote}
              onChange={(e) => setInvoiceNote(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-200 rounded-xl"
            />
          </div>
        </div>

        <div className="flex justify-end pt-3">
          <button
            type="submit"
            className="flex items-center gap-1.5 px-6 py-2.5 bg-[#E53935] hover:bg-[#C62828] text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </form>

      {/* Database Backup & Restore Card */}
      <div className="bg-white p-6 rounded-2xl border border-[#EEEEEE] space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-neutral-100">
          <Database className="w-5 h-5 text-[#E53935]" />
          <div>
            <h3 className="text-sm font-bold text-neutral-900">{t('dataBackup')}</h3>
            <p className="text-xs text-neutral-500">
              Never lose business data. Export a full offline backup or restore previous databases.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <button
            onClick={handleDownloadBackup}
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-neutral-200 hover:border-red-200 hover:bg-[#FFF5F5] transition-all cursor-pointer text-center group"
          >
            <Download className="w-5 h-5 text-[#E53935] mb-1.5 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-neutral-900">{t('exportBackup')}</span>
            <span className="text-[10px] text-neutral-400 mt-0.5">Download JSON snapshot</span>
          </button>

          <label className="flex flex-col items-center justify-center p-4 rounded-xl border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 transition-all cursor-pointer text-center group">
            <Upload className="w-5 h-5 text-neutral-600 mb-1.5 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-neutral-900">{t('importBackup')}</span>
            <span className="text-[10px] text-neutral-400 mt-0.5">Select .json backup file</span>
            <input type="file" accept=".json" onChange={handleRestoreBackup} className="hidden" />
          </label>

          <button
            onClick={handleResetDemoData}
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-neutral-200 hover:border-amber-300 hover:bg-amber-50/50 transition-all cursor-pointer text-center group"
          >
            <RefreshCw className="w-5 h-5 text-amber-600 mb-1.5 group-hover:rotate-180 transition-transform" />
            <span className="text-xs font-bold text-neutral-900">{t('loadDemoData')}</span>
            <span className="text-[10px] text-neutral-400 mt-0.5">Reset demo retail store</span>
          </button>
        </div>
      </div>

      {/* Android Packaging & Capacitor Guide Card */}
      <div className="bg-white p-6 rounded-2xl border border-[#EEEEEE] space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
          <Smartphone className="w-5 h-5 text-[#E53935]" />
          <div>
            <h3 className="text-sm font-bold text-neutral-900">Android & Capacitor Native Packaging</h3>
            <p className="text-xs text-neutral-500">Run this exact application natively on Android devices</p>
          </div>
        </div>

        <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 text-xs font-mono space-y-2 text-neutral-800">
          <p className="font-sans text-[11px] text-neutral-600 font-semibold">
            To build an Android APK using Capacitor:
          </p>
          <div className="bg-white p-2.5 rounded-lg border border-neutral-200">
            <p className="text-neutral-500"># 1. Initialize Capacitor in workspace</p>
            <p className="text-[#E53935] font-bold">npx cap init HisabKhatiyan com.hisabkhatiyan.app --web-dir dist</p>
            <p className="text-neutral-500 mt-2"># 2. Build web bundle & add Android platform</p>
            <p className="text-neutral-900">npm run build && npx cap add android</p>
            <p className="text-neutral-500 mt-2"># 3. Open in Android Studio & generate release APK</p>
            <p className="text-neutral-900">npx cap open android</p>
          </div>
          <p className="font-sans text-[11px] text-neutral-500">
            The application is pre-configured with standalone manifest, responsive touch gestures, local offline storage, and zero external blocking dependencies.
          </p>
        </div>
      </div>
    </div>
  );
};
