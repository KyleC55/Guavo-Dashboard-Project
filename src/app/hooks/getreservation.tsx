import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@apollo/client/react';
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

export function useAllReservations(initialLimit = 25) {
    const [limit, setLimit] = useState(initialLimit);
    const [offset, setOffset] = useState(0);

    const variables = useMemo(() => ({ limit, offset }), [limit, offset]);
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

    const updateLimit = useCallback((n: number) => { setOffset(0); setLimit(n); }, []);

    return {
        rows, count, loading, error, refetch,
        limit, offset, setOffset,
        setLimit: updateLimit,
        canPrev, canNext,
    };
}

export type AdminReservationsVars = {
    uuid?: string;
    from?: string;
    to?: string;
    limit: number;
    offset: number;
};

export function useAdminReservations(variables: AdminReservationsVars) {
    const { data, loading, error, refetch } = useQuery<{
        reservations: { count: number; items: GqlReservation[] }
    }>(GET_ADMIN_RESERVATIONS, {
        variables,
        fetchPolicy: 'network-only',
    });

    const envelope = data?.reservations;
    const rows = envelope?.items ?? [];
    const count = envelope?.count ?? 0;

    return { rows, count, loading, error, refetch };
}
