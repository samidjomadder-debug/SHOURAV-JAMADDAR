
import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  ShoppingBag,
  Package,
  Boxes,
  Users,
  Truck,
  TrendingUp,
  TrendingDown,
  BookOpen,
  BarChart3,
  UserCog,
  Settings,
  PlusCircle,
  X,
  ShieldCheck,
  Database,
} from 'lucide-react';

import { useApp, NavigationTab } from '../../context/AppContext';
import { db } from '../../services/db';

interface SidebarProps {
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpenMobile,
  onCloseMobile,
}) => {
  const {
    activeTab,
    setActiveTab,
    activeBusiness,
    currentUser,
    t,
  } = useApp();

  // Check low stock count
  const products = db.getProducts(activeBusiness.id);
  const lowStockCount = products.filter(
    (p) => p.stock <= p.minStockAlert
  ).length;

  const navItems: {
    id: NavigationTab;
    labelKey: any;
    icon: React.ElementType;
    badge?: string | number;
    restrictedToAdmin?: boolean;
  }[] = [
    { id: 'dashboard', labelKey: 'dashboard', icon: LayoutDashboard },
    { id: 'sales', labelKey: 'sales', icon: ShoppingCart, badge: 'POS' },
    { id: 'purchases', labelKey: 'purchases', icon: ShoppingBag },
    { id: 'products', labelKey: 'products', icon: Package },
    {
      id: 'inventory',
      labelKey: 'inventory',
      icon: Boxes,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
    },
    { id: 'customers', labelKey: 'customers', icon: Users },
    { id: 'suppliers', labelKey: 'suppliers', icon: Truck },
    { id: 'income', labelKey: 'income', icon: TrendingUp },
    { id: 'expenses', labelKey: 'expenses', icon: TrendingDown },
    { id: 'accounting', labelKey: 'accounting', icon: BookOpen },
    {
      id: 'reports',
      labelKey: 'reports',
      icon: BarChart3,
      restrictedToAdmin: !currentUser.permissions.canViewProfit,
    },
    {
      id: 'employees',
      labelKey: 'employees',
      icon: UserCog,
      restrictedToAdmin:
        currentUser.role !== 'admin' &&
        currentUser.role !== 'superadmin',
    },
    {
      id: 'settings',
      labelKey: 'settings',
      icon: Settings,
      restrictedToAdmin: !currentUser.permissions.canEditSettings,
    },
    {
      id: 'superadmin',
      labelKey: 'superadmin',
      icon: ShieldCheck,
      badge: 'SaaS',
    },
  ];

  const handleTabClick = (tabId: NavigationTab) => {
    setActiveTab(tabId);

    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden transition-opacity"
        />
      )}

      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-[#EEEEEE] flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          isOpenMobile
            ? 'translate-x-0'
            : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#EEEEEE]">
          <div className="flex items-center gap-2">
            <img
              src="/assets/aistudio/49e318ab-fc7a-4fe9-aa7d-87b73e98bad9_6df0a405.png"
              alt="আমার হিসাব"
              className="h-10 w-auto max-w-[175px] object-contain select-none"
            />
          </div>

          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1 text-neutral-400 hover:text-neutral-700 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* New Sale Button */}
        <div className="p-3">
          <button
            onClick={() => handleTabClick('sales')}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-[#E53935] hover:bg-[#C62828] text-white rounded-xl text-xs font-semibold shadow-sm transition-colors group cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-white/90 group-hover:scale-110 transition-transform" />
            <span>{t('newSale')}</span>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="px-3 space-y-1 overflow-y-auto max-h-[calc(100vh-220px)] pt-1 pb-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isRestricted =
              item.restrictedToAdmin &&
              currentUser.role === 'cashier';

            if (isRestricted) return null;

            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer text-left ${
                  isActive
                    ? 'bg-[#FFF5F5] text-[#E53935] font-bold shadow-2xs'
                    : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive
                        ? 'text-[#E53935]'
                        : 'text-neutral-400 group-hover:text-neutral-600'
                    }`}
                  />
                  <span className="truncate">{t(item.labelKey)}</span>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0 ${
                      item.id === 'inventory' &&
                      typeof item.badge === 'number'
                        ? 'bg-amber-100 text-amber-800'
                        : isActive
                        ? 'bg-[#E53935] text-white'
                        : 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer: User Role & Storage */}
        <div className="p-3 border-t border-[#EEEEEE] bg-neutral-50/60 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-neutral-500">
            <span className="truncate font-medium">
              {currentUser.name}
            </span>

            <span className="uppercase text-[10px] font-bold px-1.5 py-0.5 bg-neutral-200/70 text-neutral-700 rounded">
              {currentUser.role}
            </span>
          </div>

          {/* Supabase Free Tier Meter */}
          <div className="p-2 bg-white rounded-xl border border-neutral-200/70 space-y-1">
            <div className="flex items-center justify-between text-[10px] font-semibold text-neutral-600">
              <span className="flex items-center gap-1">
                <Database className="w-3 h-3 text-[#E53935]" />
                <span>Supabase Free DB</span>
              </span>

              <span className="font-mono text-neutral-800">
                500 MB
              </span>
            </div>

            <div className="w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-[#E53935] h-full w-[2%]" />
            </div>

            <div className="flex items-center justify-between text-[9px] text-neutral-400">
              <span>100% Free Plan</span>
              <span className="text-emerald-600 font-bold">
                Never Silently Purged
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
