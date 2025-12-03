import { gql } from "@apollo/client";
import { useQuery, useApolloClient } from "@apollo/client/react";
import { useEffect, useState, useMemo } from "react";

const GET_RESERVATIONS_THIN = gql`
    query ReservationsThin($uuid: String!, $limit: Int = 1000, $offset: Int = 0) {
        reservations(uuid: $uuid, search: {}, pagination: { limit: $limit, offset: $offset }) {
            count
            items {
                uuid
                status
                createdAt
                dateStart
                dateEnd
                date { start end }
                table {
                    label
                    type
                    location
                    reservedPartySize
                    recommendedPartySize
                    minPartySize
                    maxPartySize
                }
            }
        }
    }
`;

async function fetchAllReservationsPaginated(client: any, uuid: string, pageSize = 1000) {
    console.log('[fetchAllReservationsPaginated] Starting fetch for restaurant:', uuid);
    
    // First query to get total count
    const first = await client.query({
        query: GET_RESERVATIONS_THIN,
        variables: { uuid, limit: pageSize, offset: 0 },
        fetchPolicy: "network-only",
    });

    console.log('[fetchAllReservationsPaginated] First query result:', {
        count: first.data?.reservations?.count,
        itemsCount: first.data?.reservations?.items?.length,
        hasError: !!first.error,
        errors: first.error,
    });

    const total: number = first.data?.reservations?.count ?? 0;
    let items: any[] = first.data?.reservations?.items ?? [];

    console.log('[fetchAllReservationsPaginated] Total reservations:', total, 'First page items:', items.length);

    // Fetch remaining pages if needed
    if (total > pageSize) {
        console.log('[fetchAllReservationsPaginated] Fetching additional pages...');
        const reqs: Promise<any>[] = [];
        for (let offset = pageSize; offset < total; offset += pageSize) {
            reqs.push(
                client.query({
                    query: GET_RESERVATIONS_THIN,
                    variables: { uuid, limit: pageSize, offset },
                    fetchPolicy: "network-only",
                })
            );
        }

        if (reqs.length) {
            const pages = await Promise.all(reqs);
            console.log('[fetchAllReservationsPaginated] Fetched', pages.length, 'additional pages');
            for (const p of pages) {
                items = items.concat(p.data?.reservations?.items ?? []);
            }
        }
    }

    console.log('[fetchAllReservationsPaginated] Final items count:', items.length);
    return items;
}

export function useRestaurantReservations(
    uuid: string | undefined,
    opts?: { limit?: number; offset?: number }
) {
    const client = useApolloClient();
    const [allReservations, setAllReservations] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<any>(null);

    // Initial query to get count
    const skip = !uuid || uuid.trim() === "";
    const { data, loading: initialLoading, error: initialError } = useQuery(GET_RESERVATIONS_THIN, {
        variables: { uuid: uuid as string, limit: 1, offset: 0 },
        skip,
        fetchPolicy: "network-only",
    });

    useEffect(() => {
        if (!uuid || uuid.trim() === "") {
            setAllReservations([]);
            return;
        }

        let cancelled = false;

        const fetchAll = async () => {
            setLoading(true);
            setError(null);
            try {
                const items = await fetchAllReservationsPaginated(client, uuid, 1000);
                if (!cancelled) {
                    setAllReservations(items);
                }
            } catch (err) {
                console.error("Error fetching all reservations:", err);
                if (!cancelled) {
                    setError(err);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        fetchAll();

        return () => {
            cancelled = true;
        };
    }, [uuid, client]);

    const items = useMemo(() => {
        return allReservations.length > 0 ? allReservations : (data?.reservations?.items ?? []);
    }, [allReservations, data]);

    // Show all available slots from the database:
    // - LISTED: Available to book (primary)
    // - RELEASED: Expired/released slots that can be re-booked
    // - RESERVATION_PENDING: Pending bookings (might be available)
    // Exclude: RESERVED, CANCELED, CANCEL_PENDING, FREE_BOOKED, CASH_BOOKED (already booked or canceled)
    const availableSlots = useMemo(() => {
        // Debug: Log all items first to see what we're getting
        console.log('[useRestaurantReservations] All items from database:', {
            totalItems: items.length,
            items: items.map((r: any) => ({
                uuid: r.uuid,
                status: r.status,
                dateStart: r.dateStart || r.date?.start,
                dateEnd: r.dateEnd || r.date?.end,
                hasTable: !!r.table,
                tableInfo: r.table ? {
                    min: r.table.minPartySize,
                    max: r.table.maxPartySize,
                    recommended: r.table.recommendedPartySize,
                } : null,
            })),
        });
        
        const filtered = items.filter((r: any) => {
            const status = (r?.status ?? "").toUpperCase();
            // Include slots that are available for booking
            const isAvailable = status === "LISTED" || status === "RELEASED" || status === "RESERVATION_PENDING";
            
            if (!isAvailable) {
                console.log('[useRestaurantReservations] Filtered out reservation:', {
                    uuid: r.uuid,
                    status: r.status,
                    reason: 'Status not available for booking',
                });
            }
            
            return isAvailable;
        });
        
        // Debug logging
        console.log('[useRestaurantReservations] Filtering results:', {
            totalItems: items.length,
            availableSlots: filtered.length,
            statusBreakdown: items.reduce((acc: any, r: any) => {
                const status = (r?.status ?? "").toUpperCase();
                acc[status] = (acc[status] || 0) + 1;
                return acc;
            }, {}),
            availableStatusBreakdown: filtered.reduce((acc: any, r: any) => {
                const status = (r?.status ?? "").toUpperCase();
                acc[status] = (acc[status] || 0) + 1;
                return acc;
            }, {}),
        });
        
        return filtered;
    }, [items]);

    return {
        loading: loading || initialLoading,
        error: error || initialError,
        items, // All items from database
        listed: availableSlots, // Available slots (LISTED + RESERVATION_PENDING)
        refetch: async () => {
            // Refetch all reservations
            if (uuid) {
                setLoading(true);
                try {
                    const items = await fetchAllReservationsPaginated(client, uuid, 1000);
                    setAllReservations(items);
                } catch (err) {
                    console.error("Error refetching reservations:", err);
                    setError(err);
                } finally {
                    setLoading(false);
                }
            }
        },
    };
}
