'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useCreditStore } from '@/lib/store';
import { useAuthStore } from '@/lib/auth-store';
import { signInWithGoogle } from '@/lib/auth';
import PaymentModal from '@/components/PaymentModal';
import CreditGuideModal from '@/components/auth/CreditGuideModal';
import { usePathname } from 'next/navigation';

export default function ProfileDisplay() {
  const { credits, fetchCredits, loading: creditLoading } = useCreditStore();
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const t = useTranslations('auth');

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle(pathname);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  if (creditLoading && credits === null) return null;

  return (
    <>
      <div className="fixed top-4 right-4 z-50" ref={containerRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-white/90 backdrop-blur-xs px-2 py-1 rounded-full shadow-sm border border-gray-200 text-sm font-medium text-gray-700 flex items-center gap-2 hover:bg-gray-50 transition-colors"
        >
          <span className="text-md">👤</span>
        </button>

        {isOpen && (
          <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden py-2 flex flex-col gap-1 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Login Status Section */}
            <div className="px-4 py-2">
              {user ? (
                <div className="text-sm">
                  <p className="text-gray-500 text-xs mb-1">{t('loggedInAs')}</p>
                  <p className="font-medium truncate">{user.email}</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col gap-0.5">
                    <p className="text-sm font-bold text-gray-900">
                      {t('firstLoginGift')}
                    </p>
                    <p className="text-xs text-gray-500 font-normal">
                      {t('loginPrompt') || 'Log in and start for free'}
                    </p>
                  </div>
                  <button
                    onClick={handleGoogleLogin}
                    className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    {t('googleLogin')}
                  </button>
                </div>
              )}
            </div>

            <div className="h-px bg-gray-100 my-1" />

            {/* Credit Recharge Button - Only for logged in users */}
            {user && (
              <button
                onClick={() => setShowPayment(true)}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center justify-between group"
              >
                <span className="text-sm font-medium text-gray-700">
                  {t('recharge')}
                </span>
                <span className="text-lg group-hover:scale-110 transition-transform">
                  ⚡️
                </span>
              </button>
            )}

            {/* Remaining Credits Button - For everyone */}
            <button
              onClick={() => setShowGuide(true)}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center justify-between group"
            >
              <span className="text-sm font-medium text-gray-700">
                {t('remainingCredits')}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-sm">🪙</span>
                <span className="text-sm font-bold text-primary">
                  {credits?.toLocaleString() ?? 0}
                </span>
              </div>
            </button>
          </div>
        )}
      </div>

      <PaymentModal
        open={showPayment}
        onOpenChange={setShowPayment}
        onSuccess={() => fetchCredits()}
        isLoggedIn={!!user}
      />

      <CreditGuideModal
        open={showGuide}
        onOpenChange={setShowGuide}
        currentCredits={credits}
        isLoggedIn={!!user}
        onOpenRecharge={() => {
          setShowGuide(false);
          if (user) {
            setShowPayment(true);
          } else {
            handleGoogleLogin();
          }
        }}
      />
    </>
  );
}
