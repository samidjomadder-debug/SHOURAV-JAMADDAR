import React, { createContext, useContext, useState, useEffect } from 'react';
import { Business, User, Sale } from '../types';
import { db } from '../services/db';
import { translations, Language } from '../i18n/translations';

export type NavigationTab =
  | 'dashboard'
  | 'sales'
  | 'purchases'
  | 'products'
  | 'inventory'
  | 'customers'
  | 'suppliers'
  | 'income'
  | 'expenses'
  | 'accounting'
  | 'reports'
  | 'employees'
  | 'settings'
  | 'superadmin';

interface AppContextType {
  activeBusiness: Business;
  businesses: Business[];
  setActiveBusiness: (b: Business) => void;
  currentUser: User;
  users: User[];
  setCurrentUser: (u: User) => void;
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: keyof typeof translations.en) => string;
  isOnline: boolean;
  pendingSyncCount: number;
  triggerSync: () => void;
  refreshData: () => void;
  dataVersion: number;
  selectedInvoice: Sale | null;
  setSelectedInvoice: (sale: Sale | null) => void;
  toastMessage: { text: string; type: 'success' | 'error' | 'info' } | null;
  showToast: (text: string, type?: 'success' | 'error' | 'info') => void;
  showRegisterModal: boolean;
  setShowRegisterModal: (show: boolean) => void;
  registerFreeUser: (name: string, email: string, password?: string, businessName?: string) => void;
  isSuperAdmin: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [businesses, setBusinesses] = useState<Business[]>(() => db.getBusinesses());
  const [activeBusiness, setActiveBusinessState] = useState<Business>(() => {
    const list = db.getBusinesses();
    return list[0] || {
      id: 'biz-default',
      name: 'My Business',
      nameBn: 'আমার প্রতিষ্ঠান',
      phone: '+880 1700-000000',
      email: 'business@example.com',
      address: 'Dhaka, Bangladesh',
      currency: 'BDT',
      currencySymbol: '৳',
      receiptType: 'thermal-80mm',
      invoiceNote: 'Thank you for your business.',
      createdAt: new Date().toISOString(),
    };
  });

  const [users, setUsers] = useState<User[]>(() => db.getUsers(activeBusiness.id));
  const [currentUser, setCurrentUserState] = useState<User>(() => {
    const uList = db.getUsers(activeBusiness.id);
    return uList[0] || {
      id: 'user-admin',
      businessId: activeBusiness.id,
      name: 'Owner Admin',
      email: 'admin@business.com',
      phone: '+880 1712-000111',
      role: 'admin',
      active: true,
      permissions: {
        canViewProfit: true,
        canManageInventory: true,
        canEditSettings: true,
        canManageEmployees: true,
        canDeleteRecords: true,
      },
    };
  });

  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem('hisab_lang');
    return saved === 'bn' || saved === 'en' ? saved : 'en';
  });

  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  const [pendingSyncCount, setPendingSyncCount] = useState<number>(() => {
    return db.getSyncQueue().filter((item) => item.status === 'pending').length;
  });

  const [dataVersion, setDataVersion] = useState<number>(0);
  const [selectedInvoice, setSelectedInvoice] = useState<Sale | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [showRegisterModal, setShowRegisterModal] = useState<boolean>(false);

  const isSuperAdmin = currentUser.role === 'superadmin' || !!currentUser.isSuperAdmin;

  // Monitor online / offline connectivity & automated daily snapshot
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast('Back online! Auto-syncing pending offline changes...', 'info');
      triggerSync();
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast('Offline Mode: All sales and inventory will be saved locally.', 'info');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Automated backup trigger if past 24 hours
    try {
      const last = localStorage.getItem('hisab_last_backup_time');
      if (!last || Date.now() - new Date(last).getTime() > 86400000) {
        db.createAutoBackup('Automated Daily Snapshot');
      }
    } catch (e) {
      console.warn('Auto-backup initialization:', e);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const refreshData = () => {
    const bList = db.getBusinesses();
    setBusinesses(bList);
    const updatedBiz = bList.find((b) => b.id === activeBusiness.id) || bList[0];
    if (updatedBiz) {
      setActiveBusinessState(updatedBiz);
    }
    const uList = db.getUsers(activeBusiness.id);
    setUsers(uList);
    const pending = db.getSyncQueue().filter((item) => item.status === 'pending').length;
    setPendingSyncCount(pending);
    setDataVersion((v) => v + 1);
  };

  const setActiveBusiness = (biz: Business) => {
    setActiveBusinessState(biz);
    const uList = db.getUsers(biz.id);
    setUsers(uList);
    if (uList.length > 0) {
      setCurrentUserState(uList[0]);
    }
    refreshData();
    showToast(`Switched to ${biz.name}`, 'info');
  };

  const setCurrentUser = (user: User) => {
    setCurrentUserState(user);
    showToast(`Active User: ${user.name} (${user.role.toUpperCase()})`, 'info');
  };

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('hisab_lang', newLang);
  };

  const t = (key: keyof typeof translations.en): string => {
    const dict = translations[lang] || translations.en;
    return dict[key] || translations.en[key] || (key as string);
  };

  const triggerSync = () => {
    const res = db.processSyncQueue();
    setPendingSyncCount(res.remainingCount);
    showToast(`Sync completed: ${res.syncedCount} items synchronized.`, 'success');
  };

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const registerFreeUser = (name: string, email: string, password?: string, businessName?: string) => {
    const { user, business } = db.registerFreeUser(name, email, password, businessName);
    const updatedBizList = db.getAllBusinesses();
    setBusinesses(updatedBizList);
    setActiveBusinessState(business);
    const updatedUsers = db.getUsers(business.id);
    setUsers(updatedUsers);
    setCurrentUserState(user);
    refreshData();
    setShowRegisterModal(false);
    showToast(
      `Welcome ${name}! Your free business "${business.name}" is ready with all features unlocked.`,
      'success'
    );
  };

  return (
    <AppContext.Provider
      value={{
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
        dataVersion,
        selectedInvoice,
        setSelectedInvoice,
        toastMessage,
        showToast,
        showRegisterModal,
        setShowRegisterModal,
        registerFreeUser,
        isSuperAdmin,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
