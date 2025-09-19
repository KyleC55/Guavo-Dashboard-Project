import { useState, useMemo } from 'react'
import { useQuery } from "@apollo/client/react";
import { GET_ALL_RESERVATIONS, GET_ADMIN_RESERVATIONS } from '../graphql/queries'

export type EpochMsString = string
export interface GqlReservationDate { start: EpochMsString; end: EpochMsString; expiry: EpochMsString }
export interface GqlReservationTable {
    label: string; type: string; location: string;
    recommendedPartySize: number; reservedPartySize?: number | null;
    maxPartySize: number; minPartySize: number
}
export interface GqlRestaurant { uuid: string; name: string; timezone: string }
export interface GqlReservation {
    uuid: string; status: string; note?: string | null; notificationId?: number | null;
    createdAt: EpochMsString; updatedAt: EpochMsString;
    date: GqlReservationDate; table: GqlReservationTable; restaurant: GqlRestaurant
}

// —— existing global hook ——
export function useAllReservations(initialLimit = 25) {
    const [limit, setLimit] = useState(initialLimit)
    const [offset, setOffset] = useState(0)

    const variables = useMemo(() => ({ limit, offset }), [limit, offset])

    const { data, loading, error, refetch } = useQuery<{
        allReservations: { count: number; items: GqlReservation[] }
    }>(GET_ALL_RESERVATIONS, {
        variables,
        fetchPolicy: 'cache-and-network',
    })

    const envelope = data?.allReservations
    const rows = envelope?.items ?? []
    const count = envelope?.count ?? 0

    const canPrev = offset > 0
    const canNext = offset + limit < count

    return {
        rows, count, loading, error, refetch,
        limit, offset, setLimit, setOffset, canPrev, canNext,
    }
}

// —— NEW: admin/per-restaurant hook (accepts vars from your page) ——
export type AdminReservationsVars = {
    uuid?: string
    from?: string
    to?: string
    limit: number
    offset: number
}

export function useAdminReservations(variables: AdminReservationsVars) {
    const { data, loading, error, refetch } = useQuery<{
        reservations: { count: number; items: GqlReservation[] }
    }>(GET_ADMIN_RESERVATIONS, {
        variables,
        fetchPolicy: 'cache-and-network',
    })

    const envelope = data?.reservations
    const rows = envelope?.items ?? []
    const count = envelope?.count ?? 0

    return { rows, count, loading, error, refetch }
}
