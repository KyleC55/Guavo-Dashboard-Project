import React from 'react';
type Tone = 'neutral' | 'success' | 'warning' | 'ink';

const toneStyles: Record<Tone, string > = {
    neutral: 'bg-neutral-100 text-neutral-700',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-amber-100 text-amber-800',
    ink: 'bg-neutral-900 text-white',
};

export const Badge: React.FC<{
    tone?: Tone;
    children: React.ReactNode;
    className?: string;
}> = ({ tone = 'neutral', children, className }) => (
    <span
        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${toneStyles[tone]} ${className ?? ''}`}
    >
    {children}
  </span>
);