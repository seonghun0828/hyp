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

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6">
      {/* Progress Bar */}
      <div className="relative">
        <div className="flex justify-between items-center mb-2">
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

        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

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
      </div>
    </div>
  );
}
