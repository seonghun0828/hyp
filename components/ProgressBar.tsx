'use client';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  stepNames: string[];
  onStepClick?: (stepIndex: number) => void;
}

export default function ProgressBar({
  currentStep,
  totalSteps,
  stepNames,
  onStepClick,
}: ProgressBarProps) {
  const progress = (currentStep / totalSteps) * 100;
  const isFirstStep = currentStep === 1;

  return (
    <div
      className={`w-full max-w-4xl mx-auto px-4 transition-opacity duration-300 ${
        isFirstStep ? 'py-2 opacity-40' : 'py-6 opacity-100'
      }`}
    >
      {/* Progress Bar */}
      <div className="relative">
        {/* 텍스트 라벨 - 첫 단계에서는 숨김, 모바일에서도 숨김 */}
        {!isFirstStep && (
          <div className="hidden md:flex justify-between items-center mb-2">
            {stepNames.map((name, index) => {
              const stepNumber = index + 1;
              const isClickable = onStepClick && stepNumber <= currentStep;
              const isCurrentStep = stepNumber === currentStep;
              
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    if (isClickable && onStepClick) {
                      onStepClick(stepNumber);
                    }
                  }}
                  disabled={!isClickable}
                  className={`text-sm font-medium transition-colors ${
                    index < currentStep
                      ? 'text-blue-600'
                      : index === currentStep - 1
                      ? 'text-blue-600'
                      : 'text-gray-400'
                  } ${
                    isClickable
                      ? 'cursor-pointer hover:text-blue-800 hover:underline'
                      : 'cursor-default'
                  } ${
                    isCurrentStep ? 'font-bold' : ''
                  }`}
                  title={
                    isClickable
                      ? `Go to step ${stepNumber}: ${name}`
                      : undefined
                  }
                >
                  {name}
                </button>
              );
            })}
          </div>
        )}

        {/* 진행바 */}
        <div
          className={`w-full bg-gray-200 rounded-full ${
            isFirstStep ? 'h-1' : 'h-2'
          }`}
        >
          <div
            className={`bg-blue-600 rounded-full transition-all duration-300 ease-out ${
              isFirstStep ? 'h-1' : 'h-2'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* 점 표시 - 첫 단계에서는 숨김 */}
        {!isFirstStep && (
          <div className="flex justify-between mt-1">
            {stepNames.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full border-2 ${
                  index < currentStep
                    ? 'bg-blue-600 border-blue-600'
                    : index === currentStep - 1
                    ? 'bg-blue-600 border-blue-600'
                    : 'bg-white border-gray-300'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
