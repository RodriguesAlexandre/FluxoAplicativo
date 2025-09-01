
import React, { useLayoutEffect, useState, useRef } from 'react';
import { Button, Icon } from '../common/index.tsx';
import { TourStep } from '../../tourSteps';

interface TourPopoverProps {
  step: TourStep;
  currentStepIndex: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
}

export const TourPopover: React.FC<TourPopoverProps> = ({ step, currentStepIndex, totalSteps, onNext, onPrev, onSkip }) => {
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const popoverRef = useRef<HTMLDivElement>(null);
  const targetElement = document.querySelector(step.target);

  useLayoutEffect(() => {
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      // Use a timeout to wait for scrolling to finish before getting rect, making it more robust.
      const timeoutId = setTimeout(() => {
        const rect = targetElement.getBoundingClientRect();
        setPosition({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        });
      }, 300);
      
      return () => clearTimeout(timeoutId);
    }
  }, [step.target, targetElement]);

  const popoverPositionStyle = () => {
    if (!popoverRef.current || !targetElement) return { top: -9999, left: -9999 };

    const popoverRect = popoverRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - (position.top + position.height);
    const spaceAbove = position.top;

    let top = position.top + position.height + 10; // Default below
    if (spaceBelow < popoverRect.height && spaceAbove > popoverRect.height) {
      top = position.top - popoverRect.height - 10; // Position above if not enough space below
    }

    let left = position.left + position.width / 2 - popoverRect.width / 2;
    left = Math.max(10, Math.min(left, window.innerWidth - popoverRect.width - 10)); // Clamp to viewport

    return { top, left };
  };

  // Don't render until the target is found and its position is calculated
  if (!targetElement || position.width === 0) return null;
  
  const padding = 4;
  const holeX = position.left - padding;
  const holeY = position.top - padding;
  const holeWidth = position.width + padding * 2;
  const holeHeight = position.height + padding * 2;


  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* SVG-based overlay with a cutout mask. This is more robust than clip-path or box-shadow hacks. */}
      <svg width="100%" height="100%" className="fixed inset-0 pointer-events-auto" onClick={onSkip}>
        <defs>
          <mask id="tour-spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            <rect x={holeX} y={holeY} width={holeWidth} height={holeHeight} fill="black" rx="8" />
          </mask>
        </defs>
        {/* The dark overlay */}
        <rect width="100%" height="100%" fill="rgba(0,0,0,0.6)" mask="url(#tour-spotlight-mask)" />
      </svg>
      
      {/* Highlight border around the hole */}
      <div
        className="absolute rounded-lg transition-all duration-300 ease-in-out"
        style={{
          top: holeY,
          left: holeX,
          width: holeWidth,
          height: holeHeight,
          boxShadow: '0 0 15px rgba(255,255,255,0.5), inset 0 0 1px 1px rgba(255,255,255,0.5)',
        }}
      />
      
      {/* Popover */}
      <div
        ref={popoverRef}
        className="fixed bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-80 p-5 transform transition-all duration-300 animate-[fade-in-down_300ms_ease-out] pointer-events-auto"
        style={popoverPositionStyle()}
      >
        <h3 className="font-bold text-lg mb-2">{step.title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300">{step.content}</p>
        
        <div className="flex justify-between items-center mt-4">
          <span className="text-xs text-gray-500">{currentStepIndex + 1} / {totalSteps}</span>
          <div className="flex gap-2">
            {currentStepIndex > 0 && (
              <Button variant="secondary" size="sm" onClick={onPrev}>Anterior</Button>
            )}
            {currentStepIndex < totalSteps - 1 ? (
              <Button size="sm" onClick={onNext}>Próximo</Button>
            ) : (
              <Button size="sm" onClick={onSkip}>Finalizar</Button>
            )}
          </div>
        </div>
         <Button variant="ghost" size="sm" onClick={onSkip} className="absolute top-2 right-2 !p-1">
            <Icon name="close" className="w-5 h-5" />
         </Button>
      </div>
    </div>
  );
};