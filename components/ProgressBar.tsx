'use client';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  stepNames: string[];
}

export default function ProgressBar({
  currentStep,
  totalSteps,
  stepNames,
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
            {stepNames.map((name, index) => (
              <div
                key={index}
                className={`text-sm font-medium ${
                  index < currentStep
                    ? 'text-blue-600'
                    : index === currentStep - 1
                    ? 'text-blue-600'
                    : 'text-gray-400'
                }`}
              >
                {name}
              </div>
            ))}
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
