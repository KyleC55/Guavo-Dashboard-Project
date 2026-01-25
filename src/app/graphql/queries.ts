import { gql } from "@apollo/client";

export const GET_ALL_RESERVATIONS = gql`
    query AllReservations(
        $limit: Int!
        $offset: Int!
        $status: String
        $state: String
        $neighborhood: String
        $company: String
        $member: String
        $source: String
        $startDate: String
        $name: String
    ) {
        allReservations(
            pagination: { limit: $limit, offset: $offset }
            status: $status
            state: $state
            neighborhood: $neighborhood
            company: $company
            member: $member
            source: $source
            startDate: $startDate
            name: $name
        ) {
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
                dateStart
                dateEnd
                restaurant {
                    uuid
                    name
                    timezone
                    city {
                        location
                        neighborhood
                        addressLine1
                        addressLine2
                        zipCode
                    }
                }
                table { 
                    label 
                    type 
                    location 
                    reservedPartySize 
                    recommendedPartySize
                    minPartySize
                    maxPartySize
                }
                corporate { uuid name }
                member { firstName lastName email phone }
                actor  { firstName lastName email }
            }
        }
    }
`;

export const GET_ADMIN_RESERVATIONS = gql`
    query AdminReservations(
        $restaurantId: ID!
        $limit: Int = 1000
        $offset: Int = 0
        $status: String
    ) {
        reservations(
            restaurantId: $restaurantId
            status: $status
            pagination: { limit: $limit, offset: $offset }
        ) {
            count
            window { from to }
            items {
                uuid
                type
                status
                note
                notificationId
                createdAt
                updatedAt
                teamName
                dateStart
                dateEnd
                date { start end expiry }
                restaurant { 
                    uuid 
                    name 
                    timezone 
                    city {
                        location
                        neighborhood
                        addressLine1
                        addressLine2
                        zipCode
                    }
                }
                table { 
                    label 
                    type 
                    location 
                    reservedPartySize 
                    recommendedPartySize
                    minPartySize
                    maxPartySize
                }
                corporate { uuid name }
                member { uuid username firstName lastName email phone }
                actor  { firstName lastName email }
            }
        }
    }
`;

export const GET_RESERVATION_BY_UUID = gql`
    query GetReservationByUuid($uuid: ID!) {
        reservation(uuid: $uuid) {
            uuid
            table {
                label
                type
                location
                reservedPartySize
                recommendedPartySize
                minPartySize
                maxPartySize
            }
        }
    }
`;

export const LIST_RESTAURANTS = gql`
    query ListRestaurants($limit: Int = 100, $offset: Int = 0) {
        restaurants(options: { limit: $limit, offset: $offset }) {
            items {
                uuid
                name
                timezone
                listed
                city { 
                    name
                    addressLine1
                    addressLine2
                    location
                }
            }
            count
        }
    }
`;

export const LIST_RESERVATIONS_THIN = gql`
    query ReservationsForUIThin(
        $restaurantId: ID!
        $status: String
        $limit: Int = 1000
        $offset: Int = 0
    ) {
        reservations(
            restaurantId: $restaurantId
            status: $status
            pagination: { limit: $limit, offset: $offset }
        ) {
            count
            items {
                uuid
                status
                createdAt
                dateStart
                dateEnd
                date { start end }                     # optional, helps UI pick ranges
            }
        }
    }
`;

export const MEMBERS_FOR_BOOKING = gql`
    query MembersForBooking($limit: Int = 500, $offset: Int = 0) {
        members(limit: $limit, offset: $offset) {
            items {
                uuid
                preferredName
                firstName
                lastName
                username
                email
                allergies
                restrictions
            }
            count
        }
    }
`;

export const GET_MEMBER_DETAILS = gql`
    query GetMemberDetails($uuid: String!) {
        member(uuid: $uuid) {
            uuid
            firstName
            lastName
            email
        }
    }
`;

export const GET_MEMBER_TEAMS = gql`
    query GetMemberTeams($memberUuid: ID!) {
        membersTeams(memberUuid: $memberUuid) {
            teams {
                uuid
                name
                corporation {
                    uuid
                    name
                }
            }
        }
    }
`;

export const GET_TEAM_BY_NAME_AND_CORPORATION = gql`
    query GetTeamByNameAndCorporation($teamName: String!, $corporationName: String!) {
        teamByNameAndCorporation(teamName: $teamName, corporationName: $corporationName) {
            uuid
            name
            corporation {
                uuid
                name
            }
        }
    }
`;

export const GET_MEMBER_STATS = gql`
    query GetMemberStats {
        memberStats {
            activeCount
            inactiveCount
            totalCount
        }
    }
`;

export const GET_TEAM_MEMBER_RELATIONSHIPS = gql`
    query GetTeamMemberRelationships {
        teamMemberRelationships {
            memberId
            memberUuid
            memberEmail
            memberName
            corporationTeamsId
            teamUuid
            teamName
            corporationName
        }
    }
`;

export const GET_ALL_CORPORATIONS = gql`
    query GetAllCorporations {
        allCorporations {
            uuid
            name
        }
    }
`;

export const GET_MEMBER_CORPORATION_RELATIONSHIPS = gql`
    query GetMemberCorporationRelationships {
        memberCorporationRelationships {
            memberUuid
            memberEmail
            corporationUuid
            corporationName
        }
    }
`;

export const GET_RESERVATIONS_FOR_METRICS = gql`
    query AllReservationsForMetrics($limit: Int!, $offset: Int!) {
        allReservations(pagination: { limit: $limit, offset: $offset }) {
            count
            items { 
                status
                table { reservedPartySize }
            }
        }
    }
`;

export const ADMIN_LISTED_SLOTS = gql`
  query AdminListedSlots($restaurantUuid: String!) {
    adminListedSlots(restaurantUuid: $restaurantUuid) {
      uuid
      date { start end }
      table { 
        location 
        minPartySize 
        maxPartySize 
        recommendedPartySize
        reservedPartySize
        label
        type
      }
      restaurant { uuid name }
    }
  }
`;

export const CANCEL_RESERVATION = gql`
  mutation CancelReservation($uuid: String!) {
    cancelOnBehalf(uuid: $uuid)
  }
`;

export const UPDATE_RESERVATION_STATUS = gql`
  mutation UpdateReservationStatus($uuid: String!, $status: ReservationStatus!) {
    updateReservationStatus(uuid: $uuid, status: $status)
  }
`;

// Note: Admin schema doesn't have direct company/team queries
// We'll derive companies and teams from reservations data

export const GET_ALL_MEMBERS = gql`
  query GetAllMembers($limit: Int = 1000, $offset: Int = 0) {
    members(limit: $limit, offset: $offset) {
      items {
        uuid
        federatedId
        firstName
        lastName
        preferredName
        username
        email
        active
        status
        phone
        role
        profilePicture
        allergies
        restrictions
        note
        bio
        birthDate
        joinDate
        membershipId
        address {
          addressLine1
          addressLine2
          city
          state
          zipcode
          country
        }
        preferences {
          preference
          favouriteWine
          favouriteLiquor
          preferredDinningTime
        }
      }
      count
    }
  }
`;

export const GET_MEMBER_BY_UUID = gql`
  query GetMemberByUuid($uuid: String!) {
    member(uuid: $uuid) {
      uuid
      federatedId
      membershipId
      firstName
      lastName
      preferredName
      username
      email
      active
      status
      phone
      role
      profilePicture
      allergies
      restrictions
      note
      bio
      birthDate
      joinDate
      createdAt
      address {
        addressLine1
        addressLine2
        city
        state
        zipcode
        country
      }
      preferences {
        preference
        favouriteWine
        favouriteLiquor
        preferredDinningTime
      }
      favouriteRestaurants {
        uuid
        name
        city {
          location
        }
      }
    }
  }
`;

export const GET_PLANS = gql`
  query GetPlans($memberFlow: MemberFlow) {
    plans(memberFlow: $memberFlow) {
      name
      priceId
      keys
      cents
      interval
      intervalCount
      currency
      features
      order
      trialDays
      centsPerKey
    }
  }
`;

export const GET_MEMBER_ACTIVE_BOOKINGS = gql`
  query GetMemberActiveBookings($memberEmail: String!, $limit: Int = 50, $offset: Int = 0) {
    allReservations(
      pagination: { limit: $limit, offset: $offset }
      member: $memberEmail
    ) {
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
        dateStart
        dateEnd
        restaurant {
          uuid
          name
          timezone
          city {
            location
            neighborhood
            addressLine1
            addressLine2
            zipCode
          }
        }
        table { 
          label 
          type 
          location 
          reservedPartySize 
          recommendedPartySize
          minPartySize
          maxPartySize
        }
        corporate { uuid name }
        member { firstName lastName email phone }
        actor  { firstName lastName email }
      }
    }
  }
`;