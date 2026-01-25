'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useTranslations } from 'next-intl';

interface CustomImagePromptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (prompt: string) => Promise<void>;
  isLoading: boolean;
  creditCost: number;
}

export default function CustomImagePromptModal({
  open,
  onOpenChange,
  onGenerate,
  isLoading,
  creditCost,
}: CustomImagePromptModalProps) {
  const t = useTranslations('editor.customPrompt');
  const [prompt, setPrompt] = useState('');

  const maxLength = 500;
  const minLength = 10;
  const isValidLength =
    prompt.trim().length >= minLength && prompt.trim().length <= maxLength;

  const handleGenerate = async () => {
    if (!isValidLength || isLoading) return;

    await onGenerate(prompt.trim());
    setPrompt(''); // 성공 후 초기화
  };

  const handleExampleClick = (example: string) => {
    setPrompt(example);
  };

  const handleClose = (open: boolean) => {
    if (!isLoading) {
      onOpenChange(open);
      if (!open) {
        setPrompt(''); // 모달 닫을 때 초기화
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{t('title')}</DialogTitle>
          <DialogDescription className="text-gray-600">
            {t('description')}
          </DialogDescription>
        </DialogHeader>

        {/* Credit Cost Badge */}
        <div className="bg-linear-to-r from-purple-50 to-indigo-50 p-3 rounded-lg border border-purple-200">
          <p className="text-center text-sm font-semibold text-purple-700">
            {t('costNotice', { cost: creditCost })}
          </p>
        </div>

        <div className="flex flex-col gap-4 py-2">
          {/* Prompt Textarea */}
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={t('placeholder')}
              disabled={isLoading}
              className="w-full min-h-[120px] p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              maxLength={maxLength}
            />
            <div className="absolute bottom-2 right-2 text-xs text-gray-500">
              {prompt.length}/{maxLength}
            </div>
          </div>

          {/* Validation Message */}
          {prompt.trim().length > 0 && prompt.trim().length < minLength && (
            <p className="text-sm text-red-600">
              {t('validationMinLength', {
                minLength,
                currentLength: prompt.trim().length,
              })}
            </p>
          )}

          {/* Example Prompts */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">{t('examples')}</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleExampleClick(t('examplePrompts.example1'))}
                disabled={isLoading}
                className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('examplePrompts.example1')}
              </button>
              <button
                type="button"
                onClick={() => handleExampleClick(t('examplePrompts.example2'))}
                disabled={isLoading}
                className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('examplePrompts.example2')}
              </button>
              <button
                type="button"
                onClick={() => handleExampleClick(t('examplePrompts.example3'))}
                disabled={isLoading}
                className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('examplePrompts.example3')}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => handleClose(false)}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('cancel')}
            </button>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={!isValidLength || isLoading}
              className="flex-1 px-4 py-2.5 bg-linear-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>{t('generating')}</span>
                </>
              ) : (
                <span>{t('generate')}</span>
              )}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
