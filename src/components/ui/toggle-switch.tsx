"use client";

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ToggleSwitch({ 
  checked, 
  onChange, 
  disabled = false, 
  size = 'md',
  className 
}: ToggleSwitchProps) {
  const [isPressed, setIsPressed] = useState(false);

  const sizeClasses = {
    sm: 'w-10 h-5',
    md: 'w-12 h-6',
    lg: 'w-14 h-7'
  };

  const thumbSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const handleClick = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseLeave={() => setIsPressed(false)}
        className={cn(
          'relative inline-flex items-center rounded-full border-2 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-primary',
          sizeClasses[size],
          checked 
            ? 'bg-theme-primary border-theme-primary' 
            : 'bg-gray-200 border-gray-300',
          disabled 
            ? 'opacity-50 cursor-not-allowed' 
            : 'cursor-pointer hover:shadow-sm',
          isPressed && 'scale-95',
          className
        )}
      >
        <span
          className={cn(
            'inline-block rounded-full bg-white shadow-sm transform transition-transform duration-200 ease-in-out',
            thumbSizeClasses[size],
            checked 
              ? 'translate-x-6' 
              : 'translate-x-0'
          )}
        />
      </button>
      <span className={cn(
        'text-sm font-medium transition-colors duration-200',
        checked ? 'text-theme-primary' : 'text-gray-500'
      )}>
        {checked ? 'Active' : 'Inactive'}
      </span>
    </div>
  );
}
