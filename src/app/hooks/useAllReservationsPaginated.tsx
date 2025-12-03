import { useState, useCallback } from "react";
import { useLazyQuery } from "@apollo/client/react";
import { GET_ALL_RESERVATIONS } from "../graphql/queries";
import type { GqlReservation } from "./getreservation";

const MAX_LIMIT = 2000; // Backend maximum

export function useAllReservationsPaginated() {
    const [allRows, setAllRows] = useState<GqlReservation[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<any>(null);

    const [fetchPage] = useLazyQuery<{
        allReservations: { count: number; items: GqlReservation[] };
    }>(GET_ALL_RESERVATIONS, {
        fetchPolicy: "network-only",
        errorPolicy: "all",
    });

    const fetchAll = useCallback(async () => {
        setLoading(true);
        setError(null);
        setAllRows([]);

        let offset = 0;
        const accumulatedItems: GqlReservation[] = [];
        let serverTotalCount = 0;
        let hasMore = true;

        try {
            while (hasMore) {
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
                    break;
                }

                const items = data.items ?? [];
                const count = data.count ?? 0;

                // Set total count from first page
                if (offset === 0) {
                    serverTotalCount = count;
                }

                accumulatedItems.push(...items);

                // Check if we need to fetch more
                if (items.length < MAX_LIMIT || accumulatedItems.length >= serverTotalCount) {
                    hasMore = false;
                } else {
                    offset += MAX_LIMIT;
                }
            }

            setAllRows(accumulatedItems);
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    }, [fetchPage]);

    return {
        allRows,
        loading,
        error,
        fetchAll,
    };
}

