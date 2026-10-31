import React from 'react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Toast: React.FC = () => {
  const { toastMessage } = useApp();

  if (!toastMessage) return null;

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-[#E53935] shrink-0" />,
    info: <Info className="w-4 h-4 text-blue-500 shrink-0" />,
  };

  return (
    <div className="fixed top-16 right-4 z-50 flex items-center gap-2 px-4 py-2.5 bg-white text-neutral-800 rounded-xl shadow-xl border border-neutral-200 text-xs font-medium animate-in fade-in slide-in-from-top-2 duration-200">
      {icons[toastMessage.type]}
      <span>{toastMessage.text}</span>
    </div>
  );
};
