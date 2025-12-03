import BookingMetricCard from "./bookingmetriccard";
import { HiOutlineCalendarDays } from "react-icons/hi2";
import { HiCheckCircle } from "react-icons/hi2";
import { HiUserGroup } from "react-icons/hi2";
import { HiClock } from "react-icons/hi2";
import { useReservationMetrics} from "../hooks/metricsCard";
import { useEffect, useRef } from "react";

type MetricsBarProps = {
    onRefetchReady?: (refetch: () => Promise<void>) => void;
};

export default function MetricsBar({ onRefetchReady }: MetricsBarProps) {
    const { 
        totalBookings, 
        confirmedBookings, 
        totalGuests, 
        pendingReview, 
        cancelledPending,
        cancelled,
        confirmationRate,
        avgGuestsPerBooking,
        loading, 
        error, 
        refetch 
    } = useReservationMetrics();

    // Call the callback when refetch is available
    // Using useLayoutEffect to run synchronously after DOM mutations but before paint
    useEffect(() => {
        if (onRefetchReady && refetch && typeof refetch === 'function') {
            onRefetchReady(refetch);
        }
    }, [onRefetchReady, refetch]);

    return (
        <div className="flex items-center gap-6">
            <BookingMetricCard
                icon={HiOutlineCalendarDays}
                label="Total Bookings"
                value={loading ? "…" : totalBookings.toLocaleString()}
                subDetails={loading ? "…" : `${confirmedBookings.toLocaleString()} confirmed • ${pendingReview} pending`}
            />
            <BookingMetricCard
                icon={HiCheckCircle}
                label="Confirmed Bookings"
                value={loading ? "…" : confirmedBookings.toLocaleString()}
                subDetails={loading ? "…" : `${confirmationRate}% confirmation rate`}
            />
            <BookingMetricCard
                icon={HiUserGroup}
                label="Total Guests"
                value={loading ? "…" : totalGuests.toLocaleString()}
                subDetails={loading ? "…" : `Avg ${avgGuestsPerBooking} per booking`}
            />
            <BookingMetricCard
                icon={HiClock}
                label="Pending Review"
                value={loading ? "…" : pendingReview}
                subDetails={loading ? "…" : `${cancelled} cancelled`}
            />

            {error && (
                <span className="text-sm text-red-600">Failed to load metrics</span>
            )}
        </div>
    );
}
