import { useQuery } from "@apollo/client/react";
import { gql } from "@apollo/client";

export const ADMIN_LISTED_SLOTS = gql`
  query AdminListedSlots($restaurantUuid: String!) {
    adminListedSlots(restaurantUuid: $restaurantUuid) {
      uuid
      date { start end }
      table { location minPartySize maxPartySize }
      restaurant { uuid name }
    }
  }
`;

export function useAdminListedSlots(restaurantUuid?: string) {
    const skip = !restaurantUuid || restaurantUuid.trim() === "";
    const { data, loading, error, refetch } = useQuery(ADMIN_LISTED_SLOTS, {
        variables: { restaurantUuid: restaurantUuid as string },
        skip,
        fetchPolicy: "network-only",
    });

    const raw = data?.adminListedSlots ?? [];
    const slots = raw.map((r: any) => ({
        reservationUuid: r.uuid,
        startISO: r.date?.start ?? null,
        endISO: r.date?.end ?? null,
        tableLabel: r.table?.location ?? "",
        min: r.table?.minPartySize ?? 1,
        max: r.table?.maxPartySize ?? 20,
        restaurantUuid: r.restaurant?.uuid ?? null,
        restaurantName: r.restaurant?.name ?? "",
    }));

    return { slots, loading, error, refetch };
}
