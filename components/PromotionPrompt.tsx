'use client';

import { trackEvent } from '@/lib/analytics';

interface PromotionPromptProps {
  onClose?: () => void;
  onAgree?: () => void;
}

export const PromotionPrompt = ({ onClose, onAgree }: PromotionPromptProps) => {
  const handleAgree = () => {
    // 이벤트 추적
    trackEvent('promotion_agree', {
      step: 6,
      page: 'result',
      action: 'promotion_agree',
    });

    // 동의하기 처리 (나중에 API 호출 등 추가 가능)
    if (onAgree) {
      onAgree();
    }

    // 팝업 닫기
    if (onClose) {
      onClose();
    }
  };

  const handleDecline = () => {
    // 이벤트 추적
    trackEvent('promotion_decline', {
      step: 6,
      page: 'result',
      action: 'promotion_decline',
    });

    // 팝업 닫기
    if (onClose) {
      onClose();
    }
  };

  if (!onClose) return null;

  return (
    <div className="feedback-popup-overlay">
      <div className="feedback-popup">
        <div className="feedback-header">
          <h3>프로젝트를 대신 홍보해드릴까요?</h3>
          <p>
            동의하시면 HYP의 SNS 채널에 방금 만든 콘텐츠를 올려
            <br />
            당신의 프로젝트를 소개해드릴게요.
          </p>
        </div>

        <div className="quick-actions">
          <button onClick={handleAgree} className="feedback-btn survey">
            동의하기
          </button>
        </div>

        <button onClick={handleDecline} className="skip-btn">
          괜찮아요
        </button>

        <p className="text-xs text-gray-500 mt-4">
          ※ 게시된 콘텐츠는 프로젝트 홍보와 HYP 사례 소개 목적에 함께 활용될 수
          있습니다.
        </p>
      </div>
    </div>
  );
};
