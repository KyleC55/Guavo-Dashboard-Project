import { useMemo, useState, useEffect, useCallback } from "react";
import { useLazyQuery } from "@apollo/client/react";
import { GET_RESERVATIONS_FOR_METRICS } from "../graphql/queries";

type GqlReservationForMetrics = {
    status: string;
    table?: {
        reservedPartySize?: number | null;
    } | null;
};

const MAX_LIMIT = 2000; // Backend maximum

export function useReservationMetrics() {
    const [allItems, setAllItems] = useState<GqlReservationForMetrics[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<any>(null);

    const [fetchPage] = useLazyQuery<{
        allReservations: { count: number; items: GqlReservationForMetrics[] }
    }>(GET_RESERVATIONS_FOR_METRICS, {
        fetchPolicy: "network-only",
        errorPolicy: "all",
    });

    const refetch = useCallback(async () => {
        setLoading(true);
        setError(null);
        setAllItems([]);
        setTotalCount(0);
        
        let offset = 0;
        const accumulatedItems: GqlReservationForMetrics[] = [];
        let serverTotalCount = 0;
        let hasMore = true;

        while (hasMore) {
            try {
                const result = await fetchPage({
                    variables: { limit: MAX_LIMIT, offset },
                });

                if (result.error) {
                    setError(result.error);
                    setLoading(false);
                    return;
                }

                const data = result.data?.allReservations;
                if (!data) {
                    hasMore = false;
                    break;
                }

                const items = data.items ?? [];
                const count = data.count ?? 0;

                // Set total count from first page
                if (offset === 0) {
                    serverTotalCount = count;
                    setTotalCount(count);
                }

                accumulatedItems.push(...items);

                // Check if we need to fetch more
                if (items.length < MAX_LIMIT || accumulatedItems.length >= count) {
                    hasMore = false;
                } else {
                    offset += MAX_LIMIT;
                }
            } catch (err) {
                setError(err);
                setLoading(false);
                return;
            }
        }

        setAllItems(accumulatedItems);
        setLoading(false);
    }, [fetchPage]);

    // Initial fetch
    useEffect(() => {
        refetch();
    }, [refetch]);

    const items = allItems;
    const totalFromServer = totalCount;

    const metrics = useMemo(() => {
        let reserved = 0;
        let pendingReview = 0;
        let cancelledPending = 0;
        let cancelled = 0;
        let totalGuests = 0;

        for (const r of items) {
            if (r.status === "RESERVED") reserved += 1;
            if (r.status === "RESERVATION_PENDING" || r.status === "CANCEL_PENDING") {
                pendingReview += 1;
            }
            if (r.status === "CANCEL_PENDING") {
                cancelledPending += 1;
            }
            if (r.status === "CANCELED" || r.status === "CANCEL_PENDING") {
                cancelled += 1;
            }
            
            // Calculate total guests from reservedPartySize
            const partySize = r.table?.reservedPartySize;
            if (typeof partySize === "number" && partySize > 0) {
                totalGuests += partySize;
            }
        }

        const confirmationRate = totalFromServer > 0 
            ? Math.round((reserved / totalFromServer) * 100) 
            : 0;
        
        const avgGuestsPerBooking = reserved > 0 
            ? (totalGuests / reserved).toFixed(1) 
            : "0.0";

        return {
            totalBookings: totalFromServer,
            confirmedBookings: reserved,
            totalGuests,
            pendingReview,
            cancelledPending,
            cancelled,
            confirmationRate,
            avgGuestsPerBooking,
        };
    }, [items, totalFromServer]);

    return { ...metrics, loading, error, refetch };
}
