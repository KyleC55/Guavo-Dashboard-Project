import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { GET_TEAM_MEMBER_RELATIONSHIPS } from "../../graphql/queries";
import { MOVE_MEMBER_TO_TEAM } from "../../graphql/mutations";
import { GET_ALL_MEMBERS, GET_ALL_RESERVATIONS } from "../../graphql/queries";
import Modal from "../modal";

type TeamMemberRelationship = {
    memberId: number;
    memberUuid: string;
    memberEmail: string;
    memberName: string;
    corporationTeamsId: number;
    teamUuid: string;
    teamName: string;
    corporationName: string;
};

export function TeamMemberRelationships({ 
    open, 
    onClose,
    corporations 
}: { 
    open: boolean; 
    onClose: () => void;
    corporations: any[];
}) {
    const { data, loading, error, refetch } = useQuery(GET_TEAM_MEMBER_RELATIONSHIPS, {
        fetchPolicy: "network-only",
        skip: !open,
    });

    const [editingRow, setEditingRow] = useState<number | null>(null);
    const [selectedTeamUuid, setSelectedTeamUuid] = useState<string | null>(null);

    const [moveMember] = useMutation(MOVE_MEMBER_TO_TEAM, {
        refetchQueries: [
            { query: GET_TEAM_MEMBER_RELATIONSHIPS },
            { query: GET_ALL_MEMBERS, variables: { limit: 1000, offset: 0 } },
            { query: GET_ALL_RESERVATIONS, variables: { limit: 10000, offset: 0 } },
        ],
        awaitRefetchQueries: true,
        fetchPolicy: "network-only",
    });

    const relationships: TeamMemberRelationship[] = data?.teamMemberRelationships || [];

    // Get all available teams from corporations - use team UUIDs for selection
    const allTeams = corporations.flatMap(corp => 
        corp.teams.map((team: any) => ({
            uuid: team.uuid,
            name: team.name,
            corporationName: corp.name,
            corporationUuid: corp.uuid,
        }))
    );

    const handleEdit = (relationship: TeamMemberRelationship) => {
        setEditingRow(relationship.memberId);
        setSelectedTeamUuid(relationship.teamUuid);
    };

    const handleSave = async (relationship: TeamMemberRelationship) => {
        if (!selectedTeamUuid) {
            alert("Please select a team");
            return;
        }

        // Check if team is already the same
        if (selectedTeamUuid === relationship.teamUuid) {
            setEditingRow(null);
            setSelectedTeamUuid(null);
            return;
        }

        try {
            await moveMember({
                variables: {
                    memberUUID: relationship.memberUuid,
                    teamUUID: selectedTeamUuid,
                },
            });
            setEditingRow(null);
            setSelectedTeamUuid(null);
            await refetch();
        } catch (error: any) {
            console.error("Error moving member:", error);
            alert(`Failed to update: ${error.message || "Please try again."}`);
        }
    };

    const handleCancel = () => {
        setEditingRow(null);
        setSelectedTeamUuid(null);
    };

    if (!open) return null;

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Team-Member Relationships"
            size="lg"
            showCloseButton={true}
        >
            <div className="space-y-4">
                {loading && <div className="text-center py-4">Loading...</div>}
                {error && <div className="text-red-600 py-4">Error: {error.message}</div>}
                
                {!loading && !error && (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Member
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Corporation
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Team
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {relationships.map((rel) => (
                                    <tr key={`${rel.memberId}-${rel.corporationTeamsId}`}>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {rel.memberName}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {rel.memberEmail}
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                ID: {rel.memberId}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                            {rel.corporationName}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            {editingRow === rel.memberId ? (
                                                <select
                                                    value={selectedTeamUuid || ""}
                                                    onChange={(e) => setSelectedTeamUuid(e.target.value)}
                                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                                >
                                                    <option value="">Select team</option>
                                                    {allTeams
                                                        .filter(t => t.corporationName === rel.corporationName)
                                                        .map((team) => (
                                                            <option key={team.uuid} value={team.uuid}>
                                                                {team.name}
                                                            </option>
                                                        ))}
                                                </select>
                                            ) : (
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {rel.teamName}
                                                    </div>
                                                    <div className="text-xs text-gray-400">
                                                        Team ID: {rel.corporationTeamsId}
                                                    </div>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                                            {editingRow === rel.memberId ? (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleSave(rel)}
                                                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        onClick={handleCancel}
                                                        className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => handleEdit(rel)}
                                                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                                                >
                                                    Edit
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </Modal>
    );
}

