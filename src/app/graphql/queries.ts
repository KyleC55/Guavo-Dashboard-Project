import { gql } from '@apollo/client'

export const GET_ALL_RESERVATIONS = gql`
    query AllReservations($limit: Int!, $offset: Int!) {
        allReservations(pagination: { limit: $limit, offset: $offset }) {
            count
            items {
                uuid
                type
                status
                note
                notificationId
                createdAt
                updatedAt
                teamName
                date { start end expiry }
                table {
                    label
                    type
                    location
                    recommendedPartySize
                    reservedPartySize
                    maxPartySize
                    minPartySize
                }
                restaurant { uuid name timezone }
                corporate { uuid name }          
                member {                         
                    firstName
                    lastName
                    email
                    phone
                }
                actor {                          
                    firstName
                    lastName
                    email
                }
            }
        }
    }
`
export const GET_ADMIN_RESERVATIONS = gql`
  query AdminReservations($uuid: String, $from: String, $to: String, $limit: Int!, $offset: Int!) {
    reservations(
      uuid: $uuid
      search: { from: $from, to: $to }
      pagination: { limit: $limit, offset: $offset }
    ) {
      count
      items {
        uuid
        status
        note
        notificationId
        createdAt
        updatedAt
        teamName
        date { start end expiry }
        table {
          label
          type
          location
          recommendedPartySize
          reservedPartySize
          maxPartySize
          minPartySize
        }
        restaurant { uuid name timezone }
        corporate { uuid name }        
        member {
          uuid
          username
          firstName
          lastName
          email
          phone
        }
        actor {                          
          firstName
          lastName
          email
        }
      }
    }
  }
`
