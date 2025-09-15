import type { ReactNode } from 'react';

export const SectionCard: React.FC<{
    title: string;
    onViewAll?: () => void;
    children: ReactNode;
}> = ({ title, onViewAll, children } ) => (
    <section className="rounded-2xl border border-neutral-200 bg-white p-4 md:p-5">
        <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-neutral-900">{title}</h2>
            <button
                type="button"
                onClick={onViewAll}
                className="rounded-lg border border-neutral-300 px-3 py-1 text-sm font-medium text-neutral-700 hover:bg-neutral-50" >
                View All
            </button>
        </div>
        <div className="space-y-3">{children}</div>
    </section>
);
