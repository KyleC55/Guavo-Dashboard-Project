import { gql } from "@apollo/client";
import { useApolloClient } from "@apollo/client/react";
import { useEffect, useMemo, useRef, useState } from "react";

export type RestaurantOption = { value: string; label: string; meta?: string };

type GalleryRestaurant = {
    uuid: string;
    name: string;
    listed?: boolean | null;
    city?: { name?: string | null } | null;
};

const LIST_RESTAURANTS = gql`
    query ListRestaurants($limit: Int = 500, $offset: Int = 0) {
        restaurants(options: { limit: $limit, offset: $offset }) {
            count
            items {
                uuid
                name
                listed
                city { name }
            }
        }
    }
`;

export function useListedRestaurantsOnOpen(open: boolean, pageSize = 500) {
    const client = useApolloClient();
    const [all, setAll] = useState<GalleryRestaurant[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<unknown>(null);

    // simple cache so reopening the modal doesn't refetch every time
    const hasLoadedOnce = useRef(false);

    useEffect(() => {
        if (!open || hasLoadedOnce.current) return;

        let cancelled = false;
        (async () => {
            setLoading(true);
            setError(null);
            try {
                // first page
                const first = await client.query({
                    query: LIST_RESTAURANTS,
                    variables: { limit: pageSize, offset: 0 },
                    fetchPolicy: "network-only",
                });
                if (cancelled) return;

                const total: number = first.data?.restaurants?.count ?? 0;
                let acc: GalleryRestaurant[] = first.data?.restaurants?.items ?? [];

                // remaining pages
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
                    for (const p of pages) acc = acc.concat(p.data?.restaurants?.items ?? []);
                }

                if (!cancelled) {
                    setAll(acc);
                    hasLoadedOnce.current = true;
                }
            } catch (e) {
                if (!cancelled) setError(e);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => { cancelled = true; };
    }, [open, pageSize, client]);

    // Only LISTED + map to combobox options
    const options: RestaurantOption[] = useMemo(() => {
        return (all.filter(r => r.listed === true)).map(r => ({
            value: r.uuid,
            label: r.name || "(Unnamed)",
            meta: r.city?.name || undefined,
        }));
    }, [all]);

    return { options, loading, error };
}
