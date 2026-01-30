import { useMemo, useState } from "react";
import { useMutation } from "@apollo/client/react";
import Modal from "../modal";
import { CREATE_CORPORATE_MEMBER_ADMIN } from "../../graphql/mutations";
import type { Corporation } from "./types";

type AddMemberModalProps = {
    open: boolean;
    onClose: () => void;
    corporations: Corporation[];
    onSuccess?: () => void;
};

export function AddMemberModal({ open, onClose, corporations, onSuccess }: AddMemberModalProps) {
    const [companyUuid, setCompanyUuid] = useState("");
    const [companyName, setCompanyName] = useState("");
    const [teamUuid, setTeamUuid] = useState("");
    const [teamName, setTeamName] = useState("");
    const [showCompanySuggestions, setShowCompanySuggestions] = useState(false);
    const [showTeamSuggestions, setShowTeamSuggestions] = useState(false);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [phoneCountryCode, setPhoneCountryCode] = useState("+1");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [showCountryDropdown, setShowCountryDropdown] = useState(false);
    const [countrySearch, setCountrySearch] = useState("");
    const [addressLine1, setAddressLine1] = useState("");
    const [addressLine2, setAddressLine2] = useState("");
    const [city, setCity] = useState("");
    const [state, setState] = useState("");
    const [zip, setZip] = useState("");
    const [country, setCountry] = useState("");
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showReview, setShowReview] = useState(false);

    const countryCodes = [
        { code: "+1", country: "United States", flag: "🇺🇸" },
        { code: "+1", country: "Canada", flag: "🇨🇦" },
        { code: "+44", country: "United Kingdom", flag: "🇬🇧" },
        { code: "+61", country: "Australia", flag: "🇦🇺" },
        { code: "+49", country: "Germany", flag: "🇩🇪" },
        { code: "+33", country: "France", flag: "🇫🇷" },
        { code: "+34", country: "Spain", flag: "🇪🇸" },
        { code: "+39", country: "Italy", flag: "🇮🇹" },
        { code: "+31", country: "Netherlands", flag: "🇳🇱" },
        { code: "+46", country: "Sweden", flag: "🇸🇪" },
        { code: "+47", country: "Norway", flag: "🇳🇴" },
        { code: "+45", country: "Denmark", flag: "🇩🇰" },
        { code: "+41", country: "Switzerland", flag: "🇨🇭" },
        { code: "+43", country: "Austria", flag: "🇦🇹" },
        { code: "+32", country: "Belgium", flag: "🇧🇪" },
        { code: "+351", country: "Portugal", flag: "🇵🇹" },
        { code: "+353", country: "Ireland", flag: "🇮🇪" },
        { code: "+64", country: "New Zealand", flag: "🇳🇿" },
        { code: "+81", country: "Japan", flag: "🇯🇵" },
        { code: "+82", country: "South Korea", flag: "🇰🇷" },
        { code: "+86", country: "China", flag: "🇨🇳" },
        { code: "+91", country: "India", flag: "🇮🇳" },
        { code: "+65", country: "Singapore", flag: "🇸🇬" },
        { code: "+852", country: "Hong Kong", flag: "🇭🇰" },
        { code: "+971", country: "UAE", flag: "🇦🇪" },
        { code: "+972", country: "Israel", flag: "🇮🇱" },
        { code: "+27", country: "South Africa", flag: "🇿🇦" },
        { code: "+55", country: "Brazil", flag: "🇧🇷" },
        { code: "+52", country: "Mexico", flag: "🇲🇽" },
        { code: "+54", country: "Argentina", flag: "🇦🇷" },
    ];

    const filteredCountryCodes = useMemo(() => {
        const q = countrySearch.trim().toLowerCase();
        if (!q) return countryCodes;
        return countryCodes.filter(
            (cc) =>
                cc.country.toLowerCase().includes(q) ||
                cc.code.toLowerCase().includes(q)
        );
    }, [countrySearch]);

    const formatPhoneNumber = (value: string): string => {
        const digits = value.replace(/\D/g, "");
        if (phoneCountryCode !== "+1") return value.replace(/[^\d\s\-\(\)\+]/g, "");
        if (digits.length <= 3) return digits;
        if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    };

    const selectedCompany = useMemo(
        () => corporations.find((corp) => corp.uuid === companyUuid) || null,
        [corporations, companyUuid]
    );
    const availableTeams = selectedCompany?.teams || [];
    const filteredCompanies = useMemo(() => {
        const query = companyName.trim().toLowerCase();
        if (!query) return corporations;
        return corporations.filter((corp) => corp.name.toLowerCase().includes(query));
    }, [companyName, corporations]);
    const filteredTeams = useMemo(() => {
        const query = teamName.trim().toLowerCase();
        if (!query) return availableTeams;
        return availableTeams.filter((team) => team.name.toLowerCase().includes(query));
    }, [teamName, availableTeams]);
    const hasTeams = availableTeams.length > 0;

    const [createCorporateMemberAdmin] = useMutation(CREATE_CORPORATE_MEMBER_ADMIN, {
        errorPolicy: "all",
    });

    const resetForm = () => {
        setCompanyUuid("");
        setTeamUuid("");
        setCompanyName("");
        setTeamName("");
        setFirstName("");
        setLastName("");
        setEmail("");
        setPhoneCountryCode("+1");
        setPhoneNumber("");
        setShowCountryDropdown(false);
        setCountrySearch("");
        setAddressLine1("");
        setAddressLine2("");
        setCity("");
        setState("");
        setZip("");
        setCountry("");
        setErrors({});
        setIsSubmitting(false);
        setShowReview(false);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const validateForm = () => {
        const nextErrors: Record<string, string> = {};
        const phoneDigits = phoneNumber.replace(/\D/g, "");

        if (!companyUuid && !companyName.trim()) nextErrors.companyUuid = "Company is required";
        if (!firstName.trim()) nextErrors.firstName = "First name is required";
        if (!lastName.trim()) nextErrors.lastName = "Last name is required";
        if (!email.trim()) {
            nextErrors.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            nextErrors.email = "Please enter a valid email address";
        }
        if (!phoneDigits || phoneDigits.length < 7) {
            nextErrors.phone = "Phone number is required";
        }
        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        setShowReview(true);
    };

    const handleConfirm = async () => {
        setIsSubmitting(true);
        setErrors({});

        try {
            const result = await createCorporateMemberAdmin({
                variables: {
                    input: {
                        firstName: firstName.trim(),
                        lastName: lastName.trim(),
                        email: email.trim().toLowerCase(),
                        phone: `${phoneCountryCode} ${phoneNumber.replace(/\D/g, "")}`.trim(),
                        corporationUuid: companyUuid || undefined,
                        corporationName: companyUuid ? undefined : companyName.trim() || undefined,
                        teamUuid: teamUuid || undefined,
                        teamName: teamUuid ? undefined : teamName.trim() || undefined,
                        address: {
                            addressLine1: addressLine1.trim() || undefined,
                            addressLine2: addressLine2.trim() || undefined,
                            city: city.trim() || undefined,
                            state: state.trim() || undefined,
                            country: country.trim() || undefined,
                            zip: zip.trim() || undefined,
                        },
                    },
                },
            });

            const success = (result.data as any)?.createCorporateMemberAdmin;
            if (!success) {
                setErrors({
                    submit: "Failed to create member. Please try again.",
                });
                return;
            }
            onSuccess?.();
            handleClose();
        } catch (error: any) {
            setErrors({
                submit: error.message || "Failed to create member.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBackToForm = () => {
        setShowReview(false);
    };

    return (
        <Modal
            open={open}
            onClose={handleClose}
            showCloseButton={false}
            size="md"
            title={
                <div className="flex-1">
                    <div className="text-xl font-semibold">
                        {showReview ? "Review Member" : "Add Member"}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                        {showReview
                            ? "Confirm the details before creating the member."
                            : "Assign a company and optionally a team."}
                    </div>
                </div>
            }
        >
            {showReview ? (
                <div className="space-y-6">
                    <div className="bg-gray-50 rounded-lg p-5 space-y-4">
                        <div>
                            <div className="text-sm font-medium text-gray-600">Company</div>
                            <div className="text-sm text-gray-900 mt-1">
                                {companyUuid ? selectedCompany?.name : companyName || "—"}
                            </div>
                        </div>
                        <div>
                            <div className="text-sm font-medium text-gray-600">Team</div>
                            <div className="text-sm text-gray-900 mt-1">
                                {teamUuid
                                    ? availableTeams.find((t) => t.uuid === teamUuid)?.name
                                    : teamName || "—"}
                            </div>
                        </div>
                        <div>
                            <div className="text-sm font-medium text-gray-600">Member</div>
                            <div className="text-sm text-gray-900 mt-1">
                                {firstName} {lastName}
                            </div>
                            <div className="text-sm text-gray-900 mt-1">{email}</div>
                            <div className="text-sm text-gray-900 mt-1">
                                {phoneCountryCode} {phoneNumber}
                            </div>
                        </div>
                        {(addressLine1 || addressLine2 || city || state || zip || country) && (
                            <div>
                                <div className="text-sm font-medium text-gray-600">Address</div>
                                <div className="text-sm text-gray-900 mt-1">
                                    {[addressLine1, addressLine2].filter(Boolean).join(", ")}
                                </div>
                                <div className="text-sm text-gray-900 mt-1">
                                    {[city, state, zip].filter(Boolean).join(", ")}
                                </div>
                                {country && (
                                    <div className="text-sm text-gray-900 mt-1">{country}</div>
                                )}
                            </div>
                        )}
                    </div>

                    {errors.submit && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-600">{errors.submit}</p>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={handleBackToForm}
                            disabled={isSubmitting}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Back
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirm}
                            disabled={isSubmitting}
                            className="px-4 py-2 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            style={{ backgroundColor: "#064126" }}
                            onMouseEnter={(e) => {
                                if (!e.currentTarget.disabled) {
                                    e.currentTarget.style.backgroundColor = "#052a1a";
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!e.currentTarget.disabled) {
                                    e.currentTarget.style.backgroundColor = "#064126";
                                }
                            }}
                        >
                            {isSubmitting ? "Creating member..." : "Confirm & Create"}
                        </button>
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-6 pb-2">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Company <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={companyName}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setCompanyName(value);
                                    setShowCompanySuggestions(true);
                                    if (value.trim()) {
                                        setCompanyUuid("");
                                        setTeamUuid("");
                                        setTeamName("");
                                    }
                                }}
                                onFocus={() => setShowCompanySuggestions(true)}
                                onBlur={() => {
                                    const match = corporations.find(
                                        (corp) => corp.name.toLowerCase() === companyName.trim().toLowerCase()
                                    );
                                    if (match) {
                                        setCompanyUuid(match.uuid);
                                        setCompanyName(match.name);
                                    }
                                    setTimeout(() => setShowCompanySuggestions(false), 150);
                                }}
                                className={`w-full px-3 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-gray-700 ${
                                    errors.companyUuid ? "border-red-500" : "border-gray-300"
                                }`}
                                placeholder="Type company name..."
                            />
                            {showCompanySuggestions && filteredCompanies.length > 0 && (
                                <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg max-h-56 overflow-auto">
                                    {filteredCompanies.map((corp) => (
                                        <button
                                            key={corp.uuid}
                                            type="button"
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                setCompanyUuid(corp.uuid);
                                                setCompanyName(corp.name);
                                                setShowCompanySuggestions(false);
                                                setTeamUuid("");
                                                setTeamName("");
                                            }}
                                            className="w-full text-left px-3 py-2 hover:bg-gray-50"
                                        >
                                            {corp.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        {errors.companyUuid && (
                            <p className="mt-1 text-sm text-red-500">{errors.companyUuid}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Team <span className="text-gray-400">(Optional)</span>
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={teamName}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setTeamName(value);
                                    setShowTeamSuggestions(true);
                                    if (value.trim()) {
                                        setTeamUuid("");
                                    }
                                }}
                                onFocus={() => setShowTeamSuggestions(true)}
                                onBlur={() => {
                                    const match = availableTeams.find(
                                        (team) => team.name.toLowerCase() === teamName.trim().toLowerCase()
                                    );
                                    if (match) {
                                        setTeamUuid(match.uuid);
                                        setTeamName(match.name);
                                    }
                                    setTimeout(() => setShowTeamSuggestions(false), 150);
                                }}
                                disabled={!companyUuid || !hasTeams}
                                className="w-full px-3 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-gray-700 border-gray-300 disabled:opacity-60 disabled:cursor-not-allowed"
                                placeholder={
                                    !companyUuid
                                        ? "Select a company first"
                                        : !hasTeams
                                        ? "No teams available"
                                        : "Type team name (optional)..."
                                }
                            />
                            {showTeamSuggestions && filteredTeams.length > 0 && companyUuid && hasTeams && (
                                <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg max-h-56 overflow-auto">
                                    {filteredTeams.map((team) => (
                                        <button
                                            key={team.uuid}
                                            type="button"
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                setTeamUuid(team.uuid);
                                                setTeamName(team.name);
                                                setShowTeamSuggestions(false);
                                            }}
                                            className="w-full text-left px-3 py-2 hover:bg-gray-50"
                                        >
                                            {team.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
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
                                className={`w-full px-3 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-gray-700 ${
                                    errors.firstName ? "border-red-500" : "border-gray-300"
                                }`}
                                placeholder="Jane"
                            />
                            {errors.firstName && (
                                <p className="mt-1 text-sm text-red-500">{errors.firstName}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Last Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                className={`w-full px-3 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-gray-700 ${
                                    errors.lastName ? "border-red-500" : "border-gray-300"
                                }`}
                                placeholder="Doe"
                            />
                            {errors.lastName && (
                                <p className="mt-1 text-sm text-red-500">{errors.lastName}</p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Email <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={`w-full px-3 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-gray-700 ${
                                    errors.email ? "border-red-500" : "border-gray-300"
                                }`}
                                placeholder="jane@company.com"
                            />
                            {errors.email && (
                                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Phone <span className="text-red-500">*</span>
                            </label>
                            <div className="flex gap-2 items-stretch">
                                <div className="relative w-28 flex-shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => setShowCountryDropdown((open) => !open)}
                                        className="w-full h-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-left focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-gray-800 flex items-center justify-between"
                                    >
                                        <span className="flex items-center gap-2 truncate">
                                            <span>
                                                {countryCodes.find((cc) => cc.code === phoneCountryCode)?.flag || "🌐"}
                                            </span>
                                            <span className="truncate">{phoneCountryCode}</span>
                                        </span>
                                        <span className="text-gray-500">▾</span>
                                    </button>
                                    {showCountryDropdown && (
                                        <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg max-h-64 overflow-auto">
                                            <div className="p-2 border-b border-gray-100">
                                                <input
                                                    type="text"
                                                    value={countrySearch}
                                                    onChange={(e) => setCountrySearch(e.target.value)}
                                                    placeholder="Search country..."
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-gray-800"
                                                />
                                            </div>
                                            {filteredCountryCodes.map((cc, idx) => (
                                                <button
                                                    key={`${cc.country}-${cc.code}-${idx}`}
                                                    type="button"
                                                    onMouseDown={(e) => {
                                                        e.preventDefault();
                                                        setPhoneCountryCode(cc.code);
                                                        setShowCountryDropdown(false);
                                                        setCountrySearch("");
                                                    }}
                                                    className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm"
                                                >
                                                    <span>{cc.flag}</span>
                                                    <span className="flex-1 truncate">{cc.country}</span>
                                                    <span className="text-gray-600">{cc.code}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <input
                                        type="tel"
                                        value={phoneNumber}
                                        onChange={(e) => {
                                            const formatted = formatPhoneNumber(e.target.value);
                                            setPhoneNumber(formatted);
                                        }}
                                        className={`w-full h-full px-3 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-gray-700 ${
                                            errors.phone ? "border-red-500" : "border-gray-300"
                                        }`}
                                        placeholder={phoneCountryCode === "+1" ? "(555) 123-4567" : "1234567890"}
                                        maxLength={phoneCountryCode === "+1" ? 14 : 20}
                                    />
                                </div>
                            </div>
                            {errors.phone && (
                                <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
                            )}
                        </div>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Address <span className="text-gray-400">(Optional)</span>
                        </label>
                        <div className="space-y-3">
                            <input
                                type="text"
                                value={addressLine1}
                                onChange={(e) => setAddressLine1(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-gray-700 border-gray-300"
                                placeholder="Address Line 1"
                            />
                            <input
                                type="text"
                                value={addressLine2}
                                onChange={(e) => setAddressLine2(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-gray-700 border-gray-300"
                                placeholder="Address Line 2"
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <input
                                    type="text"
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-gray-700 border-gray-300"
                                    placeholder="City"
                                />
                                <input
                                    type="text"
                                    value={state}
                                    onChange={(e) => setState(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-gray-700 border-gray-300"
                                    placeholder="State"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <input
                                    type="text"
                                    value={zip}
                                    onChange={(e) => setZip(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-gray-700 border-gray-300"
                                    placeholder="ZIP"
                                />
                                <input
                                    type="text"
                                    value={country}
                                    onChange={(e) => setCountry(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-gray-700 border-gray-300"
                                    placeholder="Country"
                                />
                            </div>
                        </div>
                    </div>

                    {errors.submit && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-600">{errors.submit}</p>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={isSubmitting}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-2 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            style={{ backgroundColor: "#064126" }}
                            onMouseEnter={(e) => {
                                if (!e.currentTarget.disabled) {
                                    e.currentTarget.style.backgroundColor = "#052a1a";
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!e.currentTarget.disabled) {
                                    e.currentTarget.style.backgroundColor = "#064126";
                                }
                            }}
                        >
                            {isSubmitting ? "Reviewing..." : "Review & Confirm"}
                        </button>
                    </div>
                </form>
            )}
        </Modal>
    );
}
