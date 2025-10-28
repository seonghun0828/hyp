'use client';

interface FeedbackPromptProps {
  onClose?: () => void;
}

export const FeedbackPrompt = ({ onClose }: FeedbackPromptProps) => {
  const handleFeedbackClick = () => {
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
          <h3>HYP은 지금 여러분과 함께 성장 중이에요 🌱</h3>
          <p>딱 1분이면, 당신의 의견이 다음 버전에 반영됩니다.</p>
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
