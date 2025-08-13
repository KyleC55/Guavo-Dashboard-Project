import type { MetricCardData } from "../../types/types.ts";

export default function MetricCard({ title, value, change, notes }: MetricCardData) {
    const positive = change.trim().startsWith("+");
    return (
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <h3 className="text-base font-medium text-gray-900">{title}</h3>
            <div className="mt-3 text-3xl font-semibold">{value}</div>
            <div className={`mt-1 text-sm ${positive ? "text-green-600" : "text-red-600"}`}>{change}</div>
            <div className="mt-1 text-sm text-gray-500">{notes}</div>
        </div>
    );
}
