import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@apollo/client/react";
import { MemberRow, MemberTeamInfo } from "./types";
import { displayNameFor } from "./utils";
import { MemberCard } from "./MemberCard";
import { TOGGLE_MEMBER_ACTIVE } from "../../graphql/mutations";

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

const BuildingIcon = () => (
    <svg
        className="h-4 w-4 text-gray-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 21h18M5 21V5a2 2 0 012-2h6a2 2 0 012 2v16M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5"
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
    onBulkDeactivateComplete,
}: {
    members: MemberRow[];
    memberCompanyTeamMap: Map<string, MemberTeamInfo>;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onEditMember: (member: MemberRow) => void;
    onMoveMember: (member: MemberRow) => void;
    onDeactivateMember: (member: MemberRow) => void;
    onBulkDeactivateComplete?: () => void | Promise<void>;
}) {
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [roleFilter, setRoleFilter] = useState<string>("all");
    const [companyFilter, setCompanyFilter] = useState<string>("all");
    const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false);
    const [companySearch, setCompanySearch] = useState("");
    const [teamFilter, setTeamFilter] = useState<string>("all");
    const [teamPage, setTeamPage] = useState(1);
    const TEAM_PAGE_SIZE = 20;
    const [selectedMemberUuids, setSelectedMemberUuids] = useState<Set<string>>(new Set());
    const [bulkUpdating, setBulkUpdating] = useState(false);

    const [toggleActive] = useMutation(TOGGLE_MEMBER_ACTIVE);

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

    const filteredCompanies = useMemo(() => {
        const q = companySearch.trim().toLowerCase();
        if (!q) return uniqueCompanies;
        return uniqueCompanies.filter((company) =>
            company.toLowerCase().includes(q)
        );
    }, [companySearch, uniqueCompanies]);

    const companyTeamsMap = useMemo(() => {
        const map = new Map<string, Set<string>>();
        members.forEach((member) => {
            const info = memberCompanyTeamMap.get(member.uuid);
            const company = info?.company;
            const team = info?.team;
            if (!company || company === "—" || !team || team === "—") return;
            if (!map.has(company)) {
                map.set(company, new Set());
            }
            map.get(company)?.add(team);
        });
        return map;
    }, [members, memberCompanyTeamMap]);

    const teamsForCompany = useMemo(() => {
        if (companyFilter === "all") return [];
        const teams = Array.from(companyTeamsMap.get(companyFilter) ?? []);
        return teams.sort((a, b) => a.localeCompare(b));
    }, [companyTeamsMap, companyFilter]);

    const pagedTeams = useMemo(
        () => teamsForCompany.slice(0, teamPage * TEAM_PAGE_SIZE),
        [teamsForCompany, teamPage, TEAM_PAGE_SIZE]
    );

    useEffect(() => {
        setTeamFilter("all");
        setTeamPage(1);
    }, [companyFilter]);

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

            const matchesTeam =
                companyFilter === "all" ||
                teamFilter === "all" ||
                companyTeam?.team === teamFilter;

            return (
                matchesSearch &&
                matchesStatus &&
                matchesRole &&
                matchesCompany &&
                matchesTeam
            );
        });
    }, [
        members,
        searchQuery,
        statusFilter,
        roleFilter,
        companyFilter,
        teamFilter,
        memberCompanyTeamMap,
    ]);

    const sortedMembers = useMemo(() => {
        const sortWithFallback = (value: string) => {
            if (!value || value === "—") return "~~~";
            return value.toLowerCase();
        };

        const byName = (member: MemberRow) =>
            sortWithFallback(displayNameFor(member));

        return [...filteredMembers].sort((a, b) => byName(a).localeCompare(byName(b)));
    }, [filteredMembers]);

    const filteredMemberUuids = useMemo(
        () => filteredMembers.map((member) => member.uuid),
        [filteredMembers]
    );

    const selectedMembers = useMemo(
        () => members.filter((member) => selectedMemberUuids.has(member.uuid)),
        [members, selectedMemberUuids]
    );

    const selectedActiveMembers = useMemo(
        () => selectedMembers.filter((member) => member.active),
        [selectedMembers]
    );
    const selectedInactiveMembers = useMemo(
        () => selectedMembers.filter((member) => !member.active),
        [selectedMembers]
    );

    const selectionMode = useMemo(() => {
        if (selectedActiveMembers.length > 0) return "deactivate";
        if (selectedInactiveMembers.length > 0) return "activate";
        return "none";
    }, [selectedActiveMembers.length, selectedInactiveMembers.length]);

    const filteredActiveMembers = useMemo(
        () => filteredMembers.filter((member) => member.active),
        [filteredMembers]
    );
    const allActiveSelected =
        filteredActiveMembers.length > 0 &&
        filteredActiveMembers.every((member) => selectedMemberUuids.has(member.uuid));

    const toggleSelectAllFiltered = () => {
        setSelectedMemberUuids((prev) => {
            const next = new Set(prev);
            if (allActiveSelected) {
                filteredActiveMembers.forEach((member) => next.delete(member.uuid));
            } else {
                // Clear inactive selections before selecting all active
                selectedInactiveMembers.forEach((member) => next.delete(member.uuid));
                filteredActiveMembers.forEach((member) => next.add(member.uuid));
            }
            return next;
        });
    };

    const toggleSelectMember = (uuid: string) => {
        setSelectedMemberUuids((prev) => {
            const next = new Set(prev);
            if (next.has(uuid)) {
                next.delete(uuid);
            } else {
                const member = members.find((m) => m.uuid === uuid);
                if (!member) return next;
                if (member.active) {
                    // If selecting active, clear inactive selections
                    selectedInactiveMembers.forEach((inactive) => next.delete(inactive.uuid));
                } else {
                    // If selecting inactive, clear active selections
                    selectedActiveMembers.forEach((active) => next.delete(active.uuid));
                }
                next.add(uuid);
            }
            return next;
        });
    };

    const clearSelection = () => {
        setSelectedMemberUuids(new Set());
    };

    const handleClearFilters = () => {
        onSearchChange("");
        setStatusFilter("all");
        setRoleFilter("all");
        setCompanyFilter("all");
        setCompanySearch("");
        setCompanyDropdownOpen(false);
        setTeamFilter("all");
        setTeamPage(1);
        clearSelection();
    };

    const handleBulkToggle = async (action: "activate" | "deactivate") => {
        if (bulkUpdating) return;
        const targets = action === "deactivate" ? selectedActiveMembers : selectedInactiveMembers;
        if (targets.length === 0) return;
        const confirm = window.confirm(
            `${action === "deactivate" ? "Deactivate" : "Activate"} ${targets.length} account${
                targets.length !== 1 ? "s" : ""
            }?`
        );
        if (!confirm) return;

        setBulkUpdating(true);
        const results = await Promise.allSettled(
            targets.map((member) =>
                toggleActive({
                    variables: {
                        uuid: member.uuid,
                        active: action === "activate",
                    },
                })
            )
        );
        const failed = results.filter((result) => result.status === "rejected");
        setBulkUpdating(false);

        if (failed.length > 0) {
            alert(
                `Failed to ${action} ${failed.length} of ${targets.length} accounts. Please retry.`
            );
        }

        clearSelection();

        if (onBulkDeactivateComplete) {
            await onBulkDeactivateComplete();
        }
    };

    // Calculate stats

    return (
        <div className="w-full space-y-6">
            {/* Filters and Search */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-4">
                {/* Bulk Actions */}
                <div className="flex flex-wrap items-center gap-3">
                    <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                        <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300"
                            checked={allActiveSelected}
                            onChange={toggleSelectAllFiltered}
                        />
                        Select all active ({filteredActiveMembers.length})
                    </label>
                    {allActiveSelected && (
                        <button
                            type="button"
                            onClick={clearSelection}
                            className="px-3 py-1.5 rounded-md text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-50"
                        >
                            Reset selection
                        </button>
                    )}
                    {selectedMemberUuids.size > 0 && (
                        <span className="text-sm text-gray-500">
                            {selectedMemberUuids.size} selected
                        </span>
                    )}
                    {selectionMode === "activate" && (
                        <button
                            type="button"
                            onClick={() => handleBulkToggle("activate")}
                            disabled={selectedInactiveMembers.length === 0 || bulkUpdating}
                            className="ml-auto px-3 py-1.5 rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-green-200 disabled:text-green-700 disabled:cursor-not-allowed"
                        >
                            {bulkUpdating ? "Updating..." : "Activate selected"}
                        </button>
                    )}
                    {(selectionMode === "deactivate" || selectionMode === "none") && (
                        <button
                            type="button"
                            onClick={() => handleBulkToggle("deactivate")}
                            disabled={selectedActiveMembers.length === 0 || bulkUpdating}
                            className="ml-auto px-3 py-1.5 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-red-200 disabled:text-red-700 disabled:cursor-not-allowed"
                        >
                            {bulkUpdating ? "Updating..." : "Deactivate selected"}
                        </button>
                    )}
                </div>

                <div className="h-px bg-gray-100" />

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
                    <div className="relative" style={{ width: "200px" }}>
                        <button
                            type="button"
                            onClick={() => setCompanyDropdownOpen((open) => !open)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-left focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent flex items-center justify-between"
                        >
                            <span className="flex items-center gap-2 min-w-0">
                                <BuildingIcon />
                                <span className={`truncate ${companyFilter === "all" ? "text-gray-500" : ""}`}>
                                    {companyFilter === "all" ? "Companies" : companyFilter}
                                </span>
                            </span>
                            <span className="ml-2 text-gray-600">▾</span>
                        </button>
                        {companyDropdownOpen && (
                            <div className="absolute z-20 mt-2 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
                                <div className="p-2 border-b border-gray-100">
                                    <div className="relative">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                            <SearchIcon />
                                        </div>
                                        <input
                                            type="text"
                                            value={companySearch}
                                            onChange={(e) => setCompanySearch(e.target.value)}
                                            placeholder="Search companies..."
                                            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                                        />
                                    </div>
                                </div>
                                <div className="max-h-64 overflow-auto">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setCompanyFilter("all");
                                            setCompanyDropdownOpen(false);
                                            setCompanySearch("");
                                        }}
                                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                                    >
                                        Companies
                                    </button>
                                    {filteredCompanies.map((company) => (
                                        <button
                                            key={company}
                                            type="button"
                                            onClick={() => {
                                                setCompanyFilter(company);
                                                setCompanyDropdownOpen(false);
                                                setCompanySearch("");
                                            }}
                                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                                        >
                                            {company}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {companyFilter !== "all" && (
                        <>
                            <select
                                value={teamFilter}
                                onChange={(e) => setTeamFilter(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent appearance-none pr-8"
                                style={{ width: "180px" }}
                            >
                                <option value="all">All Teams</option>
                                {pagedTeams.map((team) => (
                                    <option key={team} value={team}>
                                        {team}
                                    </option>
                                ))}
                            </select>
                            {teamsForCompany.length > pagedTeams.length && (
                                <button
                                    type="button"
                                    onClick={() => setTeamPage((prev) => prev + 1)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm hover:bg-gray-50"
                                >
                                    Load more teams
                                </button>
                            )}
                        </>
                    )}

                    <div className="relative" style={{ width: "140px" }}>
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <FilterIcon />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                const nextStatus = e.target.value;
                                handleClearFilters();
                                setStatusFilter(nextStatus);
                            }}
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

                    <button
                        type="button"
                        onClick={handleClearFilters}
                        className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm hover:bg-gray-50"
                    >
                        Reset filters
                    </button>
                </div>
            </div>

            {/* Members List */}
            <div className="space-y-3">
                {sortedMembers.length > 0 ? (
                    sortedMembers.map((member) => {
                        const companyTeam = memberCompanyTeamMap.get(member.uuid);
                        const companyName = companyTeam?.company || "—";
                        const teamName = companyTeam?.team || "—";
                        const role = companyTeam?.role || member.role || "—";

                        return (
                            <div key={member.uuid} className="flex items-start gap-3">
                                <input
                                    type="checkbox"
                                    className="mt-5 h-4 w-4 rounded border-gray-300"
                                    checked={selectedMemberUuids.has(member.uuid)}
                                    onChange={() => toggleSelectMember(member.uuid)}
                                    aria-label={`Select ${displayNameFor(member)}`}
                                />
                                <div className="flex-1 min-w-0">
                                    <MemberCard
                                        member={member}
                                        companyName={companyName}
                                        teamName={teamName}
                                        role={role}
                                        onEdit={() => onEditMember(member)}
                                        onMove={() => onMoveMember(member)}
                                        onDeactivate={() => onDeactivateMember(member)}
                                    />
                                </div>
                            </div>
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
