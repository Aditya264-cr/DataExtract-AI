
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface PortalProps {
    children: React.ReactNode;
}

export const Portal: React.FC<PortalProps> = ({ children }) => {
    const [mounted, setMounted] = useState(false);
    const [element, setElement] = useState<HTMLElement | null>(null);

    useEffect(() => {
        setMounted(true);
        setElement(document.getElementById('overlay-root'));
        return () => setMounted(false);
    }, []);

    if (!mounted || !element) {
        return null;
    }

    return createPortal(children, element);
};
