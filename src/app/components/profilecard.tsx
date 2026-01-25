import React, { useState } from "react";
import type { Profile } from "../../../types/types.ts";
import { logout } from "../../keycloak";

interface ProfileCardProps {
    profile: Profile;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({ profile }) => {
    const [open, setOpen] = useState(false);
    const initials = [profile.firstname, profile.lastname]
        .filter(Boolean)
        .map((part) => part[0]?.toUpperCase())
        .join("")
        .slice(0, 2);

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                className="flex items-center space-x-4 hover:opacity-90 transition-opacity"
                title="Profile menu"
            >
                {profile.image ? (
                    <img
                        src={profile.image}
                        alt={`${profile.firstname} ${profile.lastname}`}
                        className="w-10 h-10 rounded-full object-cover"
                    />
                ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-sm font-semibold">
                        {initials || "U"}
                    </div>
                )}
                <div>
                    <p className="text-lg font-semibold">
                        {profile.firstname} {profile.lastname}
                    </p>
                </div>
            </button>

            {open && (
                <>
                    <button
                        type="button"
                        className="fixed inset-0 z-10 cursor-default"
                        onClick={() => setOpen(false)}
                        aria-label="Close profile menu"
                    />
                    <div className="absolute right-0 mt-2 w-40 rounded-md border border-gray-200 bg-white shadow-lg z-20">
                        <button
                            type="button"
                            onClick={logout}
                            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                            Log out
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};
