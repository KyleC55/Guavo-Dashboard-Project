import { useEffect, useMemo, useState } from "react";
import { LIST_RESTAURANTS} from "../graphql/queries.ts";
import { useApolloClient } from "@apollo/client/react";


async function fetchAllRestaurants(client: any, pageSize = 200) {
    const first = await client.query({
        query: LIST_RESTAURANTS,
        variables: { limit: pageSize, offset: 0 },
        fetchPolicy: "network-only",
    });

    const total: number = first.data?.restaurants?.count ?? 0;
    let items: any[] = first.data?.restaurants?.items ?? [];

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
        for (const p of pages) items = items.concat(p.data?.restaurants?.items ?? []);
    }

    const m = new Map(items.map((r: any) => [r.uuid, r]));
    return Array.from(m.values()).sort((a: any, b: any) => a.name.localeCompare(b.name));
}

export function useAllRestaurantsOnOpen(open: boolean, pageSize = 200) {
    const client = useApolloClient();
    const [all, setAll] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<unknown>(null);

    useEffect(() => {
        if (!open) return;
        let cancelled = false;

        (async () => {
            setLoading(true);
            setError(null);
            try {
                const items = await fetchAllRestaurants(client, pageSize);
                if (!cancelled) setAll(items);
            } catch (e) {
                if (!cancelled) setError(e);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => { cancelled = true; };
    }, [open, client, pageSize]);

    const options = useMemo(
        () => all.map(r => ({ value: r.uuid, label: r.name })),
        [all]
    );

    return { options, loading, error };
}
