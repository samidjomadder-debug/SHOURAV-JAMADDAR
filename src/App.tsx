import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { TopHeader } from './components/layout/TopHeader';
import { MobileNav } from './components/layout/MobileNav';
import { Toast } from './components/common/Toast';
import { InvoiceModal } from './components/modals/InvoiceModal';
import { RegisterFreeModal } from './components/modals/RegisterFreeModal';

// Views
import { DashboardView } from './components/views/DashboardView';
import { SalesView } from './components/views/SalesView';
import { PurchasesView } from './components/views/PurchasesView';
import { ProductsView } from './components/views/ProductsView';
import { CustomersView } from './components/views/CustomersView';
import { SuppliersView } from './components/views/SuppliersView';
import { IncomeView } from './components/views/IncomeView';
import { ExpensesView } from './components/views/ExpensesView';
import { AccountingView } from './components/views/AccountingView';
import { ReportsView } from './components/views/ReportsView';
import { EmployeesView } from './components/views/EmployeesView';
import { SettingsView } from './components/views/SettingsView';
import { SuperAdminView } from './components/views/SuperAdminView';

const MainLayout: React.FC = () => {
  const { activeTab, selectedInvoice, setSelectedInvoice } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'sales':
        return <SalesView />;
      case 'purchases':
        return <PurchasesView />;
      case 'products':
      case 'inventory':
        return <ProductsView />;
      case 'customers':
        return <CustomersView />;
      case 'suppliers':
        return <SuppliersView />;
      case 'income':
        return <IncomeView />;
      case 'expenses':
        return <ExpensesView />;
      case 'accounting':
        return <AccountingView />;
      case 'reports':
        return <ReportsView />;
      case 'employees':
        return <EmployeesView />;
      case 'settings':
        return <SettingsView />;
      case 'superadmin':
        return <SuperAdminView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="flex h-screen bg-[#FDFDFD] overflow-hidden">
      {/* Desktop Sidebar & Mobile Backdrop Drawer */}
      <Sidebar
        isOpenMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Sticky Header */}
        <TopHeader onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)} />

        {/* Scrollable Main Workspace */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 pb-20 lg:pb-8">
          <div className="max-w-7xl mx-auto">
            {renderActiveView()}
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        <MobileNav />
      </div>

      {/* Toast Notification Banner */}
      <Toast />

      {/* Printable Invoice & Receipt Modal */}
      {selectedInvoice && (
        <InvoiceModal
          sale={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}

      {/* Free User & Business Registration Modal */}
      <RegisterFreeModal />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
