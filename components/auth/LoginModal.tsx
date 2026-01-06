'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import GoogleLoginButton from './GoogleLoginButton';
import { INITIAL_CREDITS } from '@/lib/constants';

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
}

export default function LoginModal({
  open,
  onOpenChange,
  title = '로그인이 필요해요',
  description = '무료 사용량을 모두 소진하셨습니다.\n로그인하고 더 많은 혜택을 누려보세요! 🎁',
}: LoginModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            {title}
          </DialogTitle>
          <DialogDescription className="text-center pt-2 whitespace-pre-line text-base text-gray-600">
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800 mb-2">
            <p className="font-semibold mb-1">💡 회원가입 혜택</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                가입 즉시{' '}
                <span className="font-bold">
                  {INITIAL_CREDITS.MEMBER} 크레딧
                </span>{' '}
                제공
              </li>
              <li>생성된 콘텐츠 저장 및 관리</li>
              <li>더 정교한 AI 분석 기능</li>
            </ul>
          </div>
          <GoogleLoginButton size="lg" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
