import { MemberRow } from "./types";

// Format string: first letter uppercase, rest lowercase, underscores to spaces
export function formatLabel(str: string): string {
    if (!str) return str;
    return str
        .replace(/_/g, " ")
        .split(" ")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ");
}

export function displayNameFor(member: MemberRow): string {
    // Prioritize firstName + lastName combination to always show full name when available
    const fullName = [member.firstName, member.lastName].filter(Boolean).join(" ");
    if (fullName) return fullName;
    
    // Fallback to preferredName, username, email, or dash
    return (
        member.preferredName ||
        member.username ||
        member.email ||
        "—"
    );
}

export function formatUserName(member: { firstName?: string | null; lastName?: string | null; email?: string | null }): string {
    const firstName = member.firstName ? formatLabel(member.firstName) : null;
    const lastName = member.lastName ? formatLabel(member.lastName) : null;
    return [firstName, lastName].filter(Boolean).join(" ") || member.email || "—";
}

