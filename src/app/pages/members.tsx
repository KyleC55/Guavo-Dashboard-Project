import { useEffect, useState, useMemo } from "react";
import Sidebar from "../components/sidebar";
import { ProfileCard } from "../components/profilecard";
import { getDisplayProfile } from "../data/profile";
import { FiSidebar } from "react-icons/fi";
import Modal from "../components/modal";
import { useQuery } from "@apollo/client/react";
import { GET_ALL_MEMBERS, GET_ALL_RESERVATIONS, GET_MEMBER_STATS, GET_TEAM_MEMBER_RELATIONSHIPS, GET_ALL_CORPORATIONS, GET_MEMBER_CORPORATION_RELATIONSHIPS } from "../graphql/queries";
import { IoBusiness } from "react-icons/io5";
import { HiOutlineUsers } from "react-icons/hi";
import { HiOutlineUserGroup } from "react-icons/hi2";
import type {
    MemberRow,
    Corporation,
    Team,
    MemberTeamInfo,
} from "../components/members";
import {
    MemberDetails,
    EditUserModal,
    MoveUserModal,
    DeactivateUserModal,
    AddCompanyModal,
    HierarchyView,
    UsersView,
    TeamMemberRelationships,
} from "../components/members";

const Members = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [viewMode, setViewMode] = useState<"hierarchy" | "users">("hierarchy");
    const [expandedCompanies, setExpandedCompanies] = useState<Set<string>>(new Set());
    const [selectedMember, setSelectedMember] = useState<MemberRow | null>(null);
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [usersSearchQuery, setUsersSearchQuery] = useState("");
    const [editUserModalOpen, setEditUserModalOpen] = useState(false);
    const [memberToEdit, setMemberToEdit] = useState<MemberRow | null>(null);
    const [moveUserModalOpen, setMoveUserModalOpen] = useState(false);
    const [memberToMove, setMemberToMove] = useState<MemberRow | null>(null);
    const [deactivateUserModalOpen, setDeactivateUserModalOpen] = useState(false);
    const [memberToDeactivate, setMemberToDeactivate] = useState<MemberRow | null>(null);
    const [addCompanyModalOpen, setAddCompanyModalOpen] = useState(false);
    const [showEditSuccessToast, setShowEditSuccessToast] = useState(false);
    const [showMoveSuccessToast, setShowMoveSuccessToast] = useState(false);
    const [showRelationshipsModal, setShowRelationshipsModal] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0); // Force refresh trigger
    const [showCorporateSignupSuccess, setShowCorporateSignupSuccess] = useState(false);
    const [showCorporateSignupError, setShowCorporateSignupError] = useState(false);
    const [corporateSignupErrorMessage, setCorporateSignupErrorMessage] = useState<string>("");
    const [isRetryingCheckout, setIsRetryingCheckout] = useState(false);

    // Fetch reservations to extract companies and teams
    const { data: reservationsData, loading: reservationsLoading, error: reservationsError, refetch: refetchReservations } = useQuery(GET_ALL_RESERVATIONS, {
        variables: {
            limit: 10000,
            offset: 0,
        },
        fetchPolicy: "network-only",
    });

    // Fetch members data
    const { data: membersData, loading: membersLoading, error: membersError, refetch: refetchMembers } = useQuery(GET_ALL_MEMBERS, {
        variables: { limit: 1000, offset: 0 },
        fetchPolicy: "network-only",
    });

    // Fetch member statistics (active/inactive counts)
    const { data: memberStatsData, refetch: refetchMemberStats } = useQuery(GET_MEMBER_STATS, {
        fetchPolicy: "network-only",
    }) as { data: any; refetch: () => Promise<any> };

    // Fetch team-member relationships from database (source of truth)
    const { data: relationshipsData, refetch: refetchRelationships } = useQuery(GET_TEAM_MEMBER_RELATIONSHIPS, {
        fetchPolicy: "network-only",
    }) as { data: any; refetch: () => Promise<any> };

    // Fetch all corporations (including those without teams)
    const { data: corporationsData, refetch: refetchCorporations } = useQuery(GET_ALL_CORPORATIONS, {
        fetchPolicy: "network-only",
    }) as { data: any; refetch: () => Promise<any> };

    // Fetch member-corporation relationships (for matching members to corporations)
    const { data: memberCorpRelationshipsData } = useQuery(GET_MEMBER_CORPORATION_RELATIONSHIPS, {
        fetchPolicy: "network-only",
    }) as { data: any };

    // Check for corporate signup success query parameter
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const checkoutSessionId = params.get('session_id');
        if (params.get('corporate_signup') === 'success' || checkoutSessionId) {
            // Remove the query parameter from URL
            window.history.replaceState({}, '', window.location.pathname);
            
            // Try to process checkout manually if we have session_id
            const processCheckout = async () => {
                // Check localStorage for stored checkout session ID
                const storedSessionId = localStorage.getItem('pendingCorporateCheckoutSessionId');
                const sessionId = storedSessionId || checkoutSessionId;
                if (!sessionId) {
                    setCorporateSignupErrorMessage("Unable to verify payment status. Please refresh or contact support.");
                    setShowCorporateSignupError(true);
                    return;
                }
                try {
                    const { PROCESS_CORPORATE_CHECKOUT } = await import('../graphql/mutations');
                    const { client } = await import('../graphql');
                    const result = await client.mutate({
                        mutation: PROCESS_CORPORATE_CHECKOUT,
                        variables: { checkoutSessionId: sessionId },
                    });
                    
                    const processResult = (result.data as any)?.processCorporateCheckout;
                    if (processResult?.result) {
                        console.log('[CORPORATE_SIGNUP] Manual checkout processing succeeded');
                        setShowCorporateSignupSuccess(true);
                        localStorage.removeItem('pendingCorporateCheckoutSessionId');
                        localStorage.removeItem('pendingCorporateSignupPayload');
                        // Full page refresh immediately on success
                        window.location.reload();
                        return;
                    } else {
                        console.warn('[CORPORATE_SIGNUP] Manual checkout processing failed:', processResult?.error);
                        setCorporateSignupErrorMessage(processResult?.error || "Payment failed. Please try again.");
                        setShowCorporateSignupError(true);
                        localStorage.removeItem('pendingCorporateCheckoutSessionId');
                        return;
                    }
                } catch (error: any) {
                    console.error('[CORPORATE_SIGNUP] Error processing checkout manually:', error);
                    setCorporateSignupErrorMessage(error.message || "Payment failed. Please try again.");
                    setShowCorporateSignupError(true);
                    return;
                }
            };
            
            processCheckout();
            
            // Hide messages after 10 seconds (only for failures)
            setTimeout(() => {
                setShowCorporateSignupSuccess(false);
                setShowCorporateSignupError(false);
            }, 10000);
        }
    }, []); // No dependencies needed since we're doing a full page refresh

    const handleRetryCheckout = async () => {
        if (isRetryingCheckout) return;
        setIsRetryingCheckout(true);
        try {
            const rawPayload = localStorage.getItem("pendingCorporateSignupPayload");
            if (!rawPayload) {
                setCorporateSignupErrorMessage("Missing checkout details. Please reopen the Add Company modal.");
                setShowCorporateSignupError(true);
                return;
            }
            const corporateInput = JSON.parse(rawPayload);
            const { SIGN_UP_CORPORATE } = await import('../graphql/mutations');
            const { client } = await import('../graphql');
            const result = await client.mutate({
                mutation: SIGN_UP_CORPORATE,
                variables: { corporate: corporateInput },
            });
            const checkoutUrl = (result.data as any)?.signUpCorporate?.checkoutUrl;
            const checkoutSessionId = (result.data as any)?.signUpCorporate?.checkoutSessionId;
            if (checkoutUrl) {
                if (checkoutSessionId) {
                    localStorage.setItem('pendingCorporateCheckoutSessionId', checkoutSessionId);
                }
                window.location.href = checkoutUrl;
                return;
            }
            setCorporateSignupErrorMessage("Unable to start a new checkout session. Please try again.");
            setShowCorporateSignupError(true);
        } catch (error: any) {
            setCorporateSignupErrorMessage(error.message || "Unable to retry checkout. Please try again.");
            setShowCorporateSignupError(true);
        } finally {
            setIsRetryingCheckout(false);
        }
    };

    // Organize teams by corporation from database relationships (source of truth)
    const corporations = useMemo(() => {
        const allMembers = (membersData as any)?.members?.items ?? [];
        const relationships = (relationshipsData as any)?.teamMemberRelationships ?? [];
        const allCorporations = (corporationsData as any)?.allCorporations ?? [];
        
        // Create a map: companyName -> company
        const corpMap = new Map<string, Corporation>();
        
        // First, add all corporations from the allCorporations query (includes corporations without teams)
        allCorporations.forEach((corp: any) => {
            if (!corpMap.has(corp.name)) {
                corpMap.set(corp.name, {
                    uuid: corp.uuid,
                    name: corp.name,
                    teams: [],
                });
            }
        });
        
        // Create a map: "teamUuid" -> team info
        const teamMap = new Map<string, Team>();
        // Separate map to track member UUIDs per team
        const teamMemberUuidsMap = new Map<string, Set<string>>();
        
        // Build corporations and teams from database relationships
        relationships.forEach((rel: any) => {
            const corpName = rel.corporationName;
            const teamUuid = rel.teamUuid;
            const teamName = rel.teamName;
            const memberUuid = rel.memberUuid;
            
            // Create corporation if not exists (we don't have corp UUID from relationships, so use name as key)
            if (!corpMap.has(corpName)) {
                corpMap.set(corpName, {
                    uuid: `corp-${corpName}`, // Temporary UUID until we can get actual UUID
                    name: corpName,
                    teams: [],
                });
            }
            
            // Create team if not exists
            if (!teamMap.has(teamUuid)) {
                const corp = corpMap.get(corpName);
                if (!corp) return; // Skip if corporation not found
                
                teamMap.set(teamUuid, {
                    uuid: teamUuid, // Use actual team UUID from database
                        name: teamName,
                        description: null,
                        memberCount: null,
                        corporation: {
                        uuid: corp.uuid,
                            name: corpName,
                        },
                        members: [],
                    });
                teamMemberUuidsMap.set(teamUuid, new Set<string>());
                }
                
                // Track member
            const memberUuids = teamMemberUuidsMap.get(teamUuid);
            if (memberUuids) {
                memberUuids.add(memberUuid);
            }
        });
        
        // Convert team map to array and populate member details
        teamMap.forEach((team) => {
            const memberUuids = teamMemberUuidsMap.get(team.uuid);
            const memberDetails = memberUuids ? Array.from(memberUuids)
                .map((memberUuid) => {
                    return allMembers.find((m: MemberRow) => m.uuid === memberUuid);
                })
                .filter(Boolean)
                .map((m: MemberRow) => ({
                    uuid: m.uuid,
                    firstName: m.firstName || null,
                    lastName: m.lastName || null,
                    email: m.email || null,
                    active: m.active ?? true,
                })) : [];
            
            team.members = memberDetails;
            team.memberCount = memberDetails.length;
            
            const corpName = team.corporation?.name;
            if (corpName && corpMap.has(corpName)) {
                const existingTeam = corpMap.get(corpName)!.teams.find(t => t.uuid === team.uuid);
                if (!existingTeam) {
                    corpMap.get(corpName)!.teams.push(team);
                }
            }
        });
        
        // Also include corporations from reservations (even without teams)
        // This ensures corporations with members but no teams/reservations show up
        const reservations = (reservationsData as any)?.allReservations?.items ?? [];
        reservations.forEach((reservation: any) => {
            if (!reservation.corporate) return;
            
            const corpUuid = reservation.corporate.uuid;
            const corpName = reservation.corporate.name;
            const teamName = reservation.teamName;
            
            // Always add corporation if it doesn't exist (even without teams)
            if (!corpMap.has(corpName)) {
                corpMap.set(corpName, {
                    uuid: corpUuid,
                    name: corpName,
                    teams: [],
                });
            } else {
                // Update UUID if we have a real one (not the temporary 'corp-{name}' one)
                const corp = corpMap.get(corpName);
                if (corp && corp.uuid.startsWith('corp-')) {
                    corp.uuid = corpUuid;
                }
            }
            
            // Add team if it exists in the reservation
            if (teamName) {
                const corp = corpMap.get(corpName);
                if (corp) {
                    const existingTeam = corp.teams.find(t => t.name === teamName);
                    if (!existingTeam) {
                        const teamKey = `${corpUuid}-${teamName}`;
                        corp.teams.push({
                            uuid: teamKey, // Fallback composite key
                            name: teamName,
                            description: null,
                            memberCount: 0,
                            corporation: {
                                uuid: corpUuid,
                                name: corpName,
                            },
                            members: [],
                        });
                    }
                }
            }
        });
        
        // Also add corporations from reservations that don't have teams
        // This ensures corporations with members but no teams show up
        const reservationsList = (reservationsData as any)?.allReservations?.items ?? [];
        
        // Extract unique corporation names from reservations
        const corpNamesFromReservations = new Set<string>();
        reservationsList.forEach((reservation: any) => {
            if (reservation.corporate?.name) {
                corpNamesFromReservations.add(reservation.corporate.name);
            }
        });
        
        // Add corporations from reservations that don't have teams
        corpNamesFromReservations.forEach((corpName) => {
            if (!corpMap.has(corpName)) {
                // Find the corporation UUID from any reservation
                const reservationWithCorp = reservationsList.find((r: any) => r.corporate?.name === corpName);
                if (reservationWithCorp?.corporate?.uuid) {
                    corpMap.set(corpName, {
                        uuid: reservationWithCorp.corporate.uuid,
                        name: corpName,
                        teams: [],
                    });
                }
            }
        });
        
        // Sort teams within each company
        corpMap.forEach((company) => {
            company.teams.sort((a, b) => a.name.localeCompare(b.name));
        });
        
        return Array.from(corpMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    }, [relationshipsData, membersData, reservationsData, corporationsData, refreshKey]);

    // Calculate metrics
    const metrics = useMemo(() => {
        // Use backend stats if available, otherwise calculate from members array
        const stats = memberStatsData?.memberStats;
        const allMembers = (membersData as any)?.members?.items ?? [];
        
        // Count unique teams from corporations
        const allTeams = corporations.flatMap((corp) => corp.teams);
        
        return {
            companies: corporations.length,
            teams: allTeams.length,
            activeUsers: stats?.activeCount ?? allMembers.filter((m: MemberRow) => m.active).length,
            totalUsers: stats?.totalCount ?? allMembers.length,
            inactiveUsers: stats?.inactiveCount ?? allMembers.filter((m: MemberRow) => !m.active).length,
        };
    }, [membersData, corporations, memberStatsData]);

    const members = useMemo(() => {
        const mems = (membersData as any)?.members?.items ?? [];
        return mems;
    }, [membersData]);

    // Get all member UUIDs for MoveUserModal
    const memberUuids = useMemo(() => members.map((m: MemberRow) => m.uuid), [members]);

    // Create a map of member UUID to company/team/role from reservations (fallback)
    const reservationBasedMap = useMemo(() => {
        const reservations = (reservationsData as any)?.allReservations?.items ?? [];
        const map = new Map<string, { company: string; team: string; role?: string | null }>();
        
        reservations.forEach((reservation: any) => {
            // Try to get member UUID first, fallback to email
            const memberUuid = reservation.member?.uuid;
            const memberEmail = reservation.member?.email;
            
            if (!memberUuid && !memberEmail) return;
            
            // Use UUID as primary key, email as fallback
            const key = memberUuid || memberEmail;
            
            if (reservation.corporate?.name) {
                const existing = map.get(key);
                // Prefer non-empty team names, and prefer UUID-based entries
                const teamName = reservation.teamName || existing?.team || "—";
                const shouldUpdate = !existing || 
                    (!existing.team && teamName !== "—") ||
                    (memberUuid && !existing.company); // Update if we have UUID and existing doesn't
                
                if (shouldUpdate) {
                    map.set(key, {
                        company: reservation.corporate.name,
                        team: teamName,
                        role: existing?.role || null,
                    });
                }
            }
        });
        
        return map;
    }, [reservationsData]);

    // Build memberCompanyTeamMap from teamMemberRelationships (source of truth from database)
    const memberCompanyTeamMap = useMemo(() => {
        const combined = new Map<string, MemberTeamInfo>();
        const relationships = (relationshipsData as any)?.teamMemberRelationships ?? [];
        const allMembers = (membersData as any)?.members?.items ?? [];
        const allCorporations = (corporationsData as any)?.allCorporations ?? [];
        
        // Build map from database relationships (primary source)
        relationships.forEach((rel: any) => {
            const memberUuid = rel.memberUuid;
            const teamName = rel.teamName;
            const corporationName = rel.corporationName;
            
            // Find the member to get their role
            const member = allMembers.find((m: MemberRow) => m.uuid === memberUuid);
            const role = member?.role || null;
            
            // Use the relationship data (this is the source of truth from corporation_teams_members_member table)
            combined.set(memberUuid, {
                company: corporationName || "—",
                team: teamName || "—",
                role: role,
            });
        });
        
        // Fallback: Add members that don't have relationships yet (from reservations)
        members.forEach((member: MemberRow) => {
            if (!combined.has(member.uuid)) {
            // Try to find by UUID first
            let data = reservationBasedMap.get(member.uuid);
            
            // If not found by UUID, try by email
            if (!data && member.email) {
                data = reservationBasedMap.get(member.email);
            }
            
            if (data) {
                    combined.set(member.uuid, {
                        ...data,
                        role: member.role || data.role || null,
                    });
            } else {
                // Check member-corporation relationships to find which corporation this member belongs to
                const memberCorpRels = (memberCorpRelationshipsData as any)?.memberCorporationRelationships ?? [];
                const memberCorpRel = memberCorpRels.find((rel: any) => rel.memberUuid === member.uuid);
                
                if (memberCorpRel) {
                    // Member belongs to a corporation (even without teams)
                    combined.set(member.uuid, {
                        company: memberCorpRel.corporationName || "—",
                        team: "—",
                        role: member.role || null,
                    });
            } else {
                // Create entry with role even if no company/team
                combined.set(member.uuid, {
                    company: "—",
                    team: "—",
                        role: member.role || null,
                });
                }
                }
            } else {
                // Update role if we have it from member data
                const existing = combined.get(member.uuid);
                if (existing && member.role) {
                    existing.role = member.role;
                }
            }
        });
        
        return combined;
    }, [relationshipsData, membersData, reservationBasedMap, members, corporationsData, memberCorpRelationshipsData, refreshKey]);

    const handleToggleCompany = (uuid: string) => {
        const newSet = new Set(expandedCompanies);
        if (newSet.has(uuid)) {
            newSet.delete(uuid);
        } else {
            newSet.add(uuid);
        }
        setExpandedCompanies(newSet);
    };

    const handleToggleTeam = (_companyUuid: string, _teamUuid: string) => {
        // Handled in HierarchyView component
    };

    const handleEditMember = (member: MemberRow) => {
        setMemberToEdit(member);
        setEditUserModalOpen(true);
    };

    const handleMoveMember = (member: MemberRow) => {
        setMemberToMove(member);
        setMoveUserModalOpen(true);
    };

    const handleDeactivateMember = (member: MemberRow) => {
        setMemberToDeactivate(member);
        setDeactivateUserModalOpen(true);
    };

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSidebarOpen(false);
        if (sidebarOpen) document.body.style.overflow = "hidden";
        else document.body.style.overflow = "";
        window.addEventListener("keydown", onKey);
        return () => {
            window.removeEventListener("keydown", onKey);
            document.body.style.overflow = "";
        };
    }, [sidebarOpen]);

    return (
        <div className="relative flex min-h-screen bg-white">
            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 z-40 h-full w-64 bg-white border-r border-neutral-200 transform transition-transform duration-300 ease-in-out ${
                    sidebarOpen ? "translate-x-0" : "-translate-x-full"
                }`}
                aria-hidden={!sidebarOpen}
            >
                <Sidebar onClose={() => setSidebarOpen(false)} />
            </aside>

            {/* Overlay */}
            {sidebarOpen && (
                <button
                    aria-label="Close sidebar overlay"
                    onClick={() => setSidebarOpen(false)}
                    className="fixed inset-0 z-30 bg-black/30"
                />
            )}

            <main className="flex-1 flex flex-col w-full">
                {/* Header */}
                <div className="w-full px-6 py-6 relative">
                    <button
                        aria-label="Toggle sidebar"
                        onClick={() => setSidebarOpen((s) => !s)}
                        className="absolute top-6 left-6 inline-flex items-center justify-center rounded-md border border-neutral-300 bg-white p-2 shadow-sm hover:bg-neutral-100 active:scale-[0.98] transition"
                        title="Toggle Sidebar"
                    >
                        <FiSidebar size={18} />
                    </button>

                    <div className="flex items-center gap-3 pl-14 mb-5">
                        <div className="flex-1" />
                        <ProfileCard profile={getDisplayProfile()} />
                    </div>

                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <h1 className="text-3xl font-bold">Companies & Teams</h1>
                            <p className="text-gray-500 text-sm mt-1">
                                Manage organizational hierarchy and user permissions.
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setViewMode("hierarchy")}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                    viewMode === "hierarchy"
                                        ? "text-white"
                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}
                                style={viewMode === "hierarchy" ? { backgroundColor: "#064126" } : {}}
                                onMouseEnter={(e) => {
                                    if (viewMode === "hierarchy") {
                                        e.currentTarget.style.backgroundColor = "#052a1a";
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (viewMode === "hierarchy") {
                                        e.currentTarget.style.backgroundColor = "#064126";
                                    }
                                }}
                            >
                                Hierarchy View
                            </button>
                            <button
                                onClick={() => setViewMode("users")}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                    viewMode === "users"
                                        ? "text-white"
                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}
                                style={viewMode === "users" ? { backgroundColor: "#064126" } : {}}
                                onMouseEnter={(e) => {
                                    if (viewMode === "users") {
                                        e.currentTarget.style.backgroundColor = "#052a1a";
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (viewMode === "users") {
                                        e.currentTarget.style.backgroundColor = "#064126";
                                    }
                                }}
                            >
                                Users View
                            </button>
                            <button 
                                onClick={() => setAddCompanyModalOpen(true)}
                                className="px-4 py-2 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                                style={{ backgroundColor: "#064126" }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = "#052a1a";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = "#064126";
                                }}
                            >
                                <span>+</span> Add Company
                            </button>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-sm text-gray-500 mb-1">Companies</div>
                                    <div className="text-2xl font-bold">{metrics.companies}</div>
                                </div>
                                <IoBusiness className="w-8 h-8 text-gray-400" />
                            </div>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-sm text-gray-500 mb-1">Teams</div>
                                    <div className="text-2xl font-bold">{metrics.teams}</div>
                                </div>
                                <HiOutlineUserGroup className="w-8 h-8 text-gray-400" />
                            </div>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-sm text-gray-500 mb-1">Active Users</div>
                                    <div className="text-2xl font-bold">{metrics.activeUsers}</div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        of {metrics.totalUsers} total
                                    </div>
                                </div>
                                <HiOutlineUsers className="w-8 h-8 text-gray-400" />
                            </div>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-sm text-gray-500 mb-1">Inactive Users</div>
                                    <div className="text-2xl font-bold">{metrics.inactiveUsers}</div>
                                    {metrics.inactiveUsers > 0 && (
                                        <div className="text-xs text-red-600 mt-1">need attention</div>
                                    )}
                                </div>
                                <HiOutlineUsers className="w-8 h-8 text-gray-400" />
                            </div>
                        </div>
                    </div>

                    {(reservationsError || membersError) && (
                        <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                            Failed to load data. {String(reservationsError?.message || membersError?.message || "")}
                        </div>
                    )}
                </div>

                {/* Content Area */}
                <div className="px-6 pb-10">
                    {viewMode === "hierarchy" ? (
                        <div>
                            <h2 className="text-xl font-semibold mb-4">Company Hierarchy</h2>
                            {(reservationsLoading || membersLoading) ? (
                                <div className="text-center py-12 text-gray-500">Loading hierarchy...</div>
                            ) : corporations.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">No companies found</div>
                            ) : (
                                <HierarchyView
                                    corporations={corporations}
                                    expandedCompanies={expandedCompanies}
                                    onToggleCompany={handleToggleCompany}
                                    onToggleTeam={handleToggleTeam}
                                    members={members}
                                    memberCompanyTeamMap={memberCompanyTeamMap}
                                    onEditMember={handleEditMember}
                                    onMoveMember={handleMoveMember}
                                    onDeactivateMember={handleDeactivateMember}
                                />
                            )}
                        </div>
                    ) : (
                        <div>
                            {membersLoading ? (
                                <div className="text-center py-12 text-gray-500">Loading users...</div>
                            ) : (
                                <UsersView 
                                    members={members} 
                                    memberCompanyTeamMap={memberCompanyTeamMap}
                                    searchQuery={usersSearchQuery}
                                    onSearchChange={setUsersSearchQuery}
                                    onEditMember={handleEditMember}
                                    onMoveMember={handleMoveMember}
                                    onDeactivateMember={handleDeactivateMember}
                                />
                            )}
                        </div>
                    )}
                </div>

                {/* Member Details Modal */}
                {detailsModalOpen && selectedMember && (
                    <Modal
                        open={detailsModalOpen}
                        onClose={() => {
                            setDetailsModalOpen(false);
                            setSelectedMember(null);
                        }}
                        title={
                            <div>
                                <div className="text-xl font-semibold">Member Details</div>
                                <div className="text-sm text-gray-600 mt-1 font-mono">
                                    {selectedMember.uuid}
                                </div>
                            </div>
                        }
                        showCloseButton
                    >
                        <MemberDetails member={selectedMember} />
                    </Modal>
                )}

                {/* Edit User Modal */}
                <EditUserModal
                    member={memberToEdit}
                    open={editUserModalOpen}
                    onClose={() => {
                        setEditUserModalOpen(false);
                        setMemberToEdit(null);
                    }}
                    onSuccess={() => {
                        setShowEditSuccessToast(true);
                        setTimeout(() => {
                            setShowEditSuccessToast(false);
                        }, 5000);
                    }}
                />

                {/* Edit Success Toast Notification */}
                {showEditSuccessToast && (
                    <div className="fixed bottom-6 right-6 z-[10000] animate-in slide-in-from-bottom-5">
                        <div className="bg-green-600 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px]">
                            <div className="flex-shrink-0">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <div className="font-semibold">Edit Successful</div>
                                <div className="text-sm text-green-100">Member information has been updated successfully</div>
                            </div>
                            <button
                                onClick={() => setShowEditSuccessToast(false)}
                                className="flex-shrink-0 text-white hover:text-gray-200 transition-colors"
                                aria-label="Close notification"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}

                {/* Move Success Toast Notification */}
                {showMoveSuccessToast && (
                    <div className="fixed bottom-6 right-6 z-[10000] animate-in slide-in-from-bottom-5">
                        <div className="bg-green-600 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px]">
                            <div className="flex-shrink-0">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <div className="font-semibold">Move Successful</div>
                                <div className="text-sm text-green-100">Member has been moved to the new team successfully</div>
                            </div>
                            <button
                                onClick={() => setShowMoveSuccessToast(false)}
                                className="flex-shrink-0 text-white hover:text-gray-200 transition-colors"
                                aria-label="Close notification"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}

                {/* Corporate Signup Success Toast */}
                {showCorporateSignupSuccess && (
                    <div className="fixed bottom-6 right-6 z-[10000] animate-in slide-in-from-bottom-5">
                        <div className="bg-green-600 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px]">
                            <div className="flex-shrink-0">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <div className="font-semibold">Company Created Successfully</div>
                                <div className="text-sm text-green-100">The new company and owner account have been set up via Stripe checkout.</div>
                            </div>
                            <button
                                onClick={() => setShowCorporateSignupSuccess(false)}
                                className="flex-shrink-0 text-white hover:text-gray-200 transition-colors"
                                aria-label="Close notification"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}

                {/* Corporate Signup Failed Toast */}
                {showCorporateSignupError && (
                    <div className="fixed bottom-6 right-6 z-[10000] animate-in slide-in-from-bottom-5">
                        <div className="bg-red-600 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px]">
                            <div className="flex-shrink-0">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <div className="font-semibold">Payment Failed</div>
                                <div className="text-sm text-red-100">
                                    {corporateSignupErrorMessage || "Payment failed. Please try again."}
                                </div>
                            </div>
                            <button
                                onClick={handleRetryCheckout}
                                disabled={isRetryingCheckout}
                                className="rounded-md border border-white/40 px-3 py-1.5 text-sm text-white hover:bg-white/10 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {isRetryingCheckout ? "Retrying…" : "Retry checkout"}
                            </button>
                            <button
                                onClick={() => setShowCorporateSignupError(false)}
                                className="flex-shrink-0 text-white hover:text-gray-200 transition-colors"
                                aria-label="Close notification"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}

                {/* Team-Member Relationships Modal */}
                <TeamMemberRelationships
                    open={showRelationshipsModal}
                    onClose={() => setShowRelationshipsModal(false)}
                    corporations={corporations}
                />

                {/* Move User Modal */}
                <MoveUserModal
                    member={memberToMove}
                    open={moveUserModalOpen}
                    onClose={() => {
                        setMoveUserModalOpen(false);
                        setMemberToMove(null);
                    }}
                    corporations={corporations}
                    memberRole={memberToMove ? (memberCompanyTeamMap.get(memberToMove.uuid)?.role || memberToMove.role || undefined) : undefined}
                    memberCompany={memberToMove ? (memberCompanyTeamMap.get(memberToMove.uuid)?.company || undefined) : undefined}
                    memberTeam={memberToMove ? (memberCompanyTeamMap.get(memberToMove.uuid)?.team || undefined) : undefined}
                    allMemberUuids={memberUuids}
                    onMemberMoved={async () => {
                        console.log("[MOVE_MEMBER_PARENT] Refetching all data...");
                        // Force refetch of all data with network-only to bypass cache
                        try {
                            // Wait a moment for backend to fully persist
                            await new Promise(resolve => setTimeout(resolve, 500));
                            
                            // Refetch with network-only and no-cache
                            const [membersResult, reservationsResult] = await Promise.all([
                                refetchMembers({ 
                                    fetchPolicy: "network-only",
                                    notifyOnNetworkStatusChange: true,
                                }),
                                refetchReservations({ 
                                    fetchPolicy: "network-only",
                                    notifyOnNetworkStatusChange: true,
                                }),
                                refetchMemberStats(),
                                refetchRelationships && refetchRelationships(),
                            ]);
                            
                            console.log("[MOVE_MEMBER_PARENT] Data refetched successfully", {
                                membersCount: (membersResult?.data as any)?.members?.items?.length || 0,
                                reservationsCount: (reservationsResult?.data as any)?.allReservations?.items?.length || 0,
                            });
                            
                            // Force UI refresh by incrementing refreshKey
                            setRefreshKey(prev => prev + 1);
                            
                            // Force a small delay to ensure UI updates
                            await new Promise(resolve => setTimeout(resolve, 300));
                        } catch (error) {
                            console.error("[MOVE_MEMBER_PARENT] Error refetching:", error);
                        }
                    }}
                    onSuccess={() => {
                        setShowMoveSuccessToast(true);
                        setTimeout(() => {
                            setShowMoveSuccessToast(false);
                        }, 5000);
                    }}
                />

                {/* Deactivate User Modal */}
                <DeactivateUserModal
                    member={memberToDeactivate}
                    open={deactivateUserModalOpen}
                    onClose={() => {
                        setDeactivateUserModalOpen(false);
                        setMemberToDeactivate(null);
                    }}
                    onSuccess={async () => {
                        // Refetch members and stats to update the UI
                        await Promise.all([
                            refetchMembers(),
                            refetchReservations(),
                            refetchMemberStats()
                        ]);
                    }}
                />

                {/* Add Company Modal */}
                <AddCompanyModal
                    open={addCompanyModalOpen}
                    onClose={() => setAddCompanyModalOpen(false)}
                />
            </main>
        </div>
    );
};

export default Members;
