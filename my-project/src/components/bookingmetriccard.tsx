import type {BookingCard} from "../../types/types.ts";

export default function BookingMetricCard({ title, value, subtitle, Icon }: BookingCard) {
    return (
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="flex justify-between items-start">
                <h3 className="text-base font-medium text-gray-900">{title}</h3>
                <Icon size={20} className="text-gray-400" />
            </div>
            <p className="text-3xl font-bold mt-4">
                {typeof value === "number" ? value.toLocaleString() : value}
            </p>
            {subtitle && <p className="text-gray-500 text-sm mt-1">{subtitle}</p>}
        </div>
    );
}
