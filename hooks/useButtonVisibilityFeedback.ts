import { useState, useEffect } from 'react';

export const useButtonVisibilityFeedback = () => {
  const [showFeedback, setShowFeedback] = useState(false);
  const [buttonsVisible, setButtonsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !buttonsVisible) {
            setButtonsVisible(true);
            observer.disconnect(); // 한 번만 감지
          }
        });
      },
      {
        threshold: 0.1, // 10% 보이면 감지
        rootMargin: '0px', // 뷰포트 기준
      }
    );

    // 버튼 컨테이너 찾기 및 관찰 시작
    const findAndObserve = () => {
      const buttonContainer = document.querySelector('.button-container');

      if (buttonContainer) {
        observer.observe(buttonContainer);
        return true;
      }
      return false;
    };

    // 즉시 시도
    if (!findAndObserve()) {
      // 실패하면 100ms마다 재시도 (최대 3초)
      const retryInterval = setInterval(() => {
        if (findAndObserve()) {
          clearInterval(retryInterval);
        }
      }, 100);

      const timeout = setTimeout(() => {
        clearInterval(retryInterval);
      }, 3000);

      return () => {
        observer.disconnect();
        clearInterval(retryInterval);
        clearTimeout(timeout);
      };
    }

    return () => observer.disconnect();
  }, [buttonsVisible]);

  useEffect(() => {
    if (buttonsVisible) {
      // 버튼이 보인 후 3초 뒤 팝업
      const timer = setTimeout(() => {
        setShowFeedback(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [buttonsVisible]);

  return showFeedback;
};
