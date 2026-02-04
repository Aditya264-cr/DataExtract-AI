
import React from 'react';

export const ClearFormattingIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
        <path d="M17 15l4 4m0 -4l-4 4" />
        <path d="M7 6v-1h11v1" />
        <path d="M7 19h4" />
        <path d="M13 5h-4" />
        <path d="M5 12.556v-5.556h4v13h4v-13h4v5.556" />
        <path d="M12 19v-13" />
    </svg>
);
