import { useState } from "react";
import { IoBusiness } from "react-icons/io5";
import { HiOutlineUserGroup } from "react-icons/hi2";
import { Corporation, MemberRow, Team, MemberTeamInfo } from "./types";
import { MemberCard } from "./MemberCard";

const ChevronRightIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
        <path d="m9 18 6-6-6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const ChevronDownIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
        <path d="m6 9 6 6 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export function HierarchyView({ 
    corporations, 
    expandedCompanies, 
    onToggleCompany, 
    onToggleTeam,
    members,
    memberCompanyTeamMap,
    onEditMember,
    onMoveMember,
    onDeactivateMember
}: {
    corporations: Corporation[];
    expandedCompanies: Set<string>;
    onToggleCompany: (uuid: string) => void;
    onToggleTeam: (companyUuid: string, teamUuid: string) => void;
    members: MemberRow[];
    memberCompanyTeamMap: Map<string, MemberTeamInfo>;
    onEditMember: (member: MemberRow) => void;
    onMoveMember: (member: MemberRow) => void;
    onDeactivateMember: (member: MemberRow) => void;
}) {
    const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());

    const handleToggleTeam = (companyUuid: string, teamUuid: string) => {
        const key = `${companyUuid}-${teamUuid}`;
        const newSet = new Set(expandedTeams);
        if (newSet.has(key)) {
            newSet.delete(key);
        } else {
            newSet.add(key);
        }
        setExpandedTeams(newSet);
        onToggleTeam(companyUuid, teamUuid);
    };

    const getTeamStats = (team: Team) => {
        if (!team.members) return { active: 0, inactive: 0 };
        const active = team.members.filter(m => m.active).length;
        const inactive = team.members.length - active;
        return { active, inactive };
    };

    const getCompanyStats = (company: Corporation) => {
        // Get all members belonging to this corporation
        const corpMembers = members.filter((member: MemberRow) => {
            const companyTeamInfo = memberCompanyTeamMap.get(member.uuid);
            return companyTeamInfo?.company === company.name;
        });
        
        const active = corpMembers.filter(m => m.active).length;
        const inactive = corpMembers.length - active;
        return { active, inactive };
    };

    return (
        <div className="space-y-2">
            {corporations.map((company) => {
                const isExpanded = expandedCompanies.has(company.uuid);
                return (
                    <div key={company.uuid} className="border border-gray-200 rounded-lg">
                        {/* Company Row */}
                        <div
                            className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer"
                            onClick={() => onToggleCompany(company.uuid)}
                        >
                            <div className="flex items-center gap-3 flex-1">
                                {isExpanded ? (
                                    <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                                ) : (
                                    <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                                )}
                                <IoBusiness className="w-5 h-5 text-gray-600" />
                                <div className="flex-1">
                                    <div className="font-medium text-gray-900">{company.name}</div>
                                    <div className="text-sm text-gray-500">
                                        {company.teams.length} team{company.teams.length !== 1 ? "s" : ""} • {(() => {
                                            const stats = getCompanyStats(company);
                                            return `${stats.active} active • ${stats.inactive} inactive`;
                                        })()}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Teams List or Direct Members (if no teams) */}
                        {isExpanded && (
                            <div className="border-t border-gray-200 bg-gray-50">
                                {company.teams.length > 0 ? (
                                    // Show teams if they exist
                                    company.teams.map((team) => {
                                    const teamKey = `${company.uuid}-${team.uuid}`;
                                    const isTeamExpanded = expandedTeams.has(teamKey);
                                    const stats = getTeamStats(team);
                                    
                                    return (
                                        <div key={team.uuid} className="border-b border-gray-200 last:border-b-0">
                                            {/* Team Row */}
                                            <div
                                                className="flex items-center justify-between p-3 pl-12 hover:bg-gray-100 cursor-pointer"
                                                onClick={() => handleToggleTeam(company.uuid, team.uuid)}
                                            >
                                                <div className="flex items-center gap-3 flex-1">
                                                    {isTeamExpanded ? (
                                                        <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                                                    ) : (
                                                        <ChevronRightIcon className="w-4 h-4 text-gray-400" />
                                                    )}
                                                    <HiOutlineUserGroup className="w-5 h-5 text-gray-600" />
                                                    <div className="flex-1">
                                                        <div className="font-medium text-gray-900">{team.name}</div>
                                                        <div className="text-sm text-gray-500">
                                                            {stats.active} active • {stats.inactive} inactive
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Team Members */}
                                            {isTeamExpanded && team.members && team.members.length > 0 && (
                                                    <div className="bg-white pl-16 pr-4 py-4 space-y-3">
                                                    {team.members.map((member) => {
                                                        const fullMember = members.find((m: MemberRow) => m.uuid === member.uuid);
                                                        if (!fullMember) return null;
                                                            
                                                            const companyTeamInfo = memberCompanyTeamMap.get(fullMember.uuid);
                                                            const companyName = companyTeamInfo?.company || company.name || "—";
                                                            const teamName = companyTeamInfo?.team || team.name || "—";
                                                            const role = companyTeamInfo?.role || fullMember.role || "—";
                                                        
                                                        return (
                                                                <MemberCard
                                                                    key={member.uuid}
                                                                    member={fullMember}
                                                                    companyName={companyName}
                                                                    teamName={teamName}
                                                                    role={role}
                                                                    onEdit={() => onEditMember(fullMember)}
                                                                    onMove={() => onMoveMember(fullMember)}
                                                                    onDeactivate={() => onDeactivateMember(fullMember)}
                                                                />
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                        );
                                    })
                                ) : (
                                    // Show all members directly if no teams
                                    (() => {
                                        // Find all members belonging to this corporation
                                        const corpMembers = members.filter((member: MemberRow) => {
                                            const companyTeamInfo = memberCompanyTeamMap.get(member.uuid);
                                            return companyTeamInfo?.company === company.name;
                                        });
                                        
                                        if (corpMembers.length === 0) {
                                            return (
                                                <div className="p-4 pl-12 text-sm text-gray-500">
                                                    No members found
                                                </div>
                                            );
                                        }
                                        
                                        return (
                                            <div className="bg-white pl-12 pr-4 py-4 space-y-3">
                                                {corpMembers.map((member: MemberRow) => {
                                                    const companyTeamInfo = memberCompanyTeamMap.get(member.uuid);
                                                    const companyName = companyTeamInfo?.company || company.name || "—";
                                                    const teamName = companyTeamInfo?.team || "—";
                                                    const role = companyTeamInfo?.role || member.role || "—";
                                                    
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
                                })}
                                            </div>
                                        );
                                    })()
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

