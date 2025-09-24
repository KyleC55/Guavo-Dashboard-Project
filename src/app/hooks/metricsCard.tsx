import { useMemo } from "react";
import { useQuery } from "@apollo/client/react";
import { GET_ALL_RESERVATIONS } from "../graphql/queries";

type EpochMsString = string;

type GqlReservationDate = { start: EpochMsString; end: EpochMsString; expiry: EpochMsString };
type GqlReservationTable = {
    label: string;
    type: string;
    location: string;
    recommendedPartySize: number;
    reservedPartySize?: number | null;
    maxPartySize: number;
    minPartySize: number;
};
type GqlRestaurant = { uuid: string; name: string; timezone: string };

type GqlReservation = {
    uuid: string;
    status: string;
    date: GqlReservationDate;
    table: GqlReservationTable;
    restaurant: GqlRestaurant;
};

export function useReservationMetrics(limit: number = 1000) {
    const { data, loading, error, refetch } = useQuery<{
        allReservations: { count: number; items: GqlReservation[] }
    }>(GET_ALL_RESERVATIONS, {
        variables: { limit, offset: 0 },
        fetchPolicy: "network-only",
    });

    const items = data?.allReservations.items ?? [];
    const totalFromServer = data?.allReservations.count ?? 0;

    const metrics = useMemo(() => {
        let reserved = 0;
        let pendingReview = 0; // you can define this as RESERVATION_PENDING or CANCEL_PENDING, etc.
        let totalGuests = 0;

        for (const r of items) {
            if (r.status === "RESERVED") reserved += 1;
            if (r.status === "RESERVATION_PENDING" || r.status === "CANCEL_PENDING") pendingReview += 1;

            const guests =
                r.table?.reservedPartySize ??
                r.table?.recommendedPartySize ??
                r.table?.minPartySize ??
                0;
            totalGuests += Number(guests) || 0;
        }

        return {
            totalBookings: totalFromServer, // authoritative total from backend
            confirmedBookings: reserved,
            totalGuests,
            pendingReview,
        };
    }, [items, totalFromServer]);

    return { ...metrics, loading, error, refetch };
}
