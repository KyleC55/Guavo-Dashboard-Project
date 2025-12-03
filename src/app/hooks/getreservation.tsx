import { useState, useMemo, useCallback } from "react"
import { useQuery } from "@apollo/client/react"
import { GET_ALL_RESERVATIONS, GET_ADMIN_RESERVATIONS } from "../graphql/queries"

export type IsoString = string

export interface GqlReservationDate {
    start: IsoString
    end: IsoString
    expiry: IsoString
}

export interface GqlReservationTable {
    label: string
    type: string
    location: string
    recommendedPartySize: number
    reservedPartySize?: number | null
    maxPartySize: number
    minPartySize: number
}

export interface GqlRestaurant {
    uuid: string
    name: string
    timezone: string
    city?: {
        location?: string | null
        neighborhood?: string | null
        addressLine1?: string | null
        addressLine2?: string | null
        zipCode?: string | null
    } | null
}

export interface GqlMember {
    uuid?: string
    username?: string | null
    firstName?: string | null
    lastName?: string | null
    email?: string | null
    phone?: string | null
}

export interface GqlReservation {
    uuid: string
    type?: string | null
    status: string
    note?: string | null
    notificationId?: number | null
    createdAt: IsoString
    updatedAt: IsoString

    // New flat fields exposed by Admin API
    dateStart?: IsoString
    dateEnd?: IsoString

    // Original nested date
    date: GqlReservationDate

    table: GqlReservationTable
    restaurant: GqlRestaurant
    member?: GqlMember | null

    // Optional joins you may have on your schema
    corporate?: { uuid?: string; name?: string } | null
    actor?: { firstName?: string | null; lastName?: string | null; email?: string | null } | null
    teamName?: string | null
}

export type CorporateScope = {
    corporationUuid?: string | null
    teamUuid?: string | null
}

export type ReservationFilters = {
    status?: string;
    state?: string;
    neighborhood?: string;
    company?: string;
    member?: string;
    source?: string;
    startDate?: string;
    query?: string; // For text search (maps to 'name' parameter)
};

export function useAllReservations(
    initialLimit = 25,
    scope: CorporateScope = {},
    filters?: ReservationFilters
) {
    const [limit, setLimit] = useState(initialLimit)
    const [offset, setOffset] = useState(0)

    const setLimitAndReset = useCallback((n: number) => {
        setOffset(0)
        setLimit(n)
    }, [])

    const variables = useMemo(
        () => ({
            limit,
            offset,
            corporationUuid: scope.corporationUuid ?? undefined,
            teamUuid: scope.teamUuid ?? undefined,
            status: filters?.status || undefined,
            state: filters?.state || undefined,
            neighborhood: filters?.neighborhood || undefined,
            company: filters?.company || undefined,
            member: filters?.member || undefined,
            source: filters?.source || undefined,
            startDate: filters?.startDate || undefined,
            name: filters?.query?.trim() || undefined,
        }),
        [
            limit,
            offset,
            scope.corporationUuid,
            scope.teamUuid,
            filters?.status,
            filters?.state,
            filters?.neighborhood,
            filters?.company,
            filters?.member,
            filters?.source,
            filters?.startDate,
            filters?.query,
        ],
    )

    const { data, loading, error, refetch } = useQuery<{
        allReservations: { count: number; items: GqlReservation[] }
    }>(GET_ALL_RESERVATIONS, {
        variables,
        fetchPolicy: "network-only",
    })

    const envelope = data?.allReservations
    const rows = envelope?.items ?? []
    const count = envelope?.count ?? 0

    const canPrev = offset > 0
    const canNext = offset + limit < count

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
    }
}

export type AdminReservationsVars = {
    uuid?: string
    from?: string
    to?: string
    limit: number
    offset: number
    corporationUuid?: string | null
    teamUuid?: string | null
    statusIn?: string[]
    restaurantUuid?: string
}

export function useAdminReservations(input: AdminReservationsVars) {
    const stableVars = useMemo(
        () => ({
            uuid: input.uuid,
            from: input.from,
            to: input.to,
            limit: input.limit,
            offset: input.offset,
            corporationUuid: input.corporationUuid ?? undefined,
            teamUuid: input.teamUuid ?? undefined,
            statusIn: input.statusIn ?? undefined,
            restaurantUuid: input.restaurantUuid ?? undefined,
        }),
        [
            input.uuid,
            input.from,
            input.to,
            input.limit,
            input.offset,
            input.corporationUuid,
            input.teamUuid,
            input.statusIn,
            input.restaurantUuid,
        ],
    )

    const { data, loading, error, refetch } = useQuery<{
        reservations: { count: number; items: GqlReservation[] }
    }>(GET_ADMIN_RESERVATIONS, {
        variables: stableVars,
        fetchPolicy: "network-only",
    })

    const envelope = data?.reservations
    const rows = envelope?.items ?? []
    const count = envelope?.count ?? 0

    return { rows, count, loading, error, refetch }
}
