import { useEffect, useState } from "react";
import Modal from "../modal";
import { MemberRow } from "./types";
import { useMutation } from "@apollo/client/react";
import { UPDATE_MEMBER_INFORMATION } from "../../graphql/mutations";
import { HiOutlineUser, HiOutlineMail, HiOutlinePhone, HiOutlineLocationMarker } from "react-icons/hi";

// Target icon component
const TargetIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" strokeWidth="2"/>
        <circle cx="12" cy="12" r="6" strokeWidth="2"/>
        <circle cx="12" cy="12" r="2" strokeWidth="2"/>
    </svg>
);

export function EditUserModal({ 
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
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [preferredName, setPreferredName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [address, setAddress] = useState("");
    const [restrictionsInput, setRestrictionsInput] = useState("");
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [pendingUpdateData, setPendingUpdateData] = useState<any>(null);
    
    // Track original values to detect changes
    const [originalValues, setOriginalValues] = useState({
        firstName: "",
        lastName: "",
        preferredName: "",
        phoneNumber: "",
        address: "",
        restrictions: "",
    });

    const [updateMember, { loading: updating }] = useMutation(UPDATE_MEMBER_INFORMATION, {
        refetchQueries: ["GetAllMembers", "GetMemberDetails"],
        onCompleted: () => {
            setShowConfirmation(false);
            setPendingUpdateData(null);
            onClose();
            // Trigger success callback if provided
            if (onSuccess) {
                onSuccess();
            }
        },
        onError: (error) => {
            console.error("Error updating member:", error);
            alert("Failed to update member. Please try again.");
            setShowConfirmation(false);
        }
    });

    // Update form when member changes
    useEffect(() => {
        if (member) {
            const firstNameValue = member.firstName || "";
            const lastNameValue = member.lastName || "";
            const preferredNameValue = member.preferredName || "";
            const phoneValue = member.phone || "";
            const addressValue = ""; // Address would need to be fetched from member details if needed
            const restrictionsValue = Array.isArray(member.restrictions)
                ? member.restrictions.join(", ")
                : "";
            
            setFirstName(firstNameValue);
            setLastName(lastNameValue);
            setPreferredName(preferredNameValue);
            setPhoneNumber(phoneValue);
            setAddress(addressValue);
            setRestrictionsInput(restrictionsValue);
            
            // Store original values for comparison
            setOriginalValues({
                firstName: firstNameValue,
                lastName: lastNameValue,
                preferredName: preferredNameValue,
                phoneNumber: phoneValue,
                address: addressValue,
                restrictions: restrictionsValue,
            });
        }
    }, [member]);
    
    // Check if any values have changed
    const hasChanges = () => {
        return (
            firstName.trim() !== originalValues.firstName.trim() ||
            lastName.trim() !== originalValues.lastName.trim() ||
            preferredName.trim() !== originalValues.preferredName.trim() ||
            phoneNumber.trim() !== originalValues.phoneNumber.trim() ||
            address.trim() !== originalValues.address.trim() ||
            restrictionsInput.trim() !== originalValues.restrictions.trim()
        );
    };

    const prepareUpdateData = () => {
        // Parse address if provided - try to parse comma-separated values
        // Expected format: "123 Main St, Suite 100, City, State, ZIP" (5 parts)
        // or "123 Main St, City, State, ZIP" (4 parts)
        let addressInput = undefined;
        if (address.trim()) {
            const addressParts = address.split(",").map((s) => s.trim());
            if (addressParts.length >= 5) {
                // 5 parts: addressLine1, addressLine2, city, state, zip
                addressInput = {
                    addressLine1: addressParts[0] || "",
                    addressLine2: addressParts[1] || "",
                    city: addressParts[2] || "",
                    state: addressParts[3] || "",
                    zip: addressParts[4] || "",
                };
            } else if (addressParts.length === 4) {
                // 4 parts: addressLine1, city, state, zip (no addressLine2)
                addressInput = {
                    addressLine1: addressParts[0] || "",
                    city: addressParts[1] || "",
                    state: addressParts[2] || "",
                    zip: addressParts[3] || "",
                };
            } else {
                // If format doesn't match, just use the whole string as addressLine1
                addressInput = {
                    addressLine1: address.trim(),
                };
            }
        }

        const updateData: any = {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            phone: phoneNumber.trim(),
        };

        // Only include preferredName if it's not empty
        if (preferredName.trim()) {
            updateData.preferredName = preferredName.trim();
        }

        // Only include address if provided
        if (addressInput) {
            updateData.address = addressInput;
        }

        const restrictionsList = restrictionsInput
            .split(",")
            .map((entry) => entry.trim())
            .filter(Boolean);
        if (
            restrictionsInput.trim() !== originalValues.restrictions.trim()
        ) {
            updateData.restrictions = restrictionsList;
        }

        return updateData;
    };

    const handleSave = () => {
        if (!member) return;

        // Check if anything has changed
        if (!hasChanges()) {
            alert("No changes detected. Please make changes before saving.");
            return;
        }

        // Validate required fields
        if (!firstName.trim() || !lastName.trim() || !phoneNumber.trim()) {
            alert("Please fill in all required fields.");
            return;
        }

        const updateData = prepareUpdateData();
        setPendingUpdateData(updateData);
        setShowConfirmation(true);
    };

    const handleConfirmUpdate = () => {
        if (!member || !pendingUpdateData) return;

        updateMember({
            variables: {
                uuid: member.uuid,
                information: pendingUpdateData,
            }
        });
    };

    const handleGoBack = () => {
        setShowConfirmation(false);
        setPendingUpdateData(null);
    };

    const formatAddress = (addressInput: any): string => {
        if (!addressInput) return "—";
        const parts = [];
        if (addressInput.addressLine1) parts.push(addressInput.addressLine1);
        if (addressInput.addressLine2) parts.push(addressInput.addressLine2);
        if (addressInput.city) parts.push(addressInput.city);
        if (addressInput.state) parts.push(addressInput.state);
        if (addressInput.zip) parts.push(addressInput.zip);
        return parts.length > 0 ? parts.join(", ") : address || "—";
    };

    if (!member) return null;

    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    const displayAddress = pendingUpdateData?.address ? formatAddress(pendingUpdateData.address) : (address || "—");
    const displayRestrictions = pendingUpdateData?.restrictions
        ? (pendingUpdateData.restrictions.length > 0 ? pendingUpdateData.restrictions.join(", ") : "N/A")
        : (restrictionsInput.trim() || "N/A");

    return (
        <>
            {/* Show confirmation modal */}
            {showConfirmation ? (
                <Modal
                    open={open}
                    onClose={handleGoBack}
                    title={
                        <span className="text-xl font-semibold">Confirm Member Update</span>
                    }
                    showCloseButton={false}
                    size="md"
                >
                    <div className="space-y-4">
                        <div className="text-sm text-gray-600 mb-4">
                            Please review the updated member information before confirming.
                        </div>

                        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
                            <div className="flex items-start gap-3">
                                <HiOutlineUser className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm text-gray-500">Full Name</div>
                                    <div className="text-base font-semibold text-gray-900">{fullName}</div>
                                </div>
                            </div>

                            {preferredName.trim() && (
                                <div className="flex items-start gap-3">
                                    <TargetIcon className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm text-gray-500">Preferred Name</div>
                                        <div className="text-base font-semibold text-gray-900">{preferredName.trim()}</div>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-start gap-3">
                                <HiOutlineMail className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm text-gray-500">Email</div>
                                    <div className="text-base font-semibold text-gray-900">{member.email}</div>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <HiOutlinePhone className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm text-gray-500">Phone Number</div>
                                    <div className="text-base font-semibold text-gray-900">{phoneNumber.trim()}</div>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <HiOutlineLocationMarker className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm text-gray-500">Address</div>
                                    <div className="text-base font-semibold text-gray-900">{displayAddress}</div>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <HiOutlineLocationMarker className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm text-gray-500">Dietary Restrictions</div>
                                    <div className="text-base font-semibold text-gray-900">{displayRestrictions}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={handleGoBack}
                            disabled={updating}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Go Back
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirmUpdate}
                            disabled={updating}
                            className="px-4 py-2 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                                backgroundColor: "#064126",
                            }}
                            onMouseEnter={(e) => {
                                if (!updating) {
                                    e.currentTarget.style.backgroundColor = "#052a1a";
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!updating) {
                                    e.currentTarget.style.backgroundColor = "#064126";
                                }
                            }}
                        >
                            {updating ? "Updating..." : "Confirm Update"}
                        </button>
                    </div>
                </Modal>
            ) : (
                /* Show edit form modal */
        <Modal
            open={open}
            onClose={onClose}
            title={
                <span className="text-xl font-semibold">Edit Member</span>
            }
            showCloseButton={false}
            size="md"
        >
            <div className="space-y-4">
                <div className="text-sm text-gray-600 mb-4">
                    Update member information. Email: {member.email}
                </div>

                <div className="grid grid-cols-2 gap-4">
                <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            First Name <span className="text-red-500">*</span>
                        </label>
                    <input
                        type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter first name"
                    />
                </div>

                <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Last Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter last name"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Preferred Name (Optional)
                    </label>
                    <input
                        type="text"
                        value={preferredName}
                        onChange={(e) => setPreferredName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter preferred name"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                        If different from first name, this will be used in communications
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="+1 (555) 123-4567"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Address (Optional)
                    </label>
                    <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="123 Main Street, Suite 100, City, State, ZIP"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Dietary Restrictions (Optional)
                    </label>
                    <input
                        type="text"
                        value={restrictionsInput}
                        onChange={(e) => setRestrictionsInput(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g. Vegan, No Dairy, Gluten-Free"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                        Separate multiple restrictions with commas.
                    </p>
                </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
                <button
                    type="button"
                    onClick={onClose}
                    disabled={updating}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={updating || !hasChanges()}
                    className="px-4 py-2 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                        backgroundColor: hasChanges() && !updating ? "#064126" : "#9ca3af",
                    }}
                    onMouseEnter={(e) => {
                        if (!updating && hasChanges()) {
                            e.currentTarget.style.backgroundColor = "#052a1a";
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (!updating && hasChanges()) {
                            e.currentTarget.style.backgroundColor = "#064126";
                        }
                    }}
                    title={!hasChanges() ? "No changes to save" : ""}
                >
                    {updating ? "Saving..." : "Save Changes"}
                </button>
            </div>
        </Modal>
            )}
        </>
    );
}

