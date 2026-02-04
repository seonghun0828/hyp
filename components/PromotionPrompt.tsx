'use client';

import { useLocale, useTranslations } from 'next-intl';
import { trackEvent } from '@/lib/analytics';

interface PromotionPromptProps {
  resultId: string;
  onClose?: () => void;
  onAgree?: () => void;
}

export const PromotionPrompt = ({
  resultId,
  onClose,
  onAgree,
}: PromotionPromptProps) => {
  const t = useTranslations('promotion');
  const locale = useLocale();

  // Get locale-specific form ID
  const formId =
    locale === 'ko'
      ? process.env.NEXT_PUBLIC_TALLY_FORM_ID_KO
      : process.env.NEXT_PUBLIC_TALLY_FORM_ID_EN;

  const handleAgree = async () => {
    trackEvent('promotion_agree', {
      step: 6,
      page: 'result',
      action: 'promotion_agree',
    });

    try {
      fetch('/api/promotion-consent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resultId,
          consent: true,
        }),
      });
    } catch (error) {
      console.error('Failed to save promotion consent:', error);
    }

    if (onAgree) {
      onAgree();
    }

    if (onClose) {
      onClose();
    }
  };

  const handleDecline = () => {
    trackEvent('promotion_decline', {
      step: 6,
      page: 'result',
      action: 'promotion_decline',
    });

    if (onClose) {
      onClose();
    }
  };

  if (!onClose) return null;

  return (
    <div className="feedback-popup-overlay">
      <div className="feedback-popup">
        <div className="feedback-header">
          <h3>{t('title')}</h3>
          <p className="whitespace-pre-line">{t('description')}</p>
        </div>

        <div className="quick-actions">
          <button
            onClick={handleAgree}
            className="feedback-btn survey"
            data-tally-open={formId}
            data-tally-hide-title="1"
            data-tally-emoji-text="📝"
            data-tally-emoji-animation="wave"
          >
            {t('agreeButton')}
          </button>
        </div>

        <button
          onClick={handleDecline}
          className="skip-btn"
          data-tally-open={formId}
          data-tally-hide-title="1"
          data-tally-emoji-text="📝"
          data-tally-emoji-animation="wave"
        >
          {t('declineButton')}
        </button>

        <p className="text-xs text-gray-500 mt-4">{t('notice')}</p>
      </div>
    </div>
  );
};
