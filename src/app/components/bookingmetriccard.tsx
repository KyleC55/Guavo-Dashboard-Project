import type {IconType} from "react-icons";

type BookingMetricCardProps = {
    icon?: IconType;
    label: string;
    value: string | number;
    subDetails?: string;
};

export default function BookingMetricCard({ icon: Icon, label, value, subDetails }: BookingMetricCardProps) {
    return (
        <div className="bg-white rounded-lg border border-gray-200 p-5 min-w-[200px]">
            <div className="flex items-center gap-2 mb-4">
                {Icon && (
                    <Icon size={18} className="text-gray-600 flex-shrink-0" />
                )}
                <span className="text-sm font-medium text-gray-900">{label}</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">{value}</div>
            {subDetails && (
                <div className="text-sm text-gray-500">{subDetails}</div>
            )}
        </div>
    );
}

