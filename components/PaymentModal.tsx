'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { signInWithGoogle } from '@/lib/auth';
import { usePathname } from 'next/navigation';
import { rechargeCredits } from '@/lib/api/credits';
import { useState } from 'react';
import { FeedbackPrompt } from '@/components/FeedbackPrompt';

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
  const [loading, setLoading] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle(pathname);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleRecharge = async () => {
    try {
      setLoading(true);
      // 50 크레딧 충전
      await rechargeCredits(5);

      // 모달 닫기 및 성공 콜백
      onOpenChange(false);
      onSuccess?.();

      // 피드백 프롬프트 표시 (별도 오버레이로 띄움)
      setShowFeedback(true);
    } catch (error) {
      console.error('Recharge failed:', error);
      alert('충전에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  // 피드백 프롬프트가 활성화된 경우 (모달이 닫힌 후 보여짐)
  if (showFeedback) {
    return <FeedbackPrompt onClose={() => setShowFeedback(false)} />;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isLoggedIn ? '베타 테스터 혜택 🎉' : '무료 체험 크레딧 소진'}
          </DialogTitle>
          <DialogDescription asChild>
            <div className="text-muted-foreground text-sm">
              {description ||
                (isLoggedIn
                  ? '오픈 베타 기간 동안 무제한 무료로 이용하실 수 있습니다.'
                  : '아쉬워하지 마세요! 로그인하면 무료로 더 이용할 수 있어요.')}
            </div>
          </DialogDescription>
        </DialogHeader>

        {isLoggedIn ? (
          <div className="py-6 flex flex-col items-center justify-center gap-4 text-center">
            <div className="text-4xl">💎</div>
            <p className="text-gray-600 text-sm">
              서비스를 이용해주셔서 감사합니다.
              <br />
              버튼을 눌러 무료로 충전하고 계속 이용해보세요!
            </p>
          </div>
        ) : (
          <div className="py-4 flex flex-col items-center justify-center gap-4 text-center">
            <p className="text-lg font-bold text-gray-900">
              가입 즉시 5크레딧 선물! 🎁
            </p>
          </div>
        )}

        <DialogFooter className={!isLoggedIn ? 'sm:justify-center' : ''}>
          {isLoggedIn ? (
            <>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                닫기
              </Button>
              <Button
                onClick={handleRecharge}
                disabled={loading}
                className="bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0"
              >
                {loading ? '충전 중...' : '무료로 충전하고 계속하기'}
              </Button>
            </>
          ) : (
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
              Google로 시작하기
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
