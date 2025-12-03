import { useEffect, useMemo, useState } from "react";
import { useQuery, useApolloClient } from "@apollo/client/react";
import { LIST_RESTAURANTS } from "../graphql/queries";

export type RestaurantOption = {
    value: string;          // r.uuid for UI and mutation
    label: string;          // r.name
    meta?: string;          // city label for display
    uuid: string;           // r.uuid again for convenience
    timezone?: string | null;
    addressLine1?: string | null;
    addressLine2?: string | null;
    cityLocation?: string | null;
};

async function fetchAllRestaurantsPaginated(client: any, pageSize = 1000) {
    // First query to get total count
    const first = await client.query({
        query: LIST_RESTAURANTS,
        variables: { limit: pageSize, offset: 0 },
        fetchPolicy: "network-only",
    });

    const total: number = first.data?.restaurants?.count ?? 0;
    let items: any[] = first.data?.restaurants?.items ?? [];

    // Fetch remaining pages if needed
    if (total > pageSize) {
        const reqs: Promise<any>[] = [];
        for (let offset = pageSize; offset < total; offset += pageSize) {
            reqs.push(
                client.query({
                    query: LIST_RESTAURANTS,
                    variables: { limit: pageSize, offset },
                    fetchPolicy: "network-only",
                })
            );
        }

        if (reqs.length) {
            const pages = await Promise.all(reqs);
            for (const p of pages) {
                items = items.concat(p.data?.restaurants?.items ?? []);
            }
        }
    }

    return items;
}

export function useListedRestaurantsOnOpen(open: boolean, limit = 10000) {
    const client = useApolloClient();
    const [allRestaurants, setAllRestaurants] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<any>(null);

    useEffect(() => {
        if (!open) {
            setAllRestaurants([]);
            return;
        }

        let cancelled = false;

        const fetchAll = async () => {
            setLoading(true);
            setError(null);
            try {
                const items = await fetchAllRestaurantsPaginated(client, 1000);
                if (!cancelled) {
                    setAllRestaurants(items);
                }
            } catch (err) {
                console.error("Error fetching all restaurants:", err);
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
    }, [open, client]);

    const options: RestaurantOption[] = useMemo(() => {
        // Show ALL restaurants, not just listed ones (for admin manual booking)
        return allRestaurants
            .map((r: any) => ({
                value: String(r?.uuid ?? ""),   // used by the select and mutation
                uuid: String(r?.uuid ?? ""),
                label: r?.name ?? "",
                meta: r?.city?.name ?? r?.city?.label ?? r?.city?.code ?? "",
                timezone: r?.timezone ?? null,
                addressLine1: r?.city?.addressLine1 ?? null,
                addressLine2: r?.city?.addressLine2 ?? null,
                cityLocation: r?.city?.location ?? null,
            }))
            .filter(o => o.value.length > 0 && o.label.length > 0)
            .sort((a, b) => a.label.localeCompare(b.label)); // Sort alphabetically
    }, [allRestaurants]);

    const byUuid = useMemo(() => {
        const m = new Map<string, RestaurantOption>();
        for (const o of options) m.set(o.uuid, o);
        return m;
    }, [options]);

    return { 
        options, 
        byUuid, 
        loading, 
        error 
    };
}
