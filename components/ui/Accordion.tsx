
import React, { useState, useRef, useEffect } from 'react';
import { ChevronRightIcon } from '../icons/ChevronRightIcon';

// Accordion container
export const Accordion: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="w-full">{children}</div>
);

interface AccordionItemProps {
    title: string;
    children: React.ReactNode;
}

export const AccordionItem: React.FC<AccordionItemProps> = ({ title, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);
    const [height, setHeight] = useState(0);

    useEffect(() => {
        if (contentRef.current) {
            setHeight(isOpen ? contentRef.current.scrollHeight : 0);
        }
    }, [isOpen, children]);

    return (
        <div className="border-b border-[#F3F4F6] dark:border-zinc-800 last:border-b-0">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center text-left py-4 group"
                aria-expanded={isOpen}
            >
                {/* Question: Medium weight, Dark Charcoal (#1F2937) */}
                <span className="font-medium text-[#1F2937] dark:text-gray-200 text-base pr-4">{title}</span>
                {/* Icon: Blue Chevron (#007AFF) rotating 90deg */}
                <ChevronRightIcon
                    className={`w-5 h-5 text-[#007AFF] transition-transform duration-300 flex-shrink-0 ${isOpen ? 'rotate-90' : ''}`}
                />
            </button>
            <div
                style={{ maxHeight: `${height}px` }}
                className="overflow-hidden transition-max-height duration-300 ease-in-out"
            >
                {/* Answer: Regular weight, Slate Gray (#6B7280) */}
                <div ref={contentRef} className="pb-4 text-[#6B7280] dark:text-gray-400 font-normal leading-relaxed">
                    {children}
                </div>
            </div>
        </div>
    );
};
