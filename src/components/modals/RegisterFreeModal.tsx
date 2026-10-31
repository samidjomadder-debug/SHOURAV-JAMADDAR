import React, { useState } from 'react';
import { X, CheckCircle, ShieldCheck, Building, User, Mail, Lock, Phone } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const RegisterFreeModal: React.FC = () => {
  const { showRegisterModal, setShowRegisterModal, registerFreeUser } = useApp();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('017');
  const [businessName, setBusinessName] = useState('');
  const [password, setPassword] = useState('');

  if (!showRegisterModal) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !businessName.trim()) return;

    registerFreeUser(name, email, password, businessName);
    setName('');
    setEmail('');
    setBusinessName('');
    setPassword('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header with Red Accent */}
        <div className="bg-[#FFF5F5] border-b border-red-100 p-6 relative">
          <button
            onClick={() => setShowRegisterModal(false)}
            className="absolute top-5 right-5 text-neutral-400 hover:text-neutral-700 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 bg-[#E53935] text-white rounded-full text-[10px] font-black uppercase tracking-wider">
              Forever Free
            </span>
            <span className="text-xs font-bold text-neutral-500">No Credit Card Required</span>
          </div>

          <h3 className="text-xl font-black text-neutral-900 tracking-tight">
            Create Free Business Account
          </h3>
          <p className="text-xs text-neutral-600 mt-1">
            Unlimited user registration, separate tenant database, and strict Row Level Security.
          </p>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-neutral-700 mb-1">
              Your Full Name *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                placeholder="e.g. Arifur Rahman"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:border-[#E53935]"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-neutral-700 mb-1">
              Business / Store Name *
            </label>
            <div className="relative">
              <Building className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                placeholder="e.g. Rahman General Store"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:border-[#E53935]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  placeholder="name@business.bd"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:border-[#E53935]"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Mobile Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                <input
                  type="tel"
                  placeholder="01712-345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-neutral-200 rounded-xl font-mono focus:outline-none focus:border-[#E53935]"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-neutral-700 mb-1">
              Account Password (for multi-device login)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-neutral-200 rounded-xl font-mono focus:outline-none focus:border-[#E53935]"
              />
            </div>
          </div>

          {/* Guarantees Box */}
          <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-1.5 text-[11px] text-neutral-600">
            <div className="flex items-center gap-1.5 text-neutral-800 font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Free SaaS Commitments:</span>
            </div>
            <p>✓ All modules unlocked (POS, Purchases, Stock, Incomes, Cashbook, Reports)</p>
            <p>✓ Dedicated business tenant with Row Level Security</p>
            <p>✓ Zero data deletion: Quota alerts show transparent warnings without purging records</p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
            <button
              type="button"
              onClick={() => setShowRegisterModal(false)}
              className="px-4 py-2 font-medium text-neutral-600 hover:bg-neutral-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 font-bold text-white bg-[#E53935] hover:bg-[#C62828] rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Register Free Business
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
