import {gql} from "@apollo/client";

export const GET_ADMIN_RESERVATIONS = gql`
    query AdminReservations(
        $uuid: String
        $from: String
        $to: String
        $limit: Int
        $offset: Int
    ) {
        reservations(
            uuid: $uuid
            search: { from: $from, to: $to }
            pagination: { limit: $limit, offset: $offset }
        ) {
            items {
                uuid
                table {
                    label
                    type
                    location
                    recommendedPartySize
                    maxPartySize
                    minPartySize
                }
                credit {
                    amount
                }
                date {
                    start
                    end
                }
                status
                member {
                    uuid
                    membershipId
                    allergies
                    restrictions
                    bio
                    joinDate
                    birthDate
                    profilePicture
                    username
                    firstName
                    lastName
                    preferredName
                    email
                    phone
                }
                createdAt
                updatedAt
            }
            count
        }
    }
`;


