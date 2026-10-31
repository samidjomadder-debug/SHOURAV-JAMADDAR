import React, { useState } from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  BookOpen,
  MoreHorizontal,
  X,
  ShoppingBag,
  Users,
  Truck,
  TrendingDown,
  TrendingUp,
  BarChart3,
  UserCog,
  Settings,
} from 'lucide-react';
import { useApp, NavigationTab } from '../../context/AppContext';

export const MobileNav: React.FC = () => {
  const { activeTab, setActiveTab, currentUser, t } = useApp();
  const [showMoreSheet, setShowMoreSheet] = useState(false);

  const mainTabs: { id: NavigationTab; labelKey: any; icon: React.ElementType }[] = [
    { id: 'dashboard', labelKey: 'dashboard', icon: LayoutDashboard },
    { id: 'sales', labelKey: 'sales', icon: ShoppingCart },
    { id: 'products', labelKey: 'products', icon: Package },
    { id: 'accounting', labelKey: 'accounting', icon: BookOpen },
  ];

  const secondaryTabs: { id: NavigationTab; labelKey: any; icon: React.ElementType }[] = [
    { id: 'purchases', labelKey: 'purchases', icon: ShoppingBag },
    { id: 'customers', labelKey: 'customers', icon: Users },
    { id: 'suppliers', labelKey: 'suppliers', icon: Truck },
    { id: 'expenses', labelKey: 'expenses', icon: TrendingDown },
    { id: 'income', labelKey: 'income', icon: TrendingUp },
    { id: 'reports', labelKey: 'reports', icon: BarChart3 },
    { id: 'employees', labelKey: 'employees', icon: UserCog },
    { id: 'settings', labelKey: 'settings', icon: Settings },
  ];

  const handleSelectTab = (tabId: NavigationTab) => {
    setActiveTab(tabId);
    setShowMoreSheet(false);
  };

  return (
    <>
      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#EEEEEE] shadow-lg px-2 py-1 flex items-center justify-around h-16">
        {mainTabs.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleSelectTab(item.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1 min-h-[44px] transition-colors ${
                isActive ? 'text-[#E53935]' : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className={`text-[10px] tracking-tight truncate ${isActive ? 'font-bold' : 'font-medium'}`}>
                {t(item.labelKey)}
              </span>
            </button>
          );
        })}

        {/* More Tab */}
        <button
          onClick={() => setShowMoreSheet(true)}
          className={`flex flex-col items-center justify-center flex-1 py-1 min-h-[44px] transition-colors ${
            showMoreSheet || secondaryTabs.some((s) => s.id === activeTab)
              ? 'text-[#E53935] font-bold'
              : 'text-neutral-500 hover:text-neutral-900 font-medium'
          }`}
        >
          <MoreHorizontal className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">More</span>
        </button>
      </nav>

      {/* "More" Bottom Sheet Modal */}
      {showMoreSheet && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/50 lg:hidden">
          <div className="w-full bg-white rounded-t-2xl p-5 shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <img
                  src="/assets/aistudio/49e318ab-fc7a-4fe9-aa7d-87b73e98bad9_6df0a405.png"
                  alt="আমার হিসাব"
                  className="h-7 w-auto object-contain select-none"
                />
                <span className="text-xs text-neutral-400 font-semibold">· All Modules</span>
              </div>
              <button
                onClick={() => setShowMoreSheet(false)}
                className="p-1 text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-3 py-4">
              {secondaryTabs.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTab(item.id)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl transition-colors min-h-[56px] text-center ${
                      isActive
                        ? 'bg-[#FFF5F5] text-[#E53935] font-bold border border-red-200'
                        : 'bg-neutral-50 text-neutral-700 hover:bg-neutral-100'
                    }`}
                  >
                    <Icon className="w-5 h-5 mb-1" />
                    <span className="text-[11px] leading-tight line-clamp-1">
                      {t(item.labelKey)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
