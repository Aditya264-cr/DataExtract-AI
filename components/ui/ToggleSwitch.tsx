
import React from 'react';

interface ToggleSwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ checked, onChange, ...props }) => {
    return (
        <label className="relative inline-flex items-center cursor-pointer">
            <input
                type="checkbox"
                className="sr-only peer"
                checked={checked}
                onChange={onChange}
                {...props}
            />
            <div className="w-11 h-6 bg-gray-300 dark:bg-zinc-700 rounded-full peer peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500/80 transition-colors peer-checked:bg-[#34C759]"></div>
            <div className="absolute left-0.5 top-0.5 bg-white border-gray-300 border rounded-full h-5 w-5 transition-transform peer-checked:translate-x-full"></div>
        </label>
    );
};