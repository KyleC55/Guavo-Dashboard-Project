import React from "react";
import type { Profile } from "../../../types/types.ts";

interface ProfileCardProps {
    profile: Profile;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({ profile }) => {
    return (
        <div className="flex items-center space-x-4">
            {profile.image && (
                <img
                    src={profile.image}
                    alt={`${profile.firstname} ${profile.lastname}`}
                    className="w-10 h-10 rounded-full object-cover"
                />
            )}
            <div>
                <p className="text-lg font-semibold">
                    {profile.firstname} {profile.lastname}
                </p>
            </div>
        </div>
    );
};
