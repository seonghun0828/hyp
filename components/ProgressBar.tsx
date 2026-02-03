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
      className={`w-full px-4 md:px-8 lg:px-12 xl:px-16 transition-opacity duration-base ${
        isFirstStep ? 'py-2 opacity-40' : 'py-6 opacity-100'
      }`}
    >
      <div className="max-w-7xl mx-auto">
        {/* Progress Bar */}
        <div className="relative">
        {/* Step Labels - hidden on first step and mobile */}
        {!isFirstStep && (
          <div className="hidden md:flex justify-between items-center mb-2">
            {stepNames.map((name, index) => {
              const stepNumber = index + 1;
              const isClickable = onStepClick && stepNumber <= currentStep;
              const isCurrentStep = stepNumber === currentStep;
              const isCompleted = stepNumber < currentStep;

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
                  className={`text-xs lg:text-sm transition-colors duration-fast ${
                    isCompleted || isCurrentStep
                      ? 'text-primary-600'
                      : 'text-neutral-500'
                  } ${
                    isClickable
                      ? 'cursor-pointer hover:text-primary-500 hover:underline'
                      : 'cursor-default'
                  } ${isCurrentStep ? 'font-semibold' : 'font-medium'}`}
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

        {/* Progress Track */}
        <div
          className={`w-full bg-neutral-200 rounded-full ${
            isFirstStep ? 'h-1' : 'h-2'
          }`}
        >
          <div
            className={`bg-primary-600 rounded-full transition-all duration-slow ease-out ${
              isFirstStep ? 'h-1' : 'h-2'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Step Dots - hidden on first step */}
        {!isFirstStep && (
          <div className="flex justify-between mt-1">
            {stepNames.map((_, index) => {
              const stepNumber = index + 1;
              const isCompleted = stepNumber < currentStep;
              const isCurrentStep = stepNumber === currentStep;

              return (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full border-2 transition-colors duration-fast ${
                    isCompleted || isCurrentStep
                      ? 'bg-primary-600 border-primary-600'
                      : 'bg-white border-neutral-300'
                  }`}
                />
              );
            })}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
