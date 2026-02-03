'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useCreditStore } from '@/lib/store';
import { Button } from '@/components/ui/button';

export default function PaymentSuccessPage() {
  const t = useTranslations('paymentSuccess');
  const router = useRouter();
  const { fetchCredits, credits } = useCreditStore();
  const [loading, setLoading] = useState(true);
  const [initialCredits] = useState(credits);
  const [returnUrl, setReturnUrl] = useState<string>('/');

  useEffect(() => {
    // Get return URL from sessionStorage
    const storedUrl = sessionStorage.getItem('payment_return_url');
    if (storedUrl) {
      setReturnUrl(storedUrl);
      sessionStorage.removeItem('payment_return_url');
    }
  }, []);

  useEffect(() => {
    // Poll for credit update (webhook may take a few seconds)
    const pollInterval = setInterval(async () => {
      await fetchCredits();

      // If credits increased, webhook processed successfully
      if (credits !== null && credits > (initialCredits || 0)) {
        setLoading(false);
        clearInterval(pollInterval);
      }
    }, 2000);

    // Timeout after 30 seconds
    const timeout = setTimeout(() => {
      setLoading(false);
      clearInterval(pollInterval);
    }, 30000);

    return () => {
      clearInterval(pollInterval);
      clearTimeout(timeout);
    };
  }, [credits, initialCredits, fetchCredits]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-100">
      <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-8 text-center">
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
            <h1 className="text-lg font-semibold text-neutral-900 mb-2">
              {t('loading')}
            </h1>
            <p className="text-sm text-neutral-500">
              {t('loadingDescription')}
            </p>
          </>
        ) : (
          <>
            <div className="text-4xl mb-4">✅</div>
            <h1 className="text-lg font-semibold text-neutral-900 mb-2">
              {t('title')}
            </h1>
            <p className="text-sm text-neutral-500 mb-6">{t('description')}</p>
            {credits !== null && (
              <p className="text-md text-neutral-700 mb-6">
                {t('currentCredits')}:{' '}
                <strong>{credits.toLocaleString()}</strong>
              </p>
            )}
            <Button onClick={() => router.push(returnUrl)} className="w-full">
              {t('backToApp')}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
