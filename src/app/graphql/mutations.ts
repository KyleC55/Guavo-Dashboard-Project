import { gql } from "@apollo/client";

export const ADMIN_MANUAL_BOOK_LISTED_SLOT = gql`
    mutation AdminManualBookListedSlot(
        $reservationUuid: ID!
        $memberUuid: ID
        $notes: String
        $partySize: Int
        $teamUuid: ID
    ) {
        adminManualBookListedSlot(
            reservationUuid: $reservationUuid
            memberUuid: $memberUuid
            notes: $notes
            partySize: $partySize
            teamUuid: $teamUuid
        ) {
            uuid
            status
            date { start end }
            member { uuid firstName lastName email }
            actor { uuid firstName lastName email }
            restaurant { uuid name timezone }
        }
    }
`;

export const ADMIN_CREATE_BOOKING = gql`
    mutation AdminCreateBooking(
        $restaurantUuid: String!
        $startIso: String!
        $endIso: String!
        $partySize: Int!
        $note: String
        $memberUuid: String
    ) {
        adminCreateBooking(
            restaurantUuid: $restaurantUuid
            startIso: $startIso
            endIso: $endIso
            partySize: $partySize
            note: $note
            memberUuid: $memberUuid
        ) {
            uuid
            status
            date { start end }    
            member { uuid firstName lastName email }
            actor { uuid firstName lastName email }
            restaurant { uuid name timezone }
        }
    }
`;