export type BookingStatus = 'confirmed' | 'rejected' | 'pending';
export type InquiryStatus = 'connecting' | 'negotiating' | 'confirmed' | 'canceled';
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
    id: string;
    name: string;
    profile_image: string;
}
