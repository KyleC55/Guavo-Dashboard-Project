export type MemberRow = {
    uuid: string;
    federatedId?: string | null;
    preferredName?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    username?: string | null;
    email?: string | null;
    active?: boolean | null;
    status?: string | null;
    phone?: string | null;
    role?: string | null;
    allergies?: string[] | null;
    restrictions?: string[] | null;
    profilePicture?: string | null;
    address?: {
        addressLine1?: string | null;
        addressLine2?: string | null;
        city?: string | null;
        state?: string | null;
        zipcode?: string | null;
        country?: string | null;
    } | null;
    preferences?: {
        preference?: string | null;
        favouriteWine?: string | null;
        favouriteLiquor?: string | null;
        preferredDinningTime?: string | null;
    } | null;
    birthDate?: string | null;
    joinDate?: string | null;
    createdAt?: string | null;
    note?: string | null;
    favouriteRestaurants?: Array<{
        uuid: string;
        name: string;
        city?: {
            location?: string | null;
        } | null;
    }> | null;
};

export type Team = {
    uuid: string;
    name: string;
    description?: string | null;
    memberCount?: number | null;
    corporation?: {
        uuid: string;
        name: string;
    } | null;
    members?: Array<{
        uuid: string;
        firstName?: string | null;
        lastName?: string | null;
        email?: string | null;
        active?: boolean | null;
    }> | null;
};

export type Corporation = {
    uuid: string;
    name: string;
    teams: Team[];
};

export type MemberTeamInfo = {
    company: string;
    team: string;
    role?: string | null | undefined;
};

