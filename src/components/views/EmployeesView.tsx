import React, { useState, useMemo } from 'react';
import {
  UserCog,
  Plus,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  Trash2,
  Edit2,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { db } from '../../services/db';
import { User, Role } from '../../types';

export const EmployeesView: React.FC = () => {
  const { activeBusiness, currentUser, lang, t, refreshData, showToast, dataVersion } = useApp();

  const [activeTab, setActiveTab] = useState<'employees' | 'logs'>('employees');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<Role>('cashier');
  const [canViewProfit, setCanViewProfit] = useState(false);
  const [canManageInventory, setCanManageInventory] = useState(false);
  const [canEditSettings, setCanEditSettings] = useState(false);
  const [canManageEmployees, setCanManageEmployees] = useState(false);

  // Raw data
  const users = useMemo(() => db.getUsers(activeBusiness.id), [activeBusiness.id, dataVersion]);
  const activityLogs = useMemo(() => db.getActivityLogs(activeBusiness.id), [activeBusiness.id, dataVersion]);

  const openAddModal = () => {
    setEditingUser(null);
    setName('');
    setEmail('');
    setPhone('017');
    setRole('cashier');
    setCanViewProfit(false);
    setCanManageInventory(false);
    setCanEditSettings(false);
    setCanManageEmployees(false);
    setShowModal(true);
  };

  const openEditModal = (u: User) => {
    setEditingUser(u);
    setName(u.name);
    setEmail(u.email);
    setPhone(u.phone);
    setRole(u.role);
    setCanViewProfit(u.permissions.canViewProfit);
    setCanManageInventory(u.permissions.canManageInventory);
    setCanEditSettings(u.permissions.canEditSettings);
    setCanManageEmployees(u.permissions.canManageEmployees);
    setShowModal(true);
  };

  const handleRoleChange = (newRole: Role) => {
    setRole(newRole);
    if (newRole === 'admin') {
      setCanViewProfit(true);
      setCanManageInventory(true);
      setCanEditSettings(true);
      setCanManageEmployees(true);
    } else if (newRole === 'manager') {
      setCanViewProfit(true);
      setCanManageInventory(true);
      setCanEditSettings(false);
      setCanManageEmployees(false);
    } else {
      setCanViewProfit(false);
      setCanManageInventory(false);
      setCanEditSettings(false);
      setCanManageEmployees(false);
    }
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const user: User = {
      id: editingUser ? editingUser.id : 'user-' + Date.now(),
      businessId: activeBusiness.id,
      name,
      email: email || `${name.toLowerCase().replace(/\s+/g, '')}@example.com`,
      phone,
      role,
      active: true,
      permissions: {
        canViewProfit,
        canManageInventory,
        canEditSettings,
        canManageEmployees,
        canDeleteRecords: role === 'admin',
      },
    };

    db.saveUser(user);
    refreshData();
    setShowModal(false);
    showToast(editingUser ? 'Staff account updated' : 'New employee registered', 'success');
  };

  const handleDeleteUser = (u: User) => {
    if (u.id === currentUser.id) {
      showToast('You cannot delete your own active account!', 'error');
      return;
    }
    if (confirm(`Remove staff member ${u.name}?`)) {
      db.deleteUser(u.id);
      refreshData();
      showToast('Staff account removed.', 'info');
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-[#EEEEEE]">
        <div>
          <h2 className="text-lg font-bold text-neutral-900">{t('employees')}</h2>
          <p className="text-xs text-neutral-500">
            {lang === 'bn'
              ? 'কর্মচারী ব্যবস্থাপনা, পদবী ও আর্থিক তথ্যের নিরাপত্তা নিয়ন্ত্রণ'
              : 'Staff accounts, role permissions, and system activity logs'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sub-tab pills */}
          <div className="flex items-center p-1 bg-neutral-100 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveTab('employees')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'employees'
                  ? 'bg-white text-[#E53935] shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Team Staff
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'logs'
                  ? 'bg-white text-[#E53935] shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              {t('activityLog')}
            </button>
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#E53935] hover:bg-[#C62828] text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('addEmployee')}</span>
          </button>
        </div>
      </div>

      {/* ===================== TAB 1: EMPLOYEES LIST ===================== */}
      {activeTab === 'employees' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {users.map((u) => (
            <div
              key={u.id}
              className="bg-white rounded-2xl p-5 border border-[#EEEEEE] flex flex-col justify-between shadow-2xs space-y-4"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#E53935] text-white flex items-center justify-center font-black text-sm">
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-neutral-900 leading-tight">{u.name}</h3>
                      <p className="text-[11px] text-neutral-500 font-mono mt-0.5">{u.phone}</p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                      u.role === 'admin'
                        ? 'bg-red-100 text-[#E53935]'
                        : u.role === 'manager'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-neutral-100 text-neutral-700'
                    }`}
                  >
                    {u.role}
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-neutral-100 space-y-1.5 text-xs text-neutral-600">
                  <div className="flex items-center justify-between">
                    <span>View Financial Profits:</span>
                    {u.permissions.canViewProfit ? (
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-neutral-300" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Manage Inventory & Stock:</span>
                    {u.permissions.canManageInventory ? (
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-neutral-300" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Change Business Settings:</span>
                    {u.permissions.canEditSettings ? (
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-neutral-300" />
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
                <button
                  onClick={() => openEditModal(u)}
                  className="px-3 py-1 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-lg"
                >
                  Edit
                </button>
                {u.id !== currentUser.id && (
                  <button
                    onClick={() => handleDeleteUser(u)}
                    className="p-1 text-neutral-400 hover:text-[#E53935] rounded-lg"
                    title="Remove Employee"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===================== TAB 2: ACTIVITY LOGS ===================== */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-2xl p-5 border border-[#EEEEEE]">
          <div className="pb-3 border-b border-neutral-100">
            <h3 className="text-sm font-bold text-neutral-900">{t('activityLog')}</h3>
            <p className="text-xs text-neutral-500">Security and audit trail of operations carried out by staff members</p>
          </div>

          <div className="divide-y divide-neutral-100 mt-2 max-h-96 overflow-y-auto">
            {activityLogs.map((log) => (
              <div key={log.id} className="py-3 flex items-start justify-between text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-neutral-900">{log.userName}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-100 text-neutral-600">
                      {log.action}
                    </span>
                  </div>
                  <p className="text-neutral-600 mt-1">{log.details}</p>
                </div>
                <span className="text-[10px] text-neutral-400 font-mono tabular-nums shrink-0">
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Add / Edit Employee */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-neutral-200">
            <h3 className="text-base font-bold text-neutral-900 pb-2 border-b border-neutral-100">
              {editingUser ? 'Edit Staff Member' : t('addEmployee')}
            </h3>

            <form onSubmit={handleSaveUser} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Staff Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Asif Mahmud"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Mobile Phone *</label>
                  <input
                    type="text"
                    required
                    placeholder="01712-345678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="staff@store.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Staff Role *</label>
                <select
                  value={role}
                  onChange={(e) => handleRoleChange(e.target.value as Role)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-xl font-semibold"
                >
                  <option value="cashier">Cashier (POS & Sales only)</option>
                  <option value="manager">Manager (Sales, Products & Stock)</option>
                  <option value="admin">Admin (Full System Access)</option>
                </select>
              </div>

              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2">
                <p className="font-bold text-[11px] text-neutral-700 uppercase">Access Permissions</p>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={canViewProfit}
                    onChange={(e) => setCanViewProfit(e.target.checked)}
                    className="rounded text-[#E53935]"
                  />
                  <span>Can view profit margins & revenue totals</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={canManageInventory}
                    onChange={(e) => setCanManageInventory(e.target.checked)}
                    className="rounded text-[#E53935]"
                  />
                  <span>Can manage products & adjust stock levels</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={canEditSettings}
                    onChange={(e) => setCanEditSettings(e.target.checked)}
                    className="rounded text-[#E53935]"
                  />
                  <span>Can edit business profile & backup settings</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 font-medium text-neutral-600 hover:bg-neutral-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-[#E53935] hover:bg-[#C62828] rounded-xl shadow-xs"
                >
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
