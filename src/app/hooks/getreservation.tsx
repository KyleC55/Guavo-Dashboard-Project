import { useState, useMemo, useCallback } from 'react';
import { useQuery } from "@apollo/client/react";
import { GET_ALL_RESERVATIONS, GET_ADMIN_RESERVATIONS } from '../graphql/queries';

export type EpochMsString = string;

export interface GqlReservationDate {
    start: EpochMsString;
    end: EpochMsString;
    expiry: EpochMsString;
}
export interface GqlReservationTable {
    label: string;
    type: string;
    location: string;
    recommendedPartySize: number;
    reservedPartySize?: number | null;
    maxPartySize: number;
    minPartySize: number;
}
export interface GqlRestaurant { uuid: string; name: string; timezone: string }
export interface GqlMember {
    uuid?: string;
    username?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    phone?: string | null;
}
export interface GqlReservation {
    uuid: string;
    type?: string | null;
    status: string;
    note?: string | null;
    notificationId?: number | null;
    createdAt: EpochMsString;
    updatedAt: EpochMsString;
    date: GqlReservationDate;
    table: GqlReservationTable;
    restaurant: GqlRestaurant;
    member?: GqlMember | null;
}

export type CorporateScope = {
    corporationUuid?: string | null;
    teamUuid?: string | null; // if you have team-level tenancy
};

export function useAllReservations(
    initialLimit = 25,
    scope: CorporateScope = {}
) {
    const [limit, setLimit] = useState(initialLimit);
    const [offset, setOffset] = useState(0);

    // When filters/scope change, snap pagination back to page 1
    const setLimitAndReset = useCallback((n: number) => {
        setOffset(0);
        setLimit(n);
    }, []);

    const variables = useMemo(
        () => ({
            limit,
            offset,
            // 👇 Add corporate/team scoping if your schema supports these variables.
            corporationUuid: scope.corporationUuid ?? undefined,
            teamUuid: scope.teamUuid ?? undefined,
        }),
        [limit, offset, scope.corporationUuid, scope.teamUuid]
    );

    const { data, loading, error, refetch } = useQuery<{
        allReservations: { count: number; items: GqlReservation[] }
    }>(GET_ALL_RESERVATIONS, {
        variables,
        fetchPolicy: 'network-only',
    });

    const envelope = data?.allReservations;
    const rows = envelope?.items ?? [];
    const count = envelope?.count ?? 0;

    const canPrev = offset > 0;
    const canNext = offset + limit < count;

    return {
        rows,
        count,
        loading,
        error,
        refetch,
        limit,
        offset,
        setOffset,
        setLimit: setLimitAndReset,
        canPrev,
        canNext,
    };
}

export type AdminReservationsVars = {
    uuid?: string;          // reservation uuid filter
    from?: string;          // epoch ms string or ISO, per your schema
    to?: string;
    limit: number;
    offset: number;
    // 👇 NEW for corporate tenancy
    corporationUuid?: string | null;
    teamUuid?: string | null;
    // Optional extra filters you might want later:
    statusIn?: string[];
    restaurantUuid?: string;
};

export function useAdminReservations(input: AdminReservationsVars) {
    // Snap pagination when filters change (except offset/limit themselves)
    const stableVars = useMemo(() => ({
        uuid: input.uuid,
        from: input.from,
        to: input.to,
        limit: input.limit,
        offset: input.offset,
        corporationUuid: input.corporationUuid ?? undefined,
        teamUuid: input.teamUuid ?? undefined,
        statusIn: input.statusIn ?? undefined,
        restaurantUuid: input.restaurantUuid ?? undefined,
    }), [
        input.uuid,
        input.from,
        input.to,
        input.limit,
        input.offset,
        input.corporationUuid,
        input.teamUuid,
        input.statusIn,
        input.restaurantUuid,
    ]);

    const { data, loading, error, refetch } = useQuery<{
        reservations: { count: number; items: GqlReservation[] }
    }>(GET_ADMIN_RESERVATIONS, {
        variables: stableVars,
        fetchPolicy: 'network-only',
    });

    const envelope = data?.reservations;
    const rows = envelope?.items ?? [];
    const count = envelope?.count ?? 0;

    return { rows, count, loading, error, refetch };
}
