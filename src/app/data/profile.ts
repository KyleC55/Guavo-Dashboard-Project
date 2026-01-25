import type { Profile } from "../../../types/types.ts";
import { keycloak } from "../../keycloak";

const getNameParts = (fullName?: string | null) => {
    if (!fullName) return { first: "", last: "" };
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return { first: "", last: "" };
    if (parts.length === 1) return { first: parts[0], last: "" };
    return { first: parts[0], last: parts.slice(1).join(" ") };
};

const buildProfileFromKeycloak = (): Profile => {
    const parsed = keycloak?.tokenParsed as Record<string, any> | undefined;
    const fullName = parsed?.name as string | undefined;
    const { first, last } = getNameParts(fullName);
    const firstName = parsed?.given_name || first || parsed?.preferred_username || parsed?.email || "User";
    const lastName = parsed?.family_name || last || "";
    const image = parsed?.picture || parsed?.avatar_url || parsed?.avatar || undefined;

    return {
        firstname: firstName,
        lastname: lastName,
        image,
    };
};

export const getDisplayProfile = (): Profile => buildProfileFromKeycloak();