import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PWAInstallButton: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    const ua = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(ua);
    setIsIOS(isIOSDevice);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    } else if (isIOS) {
      setShowIOSModal(true);
    } else {
      // Direct instructions
      setShowIOSModal(true);
    }
  };

  if (isInstalled) return null;

  return (
    <>
      <button
        onClick={handleInstallClick}
        title="Install as Android / Desktop App"
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-[#E53935] bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200 shrink-0 whitespace-nowrap"
      >
        <Smartphone className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Install App</span>
      </button>

      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-2xl border border-neutral-200">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#E53935] flex items-center justify-center text-white">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-neutral-900">Install HisabKhatiyan</h4>
                  <p className="text-xs text-neutral-500">Add to home screen for offline use</p>
                </div>
              </div>
              <button
                onClick={() => setShowIOSModal(false)}
                className="text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-2.5 text-xs text-neutral-600">
              <p className="flex items-start gap-2">
                <span className="font-bold text-[#E53935]">1.</span>
                <span>
                  Tap browser menu <strong>Share / Settings (⋮ or ⬆)</strong> icon.
                </span>
              </p>
              <p className="flex items-start gap-2">
                <span className="font-bold text-[#E53935]">2.</span>
                <span>
                  Select <strong>Add to Home Screen</strong> or <strong>Install App</strong>.
                </span>
              </p>
              <p className="flex items-start gap-2">
                <span className="font-bold text-[#E53935]">3.</span>
                <span>Launch directly like an Android native app with full offline support!</span>
              </p>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="mt-5 w-full py-2 text-xs font-semibold bg-[#E53935] text-white rounded-lg hover:bg-[#C62828] transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
