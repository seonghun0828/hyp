'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';

interface CustomImagePromptPanelProps {
  onGenerate: (prompt: string) => Promise<void>;
  onClose: () => void;
  isLoading: boolean;
  creditCost: number;
  value: string;
  onChange: (value: string) => void;
}

export default function CustomImagePromptPanel({
  onGenerate,
  onClose,
  isLoading,
  creditCost,
  value: prompt,
  onChange: setPrompt,
}: CustomImagePromptPanelProps) {
  const t = useTranslations('editor.customPrompt');
  const [showValidationError, setShowValidationError] = useState(false);

  const maxLength = 500;
  const minLength = 10;
  const isValidLength =
    prompt.trim().length >= minLength && prompt.trim().length <= maxLength;

  const handleGenerate = async () => {
    if (isLoading) return;

    // Show validation error if length is invalid
    if (!isValidLength) {
      setShowValidationError(true);
      return;
    }

    await onGenerate(prompt.trim());
    // Parent will reset prompt after success
  };

  const handlePromptChange = (value: string) => {
    setPrompt(value);
    // Clear validation error when user starts typing
    if (showValidationError) {
      setShowValidationError(false);
    }
  };

  const handleExampleClick = (example: string) => {
    setPrompt(example);
    // Clear validation error when selecting example
    if (showValidationError) {
      setShowValidationError(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setPrompt(''); // Reset when manually closing
      onClose();
    }
  };

  return (
    <>
      {/* Mobile: Backdrop overlay */}
      <div
        className="lg:hidden fixed inset-0 bg-black/50 z-40"
        onClick={handleClose}
      />

      {/* Panel Container */}
      <div
        className="
        lg:relative lg:h-auto lg:bg-white lg:rounded-lg lg:shadow-md
        fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50
        max-h-[80vh] overflow-y-auto
        animate-slide-up lg:animate-none
      "
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 lg:px-6 lg:py-4 flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 lg:text-xl">
              {t('title')}
            </h3>
            <p className="text-xs text-gray-600 mt-1">{t('description')}</p>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="ml-2 p-1 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="px-4 py-4 lg:px-6 space-y-4">
          {/* Prompt Textarea */}
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => handlePromptChange(e.target.value)}
              placeholder={t('placeholder')}
              disabled={isLoading}
              className="w-full min-h-[100px] p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
              maxLength={maxLength}
            />
            <div className="absolute bottom-2 right-2 text-xs text-gray-500">
              {prompt.length}/{maxLength}
            </div>
          </div>

          {/* Validation Message */}
          {showValidationError && !isValidLength && (
            <p className="text-sm text-red-600">
              {t('validationMinLength', { minLength })}
            </p>
          )}

          {/* Example Prompts */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">{t('examples')}</p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => handleExampleClick(t('examplePrompts.example1'))}
                disabled={isLoading}
                className="w-full px-3 py-2 text-sm text-left bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('examplePrompts.example1')}
              </button>
              <button
                type="button"
                onClick={() => handleExampleClick(t('examplePrompts.example2'))}
                disabled={isLoading}
                className="w-full px-3 py-2 text-sm text-left bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('examplePrompts.example2')}
              </button>
              <button
                type="button"
                onClick={() => handleExampleClick(t('examplePrompts.example3'))}
                disabled={isLoading}
                className="w-full px-3 py-2 text-sm text-left bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('examplePrompts.example3')}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2 pb-safe">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-[0.6] px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {t('cancel')}
            </button>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={!isValidLength || isLoading}
              className="flex-[1.4] px-4 py-2.5 bg-linear-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
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
                <span className="text-center leading-tight">
                  {t('generate')}
                  <br />
                  <span className="text-[10px] opacity-75 font-normal">
                    ({creditCost} {t('credits')})
                  </span>
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
