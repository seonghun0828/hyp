'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useTranslations } from 'next-intl';
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
  title,
  description,
}: LoginModalProps) {
  const t = useTranslations('auth');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            {title || t('loginRequired')}
          </DialogTitle>
          <DialogDescription className="text-center pt-2 whitespace-pre-line text-base text-gray-600">
            {description || t('loginDescription')}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800 mb-2">
            <p className="font-semibold mb-1">{t('signupBenefits')}</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                {t('benefit1', { credits: INITIAL_CREDITS.MEMBER })}
              </li>
              <li>{t('benefit2')}</li>
              <li>{t('benefit3')}</li>
            </ul>
          </div>
          <GoogleLoginButton size="lg" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
