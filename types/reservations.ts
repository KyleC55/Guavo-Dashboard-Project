export interface AdminReservation {
    uuid: string;
    table: {
        label: string;
        type: string;
        location: string;
        recommendedPartySize: number;
        maxPartySize: number;
        minPartySize: number;
    } | null;
    credit: {
        amount: number;
    } | null;
    date: {
        start: string;
        end: string;
    };
    status: string;
    member: {
        uuid: string;
        membershipId: string;
        allergies: string[];
        restrictions: string[];
        bio?: string;
        joinDate?: string;
        birthDate?: string;
        profilePicture?: string;
        username: string;
        firstName: string;
        lastName: string;
        preferredName?: string;
        email: string;
        phone?: string;
    } | null;
    createdAt: string;
    updatedAt: string;
}

export interface AdminReservationsResponse {
    reservations: {
        items: AdminReservation[];
        count: number;
    };
}
