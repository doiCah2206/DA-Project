import { useState, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';

interface CustomSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: { label: string; value: string }[];
    icon?: ReactNode;
    className?: string;
}

export const CustomSelect = ({
    value,
    onChange,
    options,
    icon,
    className = 'w-full sm:w-48'
}: CustomSelectProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedLabel = options.find(opt => opt.value === value)?.label || 'Select...';

    return (
        <div ref={containerRef} className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`appearance-none w-full px-4 py-3 rounded-xl bg-notary-dark-secondary border border-notary-slate-dark text-white focus:border-notary-cyan focus:ring-1 focus:ring-notary-cyan transition-all flex items-center justify-between ${className}`}
            >
                <span>{selectedLabel}</span>
                <div className="pointer-events-none">
                    {icon}
                </div>
            </button>

            {isOpen && (
                <div
                    className="absolute top-full left-0 right-0 mt-2 rounded-xl bg-notary-dark-secondary border border-notary-slate-dark shadow-xl"
                    style={{
                        zIndex: 9999,
                        maxHeight: '300px',
                        overflowY: 'auto',
                        position: 'absolute'
                    }}
                >
                    {options.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => {
                                onChange(option.value);
                                setIsOpen(false);
                            }}
                            className={`w-full text-left px-4 py-3 transition-colors first:rounded-t-xl last:rounded-b-xl ${value === option.value
                                    ? 'bg-notary-cyan/20 text-notary-cyan'
                                    : 'text-white hover:bg-notary-cyan/10'
                                }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
