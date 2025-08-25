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

export interface BookingRow {
    id: string;
    venue: string;
    city: string;
    booker: string;
    company: string;
    role: string;
    partysize: number;
    date: string;
    status: BookingStatus;
    source: Provider;
    email?: string;
    notes?: string;
}

export type VenueList = {
    id: string;
    name: string;
    city: string;
}