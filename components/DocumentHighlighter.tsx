
import React, { useState, useRef, useEffect, useMemo } from 'react';
import type { UploadedFile, Highlight } from '../types';

interface DocumentHighlighterProps {
    file: UploadedFile;
    highlights: Highlight[];
    hoveredField: string | null;
    activeField?: string | null; // Field focused in the form
    onHoverField: (fieldName: string | null) => void;
    showHighlights: boolean;
}

const getConfidenceStyles = (score: number): { borderColor: string; glow: string } => {
    if (score >= 90) return { borderColor: 'rgba(52, 199, 89, 0.7)', glow: 'none' }; // High (Green)
    if (score >= 80) return { borderColor: 'rgba(255, 204, 0, 0.7)', glow: '0 0 7px rgba(255, 204, 0, 0.6)' }; // Moderate (Yellow)
    if (score >= 70) return { borderColor: 'rgba(255, 149, 0, 0.7)', glow: '0 0 7px rgba(255, 149, 0, 0.6)' }; // Low (Orange)
    return { borderColor: 'rgba(255, 59, 48, 0.7)', glow: '0 0 10px rgba(255, 59, 48, 0.8)' }; // Very Low (Red)
};

export const DocumentHighlighter: React.FC<DocumentHighlighterProps> = ({ 
    file, 
    highlights, 
    hoveredField, 
    activeField, 
    onHoverField, 
    showHighlights 
}) => {
    const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    
    // Zoom/Pan State
    const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });

    const activeHighlight = useMemo(() => 
        highlights.find(h => h.fieldName === activeField), 
    [highlights, activeField]);

    // Update image dimensions on load/resize
    useEffect(() => {
        const img = imageRef.current;
        if (!img) return;

        const handleLoad = () => {
            setImageSize({ width: img.clientWidth, height: img.clientHeight });
        };
        
        if (img.complete) {
            handleLoad();
        } else {
            img.addEventListener('load', handleLoad);
        }

        const resizeObserver = new ResizeObserver(() => {
            if (img.complete) {
                handleLoad();
            }
        });
        resizeObserver.observe(img);

        return () => {
            img.removeEventListener('load', handleLoad);
            resizeObserver.unobserve(img);
        };
    }, []);

    // Sync Zoom to Active Field
    useEffect(() => {
        if (!activeHighlight || !imageSize || !containerRef.current) {
            return;
        }

        const [x_min, y_min, x_max, y_max] = activeHighlight.boundingBox;
        const containerW = containerRef.current.clientWidth;
        const containerH = containerRef.current.clientHeight;

        // Calculate center of the bounding box in pixels relative to the image
        const centerX = ((x_min + x_max) / 2) * imageSize.width;
        const centerY = ((y_min + y_max) / 2) * imageSize.height;

        const targetScale = 2.5; // Zoom level

        // Calculate translation to center the point
        // T = CenterContainer - (CenterImagePoint * Scale)
        const targetX = (containerW / 2) - (centerX * targetScale);
        const targetY = (containerH / 2) - (centerY * targetScale);

        setTransform({
            scale: targetScale,
            x: targetX,
            y: targetY
        });

    }, [activeHighlight, imageSize]);

    // Helper to manually reset view
    const resetZoom = () => setTransform({ scale: 1, x: 0, y: 0 });

    return (
        <div ref={containerRef} className="w-full h-full relative overflow-hidden bg-gray-100 dark:bg-zinc-900 cursor-grab active:cursor-grabbing group/canvas">
            {/* Controls Overlay */}
            <div className="absolute bottom-4 right-4 z-20 flex gap-2 opacity-0 group-hover/canvas:opacity-100 transition-opacity">
                 <button onClick={resetZoom} className="px-3 py-1 bg-black/70 text-white text-xs rounded-full shadow-lg backdrop-blur-md hover:bg-black/90 transition-colors">
                    Reset View
                 </button>
            </div>

            <div 
                className="w-full h-full transition-transform duration-500 cubic-bezier(0.16, 1, 0.3, 1)"
                style={{
                    transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
                    transformOrigin: '0 0' // Important for coordinate math
                }}
            >
                <img 
                    ref={imageRef}
                    src={file.preview} 
                    alt="Document Preview" 
                    className="w-full h-full object-contain" 
                    draggable={false}
                />
                
                {imageSize && showHighlights && highlights.map((highlight, index) => {
                    const [x_min, y_min, x_max, y_max] = highlight.boundingBox;
                    const left = x_min * imageSize.width;
                    const top = y_min * imageSize.height;
                    const width = (x_max - x_min) * imageSize.width;
                    const height = (y_max - y_min) * imageSize.height;
                    const isHovered = hoveredField === highlight.fieldName;
                    const isActive = activeField === highlight.fieldName;

                    const { borderColor, glow } = getConfidenceStyles(highlight.confidence);
                    const hoverGlow = `0 0 12px 3px ${borderColor.replace('0.7', '0.9')}`;
                    const activeGlow = `0 0 20px 5px ${borderColor.replace('0.7', '1')}`;

                    return (
                        <div
                            key={index}
                            className={`absolute transition-all duration-300 border-2 rounded ${isHovered || isActive ? 'bg-blue-500/20' : 'bg-transparent'}`}
                            style={{
                                left: `${left}px`,
                                top: `${top}px`,
                                width: `${width}px`,
                                height: `${height}px`,
                                borderColor: isActive ? '#007AFF' : borderColor,
                                boxShadow: isActive ? activeGlow : (isHovered ? hoverGlow : glow),
                                zIndex: isActive ? 10 : 1
                            }}
                            onMouseEnter={() => onHoverField(highlight.fieldName)}
                            onMouseLeave={() => onHoverField(null)}
                        >
                            {(isHovered || isActive) && (
                                <div className={`absolute bottom-full mb-1 left-1/2 -translate-x-1/2 z-10 animate-fade-in`}>
                                    <div className="bg-black/80 text-white text-[10px] font-semibold px-2 py-1 rounded shadow-lg whitespace-nowrap backdrop-blur-md">
                                        <p><span className="text-gray-300">{highlight.fieldName}</span></p>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
