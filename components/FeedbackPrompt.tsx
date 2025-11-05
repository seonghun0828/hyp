'use client';

import { trackEvent } from '@/lib/analytics';

interface FeedbackPromptProps {
  onClose?: () => void;
}

export const FeedbackPrompt = ({ onClose }: FeedbackPromptProps) => {
  const handleFeedbackClick = () => {
    // 이벤트 추적
    trackEvent('feedback', {
      step: 6,
      page: 'result',
      action: 'feedback',
    });

    // Google Forms로 이동
    window.open('https://forms.gle/6yxH79hG1ize2cCE9', '_blank');

    // 팝업 닫기
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
          <h3>당신의 한마디가 HYP의 다음 버전을 만듭니다 🚀</h3>
          <p>
            어떤 점이 좋았고, 어떤 점이 아쉬웠나요?
            <br />딱 1분만, 베타테스터로서 당신의 의견을 들려주세요.
          </p>
        </div>

        <div className="quick-actions">
          <button onClick={handleFeedbackClick} className="feedback-btn survey">
            💬 피드백 남기기
          </button>
        </div>

        <button onClick={handleSkip} className="skip-btn">
          건너뛰기
        </button>
      </div>
    </div>
  );
};
