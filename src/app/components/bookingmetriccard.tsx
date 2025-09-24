import type {IconType} from "react-icons";

type BookingMetricCardProps = {
    icon?: IconType;
    label: string;
    value: string | number;
};

export default function BookingMetricCard({ icon: Icon, label, value }: BookingMetricCardProps) {
    return (
        <div className="flex items-center gap-3">
            {Icon ? <Icon size={20} className="text-gray-400" /> : null}
            <div className="flex flex-col">
                <span className="text-sm text-gray-500">{label}</span>
                <span className="text-lg font-semibold">{value}</span>
            </div>
        </div>
    );
}

