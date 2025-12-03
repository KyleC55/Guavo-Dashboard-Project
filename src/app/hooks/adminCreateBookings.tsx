import { gql, useMutation, type MutationHookOptions } from "@apollo/client";

export const ADMIN_CREATE_BOOKING = gql`
  mutation AdminCreateBooking(
    $restaurantId: Int!
    $startAtISO: String!
    $partySize: Int!
    $memberUuid: UUID
    $note: String
  ) {
    adminCreateBooking(
      restaurantId: $restaurantId
      startAtISO: $startAtISO
      partySize: $partySize
      memberUuid: $memberUuid
      note: $note
    ) {
      id
      status
      startAtISO
      partySize
      restaurant { id uuid name }
    }
  }
`;

export type AdminCreateBookingVars = {
    restaurantId: number;
    startAtISO: string;
    partySize: number;
    memberUuid?: string | null;
    note?: string | null;
};

export type AdminCreateBookingResp = {
    adminCreateBooking: {
        id: number;
        status: string;
        startAtISO: string;
        partySize: number;
        restaurant: { id: number; uuid: string; name: string };
    };
};

export function useAdminCreateBooking(
    options?: MutationHookOptions<AdminCreateBookingResp, AdminCreateBookingVars>
) {
    return useMutation<AdminCreateBookingResp, AdminCreateBookingVars>(
        ADMIN_CREATE_BOOKING,
        options
    );
}
