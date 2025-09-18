import type {IconType} from "react-icons";

export type BookingStatus = 'confirmed' | 'rejected' | 'pending' | 'cancelled';
export type InquiryStatus = 'connecting' | 'negotiating' | 'confirmed' | 'cancelled';
export type Provider = 'Resy' | 'OpenTable' | 'Manual'


export interface MetricCardData {
    title: string;
    value: string;
    change: string;
    notes: string;
}
export interface RecentBookings {
    id: string;
    restaurant: string;
    provider?: Provider;
    name: string;
    company: string;
    guests: number;
    when: string;
    status: BookingStatus;
}

export interface PendingInquiries {
    id: string;
    venue: string;
    status?: InquiryStatus;
    location: string;
    company: string;
    guests: number;
    date: string;
}

export interface VenuePerformance {
    category: 'Restaurants' | 'Private Dining' | 'Event Spaces' | string;
    active: number;
    total: number;
}

export interface Profile {
    firstname: string;
    lastname: string;
    image?: string;
}

export interface AddBookings {
    venue: string;
    name: string;
    company: string;
    email: string;
    phonenumber: string;
    partysize: number;
    date: string;
    startTime: string;
    endTime: string;
    notes?: string;
}

export interface BookingCard {
    title: string;
    value: number;
    subtitle: string;
    Icon?: IconType;
}


export interface VenueList {
    id: string;
    name: string;
    city: string;
}

export interface BookingFilterState {
    query: string;
    city: string;
    source: string;
    status: string;
    company: string;
    dateFrom: string;
    dateTo: string;
    page: number;
    pageSize: number;
    total: number;
}

// in types/types.ts

export interface BookingRow {
    id: string;                     // booking uuid or generated id
    status: 'confirmed' | 'pending' | 'cancelled' | string;
    date: string;                   // ISO string of the reservation start time
    venue: string;                  // table/restaurant name
    booker: string;                 // member full name
    email: string;
    notes: string;

    // Extra fields used for filtering in Bookings page
    city: string;
    source: string;
    company: string;
    role: string;
    phone: string;

}
