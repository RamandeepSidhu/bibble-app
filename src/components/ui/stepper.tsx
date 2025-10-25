'use client';

import { cn } from '@/lib/utils';

interface StepperProps {
  steps: {
    id: string;
    title: string;
  }[];
  currentStep: number;
}

export function Stepper({ steps, currentStep }: StepperProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-center">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isDisabled = index > currentStep;

          return (
            <div key={step.id} className="flex items-center">
              {/* Step Circle */}
              <div
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors",
                  isCurrent && "border-theme-primary text-theme-primary bg-theme-secondary",
                  isCompleted && "bg-theme-primary border-theme-primary text-theme-secondary",
                  isDisabled && "border-gray-300 text-gray-400 bg-white"
                )}
              >
                <span className="text-sm font-medium">{index + 1}</span>
              </div>

              {/* Step Title */}
              <div className="ml-2">
                <div
                  className={cn(
                    "text-sm font-medium",
                    isCurrent && "text-theme-primary font-bold",
                    isCompleted && "text-gray-600",
                    isDisabled && "text-gray-500"
                  )}
                >
                  {step.title}
                </div>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "w-[560px] mr-[20px] ml-[20px] h-0.5 transition-colors ",
                    isCompleted ? "bg-theme-primary" : "bg-gray-300"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
