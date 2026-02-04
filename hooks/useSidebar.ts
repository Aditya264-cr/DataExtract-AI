
import { useState, useEffect, useCallback } from 'react';

const useLocalStorage = (key: string, initialValue: boolean) => {
    const [storedValue, setStoredValue] = useState(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(error);
            return initialValue;
        }
    });

    const setValue = (value: boolean | ((val: boolean) => boolean)) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.error(error);
        }
    };

    return [storedValue, setValue];
};

export const useSidebar = () => {
    const [isLeftOpen, setIsLeftOpen] = useLocalStorage('sidebar-left-open', true);
    const [isRightOpen, setIsRightOpen] = useLocalStorage('sidebar-right-open', true);

    const toggleLeftSidebar = useCallback(() => setIsLeftOpen((prev: boolean) => !prev), [setIsLeftOpen]);
    const toggleRightSidebar = useCallback(() => setIsRightOpen((prev: boolean) => !prev), [setIsRightOpen]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key === '1') {
                event.preventDefault();
                toggleLeftSidebar();
            }
            if ((event.metaKey || event.ctrlKey) && event.key === '2') {
                event.preventDefault();
                toggleRightSidebar();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [toggleLeftSidebar, toggleRightSidebar]);

    return { isLeftOpen, toggleLeftSidebar, isRightOpen, toggleRightSidebar };
};
