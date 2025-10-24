import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";

export type ThinReservation = {
    uuid: string;
    status?: string | null;
    createdAt?: string | null;
    dateStart?: string | null;
    dateEnd?: string | null;          // <-- add
    date?: {                          // <-- add (nested fallback)
        start?: string | null;
        end?: string | null;
    } | null;
};

export const LIST_RESERVATIONS_THIN = gql`
  query ReservationsForUI(
    $uuid: String
    $from: String!
    $to: String!
    $limit: Int!
    $offset: Int!
  ) {
    reservations(
      uuid: $uuid
      search: { from: $from, to: $to }
      pagination: { limit: $limit, offset: $offset }
    ) {
      items {
        uuid
        status
        createdAt
        dateStart            # flat start
        dateEnd              # flat end (if your server exposes it)
        date {               # nested as a fallback
          start
          end
        }
      }
      count
    }
  }
`;

export function useRestaurantReservations(
    restaurantUuid: string | null | undefined,
    fromISO: string,
    toISO: string,
    pageSize = 500
) {
    const skip = !restaurantUuid || !fromISO || !toISO;

    const { data, loading, error } = useQuery(LIST_RESERVATIONS_THIN, {
        variables: { uuid: restaurantUuid ?? null, from: fromISO, to: toISO, limit: pageSize, offset: 0 },
        fetchPolicy: "network-only",
        skip,
    });

    const items: ThinReservation[] = data?.reservations?.items ?? [];
    const listed = items.filter(r => (r.status ?? "").toUpperCase() === "LISTED");

    return {
        items,
        listed,
        count: data?.reservations?.count ?? 0,
        loading: skip ? false : loading,
        error: skip ? undefined : error,
    };
}
