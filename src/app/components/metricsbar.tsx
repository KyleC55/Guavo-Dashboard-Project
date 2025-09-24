import BookingMetricCard from "./bookingmetriccard";
import { FaCalendar } from "react-icons/fa";
import { IoIosTrendingUp } from "react-icons/io";
import { SlPeople } from "react-icons/sl";
import { PiClockThin } from "react-icons/pi";
import {useReservationMetrics} from "../hooks/metricsCard.tsx";

export default function MetricsBar() {
    const { totalBookings, confirmedBookings, totalGuests, pendingReview, loading, error, refetch } =
        useReservationMetrics(1000);

    return (
        <div className="flex items-center gap-6">
            <BookingMetricCard
                icon={FaCalendar}
                label="Total Bookings"
                value={loading ? "…" : totalBookings}
            />
            <BookingMetricCard
                icon={IoIosTrendingUp}
                label="Confirmed Bookings"
                value={loading ? "…" : confirmedBookings}
            />
            <BookingMetricCard
                icon={SlPeople}
                label="Total Guests"
                value={loading ? "…" : totalGuests}
            />
            <BookingMetricCard
                icon={PiClockThin}
                label="Pending Review"
                value={loading ? "…" : pendingReview}
            />

            {error ? (
                <span className="text-sm text-red-600">Failed to load metrics</span>
            ) : (
                <button
                    className="ml-auto rounded px-3 py-2 border"
                    onClick={() => refetch()}
                    disabled={loading}
                >
                    Refresh
                </button>
            )}
        </div>
    );
}
