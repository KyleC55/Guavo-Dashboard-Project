import { useEffect, useState, useMemo } from "react";
import Modal from "../modal";
import { MemberRow, Corporation } from "./types";
import { displayNameFor } from "./utils";
import { useMutation, useLazyQuery, useApolloClient } from "@apollo/client/react";
import { MOVE_MEMBER_TO_TEAM } from "../../graphql/mutations";
import { GET_ALL_MEMBERS, GET_ALL_RESERVATIONS, GET_MEMBER_TEAMS, GET_TEAM_BY_NAME_AND_CORPORATION, GET_TEAM_MEMBER_RELATIONSHIPS } from "../../graphql/queries";
import { HiOutlineUser } from "react-icons/hi";

export function MoveUserModal({ 
    member, 
    open, 
    onClose,
    corporations,
    memberRole,
    memberCompany,
    memberTeam,
    onSuccess,
    allMemberUuids,
    onMemberMoved
}: { 
    member: MemberRow | null; 
    open: boolean; 
    onClose: () => void;
    corporations: Corporation[];
    memberRole?: string;
    memberCompany?: string;
    memberTeam?: string;
    onSuccess?: () => void;
    allMemberUuids?: string[];
    onMemberMoved?: () => Promise<void>;
}) {
    const [selectedTeamUuid, setSelectedTeamUuid] = useState<string>("");
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [getMemberTeams] = useLazyQuery(GET_MEMBER_TEAMS);
    const [getTeamByNameAndCorporation] = useLazyQuery(GET_TEAM_BY_NAME_AND_CORPORATION);
    const [teamUuidMap, setTeamUuidMap] = useState<Map<string, string>>(new Map()); // Map team name to actual UUID
    const apolloClient = useApolloClient();

    const [moveMember, { loading: moving }] = useMutation(MOVE_MEMBER_TO_TEAM, {
        // No refetchQueries - we'll handle refetch manually once via onMemberMoved callback
        fetchPolicy: "network-only",
        errorPolicy: "all",
        onCompleted: async (data: unknown) => {
            console.log("[MOVE_MEMBER_FRONTEND] Move member completed:", data);
            const result = data as { moveMemberToTeam?: boolean };
            const success = result?.moveMemberToTeam === true;
            console.log("[MOVE_MEMBER_FRONTEND] Success:", success);
            
            if (success) {
                // Reset confirmation state immediately to prevent showing team selection
                setShowConfirmation(false);
                // Show success state in confirmation modal
                setShowSuccess(true);
                
                // Wait a moment for backend to fully commit
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // Clear Apollo cache
                console.log("[MOVE_MEMBER_FRONTEND] Clearing Apollo cache...");
                try {
                    apolloClient.cache.evict({ fieldName: 'members' });
                    apolloClient.cache.evict({ fieldName: 'allReservations' });
                    apolloClient.cache.evict({ fieldName: 'memberStats' });
                    apolloClient.cache.evict({ fieldName: 'teamMemberRelationships' });
                    apolloClient.cache.gc();
                    console.log("[MOVE_MEMBER_FRONTEND] Cache cleared");
                } catch (cacheError) {
                    console.error("[MOVE_MEMBER_FRONTEND] Error clearing cache:", cacheError);
                }
                
                // Single refetch - call the parent callback which handles all refetching
                if (onMemberMoved) {
                    console.log("[MOVE_MEMBER_FRONTEND] Calling onMemberMoved callback for single refresh...");
                    await onMemberMoved();
                    console.log("[MOVE_MEMBER_FRONTEND] Refresh completed");
                }
                
                // Wait a bit to show success message, then close modal and show toast
                await new Promise(resolve => setTimeout(resolve, 1500));
                
                // Reset all states before closing to prevent showing team selection
                setShowConfirmation(false);
                setShowSuccess(false);
                setSelectedTeamUuid("");
                
                // Close modal completely
                onClose();
                
                // Show success toast
                if (onSuccess) {
                    onSuccess();
                }
            } else {
                console.error("[MOVE_MEMBER_FRONTEND] Move failed - returned false");
                alert("Failed to move member. The operation returned false.");
                setShowConfirmation(false);
                setShowSuccess(false);
            }
        },
        onError: (error: any) => {
            console.error("Error moving member:", error);
            console.error("Error details:", {
                message: error.message,
                graphQLErrors: error.graphQLErrors,
                networkError: error.networkError,
                extraInfo: error.extraInfo
            });
            alert(`Failed to move member: ${error.message || "Please try again."}`);
            setShowConfirmation(false);
            setShowSuccess(false);
        }
    });

    // Reset state when modal opens/closes
    useEffect(() => {
        if (open) {
            setSelectedTeamUuid("");
            setShowConfirmation(false);
            setShowSuccess(false);
            setTeamUuidMap(new Map()); // Reset the map
            
            // Fetch actual team UUIDs for all teams in the member's corporation
            // Query teams from multiple members in the same corporation to get all team UUIDs
            if (member && memberCompany && memberCompany !== "—" && allMemberUuids && allMemberUuids.length > 0) {
                // Query teams from multiple members to build a comprehensive list
                // Limit to first 50 members to avoid too many requests
                const sampleMembers = allMemberUuids.slice(0, 50);
                const uuidMap = new Map<string, string>();
                
                // Fetch teams for multiple members in parallel to build a map of all teams in the corporation
                Promise.all(
                    sampleMembers.map((memberUuid) =>
                        getMemberTeams({
                            variables: { memberUuid }
                        }).then(({ data }: { data: any }) => {
                            const teams = (data as any)?.membersTeams?.teams ?? [];
                            teams.forEach((team: any) => {
                                // Only store teams from the member's corporation
                                if (team.name && team.uuid && team.corporation?.name === memberCompany) {
                                    // Use a composite key: "teamName|corporationName" to handle duplicate team names
                                    const key = `${team.name}|${team.corporation?.name || ''}`;
                                    uuidMap.set(key, team.uuid);
                                }
                            });
                        }).catch(() => {
                            // Silently fail for individual members
                        })
                    )
                ).then(() => {
                    console.log(`Fetched ${uuidMap.size} unique teams for corporation ${memberCompany}`);
                    setTeamUuidMap(uuidMap);
                }).catch(console.error);
            } else if (member && memberCompany && memberCompany !== "—") {
                // Fallback: just query for the current member
                getMemberTeams({
                    variables: { memberUuid: member.uuid }
                }).then(({ data }: { data: any }) => {
                    const teams = (data as any)?.membersTeams?.teams ?? [];
                    const uuidMap = new Map<string, string>();
                    teams.forEach((team: any) => {
                        // Only store teams from the member's corporation
                        if (team.name && team.uuid && team.corporation?.name === memberCompany) {
                            const key = `${team.name}|${team.corporation?.name || ''}`;
                            uuidMap.set(key, team.uuid);
                        }
                    });
                    console.log(`Fetched ${uuidMap.size} teams for member ${member.uuid} in corporation ${memberCompany}`);
                    setTeamUuidMap(uuidMap);
                }).catch(console.error);
            }
        }
    }, [open, member, memberCompany, allMemberUuids, getMemberTeams]);

    // Get teams only from the member's current corporation
    // Show teams from corporations data structure, and try to get actual UUIDs from teamUuidMap
    const availableTeams = useMemo(() => {
        if (!memberCompany || memberCompany === "—") {
            return []; // No company assigned, can't move to any team
        }

        const teams: Array<{ uuid: string; name: string; memberCount: number; corporationName: string; corporationUuid: string }> = [];
        
        // Find the corporation that matches the member's company
        const memberCorp = corporations.find(corp => corp.name === memberCompany);
        
        if (memberCorp && memberCorp.teams && memberCorp.teams.length > 0) {
            memberCorp.teams.forEach((team) => {
                // Check if this is a composite key (contains a dash and team name pattern)
                const isCompositeKey = team.uuid.includes('-') && team.uuid.length > 36;
                
                // Try to get actual UUID from map using composite key: "teamName|corporationName"
                const mapKey = `${team.name}|${memberCorp.name}`;
                const actualUuid = teamUuidMap.get(mapKey);
                
                if (actualUuid) {
                    // Use the actual UUID from the map
                    teams.push({
                        uuid: actualUuid,
                        name: team.name,
                        memberCount: team.memberCount || team.members?.length || 0,
                        corporationName: memberCorp.name,
                        corporationUuid: memberCorp.uuid,
                    });
                } else if (!isCompositeKey) {
                    // If it's not a composite key, use it directly (might be a real UUID)
                teams.push({
                    uuid: team.uuid,
                    name: team.name,
                    memberCount: team.memberCount || team.members?.length || 0,
                        corporationName: memberCorp.name,
                        corporationUuid: memberCorp.uuid,
                    });
                } else {
                    // Even if it's a composite key and we don't have UUID yet, show it
                    // We'll try to fetch the UUID when the user selects it
                    teams.push({
                        uuid: team.uuid, // Use composite key temporarily
                        name: team.name,
                        memberCount: team.memberCount || team.members?.length || 0,
                        corporationName: memberCorp.name,
                        corporationUuid: memberCorp.uuid,
                });
                }
            });
        }
        
        console.log(`Available teams for ${memberCompany}:`, teams.length, teams.map(t => ({ name: t.name, uuid: t.uuid.substring(0, 20) + '...' })));
        
        return teams;
    }, [corporations, memberCompany, teamUuidMap]);

    const handleMove = () => {
        if (!selectedTeamUuid) return;
        setShowConfirmation(true);
    };

    const handleConfirmMove = async () => {
        if (!member || !selectedTeamUuid) return;

        const selectedTeam = availableTeams.find(t => t.uuid === selectedTeamUuid);
        
        // Check if we have a composite key and need to fetch the actual UUID
        let actualTeamUuid = selectedTeamUuid;
        const isCompositeKey = selectedTeamUuid.includes('-') && selectedTeamUuid.length > 36 && !selectedTeamUuid.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
        
        console.log("[MOVE_MEMBER_FRONTEND] Team UUID resolution:", {
            selectedTeamUuid,
            isCompositeKey,
            selectedTeamName: selectedTeam?.name,
            memberCompany,
            teamUuidMapSize: teamUuidMap.size
        });
        
        // Always try to resolve the UUID if we have team name and company
        if (selectedTeam && memberCompany && memberCompany !== "—") {
            const mapKey = `${selectedTeam.name}|${memberCompany}`;
            const mappedUuid = teamUuidMap.get(mapKey);
            
            if (mappedUuid) {
                actualTeamUuid = mappedUuid;
                console.log(`[MOVE_MEMBER_FRONTEND] Using mapped UUID for team ${selectedTeam.name}: ${actualTeamUuid}`);
            } else if (isCompositeKey) {
                // Try to fetch it directly by team name and corporation name
                try {
                    console.log(`[MOVE_MEMBER_FRONTEND] Fetching UUID for team "${selectedTeam.name}" in corporation "${memberCompany}"...`);
                    
                    const { data } = await getTeamByNameAndCorporation({
                        variables: {
                            teamName: selectedTeam.name,
                            corporationName: memberCompany
                        }
                    });
                    
                    const team = (data as any)?.teamByNameAndCorporation;
                    
                    if (team && team.uuid) {
                        actualTeamUuid = team.uuid;
                        console.log(`[MOVE_MEMBER_FRONTEND] Found UUID for team ${selectedTeam.name}: ${actualTeamUuid}`);
                        // Update the map for future use
                        setTeamUuidMap(prev => {
                            const newMap = new Map(prev);
                            newMap.set(mapKey, team.uuid);
                            return newMap;
                        });
                    } else {
                        console.error(`[MOVE_MEMBER_FRONTEND] Could not find team "${selectedTeam.name}" in corporation "${memberCompany}"`);
                        alert(`Could not find team "${selectedTeam.name}" in "${memberCompany}". The team may not exist.`);
                        return;
                    }
                } catch (error) {
                    console.error("[MOVE_MEMBER_FRONTEND] Error fetching team UUID:", error);
                    alert("Could not fetch team information. Please try again.");
                    return;
                }
            } else {
                // Not a composite key, but verify it's a valid UUID format
                const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(selectedTeamUuid);
                if (!isValidUUID) {
                    console.warn(`[MOVE_MEMBER_FRONTEND] Team UUID "${selectedTeamUuid}" doesn't look like a valid UUID, attempting to resolve...`);
                    // Try to fetch it anyway
                    try {
                        const { data } = await getTeamByNameAndCorporation({
                            variables: {
                                teamName: selectedTeam.name,
                                corporationName: memberCompany
                            }
                        });
                        
                        const team = (data as any)?.teamByNameAndCorporation;
                        if (team && team.uuid) {
                            actualTeamUuid = team.uuid;
                            console.log(`[MOVE_MEMBER_FRONTEND] Resolved UUID for team ${selectedTeam.name}: ${actualTeamUuid}`);
                        }
                    } catch (error) {
                        console.error("[MOVE_MEMBER_FRONTEND] Error resolving team UUID:", error);
                    }
                }
            }
        }
        
        console.log("[MOVE_MEMBER_FRONTEND] Calling moveMember mutation:", {
            memberUUID: member.uuid,
            teamUUID: actualTeamUuid,
            originalTeamUUID: selectedTeamUuid,
            teamName: selectedTeam?.name,
            memberEmail: member.email,
            memberCompany: memberCompany
        });

        try {
            await moveMember({
                variables: {
                    memberUUID: member.uuid,
                    teamUUID: actualTeamUuid,
                }
            });
        } catch (error: any) {
            console.error("[MOVE_MEMBER_FRONTEND] Mutation call error:", error);
            console.error("[MOVE_MEMBER_FRONTEND] Error details:", {
                message: error.message,
                graphQLErrors: error.graphQLErrors,
                networkError: error.networkError,
                stack: error.stack
            });
            alert(`Failed to move member: ${error.message || "Please try again."}`);
        }
    };

    if (!member) return null;

    const displayRole = memberRole || member.role || "—";
    const memberName = displayNameFor(member);
    const selectedTeam = availableTeams.find(t => t.uuid === selectedTeamUuid);
    const targetTeamName = selectedTeam?.name || "—";
    const currentTeamName = memberTeam || "—";
    const memberCorp = corporations.find(corp => corp.name === memberCompany);
    const corporationInfo = memberCorp ? `${memberCorp.name} (ID: ${memberCorp.uuid})` : memberCompany || "—";

    // Show confirmation modal (only if not in success state)
    if (showConfirmation && !showSuccess) {
        return (
            <Modal
                open={open}
                onClose={() => {}} // Prevent closing during move
                title={
                    <span className="text-xl font-semibold">
                        {moving ? "Moving Member..." : "Confirm Team Move"}
                    </span>
                }
                showCloseButton={false}
                size="md"
            >
                <div className="space-y-4">
                    <div className="text-sm text-gray-600 mb-4">
                        Please review the team move details before confirming.
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
                        <div className="flex items-start gap-3">
                            <HiOutlineUser className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <div className="text-sm text-gray-500">Member</div>
                                <div className="text-base font-semibold text-gray-900">{memberName}</div>
                                <div className="text-sm text-gray-600 mt-1">
                                    {displayRole !== "—" ? `${displayRole} • ` : ""}{member.email}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <svg className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm text-gray-500">Corporation</div>
                                <div className="text-base font-semibold text-gray-900">{corporationInfo}</div>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <svg className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm text-gray-500">Current Team</div>
                                <div className="text-base font-semibold text-gray-900">{currentTeamName}</div>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <svg className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm text-gray-500">New Team</div>
                                <div className="text-base font-semibold text-gray-900">{targetTeamName}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => setShowConfirmation(false)}
                        disabled={moving}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Go Back
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirmMove}
                        disabled={moving}
                        className="px-4 py-2 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                            backgroundColor: "#064126",
                        }}
                        onMouseEnter={(e) => {
                            if (!moving) {
                                e.currentTarget.style.backgroundColor = "#052a1a";
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!moving) {
                                e.currentTarget.style.backgroundColor = "#064126";
                            }
                        }}
                    >
                        {moving ? "Moving..." : "Confirm Move"}
                    </button>
                </div>
            </Modal>
        );
    }

    // Show team selection modal
    return (
        <Modal
            open={open}
            onClose={onClose}
            title={
                <div className="flex items-center justify-between w-full">
                    <span className="text-xl font-semibold">Move User to Another Team</span>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label="Close"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            }
            showCloseButton={false}
            size="md"
        >
            {/* User Display Box */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
                <div className="font-semibold text-gray-900">{memberName}</div>
                <div className="text-sm text-gray-600 mt-1">
                    {displayRole !== "—" ? `${displayRole} • ` : ""}{member.email}
                </div>
                    </div>

                    {/* Team Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Move to Team</label>
                        <div className="relative">
                            <select
                                value={selectedTeamUuid}
                                onChange={(e) => setSelectedTeamUuid(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none pr-8"
                            >
                        <option value="">Select target team</option>
                        {availableTeams.length > 0 ? (
                            availableTeams.map((team) => (
                                    <option key={team.uuid} value={team.uuid}>
                                    {team.name}
                                    </option>
                            ))
                        ) : (
                            <option value="" disabled>No teams available in {memberCompany || "your corporation"}</option>
                        )}
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleMove}
                    disabled={!selectedTeamUuid || moving}
                    className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                    {moving ? "Moving..." : "Move User"}
                        </button>
                    </div>
        </Modal>
    );
}

