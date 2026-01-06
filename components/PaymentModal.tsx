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

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PaymentModal({
  open,
  onOpenChange,
}: PaymentModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>크레딧 충전</DialogTitle>
          <DialogDescription>
            크레딧이 부족합니다. 결제를 통해 충전해주세요.
          </DialogDescription>
        </DialogHeader>
        <div className="py-6 flex flex-col items-center justify-center gap-4 text-center">
          <div className="text-4xl">💳</div>
          <p className="text-gray-600">
            결제 시스템은 현재 준비 중입니다.
            <br />
            (결제 모듈 연동 예정)
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            닫기
          </Button>
          <Button onClick={() => onOpenChange(false)}>충전하기 (Test)</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
