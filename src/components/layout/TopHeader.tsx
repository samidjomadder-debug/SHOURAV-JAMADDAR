import React, { useState } from 'react';
import {
  Store,
  ChevronDown,
  RefreshCw,
  Wifi,
  WifiOff,
  UserCheck,
  Plus,
  Globe,
  Bell,
  Menu,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PWAInstallButton } from '../common/PWAInstallButton';
import { Business } from '../../types';
import { db } from '../../services/db';

interface TopHeaderProps {
  onToggleMobileMenu?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ onToggleMobileMenu }) => {
  const {
    activeBusiness,
    businesses,
    setActiveBusiness,
    currentUser,
    users,
    setCurrentUser,
    activeTab,
    setActiveTab,
    lang,
    setLang,
    t,
    isOnline,
    pendingSyncCount,
    triggerSync,
    refreshData,
    showToast,
    setShowRegisterModal,
    isSuperAdmin,
  } = useApp();

  const [showBizDropdown, setShowBizDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNewBizModal, setShowNewBizModal] = useState(false);
  const [newBizName, setNewBizName] = useState('');
  const [newBizPhone, setNewBizPhone] = useState('');
  const [newBizAddress, setNewBizAddress] = useState('');

  const handleCreateBusiness = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBizName.trim()) return;

    const newBiz: Business = {
      id: 'biz-' + Date.now(),
      name: newBizName,
      nameBn: newBizName,
      phone: newBizPhone || '+880 1700-000000',
      email: 'contact@' + newBizName.toLowerCase().replace(/\s+/g, '') + '.com',
      address: newBizAddress || 'Dhaka, Bangladesh',
      currency: 'BDT',
      currencySymbol: '৳',
      receiptType: 'thermal-80mm',
      invoiceNote: 'Thank you for shopping with us!',
      createdAt: new Date().toISOString(),
    };

    db.saveBusiness(newBiz);
    refreshData();
    setActiveBusiness(newBiz);
    setShowNewBizModal(false);
    setNewBizName('');
    setNewBizPhone('');
    setNewBizAddress('');
    showToast(`New business "${newBiz.name}" created!`, 'success');
  };

  // Capitalize active tab title
  const currentTabLabel = t(activeTab as any) || activeTab;

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 px-4 sm:px-6 py-3 bg-white border-b border-[#EEEEEE] shadow-xs">
      {/* Zone 1: Mobile toggle + Amar Hisab Logo & Business selector */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-1.5 text-neutral-600 hover:text-neutral-900 rounded-lg hover:bg-neutral-100"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Mobile/Tablet Brand Logo */}
        <div className="lg:hidden flex items-center pr-1 border-r border-neutral-200">
          <img
            src="/assets/aistudio/49e318ab-fc7a-4fe9-aa7d-87b73e98bad9_6df0a405.png"
            alt="আমার হিসাব"
            className="h-7 w-auto object-contain select-none"
          />
        </div>

        {/* Business Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowBizDropdown(!showBizDropdown);
              setShowUserDropdown(false);
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#EEEEEE] bg-white hover:bg-neutral-50 transition-colors text-left"
          >
            <div className="w-7 h-7 rounded-md bg-[#FFF5F5] border border-red-200 flex items-center justify-center text-[#E53935] shrink-0">
              <Store className="w-4 h-4" />
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-semibold text-neutral-900 leading-tight truncate max-w-[150px]">
                {lang === 'bn' && activeBusiness.nameBn ? activeBusiness.nameBn : activeBusiness.name}
              </p>
              <p className="text-[10px] text-neutral-400">
                {activeBusiness.currencySymbol} BDT · {activeBusiness.receiptType.toUpperCase()}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-neutral-400 ml-1" />
          </button>

          {showBizDropdown && (
            <div className="absolute left-0 mt-1 w-64 bg-white rounded-xl shadow-xl border border-neutral-200 py-1.5 z-50">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                {t('switchBusiness')}
              </div>
              {businesses.map((b) => (
                <button
                  key={b.id}
                  onClick={() => {
                    setActiveBusiness(b);
                    setShowBizDropdown(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-colors ${
                    b.id === activeBusiness.id
                      ? 'bg-[#FFF5F5] text-[#E53935] font-semibold'
                      : 'text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  <div className="truncate">
                    <p className="font-medium truncate">{lang === 'bn' && b.nameBn ? b.nameBn : b.name}</p>
                    <p className="text-[10px] text-neutral-400 truncate">{b.address}</p>
                  </div>
                  {b.id === activeBusiness.id && (
                    <span className="text-[10px] bg-red-100 text-[#E53935] px-1.5 py-0.5 rounded font-bold">
                      Active
                    </span>
                  )}
                </button>
              ))}

              <div className="pt-1.5 mt-1 border-t border-neutral-100 px-2">
                <button
                  onClick={() => {
                    setShowBizDropdown(false);
                    setShowNewBizModal(true);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-[#E53935] hover:bg-[#FFF5F5] rounded-lg transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t('addNewBusiness')}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Breadcrumb Section Label */}
        <div className="hidden md:flex items-center gap-1.5 text-xs text-neutral-400">
          <span>/</span>
          <span className="font-medium text-neutral-800">{currentTabLabel}</span>
        </div>
      </div>

      {/* Zone 2: Sync Status, Offline badge & PWA Install */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Offline / Online Sync Indicator */}
        <div className="flex items-center gap-1.5">
          {isOnline ? (
            <div className="flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
              <Wifi className="w-3.5 h-3.5" />
              <span className="hidden md:inline font-medium">{t('online')}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 px-2 py-1 rounded-md border border-amber-200 animate-pulse">
              <WifiOff className="w-3.5 h-3.5" />
              <span className="font-medium">{t('offline')}</span>
            </div>
          )}

          {pendingSyncCount > 0 ? (
            <button
              onClick={triggerSync}
              className="flex items-center gap-1 text-[11px] font-semibold text-white bg-[#E53935] hover:bg-[#C62828] px-2.5 py-1 rounded-md transition-colors"
              title="Click to sync offline changes"
            >
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>
                {pendingSyncCount} {t('pendingSync')}
              </span>
            </button>
          ) : (
            <button
              onClick={triggerSync}
              className="hidden lg:flex items-center gap-1 text-[11px] text-neutral-500 hover:text-neutral-800 px-2 py-1 rounded hover:bg-neutral-100"
              title="Click to verify sync"
            >
              <RefreshCw className="w-3 h-3" />
              <span>{t('synced')}</span>
            </button>
          )}
        </div>

        {/* Register Free Business button */}
        <button
          onClick={() => setShowRegisterModal(true)}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#FFF5F5] hover:bg-[#ffebeb] text-[#E53935] border border-red-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          title="Register a new business account for free"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Register Free</span>
        </button>

        {/* Super Admin Quick Switcher */}
        {isSuperAdmin && (
          <button
            onClick={() => setActiveTab('superadmin')}
            className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'superadmin'
                ? 'bg-[#E53935] text-white shadow-xs'
                : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Super Admin</span>
          </button>
        )}

        {/* PWA Install Button */}
        <PWAInstallButton />

        {/* Language Switcher */}
        <div className="flex items-center p-0.5 bg-neutral-100 rounded-lg border border-neutral-200 text-xs font-semibold">
          <button
            onClick={() => setLang('en')}
            className={`px-2 py-1 rounded-md transition-all ${
              lang === 'en'
                ? 'bg-white text-[#E53935] shadow-xs font-bold'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            EN
          </button>
          <button
            onClick={() => setLang('bn')}
            className={`px-2 py-1 rounded-md transition-all font-bengali ${
              lang === 'bn'
                ? 'bg-white text-[#E53935] shadow-xs font-bold'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            বাংলা
          </button>
        </div>

        {/* Current User Role / Switcher */}
        <div className="relative">
          <button
            onClick={() => {
              setShowUserDropdown(!showUserDropdown);
              setShowBizDropdown(false);
            }}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-neutral-100 text-left transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-[#E53935] text-white flex items-center justify-center font-bold text-xs">
              {currentUser.name.charAt(0)}
            </div>
            <div className="hidden xl:block">
              <p className="text-xs font-semibold text-neutral-800 leading-tight truncate max-w-[110px]">
                {currentUser.name}
              </p>
              <p className="text-[10px] text-neutral-400 capitalize font-medium">{currentUser.role}</p>
            </div>
          </button>

          {showUserDropdown && (
            <div className="absolute right-0 mt-1 w-52 bg-white rounded-xl shadow-xl border border-neutral-200 py-1.5 z-50">
              <div className="px-3 py-1.5 border-b border-neutral-100">
                <p className="text-xs font-bold text-neutral-900">{currentUser.name}</p>
                <p className="text-[11px] text-neutral-500">{currentUser.email}</p>
                <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-red-100 text-[#E53935]">
                  {currentUser.role}
                </span>
              </div>

              <div className="px-3 pt-2 pb-1 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                Switch Role / Staff
              </div>

              {users.map((u) => (
                <button
                  key={u.id}
                  onClick={() => {
                    setCurrentUser(u);
                    setShowUserDropdown(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left ${
                    u.id === currentUser.id
                      ? 'bg-[#FFF5F5] text-[#E53935] font-semibold'
                      : 'text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  <span className="truncate">{u.name}</span>
                  <span className="text-[10px] text-neutral-400 capitalize">({u.role})</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Create Business */}
      {showNewBizModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-neutral-200">
            <h3 className="text-base font-bold text-neutral-900 pb-2 border-b border-neutral-100">
              {t('addNewBusiness')}
            </h3>

            <form onSubmit={handleCreateBusiness} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  {t('businessName')} *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sonali Enterprise, Dhaka Mart"
                  value={newBizName}
                  onChange={(e) => setNewBizName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:border-[#E53935]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  {t('phone')}
                </label>
                <input
                  type="text"
                  placeholder="01712-345678"
                  value={newBizPhone}
                  onChange={(e) => setNewBizPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:border-[#E53935]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  {t('address')}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Uttara, Sector 3, Dhaka"
                  value={newBizAddress}
                  onChange={(e) => setNewBizAddress(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:border-[#E53935]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNewBizModal(false)}
                  className="px-4 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-100 rounded-lg"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#E53935] hover:bg-[#C62828] rounded-lg shadow-xs"
                >
                  {t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
