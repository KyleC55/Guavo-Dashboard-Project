
export interface AdminReservation {
    uuid: string;
    status: string;
    date: { start: string; end: string };
    table: {
        label: string;
        type: string;
        location: string;
        recommendedPartySize: number;
        maxPartySize: number;
        minPartySize: number;
    } | null;
    credit: { amount: number } | null;
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
        count: number;
        items: AdminReservation[];
    };
}

export interface AdminReservationsVars {
    uuid?: string;
    search?: { from?: string; to?: string };
    pagination: { limit: number; offset: number };
}
