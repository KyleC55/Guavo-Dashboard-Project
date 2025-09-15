// src/components/VenuePerformanceCard.tsx
import React from 'react';
import type { VenuePerformance } from "../../../types/types.ts";

export const VenueCard: React.FC<{ data: VenuePerformance }> = ({ data }) => {
    const utilization = Math.round((data.active / data.total) * 100);

    return (
        <div className="flex items-center justify-between rounded-xl border border-neutral-200 p-4">
            <div>
                <div className="text-sm font-semibold">{data.category}</div>
                <div className="text-xs text-neutral-500">
                    {data.active}/{data.total} active
                </div>
            </div>
            <div className="flex flex-col items-end">
                <div className="text-sm font-medium">{utilization}%</div>
                <div className="w-20 h-2 bg-neutral-200 rounded-full overflow-hidden">
                    <div
                        className="h-2 bg-neutral-900 rounded-full"
                        style={{ width: `${utilization}%` }}
                    />
                </div>
            </div>
        </div>
    );
};
