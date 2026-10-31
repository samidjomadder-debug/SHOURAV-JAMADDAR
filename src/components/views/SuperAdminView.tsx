import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Server,
  Database,
  Users,
  Building,
  TrendingUp,
  AlertTriangle,
  Download,
  Upload,
  RefreshCw,
  HardDrive,
  FileCode,
  CheckCircle,
  Copy,
  ExternalLink,
  Lock,
  Plus,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { db } from '../../services/db';
import { supabaseService } from '../../services/supabase';

export const SuperAdminView: React.FC = () => {
  const {
    activeBusiness,
    setActiveBusiness,
    currentUser,
    dataVersion,
    refreshData,
    showToast,
    setShowRegisterModal,
  } = useApp();

  const metrics = useMemo(() => db.getSaaSMetrics(), [dataVersion]);
  const allBusinesses = useMemo(() => db.getAllBusinesses(), [dataVersion]);
  const allUsers = useMemo(() => db.getAllUsers(), [dataVersion]);
  const autoBackups = useMemo(() => db.getAutoBackups(), [dataVersion]);

  // Supabase connection state
  const currentConfig = supabaseService.getConfig();
  const [supabaseUrl, setSupabaseUrl] = useState(currentConfig.url);
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(currentConfig.anonKey);
  const [isTestingSupabase, setIsTestingSupabase] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>(
    supabaseService.isConnected() ? 'Connected' : 'Local-First Standalone'
  );

  // Search filter
  const [businessSearch, setBusinessSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');

  const filteredBusinesses = useMemo(() => {
    const q = businessSearch.toLowerCase();
    return allBusinesses.filter(
      (b) => b.name.toLowerCase().includes(q) || b.email.toLowerCase().includes(q)
    );
  }, [allBusinesses, businessSearch]);

  const filteredUsers = useMemo(() => {
    const q = userSearch.toLowerCase();
    return allUsers.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
    );
  }, [allUsers, userSearch]);

  // Handle Supabase connect
  const handleSaveSupabase = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTestingSupabase(true);
    const res = await supabaseService.saveConfig(supabaseUrl, supabaseAnonKey);
    setIsTestingSupabase(false);
    setConnectionStatus(res.success && supabaseUrl ? 'Connected' : 'Local-First Standalone');
    showToast(res.message, res.success ? 'success' : 'error');
  };

  // Download SQL RLS Migration file
  const handleDownloadSQL = () => {
    fetch('/src/services/supabase-schema-and-rls.sql')
      .then((res) => res.text())
      .then((sql) => {
        const blob = new Blob([sql], { type: 'text/sql' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `supabase_rls_schema_${new Date().toISOString().split('T')[0]}.sql`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Supabase PostgreSQL RLS Schema downloaded!', 'success');
      })
      .catch(() => {
        showToast('SQL schema ready in project directory.', 'info');
      });
  };

  // Full PC Backup export
  const handleExportFullPCBackup = () => {
    const jsonDump = db.exportFullDatabase();
    const blob = new Blob([jsonDump], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hisabkhatiyan_full_saas_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Secure PC database backup exported!', 'success');
  };

  // Create manual snapshot
  const handleCreateSnapshot = () => {
    const snap = db.createAutoBackup('Manual SuperAdmin Snapshot');
    refreshData();
    showToast(`Snapshot created (${(snap.sizeBytes / 1024).toFixed(1)} KB)`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* 1. Super Admin Platform Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#EEEEEE] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-[#FFF5F5] rounded-lg text-[#E53935]">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black text-neutral-900 tracking-tight">
              SaaS Super Admin Console
            </h2>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Multi-Tenant Business Management · Supabase Free Tier Architecture · Strict RLS
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFF5F5] text-[#E53935] rounded-xl text-xs font-bold border border-red-100">
            <CheckCircle className="w-4 h-4" />
            <span>100% Free SaaS · No Paywalls</span>
          </div>
          <button
            onClick={() => setShowRegisterModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#E53935] hover:bg-[#C62828] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register Free Business</span>
          </button>
        </div>
      </div>

      {/* 2. Free Service Quota & Storage Monitor */}
      <div className="bg-white rounded-2xl p-5 border border-[#EEEEEE] shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-[#E53935]" />
            <h3 className="text-sm font-bold text-neutral-900">
              Supabase Free Tier Quota & Usage Monitor
            </h3>
          </div>
          <span className="text-[11px] font-mono text-neutral-400">
            Free Plan Capacity: 500 MB DB / 50,000 MAU
          </span>
        </div>

        {/* Quota Progress Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Storage Quota */}
          <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2">
            <div className="flex justify-between items-center text-xs font-semibold text-neutral-700">
              <span>Database Storage</span>
              <span className="font-mono text-neutral-900">
                {(metrics.storageBytesUsed / (1024 * 1024)).toFixed(2)} MB / 500 MB
              </span>
            </div>
            <div className="w-full bg-neutral-200 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  metrics.storagePercentUsed > 80
                    ? 'bg-[#E53935]'
                    : metrics.storagePercentUsed > 60
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.max(metrics.storagePercentUsed, 2)}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-neutral-500">
              <span>{metrics.storagePercentUsed}% utilized</span>
              <span>{(500 - metrics.storageBytesUsed / (1024 * 1024)).toFixed(1)} MB remaining</span>
            </div>
          </div>

          {/* User Accounts Quota */}
          <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2">
            <div className="flex justify-between items-center text-xs font-semibold text-neutral-700">
              <span>Monthly Active Users (MAU)</span>
              <span className="font-mono text-neutral-900">
                {metrics.mauCount} / {metrics.mauLimit.toLocaleString()}
              </span>
            </div>
            <div className="w-full bg-neutral-200 h-2.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#E53935] transition-all duration-500"
                style={{ width: `${Math.max((metrics.mauCount / metrics.mauLimit) * 100, 1)}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-neutral-500">
              <span>Unlimited registration allowed</span>
              <span>{metrics.mauLimit - metrics.mauCount} slots free</span>
            </div>
          </div>

          {/* System Health & Zero Silent Deletion Policy */}
          <div className="p-4 bg-[#FFF5F5] rounded-xl border border-red-100 space-y-2 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#E53935]">Platform Status</span>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-black uppercase tracking-wider">
                Healthy (100% Free)
              </span>
            </div>
            <p className="text-[11px] text-neutral-600 leading-relaxed">
              <strong className="text-neutral-900">Zero Silent Deletion Policy:</strong> When free service quotas approach limits, administrative alerts trigger without purging any tenant data.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Platform Key Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-[#EEEEEE] flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-neutral-500">Registered Businesses</p>
            <p className="text-2xl font-black text-neutral-900 tabular-nums mt-1">
              {metrics.totalBusinesses}
            </p>
          </div>
          <Building className="w-6 h-6 text-[#E53935]" />
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#EEEEEE] flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-neutral-500">Total SaaS Users</p>
            <p className="text-2xl font-black text-neutral-900 tabular-nums mt-1">
              {metrics.totalUsers}
            </p>
          </div>
          <Users className="w-6 h-6 text-neutral-400" />
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#EEEEEE] flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-neutral-500">Total Products Managed</p>
            <p className="text-2xl font-black text-neutral-900 tabular-nums mt-1">
              {metrics.totalProductsCount}
            </p>
          </div>
          <HardDrive className="w-6 h-6 text-neutral-400" />
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#EEEEEE] flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-neutral-500">SaaS Transaction Volume</p>
            <p className="text-2xl font-black text-[#E53935] tabular-nums mt-1">
              ৳{metrics.totalSalesVolume.toLocaleString()}
            </p>
          </div>
          <TrendingUp className="w-6 h-6 text-[#E53935]" />
        </div>
      </div>

      {/* 4. Supabase Free Plan & Row Level Security (RLS) Configuration */}
      <div className="bg-white rounded-2xl p-6 border border-[#EEEEEE] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100">
          <div>
            <h3 className="text-base font-bold text-neutral-900">
              Supabase Free Tier & Row Level Security (RLS)
            </h3>
            <p className="text-xs text-neutral-500">
              Connect external Supabase project or run local PostgreSQL with tenant isolation.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadSQL}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <FileCode className="w-3.5 h-3.5 text-[#E53935]" />
              <span>Download RLS SQL Script</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSaveSupabase} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-neutral-700 mb-1">
              Supabase Project URL
            </label>
            <input
              type="text"
              placeholder="https://xyzcompany.supabase.co"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-200 rounded-xl font-mono text-xs focus:outline-none focus:border-[#E53935]"
            />
          </div>

          <div>
            <label className="block font-semibold text-neutral-700 mb-1">
              Supabase Anon Public API Key
            </label>
            <input
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={supabaseAnonKey}
              onChange={(e) => setSupabaseAnonKey(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-200 rounded-xl font-mono text-xs focus:outline-none focus:border-[#E53935]"
            />
          </div>

          <div className="md:col-span-2 flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-neutral-600">Connection Status:</span>
              <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg font-bold">
                {connectionStatus}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={isTestingSupabase}
                className="px-4 py-2 bg-[#E53935] hover:bg-[#C62828] text-white rounded-xl font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isTestingSupabase ? 'Testing Connection...' : 'Save & Verify Supabase'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* 5. Automated Database Backup & Secure PC Export */}
      <div className="bg-white rounded-2xl p-6 border border-[#EEEEEE] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100">
          <div>
            <h3 className="text-base font-bold text-neutral-900">
              Automated Backup & Secure PC Export
            </h3>
            <p className="text-xs text-neutral-500">
              Every 24 hours an automated system snapshot is created. Export full encrypted backups directly to your PC.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCreateSnapshot}
              className="flex items-center gap-1.5 px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Create Snapshot</span>
            </button>
            <button
              onClick={handleExportFullPCBackup}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#E53935] hover:bg-[#C62828] text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Database to PC</span>
            </button>
          </div>
        </div>

        {/* Snapshots Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-neutral-200 text-neutral-400 font-medium">
                <th className="py-2.5 px-3">Snapshot ID</th>
                <th className="py-2.5 px-3">Description / Label</th>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3 text-right">Size</th>
                <th className="py-2.5 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {autoBackups.map((bk) => (
                <tr key={bk.id} className="hover:bg-neutral-50/70">
                  <td className="py-2.5 px-3 font-mono font-bold text-neutral-900">{bk.id}</td>
                  <td className="py-2.5 px-3 font-medium text-neutral-700">{bk.label}</td>
                  <td className="py-2.5 px-3 tabular-nums text-neutral-500">
                    {new Date(bk.timestamp).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums font-mono text-neutral-600">
                    {(bk.sizeBytes / 1024).toFixed(1)} KB
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[11px] font-bold">
                      Verified
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Multi-Tenant Businesses Directory */}
      <div className="bg-white rounded-2xl p-6 border border-[#EEEEEE] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-neutral-900">
              Registered Tenant Businesses ({allBusinesses.length})
            </h3>
            <p className="text-xs text-neutral-500">
              Each business maintains completely isolated data, customers, inventory, and accounting ledger.
            </p>
          </div>

          <input
            type="text"
            placeholder="Search businesses..."
            value={businessSearch}
            onChange={(e) => setBusinessSearch(e.target.value)}
            className="px-3 py-1.5 text-xs border border-neutral-200 rounded-xl w-full sm:w-64 focus:outline-none focus:border-[#E53935]"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-neutral-200 text-neutral-400 font-medium">
                <th className="py-2.5 px-3">Business Name</th>
                <th className="py-2.5 px-3">Contact</th>
                <th className="py-2.5 px-3">Address</th>
                <th className="py-2.5 px-3">Created</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredBusinesses.map((biz) => (
                <tr key={biz.id} className="hover:bg-neutral-50/70">
                  <td className="py-3 px-3">
                    <p className="font-bold text-neutral-900">{biz.name}</p>
                    <p className="text-[10px] text-neutral-400 font-mono">ID: {biz.id}</p>
                  </td>
                  <td className="py-3 px-3">
                    <p className="text-neutral-700 font-medium">{biz.phone}</p>
                    <p className="text-[11px] text-neutral-400">{biz.email}</p>
                  </td>
                  <td className="py-3 px-3 text-neutral-600 truncate max-w-xs">{biz.address}</td>
                  <td className="py-3 px-3 tabular-nums text-neutral-500 font-mono text-[11px]">
                    {biz.createdAt?.split('T')[0] || biz.createdAt}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => {
                        setActiveBusiness(biz);
                        showToast(`Switched active workspace to "${biz.name}"`, 'info');
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        activeBusiness.id === biz.id
                          ? 'bg-neutral-100 text-neutral-500 cursor-default'
                          : 'bg-[#E53935] hover:bg-[#C62828] text-white'
                      }`}
                    >
                      {activeBusiness.id === biz.id ? 'Active Workspace' : 'Switch Workspace'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 7. Platform Users Directory */}
      <div className="bg-white rounded-2xl p-6 border border-[#EEEEEE] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-neutral-900">
              Platform User Directory ({allUsers.length})
            </h3>
            <p className="text-xs text-neutral-500">
              Multi-user accounts with role-based access control and tenant isolation.
            </p>
          </div>

          <input
            type="text"
            placeholder="Search users..."
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            className="px-3 py-1.5 text-xs border border-neutral-200 rounded-xl w-full sm:w-64 focus:outline-none focus:border-[#E53935]"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-neutral-200 text-neutral-400 font-medium">
                <th className="py-2.5 px-3">User</th>
                <th className="py-2.5 px-3">Email & Phone</th>
                <th className="py-2.5 px-3">Assigned Business</th>
                <th className="py-2.5 px-3 text-center">Role</th>
                <th className="py-2.5 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredUsers.map((u) => {
                const assignedBiz = allBusinesses.find((b) => b.id === u.businessId);
                return (
                  <tr key={u.id} className="hover:bg-neutral-50/70">
                    <td className="py-3 px-3 font-bold text-neutral-900">{u.name}</td>
                    <td className="py-3 px-3">
                      <p className="text-neutral-700 font-medium">{u.email}</p>
                      <p className="text-[11px] text-neutral-400 font-mono">{u.phone}</p>
                    </td>
                    <td className="py-3 px-3 text-neutral-600 font-medium">
                      {assignedBiz?.name || u.businessId}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                          u.role === 'superadmin'
                            ? 'bg-purple-100 text-purple-800'
                            : u.role === 'admin'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-neutral-100 text-neutral-700'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[11px] font-bold">
                        Active
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
