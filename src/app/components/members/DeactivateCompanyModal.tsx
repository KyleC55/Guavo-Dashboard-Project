import { useMemo, useState } from "react";
import { useMutation } from "@apollo/client/react";
import Modal from "../modal";
import { Corporation, MemberRow, MemberTeamInfo } from "./types";
import { TOGGLE_MEMBER_ACTIVE } from "../../graphql/mutations";

export function DeactivateCompanyModal({
    company,
    members,
    memberCompanyTeamMap,
    open,
    onClose,
    onSuccess,
    action,
}: {
    company: Corporation | null;
    members: MemberRow[];
    memberCompanyTeamMap: Map<string, MemberTeamInfo>;
    open: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    action: "deactivate" | "activate";
}) {
    const [submitting, setSubmitting] = useState(false);
    const [toggleActive] = useMutation(TOGGLE_MEMBER_ACTIVE);

    const companyMembers = useMemo(() => {
        if (!company) return [];
        return members.filter((member) => {
            const info = memberCompanyTeamMap.get(member.uuid);
            return info?.company === company.name;
        });
    }, [company, members, memberCompanyTeamMap]);

    const activeMembers = useMemo(
        () => companyMembers.filter((member) => member.active),
        [companyMembers]
    );
    const inactiveMembers = useMemo(
        () => companyMembers.filter((member) => !member.active),
        [companyMembers]
    );

    const targetMembers = action === "deactivate" ? activeMembers : inactiveMembers;
    const targetActiveState = action === "activate";

    const handleToggleCompany = async () => {
        if (!company || targetMembers.length === 0 || submitting) return;

        setSubmitting(true);
        const results = await Promise.allSettled(
            targetMembers.map((member) =>
                toggleActive({
                    variables: {
                        uuid: member.uuid,
                        active: targetActiveState,
                    },
                })
            )
        );
        const failed = results.filter((r) => r.status === "rejected");
        setSubmitting(false);

        if (failed.length > 0) {
            alert(
                `Failed to ${action} ${failed.length} of ${targetMembers.length} users. Please retry.`
            );
        } else {
            onClose();
        }

        if (onSuccess) {
            onSuccess();
        }
    };

    if (!company) return null;

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={<span>{action === "deactivate" ? "Deactivate Company" : "Activate Company"}</span>}
            showCloseButton={false}
            size="md"
        >
            <div className="space-y-4">
                <div
                    className={`rounded-lg p-4 border ${
                        action === "deactivate"
                            ? "bg-red-50 border-red-200"
                            : "bg-green-50 border-green-200"
                    }`}
                >
                    <div className="flex items-start gap-3">
                        <svg
                            className={`w-6 h-6 flex-shrink-0 mt-0.5 ${
                                action === "deactivate" ? "text-red-600" : "text-green-600"
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                        </svg>
                        <div>
                            <p
                                className={`font-medium ${
                                    action === "deactivate" ? "text-red-900" : "text-green-900"
                                }`}
                            >
                                {action === "deactivate" ? "Review Deactivation" : "Review Activation"}
                            </p>
                            <p
                                className={`text-sm mt-1 ${
                                    action === "deactivate" ? "text-red-700" : "text-green-700"
                                }`}
                            >
                                This will {action} all {action === "deactivate" ? "active" : "inactive"} users in{" "}
                                <strong>{company.name}</strong>.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="text-sm text-gray-600 mb-2">Company Summary:</div>
                    <div className="font-medium text-gray-900">{company.name}</div>
                    <div className="text-sm text-gray-600 mt-1">
                        {companyMembers.length} total user{companyMembers.length !== 1 ? "s" : ""}
                    </div>
                    <div
                        className={`text-sm mt-1 ${
                            action === "deactivate" ? "text-red-700" : "text-green-700"
                        }`}
                    >
                        {targetMembers.length} {action === "deactivate" ? "active" : "inactive"} user
                        {targetMembers.length !== 1 ? "s" : ""} will be {action}d
                    </div>
                </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors font-medium"
                    disabled={submitting}
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={handleToggleCompany}
                    disabled={submitting || targetMembers.length === 0}
                    className={`px-4 py-2 text-white rounded-lg transition-colors font-medium flex items-center gap-2 ${
                        targetMembers.length === 0
                            ? action === "deactivate"
                                ? "bg-red-200 text-red-700"
                                : "bg-green-200 text-green-700"
                            : action === "deactivate"
                            ? "bg-red-600 hover:bg-red-700"
                            : "bg-green-600 hover:bg-green-700"
                    } ${submitting ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                    {submitting ? (
                        <svg
                            className="animate-spin h-5 w-5"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            ></circle>
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                        </svg>
                    ) : null}
                    {submitting
                        ? action === "deactivate"
                            ? "Deactivating..."
                            : "Activating..."
                        : action === "deactivate"
                        ? "Deactivate company"
                        : "Activate company"}
                </button>
            </div>
        </Modal>
    );
}
