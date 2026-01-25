import { useMutation } from "@apollo/client/react";
import Modal from "../modal";
import { MemberRow } from "./types";
import { displayNameFor } from "./utils";
import { TOGGLE_MEMBER_ACTIVE } from "../../graphql/mutations";
import { GET_ALL_MEMBERS } from "../../graphql/queries";

export function DeactivateUserModal({ 
    member, 
    open, 
    onClose,
    onSuccess
}: { 
    member: MemberRow | null; 
    open: boolean; 
    onClose: () => void;
    onSuccess?: () => void;
}) {
    const isActive = member?.active ?? false;
    const action = isActive ? "deactivate" : "activate";

    const [toggleActive, { loading }] = useMutation(TOGGLE_MEMBER_ACTIVE, {
        refetchQueries: [
            { 
                query: GET_ALL_MEMBERS, 
                variables: { limit: 1000, offset: 0 },
                fetchPolicy: "network-only"
            },
        ],
        awaitRefetchQueries: true,
        onCompleted: () => {
            onClose();
            if (onSuccess) {
                onSuccess();
            }
        },
        onError: (error) => {
            console.error(`Error ${action}ing member:`, error);
            alert(`Failed to ${action} member: ${error.message || "Please try again."}`);
        }
    });


    const handleToggle = () => {
        if (!member) return;
        
        toggleActive({
            variables: {
                uuid: member.uuid,
                active: !isActive, // Toggle active status
            }
        });
    };

    if (!member) return null;

    const memberName = displayNameFor(member);

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={<span>{isActive ? 'Deactivate User' : 'Activate User'}</span>}
            showCloseButton={false}
            size="md"
        >
                    <div className="space-y-4">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <div>
                            <p className={`font-medium ${isActive ? 'text-red-900' : 'text-green-900'}`}>
                                {isActive ? 'Review Deactivation' : 'Review Activation'}
                            </p>
                            <p className={`text-sm mt-1 ${isActive ? 'text-red-700' : 'text-green-700'}`}>
                                Are you sure you want to {action} <strong>{memberName}</strong>?
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <div className="text-sm text-gray-600 mb-2">User Information:</div>
                            <div className="font-medium text-gray-900">{memberName}</div>
                            <div className="text-sm text-gray-600 mt-1">{member.role || "—"}</div>
                            <div className="text-sm text-blue-700 mt-1">{member.email}</div>
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
                    onClick={handleToggle}
                    disabled={loading}
                    className={`px-4 py-2 text-white rounded-lg transition-colors font-medium flex items-center gap-2 ${
                        isActive 
                            ? 'bg-red-600 hover:bg-red-700' 
                            : 'bg-green-600 hover:bg-green-700'
                    } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {loading ? (
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {isActive ? (
                                <>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="8.5" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
                                <line x1="23" y1="11" x2="17" y2="11" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
                                </>
                            ) : (
                                <>
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v6m3-3h-6" />
                                </>
                            )}
                            </svg>
                    )}
                    {loading ? (isActive ? 'Deactivating...' : 'Activating...') : (isActive ? 'Deactivate' : 'Activate')}
                        </button>
                    </div>
        </Modal>
    );
}

