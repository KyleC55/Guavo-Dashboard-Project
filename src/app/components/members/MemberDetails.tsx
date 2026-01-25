import { useQuery } from "@apollo/client/react";
import { GET_MEMBER_TEAMS } from "../../graphql/queries";
import { MemberRow } from "./types";
import { displayNameFor } from "./utils";
import { CopyableUuid } from "./CopyableUuid";

export function MemberDetails({ member }: { member: MemberRow }) {
    const { data: memberTeamsData, loading: teamsLoading } = useQuery(GET_MEMBER_TEAMS, {
        variables: { memberUuid: member.uuid },
        skip: !member.uuid,
        fetchPolicy: "network-only",
    });

    const teams = (memberTeamsData as any)?.membersTeams?.teams ?? [];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="sm:col-span-2">
                    <div className="text-sm text-gray-500">Name</div>
                    <div className="font-medium">{displayNameFor(member)}</div>
                </div>

                <div>
                    <div className="text-sm text-gray-500">First Name</div>
                    <div className="font-medium">{member.firstName || "—"}</div>
                </div>

                <div>
                    <div className="text-sm text-gray-500">Last Name</div>
                    <div className="font-medium">{member.lastName || "—"}</div>
                </div>

                <div>
                    <div className="text-sm text-gray-500">Preferred Name</div>
                    <div className="font-medium">{member.preferredName || "—"}</div>
                </div>

                <div>
                    <div className="text-sm text-gray-500">Username</div>
                    <div className="font-medium">{member.username || "—"}</div>
                </div>

                <div className="sm:col-span-2">
                    <div className="text-sm text-gray-500">Email</div>
                    <div className="font-medium text-blue-700">{member.email || "—"}</div>
                </div>

                <div>
                    <div className="text-sm text-gray-500">Phone</div>
                    <div className="font-medium">{member.phone || "—"}</div>
                </div>

                <div>
                    <div className="text-sm text-gray-500">Status</div>
                    <div className="font-medium">
                        {member.active ? (
                            <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-green-100 text-black">
                                Active
                            </span>
                        ) : (
                            <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-red-100 text-red-800">
                                Inactive
                            </span>
                        )}
                    </div>
                </div>

                <div>
                    <div className="text-sm text-gray-500">Member UUID</div>
                    <CopyableUuid uuid={member.uuid} />
                </div>

                {member.federatedId && (
                    <div>
                        <div className="text-sm text-gray-500">Keycloak ID (Federated ID)</div>
                        <CopyableUuid uuid={member.federatedId} />
                    </div>
                )}

                {teamsLoading ? (
                    <div className="sm:col-span-2">
                        <div className="text-sm text-gray-500">Teams</div>
                        <div className="text-sm text-gray-400">Loading...</div>
                    </div>
                ) : teams.length > 0 ? (
                    <div className="sm:col-span-2">
                        <div className="text-sm text-gray-500">Teams & Companies</div>
                        <div className="space-y-2 mt-1">
                            {teams.map((team: any) => (
                                <div key={team.uuid} className="flex items-center gap-2">
                                    <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-blue-100 text-blue-800">
                                        {team.name || "—"}
                                    </span>
                                    {team.corporation?.name && (
                                        <span className="text-xs text-gray-600">
                                            @ {team.corporation.name}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="sm:col-span-2">
                        <div className="text-sm text-gray-500">Teams</div>
                        <div className="text-sm text-gray-400">No teams assigned</div>
                    </div>
                )}
            </div>
        </div>
    );
}

