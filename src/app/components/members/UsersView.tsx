import { useState, useMemo } from "react";
import { MemberRow, MemberTeamInfo } from "./types";
import { displayNameFor } from "./utils";
import { MemberCard } from "./MemberCard";

const FilterIcon = () => (
    <svg
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
        />
    </svg>
);

const UserPlusIcon = () => (
    <svg
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
        />
    </svg>
);

const SearchIcon = () => (
    <svg
        className="h-4 w-4 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
    </svg>
);

export function UsersView({
    members,
    memberCompanyTeamMap,
    searchQuery,
    onSearchChange,
    onEditMember,
    onMoveMember,
    onDeactivateMember,
}: {
    members: MemberRow[];
    memberCompanyTeamMap: Map<string, MemberTeamInfo>;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onEditMember: (member: MemberRow) => void;
    onMoveMember: (member: MemberRow) => void;
    onDeactivateMember: (member: MemberRow) => void;
}) {
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [roleFilter, setRoleFilter] = useState<string>("all");
    const [companyFilter, setCompanyFilter] = useState<string>("all");

    // Get unique companies for filter
    const uniqueCompanies = useMemo(() => {
        const companies = new Set<string>();
        members.forEach((member) => {
            const companyTeam = memberCompanyTeamMap.get(member.uuid);
            if (companyTeam?.company && companyTeam.company !== "—") {
                companies.add(companyTeam.company);
            }
        });
        return Array.from(companies).sort();
    }, [members, memberCompanyTeamMap]);

    // Get unique roles for filter
    const uniqueRoles = useMemo(() => {
        const roles = new Set<string>();
        members.forEach((member) => {
            const companyTeam = memberCompanyTeamMap.get(member.uuid);
            const role = companyTeam?.role || member.role;
            if (role && role !== "—") {
                roles.add(role);
            }
        });
        return Array.from(roles).sort();
    }, [members, memberCompanyTeamMap]);

    // Filter members
    const filteredMembers = useMemo(() => {
        return members.filter((member) => {
            const displayName = displayNameFor(member).toLowerCase();
            const email = member.email?.toLowerCase() || "";
            const companyTeam = memberCompanyTeamMap.get(member.uuid);
            const company = companyTeam?.company?.toLowerCase() || "";
            const team = companyTeam?.team?.toLowerCase() || "";
            const role = companyTeam?.role || member.role || "";

            const matchesSearch =
                displayName.includes(searchQuery.toLowerCase()) ||
                email.includes(searchQuery.toLowerCase()) ||
                company.includes(searchQuery.toLowerCase()) ||
                team.includes(searchQuery.toLowerCase());

            const matchesStatus =
                statusFilter === "all" ||
                (statusFilter === "active" && member.active) ||
                (statusFilter === "inactive" && !member.active);

            const matchesRole = roleFilter === "all" || role === roleFilter;

            const matchesCompany =
                companyFilter === "all" ||
                companyTeam?.company === companyFilter;

            return matchesSearch && matchesStatus && matchesRole && matchesCompany;
        });
    }, [
        members,
        searchQuery,
        statusFilter,
        roleFilter,
        companyFilter,
        memberCompanyTeamMap,
    ]);

    // Calculate stats

    return (
        <div className="w-full space-y-6">
            {/* Filters and Search */}
            <div className="flex flex-col gap-4">
                {/* Search */}
                <div className="relative flex-1">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                        <SearchIcon />
                    </div>
                    <input
                        type="text"
                        placeholder="Search members by name, email, company, or team..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-2">
                    <select
                        value={companyFilter}
                        onChange={(e) => setCompanyFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent appearance-none pr-8"
                        style={{ width: "180px" }}
                    >
                        <option value="all">Move Teams</option>
                        {uniqueCompanies.map((company) => (
                            <option key={company} value={company}>
                                {company}
                            </option>
                        ))}
                    </select>

                    <div className="relative" style={{ width: "140px" }}>
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <FilterIcon />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent appearance-none"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>

                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent appearance-none pr-8"
                        style={{ width: "180px" }}
                    >
                        <option value="all">All Roles</option>
                        {uniqueRoles.map((role) => {
                            // Extract role name for display
                            const roleName = role.split("/").pop() || role;
                            return (
                                <option key={role} value={role}>
                                    {roleName}
                                </option>
                            );
                        })}
                    </select>
                </div>
            </div>

            {/* Members List */}
            <div className="space-y-3">
                {filteredMembers.length > 0 ? (
                    filteredMembers.map((member) => {
                        const companyTeam = memberCompanyTeamMap.get(member.uuid);
                        const companyName = companyTeam?.company || "—";
                        const teamName = companyTeam?.team || "—";
                        const role = companyTeam?.role || member.role || "—";

                        return (
                            <MemberCard
                                key={member.uuid}
                                member={member}
                                companyName={companyName}
                                teamName={teamName}
                                role={role}
                                onEdit={() => onEditMember(member)}
                                onMove={() => onMoveMember(member)}
                                onDeactivate={() => onDeactivateMember(member)}
                            />
                        );
                    })
                ) : (
                    <div className="text-center py-12 bg-white border rounded-lg">
                        <p className="text-gray-500">
                            No members found matching your criteria
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
