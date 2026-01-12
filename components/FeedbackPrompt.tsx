'use client';

import { useTranslations } from 'next-intl';
import { trackEvent } from '@/lib/analytics';

interface FeedbackPromptProps {
  onClose?: () => void;
}

export const FeedbackPrompt = ({ onClose }: FeedbackPromptProps) => {
  const t = useTranslations('feedback');
  const tCommon = useTranslations('common');

  const handleFeedbackClick = () => {
    trackEvent('feedback', {
      step: 6,
      page: 'result',
      action: 'feedback',
    });

    // Google Forms로 이동
    window.open('https://forms.gle/', '_blank');

    if (onClose) {
      onClose();
    }
  };

  const handleSkip = () => {
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
          <button onClick={handleFeedbackClick} className="feedback-btn survey">
            {t('submitButton')}
          </button>
        </div>

        <button onClick={handleSkip} className="skip-btn">
          {tCommon('skip')}
        </button>
      </div>
    </div>
  );
};
