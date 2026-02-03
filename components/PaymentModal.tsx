'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { signInWithGoogle } from '@/lib/auth';
import { usePathname } from 'next/navigation';
import { rechargeCredits } from '@/lib/api/credits';
import { createCheckout } from '@/lib/api/payments';
import { PricingTier } from '@/lib/lemonsqueezy';
import { useState } from 'react';
import { FeedbackPrompt } from '@/components/FeedbackPrompt';
import { PRICING_TIERS } from '@/lib/constants';

const ENABLE_PAID_CREDITS =
  process.env.NEXT_PUBLIC_ENABLE_PAID_CREDITS === 'true';

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  description?: React.ReactNode;
  onSuccess?: () => void;
  isLoggedIn?: boolean;
}

export default function PaymentModal({
  open,
  onOpenChange,
  description,
  onSuccess,
  isLoggedIn = false,
}: PaymentModalProps) {
  const pathname = usePathname();
  const t = useTranslations('payment');
  const tAuth = useTranslations('auth');
  const [loading, setLoading] = useState(false);
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle(pathname);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleFreeRecharge = async () => {
    try {
      setLoading(true);
      await rechargeCredits(500);

      onOpenChange(false);
      setShowFeedback(true);
    } catch (error) {
      console.error('Recharge failed:', error);
      alert(t('errorRecharge'));
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTier = async (tier: PricingTier) => {
    try {
      setLoadingTier(tier);
      // Store current pathname to return to after payment
      sessionStorage.setItem('payment_return_url', pathname);
      const { checkoutUrl } = await createCheckout(tier);
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error('Checkout failed:', error);
      alert(t('errorCheckout'));
      setLoadingTier(null);
    }
  };

  const handleFeedbackClose = () => {
    setShowFeedback(false);
    onSuccess?.();
  };

  if (showFeedback) {
    return <FeedbackPrompt onClose={handleFeedbackClose} />;
  }

  // Non-logged-in users: Show login prompt
  if (!isLoggedIn) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-neutral-900 text-lg font-semibold">
              {t('titleNoCredit')}
            </DialogTitle>
            <DialogDescription asChild>
              <div className="text-neutral-500 text-sm">
                {description || t('descriptionNoCredit')}
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 flex flex-col items-center gap-4 text-center">
            <p className="text-lg font-bold text-neutral-900">
              {tAuth('firstLoginGift')}
            </p>
          </div>

          <Button
            className="w-full flex items-center justify-center gap-2"
            onClick={handleGoogleLogin}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
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
            {tAuth('googleLogin')}
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  // Logged-in users: Beta mode (free only) or Production mode (paid only)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={ENABLE_PAID_CREDITS ? 'sm:max-w-3xl' : 'sm:max-w-md'}
      >
        <DialogHeader>
          <DialogTitle className="text-neutral-900 text-lg font-semibold">
            {t('title')}
          </DialogTitle>
          <DialogDescription asChild>
            <div className="text-neutral-500 text-sm">
              {description || t('description')}
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6 py-6">
          {/* Beta Mode: Free Recharge Only */}
          {!ENABLE_PAID_CREDITS && (
            <div className="border border-neutral-300 rounded-lg p-6 bg-neutral-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-md font-semibold text-neutral-900">
                    {t('freeTier.title')}
                  </h3>
                  <p className="text-sm text-neutral-500 mt-1">
                    {t('freeTier.description')}
                  </p>
                </div>
                <Button
                  onClick={handleFreeRecharge}
                  disabled={loading}
                  variant="outline"
                >
                  {loading ? t('recharging') : t('freeTier.button')}
                </Button>
              </div>
            </div>
          )}

          {/* Production Mode: Paid Tiers Only */}
          {ENABLE_PAID_CREDITS && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {PRICING_TIERS.map((tier) => (
                  <div
                    key={tier.id}
                    className={`
                      relative rounded-lg border p-6 flex flex-col gap-4
                      ${
                        tier.popular
                          ? 'border-primary-600 bg-primary-100/30'
                          : 'border-neutral-300 bg-white'
                      }
                    `}
                  >
                    {tier.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary-600 text-white text-xs font-medium rounded-full">
                        {t('popular')}
                      </div>
                    )}

                    <div className="text-neutral-900 text-md font-medium">
                      {t(`tier.${tier.id}.name`)}
                    </div>

                    <div>
                      <div className="text-neutral-900 text-xl font-semibold">
                        ${tier.price}
                      </div>
                      <div className="text-neutral-500 text-sm">
                        {tier.credits.toLocaleString()} {t('credits')}
                      </div>
                    </div>

                    <Button
                      onClick={() => handleSelectTier(tier.id)}
                      disabled={!!loadingTier}
                      variant={tier.popular ? 'default' : 'outline'}
                      className="w-full mt-auto"
                    >
                      {loadingTier === tier.id ? t('processing') : t('select')}
                    </Button>
                  </div>
                ))}
              </div>

              <div className="text-neutral-500 text-xs text-center">
                {t('securePayment')}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
