import { useEffect, useState, useRef } from "react";
import { useLazyQuery } from "@apollo/client/react";
import { GET_MEMBER_TEAMS } from "../graphql/queries";

type TeamInfo = {
    company: string;
    team: string;
    role?: string;
};

export function useMemberTeams(memberUuids: string[]) {
    const [teamsMap, setTeamsMap] = useState<Map<string, TeamInfo>>(new Map());
    const [loading, setLoading] = useState(false);
    const [getMemberTeams] = useLazyQuery(GET_MEMBER_TEAMS);
    const fetchingRef = useRef(false);
    const lastUuidsRef = useRef<string>("");

    useEffect(() => {
        // Create a stable string representation of UUIDs for comparison
        const uuidsKey = memberUuids.sort().join(",");
        
        // Skip if no UUIDs, already fetching, or UUIDs haven't changed
        if (memberUuids.length === 0 || fetchingRef.current || lastUuidsRef.current === uuidsKey) {
            return;
        }

        lastUuidsRef.current = uuidsKey;
        fetchingRef.current = true;
        setLoading(true);
        
        const fetchTeams = async () => {
            const newMap = new Map<string, TeamInfo>();
            
            // Fetch teams for each member (in batches to avoid overwhelming the server)
            const batchSize = 10;
            for (let i = 0; i < memberUuids.length; i += batchSize) {
                const batch = memberUuids.slice(i, i + batchSize);
                await Promise.all(
                    batch.map(async (uuid) => {
                        try {
                            const { data } = await getMemberTeams({
                                variables: { memberUuid: uuid },
                                fetchPolicy: "network-only",
                            });
                            
                            const teams = (data as any)?.membersTeams?.teams ?? [];
                            if (teams.length > 0) {
                                // Get the first team (or combine if multiple)
                                const firstTeam = teams[0];
                                newMap.set(uuid, {
                                    company: firstTeam.corporation?.name || "—",
                                    team: firstTeam.name || "—",
                                    role: "—", // Role not available via this query
                                });
                            }
                        } catch (error: any) {
                            // Ignore AbortError - it's expected when requests are cancelled
                            if (error?.name !== 'AbortError' && error?.message !== 'The operation was aborted.') {
                                console.error(`Failed to fetch teams for member ${uuid}:`, error);
                            }
                        }
                    })
                );
            }
            
            setTeamsMap(newMap);
            setLoading(false);
            fetchingRef.current = false;
        };

        fetchTeams().catch((error: any) => {
            // Ignore AbortError - it's expected when requests are cancelled
            if (error?.name !== 'AbortError' && error?.message !== 'The operation was aborted.') {
                console.error("Error fetching member teams:", error);
            }
            setLoading(false);
            fetchingRef.current = false;
        });
    }, [memberUuids, getMemberTeams]);

    return { teamsMap, loading };
}

