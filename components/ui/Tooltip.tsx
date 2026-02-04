
import React, { useContext, useState } from 'react';
import { SettingsContext } from '../../contexts/SettingsContext';

interface TooltipProps {
    text: string;
    children: React.ReactNode;
    position?: 'top' | 'bottom' | 'left' | 'right';
}

export const Tooltip: React.FC<TooltipProps> = ({ text, children, position = 'top' }) => {
    const { settings } = useContext(SettingsContext);
    const [isVisible, setIsVisible] = useState(false);

    if (!settings.tooltipsEnabled) return <>{children}</>;

    // Position container logic
    // We use custom keyframe animations defined in index.html to handle the translate(-50%) centering + sliding effect
    const positionClasses = {
        top: 'bottom-full left-1/2 mb-2.5 tooltip-anim-top',
        bottom: 'top-full left-1/2 mt-2.5 tooltip-anim-bottom',
        left: 'right-full top-1/2 mr-2.5 tooltip-anim-left',
        right: 'left-full top-1/2 ml-2.5 tooltip-anim-right',
    };

    // Arrow positioning
    const arrowClasses = {
        top: 'top-full left-1/2 -translate-x-1/2 -translate-y-[4px]', // Points down
        bottom: 'bottom-full left-1/2 -translate-x-1/2 translate-y-[4px]', // Points up
        left: 'left-full top-1/2 -translate-y-1/2 -translate-x-[4px]', // Points right
        right: 'right-full top-1/2 -translate-y-1/2 translate-x-[4px]', // Points left
    };

    return (
        <div 
            className="relative inline-flex items-center justify-center" 
            onMouseEnter={() => setIsVisible(true)} 
            onMouseLeave={() => setIsVisible(false)}
            onFocus={() => setIsVisible(true)}
            onBlur={() => setIsVisible(false)}
            role="tooltip"
        >
            {children}
            {isVisible && (
                <div 
                    className={`
                        absolute z-[60] px-3 py-1.5 
                        bg-[#1F2937] text-white text-[12px] font-medium leading-none
                        rounded-lg shadow-lg whitespace-nowrap 
                        pointer-events-none 
                        ${positionClasses[position]}
                    `}
                >
                    {text}
                    {/* Rotated square for arrow */}
                    <div className={`absolute w-2 h-2 bg-[#1F2937] rotate-45 ${arrowClasses[position]}`} />
                </div>
            )}
        </div>
    );
};
