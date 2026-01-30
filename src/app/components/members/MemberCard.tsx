import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { MemberRow } from "./types";
import { displayNameFor } from "./utils";

interface MemberCardProps {
    member: MemberRow;
    companyName: string;
    teamName: string;
    role: string;
    onEdit: () => void;
    onMove: () => void;
    onDeactivate: () => void;
}

// Icon Components
const ShieldIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
);

const UserIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

const EyeIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);

const Building2Icon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
);

const UsersRoundIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
);

const CopyIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
);

const EditIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
);

const MoreVerticalIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
    </svg>
);

const UsersIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
);

const UserXIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    </svg>
);

export function MemberCard({
    member,
    companyName,
    teamName,
    role,
    onEdit,
    onMove,
    onDeactivate,
}: MemberCardProps) {
    const navigate = useNavigate();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const dropdownButtonRef = useRef<HTMLButtonElement>(null);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
    const displayName = displayNameFor(member);
    const status = member.active ? "Active" : "Inactive";

    useEffect(() => {
        if (dropdownOpen && dropdownButtonRef.current) {
            const rect = dropdownButtonRef.current.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + 8,
                right: window.innerWidth - rect.right,
            });
        }
    }, [dropdownOpen]);

    const getInitials = (name: string) => {
        const parts = name.trim().split(" ").filter((n) => n.length > 0);
        if (parts.length === 0) return "?";
        if (parts.length === 1) return parts[0][0].toUpperCase();
        // First initial and last initial
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    const formatDate = (dateString: string | null | undefined): string => {
        if (!dateString) return "—";
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
        } catch {
            return dateString;
        }
    };

    const getRoleDisplay = (rolePath: string) => {
        // Extract the role name from path like "/CORPORATE/ADMIN" or just "ADMIN"
        const roleName = rolePath.split("/").pop()?.toUpperCase() || rolePath.toUpperCase();

        const roleConfig: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; className: string }> = {
            OWNER: {
                label: "Owner",
                icon: ShieldIcon,
                className: "bg-amber-100 text-amber-700 border-amber-200",
            },
            ADMIN: {
                label: "Admin",
                icon: ShieldIcon,
                className: "bg-purple-100 text-purple-700 border-purple-200",
            },
            MEMBER: {
                label: "Member",
                icon: UserIcon,
                className: "bg-blue-100 text-blue-700 border-blue-200",
            },
            VIEWER: {
                label: "Viewer",
                icon: EyeIcon,
                className: "bg-gray-100 text-gray-700 border-gray-200",
            },
        };

        return roleConfig[roleName] || {
            label: roleName,
            icon: UserIcon,
            className: "bg-gray-100 text-gray-700 border-gray-200",
        };
    };

    const roleDisplay = getRoleDisplay(role);
    const RoleIcon = roleDisplay.icon;

    const handleCopyId = async () => {
        const idToCopy = member.federatedId || member.uuid;
        try {
            await navigator.clipboard.writeText(idToCopy);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy ID:", err);
        }
    };

    const handleViewProfile = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigate(`/user/${member.uuid}`);
    };

    return (
        <div className={`bg-white border rounded-lg p-4 hover:shadow-md transition-shadow ${
            !member.active ? "opacity-75 border-red-200" : ""
        }`}
        >
            <div className="flex items-start justify-between gap-4">
                {/* Left section: Avatar and Info */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                    {/* Avatar */}
                    <div 
                        className={`h-12 w-12 flex-shrink-0 rounded-full flex items-center justify-center text-white font-semibold text-sm relative cursor-pointer hover:opacity-80 transition-opacity ${
                            member.active 
                                ? "bg-gradient-to-br from-green-700 to-green-400" 
                                : "bg-gradient-to-br from-gray-400 to-gray-500"
                        }`}
                        onClick={handleViewProfile}
                        title="View Profile"
                    >
                        {member.profilePicture ? (
                            <img 
                                src={member.profilePicture} 
                                alt={displayName}
                                className="h-full w-full rounded-full object-cover"
                            />
                        ) : (
                            <>
                                {getInitials(displayName)}
                                {!member.active && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-gray-600/50 rounded-full">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Name, Role, Company, Team */}
                    <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 
                                className="font-semibold truncate cursor-pointer hover:text-blue-600 transition-colors"
                                onClick={handleViewProfile}
                                title="View Profile"
                            >
                                {displayName}
                            </h3>
                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border ${roleDisplay.className}`}>
                                <RoleIcon className="h-3 w-3" />
                                {roleDisplay.label}
                            </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                            <div className="flex items-center gap-1.5 text-gray-600">
                                <Building2Icon className="h-3.5 w-3.5 flex-shrink-0" />
                                <span className="truncate">{companyName || "—"}</span>
                            </div>
                            <span className="text-gray-300">•</span>
                            <div className="flex items-center gap-1.5 text-gray-600">
                                <UsersRoundIcon className="h-3.5 w-3.5 flex-shrink-0" />
                                <span className="truncate">{teamName || "—"}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Middle section: Email only */}
                <div className="hidden lg:flex flex-1 min-w-0">
                    <div className="w-full">
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="text-sm truncate">{member.email || "—"}</p>
                    </div>
                </div>

                {/* Right section: Status and Actions */}
                <div className="flex items-center gap-3">
                    {/* Status Badge */}
                    <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            status === "Active"
                                ? "bg-green-100 text-black hover:bg-green-100"
                                : "bg-red-100 text-red-700 hover:bg-red-100"
                        }`}
                    >
                        {status === "Active" ? (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        ) : (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        )}
                        {status}
                    </span>

                    <button
                        type="button"
                        onClick={onEdit}
                        className="px-3 py-1.5 rounded-md text-xs font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center gap-1.5"
                    >
                        <EditIcon className="h-3.5 w-3.5" />
                        Edit Profile
                    </button>

                    {/* More Actions Dropdown */}
                    <div className="relative">
                        <button
                            ref={dropdownButtonRef}
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                            title="More actions"
                        >
                            <MoreVerticalIcon className="h-4 w-4" />
                        </button>

                        {dropdownOpen && createPortal(
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setDropdownOpen(false)}
                                />
                                <div 
                                    className="fixed w-48 border border-gray-200 rounded-lg shadow-xl z-[100] bg-white"
                                    style={{ 
                                        top: `${dropdownPosition.top}px`,
                                        right: `${dropdownPosition.right}px`,
                                        backgroundColor: "#ffffff",
                                    }}
                                >
                                    <div className="py-1 bg-white">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/user/${member.uuid}`);
                                                setDropdownOpen(false);
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                        >
                                            <UserIcon className="h-4 w-4" />
                                            View Profile
                                        </button>
                                        <div className="border-t my-1" />
                                        <button
                                            onClick={() => {
                                                handleCopyId();
                                                setDropdownOpen(false);
                                            }}
                                            className="xl:hidden w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                        >
                                            <CopyIcon className="h-4 w-4" />
                                            Copy ID
                                        </button>
                                        <button
                                            onClick={() => {
                                                onEdit();
                                                setDropdownOpen(false);
                                            }}
                                            className="xl:hidden w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                        >
                                            <EditIcon className="h-4 w-4" />
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => {
                                                onMove();
                                                setDropdownOpen(false);
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                        >
                                            <UsersIcon className="h-4 w-4" />
                                            Move Teams
                                        </button>
                                        <div className="border-t my-1" />
                                        <button
                                            onClick={() => {
                                                onDeactivate();
                                                setDropdownOpen(false);
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm text-white flex items-center gap-2 hover:opacity-90 transition-opacity"
                                            style={{ backgroundColor: "#064126" }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = "#052a1a";
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = "#064126";
                                            }}
                                        >
                                            {member.active ? (
                                                <>
                                            <UserXIcon className="h-4 w-4" />
                                            Deactivate
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v6m3-3h-6m-3-3v6m-3-3h6" />
                                                    </svg>
                                                    Activate
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </>,
                            document.body
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Email - shown on small screens */}
            <div className="lg:hidden mt-3 pt-3 border-t">
                <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="text-sm">{member.email || "—"}</p>
                </div>
            </div>
        </div>
    );
}
