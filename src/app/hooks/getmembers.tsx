import { useMemo } from "react";
import { useQuery } from "@apollo/client/react";
import { MEMBERS_FOR_BOOKING } from "../graphql/queries";

type MemberRow = {
    uuid: string;
    preferredName?: string | null;
    firstName?: string | null;
    username?: string | null;
    email?: string | null;
    allergies?: string[] | null;
    restrictions?: string[] | null;
    // team?: string | null;
    // cooperation?: string | null;
    // company?: string | null;
};

export function useMembersForBooking(search = "", limit = 500, offset = 0) {
    const { data, loading, error } = useQuery(MEMBERS_FOR_BOOKING, {
        variables: { limit, offset },          // <-- no 'search' sent to server
        fetchPolicy: "cache-first",
    });

    const rows: MemberRow[] = data?.members?.items ?? [];

    const members = useMemo(() => {
        const s = search.trim().toLowerCase();
        if (!s) return rows;
        return rows.filter((m) =>
            [m.preferredName, m.firstName, m.username, m.email]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
                .includes(s)
        );
    }, [rows, search]);

    return {
        members,
        totalCount: data?.members?.count ?? 0,
        loading,
        error,
    };
}
