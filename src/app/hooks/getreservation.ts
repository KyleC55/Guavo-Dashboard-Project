import  {useQuery} from "@apollo/client/react";
import {GET_ADMIN_RESERVATIONS} from "../graphql/queries.ts";
import type {AdminReservationsResponse} from "../../../types/reservations.ts";

export function useAdminReservations(variables: {
    uuid?: string;
    from?: string;
    to?: string;
    limit?: number;
    offset?: number;
}) {
    return useQuery<AdminReservationsResponse>(GET_ADMIN_RESERVATIONS, {
        variables,
    });
}
