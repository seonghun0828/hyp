'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface CreditGuideModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentCredits: number | null;
  onOpenRecharge: () => void;
}

export default function CreditGuideModal({
  open,
  onOpenChange,
  currentCredits,
  onOpenRecharge,
}: CreditGuideModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>크레딧 안내</DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-6">
          {/* Current Credits */}
          <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-lg">
            <span className="text-sm text-gray-500 mb-1">현재 보유 크레딧</span>
            <div className="text-3xl font-bold text-primary flex items-center gap-2">
              <span>🪙</span>
              <span>{currentCredits?.toLocaleString() ?? 0}</span>
            </div>
          </div>

          {/* Accordions */}
          <div className="space-y-2">
            <AccordionItem title="크레딧이 무엇인가요?">
              <div className="space-y-2 text-sm text-gray-600 leading-relaxed">
                <p>
                  제품 분석부터 이미지 생성, 홍보 문구 추천까지
                  <br />
                  <span className="font-semibold text-gray-900">
                    {' '}
                    한 번의 전체 과정을 완료하는 데 2 크레딧
                  </span>
                  이 사용됩니다.
                  <br />
                  (기본 이미지 + 추가 이미지 2장 포함)
                </p>
                <p>
                  더 많은 이미지를 보고 싶다면
                  <br />
                  <span className="font-semibold text-gray-900">
                    {' '}
                    1 크레딧으로 2장의 추가 이미지
                  </span>
                  를 생성할 수 있습니다.
                </p>
              </div>
            </AccordionItem>

            <AccordionItem title="크레딧을 어떻게 충전하나요?">
              <div className="space-y-2 text-sm text-gray-600 leading-relaxed">
                <p>
                  처음 방문하시면{' '}
                  <span className="font-semibold text-gray-900">
                    체험용 3 크레딧
                  </span>
                  을 드리고,
                  <br />
                  로그인하시면{' '}
                  <span className="font-semibold text-gray-900">5 크레딧</span>
                  을 추가로 드려요!
                </p>
                <p>모두 사용하셨다면 충전하여 계속 이용하실 수 있습니다.</p>
              </div>
            </AccordionItem>
          </div>
        </div>

        <DialogFooter>
          <Button
            className="w-full"
            size="lg"
            onClick={() => {
              onOpenChange(false);
              onOpenRecharge();
            }}
          >
            크레딧 충전하기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AccordionItem({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left bg-white hover:bg-gray-50 transition-colors"
      >
        <span className="font-medium text-gray-900">{title}</span>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      <div
        className={`transition-all duration-200 ease-in-out ${
          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        } overflow-hidden bg-gray-50`}
      >
        <div className="p-4 border-t border-gray-100">{children}</div>
      </div>
    </div>
  );
}
