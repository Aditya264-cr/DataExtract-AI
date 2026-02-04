
import React from 'react';

export const UnderlineIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6v6a6 6 0 0012 0V6" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 21h15" />
    </svg>
);
