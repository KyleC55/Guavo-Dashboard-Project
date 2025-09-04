import React from 'react';

export const ItemRow: React.FC<{
    title: React.ReactNode;
    tag?: React.ReactNode;
    subtitle?: string;
    meta?: string;
    rightBadge?: React.ReactNode;
}> = ({ title, tag, subtitle, meta, rightBadge }) => (
    <div className="flex items-start justify-between rounded-xl border border-neutral-200 px-4 py-3">
        <div className="min-w-0">
            <div className="flex items-center gap-2">
                <div className="truncate text-[15px] font-semibold text-neutral-900">{title}</div>
                {tag}
            </div>
            {subtitle && (
                <div className="mt-0.5 truncate text-sm text-neutral-600">{subtitle}</div>
            )}
            {meta && <div className="mt-1 text-xs text-neutral-500">{meta}</div>}
        </div>
        <div className="ml-3 shrink-0">{rightBadge}</div>
    </div>
);
