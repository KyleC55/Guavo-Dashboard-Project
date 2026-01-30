import React, { useEffect, useMemo, useRef, useState } from "react";
import type { BookingRow } from "../../../types/types";
import { DateTime } from "luxon";
import AvailableSlots from "./AvailableSlots";
import { useMembersForBooking } from "../hooks/getmembers";
import { useMutation, useQuery } from "@apollo/client/react";
import {
    ADMIN_CREATE_BOOKING,
    ADMIN_MANUAL_BOOK_LISTED_SLOT,
} from "../graphql/mutations";
import { GET_MEMBER_TEAMS } from "../graphql/queries";
import { HiHeart, HiCake, HiBriefcase, HiAcademicCap, HiEmojiHappy } from "react-icons/hi";

const formatErrorMessage = (error: any): string => {
    const message = error?.message || error?.extensions?.message || error?.extensions?.code || "An error occurred";
    
    const errorMappings: Record<string, string> = {
        "Member not found": "The selected member could not be found. Please try selecting again or enter a different name.",
        "Team not found": "The selected team could not be found. Please try selecting again.",
        "Reservation not found": "The selected time slot is no longer available. Please select a different time.",
        "Reservation is not LISTED": "This time slot has already been booked. Please select a different time.",
        "Booking failed": "We couldn't complete your booking. Please try again.",
        "Property \"memberId\" was not found": "There was an issue with the booking. Please try again.",
    };
    
    // Check for partial matches
    for (const [key, value] of Object.entries(errorMappings)) {
        if (message.includes(key)) {
            return value;
        }
    }
    
    // If it's a GraphQL error, try to extract a more readable message
    if (message.includes("INTERNAL_SERVER_ERROR")) {
        return "Something went wrong on our end. Please try again in a moment.";
    }
    
    return message;
};

const notify = {
    success: (m: string) => {
        console.log(m);
        // Success is now handled via UI state, no alert needed
    },
    error: (m: string) => {
        console.error(m);
        const friendlyMessage = formatErrorMessage({ message: m });
        if (typeof window !== "undefined") alert(friendlyMessage);
    },
};

export type RestaurantOption = {
    value: string; // equals uuid
    label: string;
    meta?: string;
    uuid: string; // equals value
    addressLine1?: string | null;
    addressLine2?: string | null;
    cityLocation?: string | null;
};

type Props = {
    onCreate?: (data: Omit<BookingRow, "id"> & {
        restaurantUuid?: string;
        startAtISO?: string;
        partySize?: number;
    }) => void;
    onDone?: () => void;
    onCancel?: () => void;
    onBookingCreated?: () => void | Promise<void>;
    restaurantOptions?: RestaurantOption[];
    restaurantsLoading?: boolean;
};

const fmtNYDate = (isoDate: string) =>
    DateTime.fromISO(isoDate, { zone: "America/New_York" }).toFormat("ccc, LLL d");

const fmtNYDateTimeRangeLabel = (isoStart?: string, label?: string) => {
    if (isoStart) {
        const d = DateTime.fromISO(isoStart, { setZone: true }).setZone(
            "America/New_York"
        );
        if (d.isValid) return d.toFormat("ccc, LLL d • t");
    }
    return label ?? "";
};

const companyFromEmail = (email?: string | null) => {
    if (!email) return undefined;
    const domain = email.split("@")[1];
    const root = domain?.split(".")[0];
    if (!root) return undefined;
    return root.charAt(0).toUpperCase() + root.slice(1);
};

const displayNameFor = (m: any) => {
    if (!m) return "";
    if (m.firstName && m.lastName) return `${m.firstName} ${m.lastName}`;
    return m.preferredName || m.firstName || m.username || m.email || "";
};

const TIME_LABEL_TO_NY: Record<string, { hour: number; minute: number }> = {
    Breakfast: { hour: 9, minute: 0 },
    Lunch: { hour: 12, minute: 30 },
    "Early Evening": { hour: 17, minute: 30 },
    Evening: { hour: 19, minute: 0 },
    Dinner: { hour: 19, minute: 0 },
    Morning: { hour: 9, minute: 0 },
    Afternoon: { hour: 14, minute: 0 },
    "All Day": { hour: 12, minute: 0 },
};

type EventType = "Restaurant" | "Catering" | "Private Dining" | "Other";

const EVENT_CONFIG: Record<
    EventType,
    {
        guestLabel: string;
        min: number;
        max: number;
        timeOptions: string[];
        requireRestaurant: boolean;
    }
> = {
    Restaurant: {
        guestLabel: "Guests",
        min: 2,
        max: 20,
        timeOptions: ["All Day", "Breakfast", "Lunch", "Dinner"],
        requireRestaurant: true,
    },
    "Private Dining": {
        guestLabel: "Guests",
        min: 6,
        max: 60,
        timeOptions: ["All Day", "Early Evening", "Evening"],
        requireRestaurant: true,
    },
    Catering: {
        guestLabel: "Attendees",
        min: 10,
        max: 500,
        timeOptions: ["All Day", "Morning", "Afternoon", "Evening"],
        requireRestaurant: false,
    },
    Other: {
        guestLabel: "Attendees",
        min: 1,
        max: 200,
        timeOptions: ["All Day", "Morning", "Afternoon", "Evening"],
        requireRestaurant: false,
    },
};

/** Helpers to keep UI time concrete after slot pick */
const hhmmFromISO = (iso?: string) =>
    iso
        ? DateTime.fromISO(iso, { setZone: true })
            .setZone("America/New_York")
            .toFormat("HH:mm")
        : undefined;

const prettyNY = (iso?: string) =>
    iso
        ? DateTime.fromISO(iso, { setZone: true })
            .setZone("America/New_York")
            .toFormat("ccc, LLL d • HH:mm")
        : "";

function Modal({
                   title,
                   open,
                   onClose,
                   children,
                   footer,
               }: {
    title: string;
    open: boolean;
    onClose: () => void;
    children: React.ReactNode;
    footer?: React.ReactNode;
}) {
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/30" onClick={onClose} />
            <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl">
                <div className="px-5 py-4 border-b">
                    <div className="text-lg font-semibold">{title}</div>
                </div>
                <div className="p-5">{children}</div>
                {footer && <div className="px-5 py-4 border-t bg-gray-50">{footer}</div>}
            </div>
        </div>
    );
}

function RestaurantCombobox({
                                options,
                                value,
                                onChange,
                                placeholder = "Search restaurants…",
                                disabled,
                                loading,
                            }: {
    options: RestaurantOption[];
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    disabled?: boolean;
    loading?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [q, setQ] = useState("");
    const btnRef = useRef<HTMLButtonElement | null>(null);
    const panelRef = useRef<HTMLDivElement | null>(null);

    const selected = useMemo(
        () => options.find((o) => o.value === value),
        [options, value]
    );
    const filtered = useMemo(() => {
        const s = q.trim().toLowerCase();
        if (!s) return options;
        return options.filter(
            (o) => o.label.toLowerCase().includes(s) || o.meta?.toLowerCase().includes(s)
        );
    }, [q, options]);

    useEffect(() => {
        if (!open) return;
        const onDoc = (e: MouseEvent) => {
            const t = e.target as Node;
            if (panelRef.current?.contains(t) || btnRef.current?.contains(t)) return;
            setOpen(false);
        };
        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, [open]);

    return (
        <div className="relative">
            <button
                ref={btnRef}
                type="button"
                disabled={disabled}
                onClick={() => setOpen((o) => !o)}
                className={[
                    "w-full rounded-[28px] border bg-white px-4 py-3 text-left shadow-sm",
                    "hover:ring-2 hover:ring-neutral-300 transition",
                    disabled ? "opacity-60 cursor-not-allowed" : "",
                    "flex items-center justify-between",
                ].join(" ")}
            >
                <div className="min-w-0">
                    <div className="text-xs text-gray-500">Restaurant</div>
                    <div className={selected ? "font-extrabold truncate" : "text-gray-400"}>
                        {selected ? selected.label : "Select a restaurant"}
                    </div>
                </div>
                <span className="ml-3 text-gray-700">▾</span>
            </button>

            {open && (
                <div
                    ref={panelRef}
                    className="absolute z-[10000] mt-2 w-full rounded-2xl border bg-white shadow-xl overflow-hidden"
                >
                    <div className="p-2 border-b">
                        <input
                            autoFocus
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder={placeholder}
                            className="w-full rounded border px-3 py-2"
                        />
                    </div>
                    <div className="max-h-96 overflow-auto">
                        {loading ? (
                            <div className="p-3 text-sm text-gray-500">Loading…</div>
                        ) : filtered.length === 0 ? (
                            <div className="p-3 text-sm text-gray-500">No matches.</div>
                        ) : (
                            <ul className="divide-y">
                                {filtered.map((o) => (
                                    <li key={o.value}>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                onChange(o.value); // value is uuid
                                                setOpen(false);
                                                setQ("");
                                            }}
                                            className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50"
                                        >
                                            <span className="font-medium truncate">{o.label}</span>
                                            {o.meta && (
                                                <span className="ml-auto text-xs text-gray-500 truncate">
                          {o.meta}
                        </span>
                                            )}
                                            {value === o.value && <span className="ml-2 text-xs">✓</span>}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function BookeeResults({
                           options,
                           value,
                           onChange,
                           query,
                           open,
                           onOpenChange,
                           loading,
                       }: {
    options: { value: string; label: string; meta?: string }[];
    value: string;
    onChange: (v: string) => void;
    query: string;
    open: boolean;
    onOpenChange: (o: boolean) => void;
    loading?: boolean;
}) {
    const panelRef = useRef<HTMLDivElement | null>(null);

    const filtered = useMemo(() => {
        const s = query.trim().toLowerCase();
        if (!s) return options;
        return options.filter(
            (o) => o.label.toLowerCase().includes(s) || o.meta?.toLowerCase().includes(s)
        );
    }, [query, options]);

    useEffect(() => {
        if (!open) return;
        const onDoc = (e: MouseEvent) => {
            const t = e.target as Node;
            if (panelRef.current?.contains(t)) return;
            onOpenChange(false);
        };
        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, [open, onOpenChange]);

    if (!open) return null;

    return (
        <div
            ref={panelRef}
            className="absolute z-50 mt-1 w-full min-w-[400px] rounded-xl border bg-white shadow-lg overflow-hidden"
        >
            <div className="max-h-52 overflow-auto text-sm">
                {loading ? (
                    <div className="px-3 py-2 text-gray-500">Loading…</div>
                ) : filtered.length === 0 ? (
                    <div className="px-3 py-2 text-gray-500">No matches.</div>
                ) : (
                    <ul className="divide-y">
                        {filtered.map((o) => (
                            <li key={o.value}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        onChange(o.value);
                                        onOpenChange(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50"
                                >
                                    <span className="font-medium flex-1 whitespace-nowrap overflow-hidden text-ellipsis min-w-0" style={{ maxWidth: '40%' }}>{o.label}</span>
                                    {o.meta && (
                                        <span className="text-xs text-gray-500 whitespace-nowrap flex-shrink-0">
                      {o.meta}
                    </span>
                                    )}
                                    {value === o.value && <span className="ml-2 text-xs flex-shrink-0">✓</span>}
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

function Block({
                   label,
                   value,
                   active,
                   onClick,
                   children,
                   className = "",
               }: {
    label: string;
    value: string;
    active?: boolean;
    onClick: () => void;
    children: React.ReactNode;
    className?: string;
}) {
    const panelRef = useRef<HTMLDivElement | null>(null);
    const btnRef = useRef<HTMLButtonElement | null>(null);

    useEffect(() => {
        if (!active) return;
        const onDoc = (e: MouseEvent) => {
            const t = e.target as Node;
            if (panelRef.current?.contains(t) || btnRef.current?.contains(t)) return;
            onClick();
        };
        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, [active, onClick]);

    return (
        <div className={`relative ${className}`}>
            <button
                ref={btnRef}
                type="button"
                onClick={onClick}
                className={[
                    "w-full rounded-[28px] border bg-white px-5 py-3 text-left shadow-sm transition",
                    "hover:ring-2 hover:ring-neutral-300",
                    active ? "ring-2 ring-neutral-300" : "",
                ].join(" ")}
            >
                <div className="flex items-center">
                    <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-500">{label}</div>
                        <div className="text-lg font-extrabold truncate">{value}</div>
                    </div>
                    <span className="ml-3 text-gray-700">▾</span>
                </div>
            </button>
            {active && (
                <div
                    ref={panelRef}
                    className="absolute z-50 mt-2 w-full rounded-2xl border bg-white shadow-xl overflow-hidden"
                >
                    {children}
                </div>
            )}
        </div>
    );
}

function Stepper({
                     value,
                     onChange,
                     min = 1,
                     max = 50,
                 }: {
    value: number;
    onChange: (v: number) => void;
    min?: number;
    max?: number;
}) {
    return (
        <div className="p-4">
            <div className="text-sm text-gray-600 mb-3">Select number of guests</div>
            <div className="flex items-center justify-center gap-4 whitespace-nowrap">
                <button
                    type="button"
                    onClick={() => onChange(Math.max(min, value - 1))}
                    className="h-10 w-10 rounded-full border flex items-center justify-center text-xl leading-none hover:bg-gray-50"
                    aria-label="Decrease guests"
                >
                    −
                </button>
                <div className="w-8 text-center font-semibold tabular-nums">{value}</div>
                <button
                    type="button"
                    onClick={() => onChange(Math.min(max, value + 1))}
                    className="h-10 w-10 rounded-full border flex items-center justify-center text-xl leading-none hover:bg-gray-50"
                    aria-label="Increase guests"
                >
                    ＋
                </button>
            </div>
        </div>
    );
}

export default function ManualBookingForm({
                                              onCreate,
                                              onDone,
                                              onCancel,
                                              onBookingCreated,
                                              restaurantOptions,
                                              restaurantsLoading,
                                          }: Props) {
    const safeRestaurantOptions: RestaurantOption[] = restaurantOptions ?? [];

    const [manualBook, { loading: manualLoading }] = useMutation(
        ADMIN_MANUAL_BOOK_LISTED_SLOT,
        { errorPolicy: "all" }
    );
    const [createBooking, { loading: createLoading }] = useMutation(
        ADMIN_CREATE_BOOKING,
        { errorPolicy: "all" }
    );

    const [bookeeSearch, setBookeeSearch] = useState("");
    const [bookeeOpen, setBookeeOpen] = useState(false);
    const { members, loading: membersLoading } = useMembersForBooking(bookeeSearch);

    const bookeeOptions = useMemo(() => {
        return members.map((m: any) => {
            const label = displayNameFor(m);
            const rightMeta =
                m.email ||
                m.company ||
                companyFromEmail(m.email) ||
                [m.team, m.cooperation].filter(Boolean).join(" • ") ||
                undefined;
            return { value: m.uuid as string, label, meta: rightMeta };
        });
    }, [members]);

    const [bookeeUuid, setBookeeUuid] = useState<string>("");
    const selectedBookee = useMemo(
        () => members.find((m: any) => m.uuid === bookeeUuid),
        [members, bookeeUuid]
    );

    const { data: memberTeamsData, loading: teamsLoading, error: teamsError } = useQuery(GET_MEMBER_TEAMS, {
        variables: { memberUuid: bookeeUuid },
        skip: !bookeeUuid,
        fetchPolicy: "network-only",
    });

    useEffect(() => {
        if (teamsError) {
            console.error("Error fetching member teams:", teamsError);
        }
    }, [teamsError]);

    const [name, setName] = useState("");
    const [team, setTeam] = useState("");
    const [teamUuid, setTeamUuid] = useState<string | null>(null);
    const [cooperation, setCooperation] = useState("");

    const [eventType, setEventType] = useState<EventType>("Restaurant");
    const cfg = EVENT_CONFIG[eventType];

    const [restaurantUuid, setRestaurantUuid] = useState<string>("");
    const selectedRestaurant = useMemo(
        () => safeRestaurantOptions.find((o) => o.value === restaurantUuid),
        [restaurantUuid, safeRestaurantOptions]
    );

    const [open, setOpen] = useState<"guests" | "date" | "time" | null>(null);
    const [guests, setGuests] = useState(cfg.min);

    const todayNY = useMemo(() => DateTime.now().setZone("America/New_York").toISODate()!, []);
    const tomorrowNY = useMemo(() => DateTime.now().setZone("America/New_York").plus({ days: 1 }).toISODate()!, []);
    const [date, setDate] = useState<string>(todayNY);
    const [time, setTime] = useState(cfg.timeOptions[0]); // may be "All Day"
    const [specificTime, setSpecificTime] = useState<string>(""); // Specific time input (e.g., "14:30" or "2:30 PM")
    const [notes, setNotes] = useState("");
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [occasion, setOccasion] = useState<string>("");
    const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
    const [dietaryNote, setDietaryNote] = useState("");
    const [specialRequests, setSpecialRequests] = useState("");

    const [pickedStartISO, setPickedStartISO] = useState<string | undefined>(
        undefined
    );
    const [pickedReservationUuid, setPickedReservationUuid] = useState<
        string | undefined
    >(undefined);
    const [pickedTableInfo, setPickedTableInfo] = useState<{
        label?: string | null;
        type?: string | null;
        location?: string | null;
    } | null>(null);

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [bookingInProgress, setBookingInProgress] = useState(false);
    const [nameTouched, setNameTouched] = useState(false);
    const [showSuccessToast, setShowSuccessToast] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);


    useEffect(() => {
        setGuests(cfg.min);
        setTime(cfg.timeOptions[0]);
        if (!cfg.requireRestaurant) setRestaurantUuid("");
        setPickedStartISO(undefined);
        setPickedReservationUuid(undefined);
    }, [eventType, cfg.min, cfg.requireRestaurant, cfg.timeOptions]);

    useEffect(() => {
        if (!selectedBookee) {
            // Clear fields when no bookee is selected
            setName("");
            setTeam("");
            setTeamUuid(null);
            setCooperation("");
            setSelectedAllergies([]);
            return;
        }
        const display = displayNameFor(selectedBookee);
        setName(display);

        if (!bookeeSearch || bookeeSearch.trim() === "") {
        setBookeeSearch(display);
        }
        

        let memberAllergies: string[] = [];
        let memberRestrictions: string[] = [];
        
        if (selectedBookee.allergies) {
            if (Array.isArray(selectedBookee.allergies)) {
                memberAllergies = selectedBookee.allergies;
            } else if (typeof selectedBookee.allergies === 'string') {
                memberAllergies = selectedBookee.allergies.split(',').map(s => s.trim()).filter(Boolean);
            }
        }
        
        if (selectedBookee.restrictions) {
            if (Array.isArray(selectedBookee.restrictions)) {
                memberRestrictions = selectedBookee.restrictions;
            } else if (typeof selectedBookee.restrictions === 'string') {
                memberRestrictions = selectedBookee.restrictions.split(',').map(s => s.trim()).filter(Boolean);
            }
        }
        
        console.log('[ManualBooking] Selected bookee allergies/restrictions:', {
            member: selectedBookee.firstName,
            rawAllergies: selectedBookee.allergies,
            rawRestrictions: selectedBookee.restrictions,
            parsedAllergies: memberAllergies,
            parsedRestrictions: memberRestrictions,
            fullBookee: selectedBookee
        });
        
        const availableOptions = [
            "All Dairy", "Eggs", "Fish", "Milk", "Peanuts", "Sesame", "Shellfish", "Soy",
            "Nuts", "Wheat", "Diabetic", "Gluten Free", "Halal", "Kosher", "Paleo",
            "Pescatarian", "Vegan", "Vegetarian"
        ];
        
        // Create a mapping for common variations and aliases (all lowercase for matching)
        const aliasMap: Record<string, string> = {
            'dairy': 'All Dairy',
            'all dairy': 'All Dairy',
            'all-dairy': 'All Dairy',
            'peanut': 'Peanuts',
            'peanuts': 'Peanuts',
            'nut': 'Nuts',
            'nuts': 'Nuts',
            'tree nuts': 'Nuts',
            'tree nut': 'Nuts',
            'gluten': 'Gluten Free',
            'gluten free': 'Gluten Free',
            'gluten-free': 'Gluten Free',
            'shellfish': 'Shellfish',
            'fish': 'Fish',
            'egg': 'Eggs',
            'eggs': 'Eggs',
            'milk': 'Milk',
            'soy': 'Soy',
            'wheat': 'Wheat',
            'sesame': 'Sesame',
            'diabetic': 'Diabetic',
            'halal': 'Halal',
            'kosher': 'Kosher',
            'paleo': 'Paleo',
            'pescatarian': 'Pescatarian',
            'vegan': 'Vegan',
            'vegetarian': 'Vegetarian',
        };
        
        // Also create a function to normalize and match
        const normalizeForMatching = (str: string): string => {
            return str.trim().toLowerCase().replace(/[-\s]+/g, ' '); // Normalize spaces and dashes
        };
        
        // Map member's allergies/restrictions to form options (case-insensitive matching)
        const matchedOptions: string[] = [];
        const allMemberItems = [...memberAllergies, ...memberRestrictions];
        
        allMemberItems.forEach(item => {
            if (!item) return;
            const normalizedItem = normalizeForMatching(item);
            const originalItem = item.trim();
            console.log('[ManualBooking] Checking item:', originalItem, 'normalized:', normalizedItem, 'type:', typeof item);
            
            // First, try exact match (case-insensitive, normalized)
            const exactMatch = availableOptions.find(opt => 
                normalizeForMatching(opt) === normalizedItem
            );
            if (exactMatch) {
                console.log('[ManualBooking] Exact match found:', exactMatch);
                if (!matchedOptions.includes(exactMatch)) {
                    matchedOptions.push(exactMatch);
                }
                return;
            }
            
            // Second, try alias map (using normalized key)
            const aliasMatch = aliasMap[normalizedItem];
            if (aliasMatch && !matchedOptions.includes(aliasMatch)) {
                console.log('[ManualBooking] Alias match found:', aliasMatch, 'for', normalizedItem);
                matchedOptions.push(aliasMatch);
                return;
            }
            
            // Third, try to find if the item contains key words that match options
            // e.g., "all dairy" should match "All Dairy"
            const keywordMatch = availableOptions.find(opt => {
                const optNormalized = normalizeForMatching(opt);
                // Check if normalized strings match
                if (optNormalized === normalizedItem) return true;
                // Check if one contains the other (for "all dairy" vs "dairy")
                if (optNormalized.includes(normalizedItem) || normalizedItem.includes(optNormalized)) {
                    // Make sure it's a meaningful match (not just "a" matching "all")
                    const minLength = Math.min(optNormalized.length, normalizedItem.length);
                    if (minLength >= 3) return true;
                }
                return false;
            });
            if (keywordMatch && !matchedOptions.includes(keywordMatch)) {
                console.log('[ManualBooking] Keyword match found:', keywordMatch, 'for', normalizedItem);
                matchedOptions.push(keywordMatch);
                return;
            }
            
            // Fourth, try partial/contains matching (but be more specific)
            const partialMatch = availableOptions.find(opt => {
                const optLower = normalizeForMatching(opt);
                // Check if the option contains the item or vice versa
                // But prioritize longer matches
                if (optLower === normalizedItem) return true;
                if (optLower.includes(normalizedItem) && normalizedItem.length >= 3) return true;
                if (normalizedItem.includes(optLower) && optLower.length >= 3) return true;
                return false;
            });
            if (partialMatch && !matchedOptions.includes(partialMatch)) {
                console.log('[ManualBooking] Partial match found:', partialMatch, 'for', normalizedItem);
                matchedOptions.push(partialMatch);
                return;
            }
            
            console.log('[ManualBooking] No match found for:', normalizedItem);
        });
        
        console.log('[ManualBooking] Final matched options:', matchedOptions);
        setSelectedAllergies(matchedOptions);
    }, [selectedBookee]); // eslint-disable-line react-hooks/exhaustive-deps

    // Auto-fill team and corporation when member teams data is loaded
    useEffect(() => {
        console.log("Auto-fill effect triggered:", { bookeeUuid, memberTeamsData, teamsLoading });
        
        if (!bookeeUuid) {
            // Clear fields when bookee is cleared
            setTeam("");
            setTeamUuid(null);
            setCooperation("");
            return;
        }

        if (teamsLoading) {
            // Still loading, don't clear fields yet
            return;
        }

        if (!memberTeamsData?.membersTeams?.teams || memberTeamsData.membersTeams.teams.length === 0) {
            // No teams found, clear the fields
            console.log("No teams found for member:", bookeeUuid);
            setTeam("");
            setTeamUuid(null);
            setCooperation("");
            return;
        }

        const teams = memberTeamsData.membersTeams.teams;
        console.log("Found teams:", teams);
        
        // Get the first team (most common case)
        const firstTeam = teams[0];
        console.log("First team:", firstTeam);
        
        if (firstTeam?.name) {
            console.log("Setting team to:", firstTeam.name);
            setTeam(firstTeam.name);
            setTeamUuid(firstTeam.uuid || null);
        } else {
            setTeam("");
            setTeamUuid(null);
        }
        
        if (firstTeam?.corporation?.name) {
            console.log("Setting cooperation to:", firstTeam.corporation.name);
            setCooperation(firstTeam.corporation.name);
        } else {
            setCooperation("");
        }
    }, [memberTeamsData, bookeeUuid, teamsLoading]);

    const errors: Record<string, string> = {};
    // Name/Bookee is now required before proceeding to booking details modal
    // Check bookeeSearch (what user types) instead of name (which is only set when member is selected)
    // Only show error if field has been touched (user has interacted with it)
    if (nameTouched && (!bookeeSearch || !bookeeSearch.trim())) {
        errors.name = "Name is required";
    }
    // Member is optional - user can type a name without selecting from dropdown
    // Only show bookee error if they start typing but haven't selected (this is just a warning, not blocking)
    // We don't add this to errors to prevent blocking, just show it as info
    if (cfg.requireRestaurant && !restaurantUuid) errors.restaurant = "Pick a restaurant";
    if (!date) errors.date = "Required";
    const disabled = Object.keys(errors).length > 0;

    /** Build payload. Prefer the exact picked slot ISO. If none, compute a concrete time. */
    const buildPayload = (): Omit<BookingRow, "id"> & {
        restaurantUuid?: string;
        startAtISO?: string;
        partySize?: number;
    } => {
        let startAtISO = pickedStartISO;

        if (!startAtISO) {
            const timeLabel =
                time === "All Day" || !TIME_LABEL_TO_NY[time] ? "Dinner" : time;
            const t = TIME_LABEL_TO_NY[timeLabel];
            const local = DateTime.fromISO(date, { zone: "America/New_York" }).set({
                hour: t.hour,
                minute: t.minute,
                second: 0,
                millisecond: 0,
            });
            startAtISO = local.toUTC().toISO({ suppressMilliseconds: true }) ?? undefined;
        }

        return {
            venue: selectedRestaurant?.label ?? "",
            city: selectedRestaurant?.meta ?? "",
            booker: name,
            company: team,
            role: cooperation,
            partySize: guests,
            date,
            status: "confirmed",
            source: "Manual",
            email: selectedBookee?.email ?? "",
            notes:
                `Bookee: ${name}${selectedBookee ? ` (${selectedBookee.uuid})` : ""}` +
                `\nTime: ${pickedStartISO ? prettyNY(pickedStartISO) : time}` +
                (occasion ? `\nOccasion: ${occasion}` : "") +
                (selectedAllergies.length > 0 ? `\nDietary Restrictions: ${selectedAllergies.join(", ")}` : "") +
                (dietaryNote ? `\nDietary Note: ${dietaryNote}` : "") +
                (specialRequests ? `\nAdditional Requests: ${specialRequests}` : "") +
                (notes ? `\n${notes}` : ""),
            restaurantUuid:
                restaurantUuid ||
                selectedRestaurant?.uuid ||
                selectedRestaurant?.value ||
                undefined,
            startAtISO,
        };
    };

    const submit: React.FormEventHandler<HTMLFormElement> = async (e) => {
        e.preventDefault();
        if (disabled) return;
        setSubmitError(null);
        // Validate name is required before opening details modal
        // Check bookeeSearch (what user types) instead of name
        if (!bookeeSearch || !bookeeSearch.trim()) {
            return; // Error will be shown in the form
        }
        // If no slot was picked, open details modal first, otherwise go straight to confirm
        if (!pickedReservationUuid && !pickedStartISO) {
            setDetailsModalOpen(true);
        } else {
        setConfirmOpen(true);
        }
    };

    /** Keep exact time when clicking a listed slot. Never fall back to "All Day". */
    const onPickSlot = (args: {
        date?: string;
        time?: string;
        partySize: number;
        startAtISO?: string;
        reservationUuid?: string;
        table?: {
            label?: string | null;
            type?: string | null;
            location?: string | null;
        } | null;
    }) => {
        // Validate name is required before opening details modal
        // Check bookeeSearch (what user types) instead of name
        if (!bookeeSearch || !bookeeSearch.trim()) {
            // Don't open modal, error will be shown in the form
            return;
        }
        setSubmitError(null);
        if (args.date) setDate(args.date);
        if (args.time !== undefined) {
            setTime(args.time);
        } else if (args.startAtISO) {
            setTime(hhmmFromISO(args.startAtISO) ?? "Custom");
        }
        const rawPartySize =
            typeof args.partySize === "number" && Number.isFinite(args.partySize)
                ? args.partySize
                : guests;
        const bounded = Math.max(cfg.min, Math.min(cfg.max, rawPartySize));
        setGuests(bounded);
        setPickedStartISO(args.startAtISO);
        setPickedReservationUuid(args.reservationUuid);
        setPickedTableInfo(args.table || null); // Set table info from the picked slot
        setOpen(null);
        setDetailsModalOpen(true); // Open details modal instead of confirm modal
    };

    const performing = manualLoading || createLoading || bookingInProgress;
    const inFlightRef = useRef(false);

    const handleConfirm = async () => {
        if (inFlightRef.current || bookingInProgress) return;
        inFlightRef.current = true;
        setBookingInProgress(true);
        setSubmitError(null);

        const payload = buildPayload();

        try {
            if (pickedReservationUuid) {
                console.log("Attempting to book slot:", {
                        reservationUuid: pickedReservationUuid,
                        memberUuid: bookeeUuid,
                        notes,
                        partySize: guests,
                });

                // Build combined notes from all details
                const combinedNotes = 
                    `Bookee: ${name}${bookeeUuid ? ` (${bookeeUuid})` : ""}` +
                    `\nTime: ${pickedStartISO ? prettyNY(pickedStartISO) : time}` +
                    (occasion ? `\nOccasion: ${occasion}` : "") +
                    (selectedAllergies.length > 0 ? `\nDietary Restrictions: ${selectedAllergies.join(", ")}` : "") +
                    (dietaryNote ? `\nDietary Note: ${dietaryNote}` : "") +
                    (specialRequests ? `\nAdditional Requests: ${specialRequests}` : "") +
                    (notes ? `\n${notes}` : "");

                let result;
                try {
                    // Build variables object, only including memberUuid and teamUuid if they have values
                    const variables: any = {
                        reservationUuid: pickedReservationUuid,
                        notes: combinedNotes,
                        partySize: guests,
                    };
                    
                    // Only include memberUuid if it has a value (don't pass null)
                    if (bookeeUuid && bookeeUuid.trim()) {
                        variables.memberUuid = bookeeUuid;
                    }
                    
                    // Only include teamUuid if it has a value (don't pass null)
                    if (teamUuid && teamUuid.trim()) {
                        variables.teamUuid = teamUuid;
                    }
                    
                    result = await manualBook({
                        variables,
                        refetchQueries: ['AllReservations'], // Refresh the table after booking
                    });
                } catch (mutationError: any) {
                    console.error("Mutation error (caught in try-catch):", mutationError);
                    console.error("Mutation error details:", {
                        message: mutationError?.message,
                        graphQLErrors: mutationError?.graphQLErrors,
                        networkError: mutationError?.networkError,
                        error: mutationError,
                        stack: mutationError?.stack
                    });
                    const errorMsg = formatErrorMessage(mutationError?.graphQLErrors?.[0] || mutationError?.networkError || mutationError);
                    setSubmitError(errorMsg);
                    setConfirmOpen(false);
                    notify.error(errorMsg);
                    inFlightRef.current = false;
                    setBookingInProgress(false);
                    return;
                }

                console.log("Booking result:", result);
                console.log("Booking result type:", typeof result);
                console.log("Booking result keys:", result ? Object.keys(result) : []);
                
                // Handle different response structures - Apollo Client can return errors in different places
                let data, errors;
                if (result && typeof result === 'object') {
                    data = result.data;
                    // Check multiple possible error locations
                    errors = result.errors || 
                             (result.error ? [result.error] : undefined) ||
                             (result.data?.errors ? result.data.errors : undefined);
                } else {
                    data = undefined;
                    errors = undefined;
                }
                
                console.log("Extracted data:", data);
                console.log("Extracted errors:", errors);
                
                // If we have no data and no errors, check if result itself is an error
                if (!data && !errors && result) {
                    console.warn("No data or errors in result, but result exists:", result);
                    // Check if the result itself indicates an error
                    if (result.error || result.message) {
                        errors = [result.error || { message: result.message }];
                    }
                }

                if (errors?.length) {
                    console.error("Booking errors:", errors);
                    const errorMsg = formatErrorMessage(errors[0]);
                    setSubmitError(errorMsg);
                    setConfirmOpen(false);
                    notify.error(errorMsg);
                    inFlightRef.current = false;
                    setBookingInProgress(false);
                    return;
                }
                
                const created = data?.adminManualBookListedSlot;
                console.log("Created reservation:", created);
                console.log("Full data object:", data);
                console.log("Data keys:", data ? Object.keys(data) : []);
                
                if (!created) {
                    console.error("Booking failed - no reservation data returned:", { 
                        data, 
                        errors,
                        dataKeys: data ? Object.keys(data) : [],
                        fullResponse: result,
                        hasData: !!data,
                        dataType: typeof data
                    });
                    
                    // Check if there's an error in the data structure
                    if (data && Object.keys(data).length > 0) {
                        console.error("Data exists but adminManualBookListedSlot is missing. Available keys:", Object.keys(data));
                        const message = "The booking request was received but the response format was unexpected. Please try again.";
                        setSubmitError(message);
                        setConfirmOpen(false);
                        notify.error(message);
                    } else if (!data && !errors) {
                        // Network error or connection issue
                        const message = "Unable to connect to the server. Please check your internet connection and try again.";
                        setSubmitError(message);
                        setConfirmOpen(false);
                        notify.error(message);
                    } else {
                        const message = "We couldn't complete your booking. The reservation may not have been created. Please try again.";
                        setSubmitError(message);
                        setConfirmOpen(false);
                        notify.error(message);
                    }
                    
                    inFlightRef.current = false;
                    setBookingInProgress(false);
                    return;
                }
                
                // Trigger refresh callback
                if (onBookingCreated) {
                    await onBookingCreated();
                }
                
                // Close modal and show success toast
                setConfirmOpen(false);
                setShowSuccessToast(true);
                setTimeout(() => {
                    setShowSuccessToast(false);
                    if (onDone) onDone();
                }, 3000);
                // Don't call onCreate here - the booking is already done via adminManualBookListedSlot
            } else {
                const startIso = payload.startAtISO!;
                const endIso = DateTime.fromISO(startIso, { zone: "utc" })
                    .plus({ minutes: 90 })
                    .toISO({ suppressMilliseconds: true });

                if (!restaurantUuid) {
                    notify.error("Please select a restaurant to continue.");
                    inFlightRef.current = false;
                    setBookingInProgress(false);
                    return;
                }
                if (!startIso || !endIso) {
                    notify.error("Please select a date and time for your booking.");
                    inFlightRef.current = false;
                    setBookingInProgress(false);
                    return;
                }

                console.log("create vars →", {
                    restaurantUuid,
                    startIso,
                    endIso,
                    partySize: guests,
                    note: notes,
                    memberUuid: bookeeUuid,
                });

                // Build combined notes from all details
                const combinedNotes = 
                    `Bookee: ${name}${bookeeUuid ? ` (${bookeeUuid})` : ""}` +
                    `\nTime: ${startIso ? prettyNY(startIso) : time}` +
                    (occasion ? `\nOccasion: ${occasion}` : "") +
                    (selectedAllergies.length > 0 ? `\nDietary Restrictions: ${selectedAllergies.join(", ")}` : "") +
                    (dietaryNote ? `\nDietary Note: ${dietaryNote}` : "") +
                    (specialRequests ? `\nAdditional Requests: ${specialRequests}` : "") +
                    (notes ? `\n${notes}` : "");

                let createResult;
                try {
                    // Build variables object, only including memberUuid if it has a value
                    const createVariables: any = {
                        restaurantUuid,
                        startIso,
                        endIso,
                        partySize: guests,
                        note: combinedNotes,
                    };
                    
                    // Only include memberUuid if it has a value (don't pass null)
                    if (bookeeUuid && bookeeUuid.trim()) {
                        createVariables.memberUuid = bookeeUuid;
                    }
                    
                    createResult = await createBooking({
                        variables: createVariables,
                        refetchQueries: ['AllReservations'], // Refresh the table after booking
                    });
                } catch (mutationError: any) {
                    console.error("Create booking mutation error:", mutationError);
                    const errorMsg = formatErrorMessage(mutationError?.graphQLErrors?.[0] || mutationError?.networkError || mutationError);
                    setSubmitError(errorMsg);
                    setConfirmOpen(false);
                    notify.error(errorMsg);
                    inFlightRef.current = false;
                    setBookingInProgress(false);
                    return;
                }
                
                const { data, errors } = createResult || {};

                if (errors?.length) {
                    console.error("Create booking errors:", errors);
                    const errorMsg = formatErrorMessage(errors[0]);
                    setSubmitError(errorMsg);
                    setConfirmOpen(false);
                    notify.error(errorMsg);
                    inFlightRef.current = false;
                    setBookingInProgress(false);
                    return;
                }
                
                const created = data?.adminCreateBooking;
                console.log("Created reservation:", created);
                console.log("Full data object:", data);
                console.log("Data keys:", data ? Object.keys(data) : []);
                
                if (!created) {
                    console.error("Create booking failed - no reservation data returned:", { 
                        data, 
                        errors,
                        dataKeys: data ? Object.keys(data) : [],
                        hasData: !!data,
                        dataType: typeof data
                    });
                    
                    // Check if there's an error in the data structure
                    if (data && Object.keys(data).length > 0) {
                        console.error("Data exists but adminCreateBooking is missing. Available keys:", Object.keys(data));
                        const message = "The booking request was received but the response format was unexpected. Please try again.";
                        setSubmitError(message);
                        setConfirmOpen(false);
                        notify.error(message);
                    } else if (!data && !errors) {
                        // Network error or connection issue
                        const message = "Unable to connect to the server. Please check your internet connection and try again.";
                        setSubmitError(message);
                        setConfirmOpen(false);
                        notify.error(message);
                    } else {
                        const message = "We couldn't complete your booking. The reservation may not have been created. Please try again.";
                        setSubmitError(message);
                        setConfirmOpen(false);
                        notify.error(message);
                    }
                    
                    inFlightRef.current = false;
                    setBookingInProgress(false);
                    return;
                }
                
                // Trigger refresh callback
                if (onBookingCreated) {
                    await onBookingCreated();
            }

                // Close modal and show success toast
            setConfirmOpen(false);
                setShowSuccessToast(true);
                setTimeout(() => {
                    setShowSuccessToast(false);
                    if (onDone) onDone();
                }, 3000);
                // Only call onCreate when creating a new booking (not when booking a listed slot)
                onCreate?.(payload);
            }
        } catch (e: any) {
            console.error("Booking exception:", e);
            const errorMsg = formatErrorMessage(e?.graphQLErrors?.[0] || e?.networkError || { message: e?.message || "An unexpected error occurred. Please try again." });
            setSubmitError(errorMsg);
            setConfirmOpen(false);
            notify.error(errorMsg);
        } finally {
            inFlightRef.current = false;
            setBookingInProgress(false);
        }
    };

    const bookeeDisplayName = selectedBookee
        ? displayNameFor(selectedBookee)
        : name || bookeeSearch || "";
    const bookeeEmail =
        selectedBookee?.email ??
        selectedBookee?.username ??
        selectedBookee?.preferredName ??
        "";

    const confirmFooter = (
        <div className="flex justify-end gap-2">
            <button
                type="button"
                className="px-3 py-2 rounded border hover:bg-gray-100"
                onClick={() => {
                    setConfirmOpen(false);
                    setDetailsModalOpen(true);
                }}
            >
                Back
            </button>
            <button
                type="button"
                disabled={performing}
                className="px-4 py-2 rounded text-white disabled:opacity-60 flex items-center gap-2"
                style={{
                    backgroundColor: "#064126",
                }}
                onMouseEnter={(e) => {
                    if (!performing) {
                        e.currentTarget.style.backgroundColor = "#052a1a";
                    }
                }}
                onMouseLeave={(e) => {
                    if (!performing) {
                        e.currentTarget.style.backgroundColor = "#064126";
                    }
                }}
                onClick={handleConfirm}
            >
                {performing && (
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                )}
                {performing ? "Booking…" : "Confirm booking"}
            </button>
        </div>
    );

    return (
        <>
            {showSuccessToast && (
                <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5">
                    <div className="bg-green-600 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px]">
                        <div className="flex-shrink-0">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <div className="font-semibold">Booking Successfully Created</div>
                        </div>
                        <button
                            onClick={() => {
                                setShowSuccessToast(false);
                            }}
                            className="flex-shrink-0 text-white hover:text-gray-200 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}
            
            {/* Details Modal - Occasion, Allergies, Special Requests */}
            <Modal
                title="Booking Details"
                open={detailsModalOpen}
                onClose={() => setDetailsModalOpen(false)}
                showCloseButton={true}
            >
                <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
                    {/* Occasion Selection */}
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-gray-400">▾</span>
                            <h3 className="text-lg font-semibold text-gray-900">What's the occasion?</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">Celebrating something special?</p>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { value: "Anniversary", icon: HiHeart },
                                { value: "Birthday", icon: HiCake },
                                { value: "Business", icon: HiBriefcase },
                                { value: "Graduation", icon: HiAcademicCap },
                                { value: "Just a good time", icon: HiEmojiHappy },
                            ].map((occ) => {
                                const IconComponent = occ.icon;
                                return (
                                    <button
                                        key={occ.value}
                                        type="button"
                                        onClick={() => setOccasion(occasion === occ.value ? "" : occ.value)}
                                        className={`flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all ${
                                            occasion === occ.value
                                                ? "border-green-600 bg-green-50"
                                                : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                                        }`}
                                    >
                                        <IconComponent 
                                            className={`w-6 h-6 ${
                                                occasion === occ.value 
                                                    ? "text-green-600" 
                                                    : "text-gray-600"
                                            }`} 
                                        />
                                        <span className={`text-sm font-semibold text-center ${
                                            occasion === occ.value 
                                                ? "text-green-700" 
                                                : "text-gray-900"
                                        }`}>
                                            {occ.value}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Allergies and Dietary Restrictions */}
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-gray-400">▾</span>
                            <h3 className="text-lg font-semibold text-gray-900">Any allergies or restrictions?</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">Any allergies of the party</p>
                        
                        <div className="space-y-4">
                            <div className="flex flex-wrap gap-2">
                                {[
                                    "All Dairy", "Eggs", "Fish", "Milk", "Peanuts", "Sesame", "Shellfish", "Soy",
                                    "Nuts", "Wheat", "Diabetic", "Gluten Free", "Halal", "Kosher", "Paleo",
                                    "Pescatarian", "Vegan", "Vegetarian"
                                ].map((allergy) => (
                                    <button
                                        key={allergy}
                                        type="button"
                                        onClick={() => {
                                            setSelectedAllergies(prev =>
                                                prev.includes(allergy)
                                                    ? prev.filter(a => a !== allergy)
                                                    : [...prev, allergy]
                                            );
                                        }}
                                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                                            selectedAllergies.includes(allergy)
                                                ? "bg-red-100 text-red-700 border-2 border-red-300"
                                                : "bg-white text-gray-700 border border-gray-300 hover:border-gray-400"
                                        }`}
                                    >
                                        {allergy}
                                    </button>
                                ))}
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Additional Dietary Note
                                </label>
                                <textarea
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm resize-y min-h-[80px]"
                                    placeholder="Add an optional note on allergies and restrictions..."
                                    value={dietaryNote}
                                    onChange={(e) => setDietaryNote(e.target.value)}
                                />
                                <p className="mt-2 text-xs text-gray-500">
                                    We will share allergies, diet restrictions, or preferences you provide with the restaurant in advance of your reservation.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Special Requests */}
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-gray-400">▾</span>
                            <h3 className="text-lg font-semibold text-gray-900">Any special requests?</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">We'll give restaurants a heads up.</p>
                        <textarea
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm resize-y min-h-[100px]"
                            placeholder="Add special requests..."
                            value={specialRequests}
                            onChange={(e) => setSpecialRequests(e.target.value)}
                        />
                    </div>

                    <div className="flex justify-between gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={() => {
                                setDetailsModalOpen(false);
                            }}
                            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors font-medium"
                        >
                            Back
                        </button>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setDetailsModalOpen(false);
                                    setConfirmOpen(true);
                                }}
                                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors font-medium"
                            >
                                Skip
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setDetailsModalOpen(false);
                                    setConfirmOpen(true);
                                }}
                                className="px-4 py-2 text-white rounded-md transition-colors font-medium"
                                style={{ backgroundColor: "#064126" }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#052a1a"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#064126"; }}
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>

            <Modal
                title="Confirm booking"
                open={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                footer={confirmFooter}
            >
                <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-3">
                        <div className="w-24 text-gray-500 font-bold">Bookee</div>
                        <div className="break-words flex-1">
                            {bookeeDisplayName ? (
                                <>
                                    <div>{bookeeDisplayName}</div>
                                    {bookeeEmail ? (
                                        <div className="text-xs text-gray-500 mt-0.5">
                                            {bookeeEmail}
                                        </div>
                                    ) : null}
                                </>
                            ) : (
                                "—"
                            )}
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-24 text-gray-500 font-bold">Restaurant</div>
                        <div className="flex-1">
                            {selectedRestaurant?.label || "—"}
                            {selectedRestaurant?.meta && (
                                <div className="text-xs text-gray-500 mt-0.5">
                                    {selectedRestaurant.meta}
                                </div>
                            )}
                            {(() => {
                                const addressParts = [
                                    selectedRestaurant?.addressLine1,
                                    selectedRestaurant?.addressLine2,
                                    selectedRestaurant?.cityLocation
                                ].filter(Boolean);
                                if (addressParts.length > 0) {
                                    return (
                                        <div className="text-xs text-gray-500 mt-1">
                                            {addressParts.join(", ")}
                                        </div>
                                    );
                                }
                                return null;
                            })()}
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-24 text-gray-500 font-bold">When</div>
                        <div>
                            {fmtNYDateTimeRangeLabel(pickedStartISO, time) || fmtNYDate(date)}
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-24 text-gray-500 font-bold">{cfg.guestLabel}</div>
                        <div>{guests}</div>
                    </div>
                    {pickedTableInfo && (pickedTableInfo.label || pickedTableInfo.type || pickedTableInfo.location) && (
                        <div className="flex items-start gap-3">
                            <div className="w-24 text-gray-500 font-bold">Table</div>
                            <div className="flex-1">
                                {pickedTableInfo.label && (
                                    <div>{pickedTableInfo.label}</div>
                                )}
                                {(pickedTableInfo.type || pickedTableInfo.location) && (
                                    <div className="text-xs text-gray-500 mt-0.5">
                                        {[pickedTableInfo.type, pickedTableInfo.location]
                                            .filter(Boolean)
                                            .join(" • ")}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    {(occasion || selectedAllergies.length > 0 || dietaryNote || specialRequests) && (
                        <div className="flex items-start gap-3">
                            <div className="w-24 text-gray-500 font-bold">Details</div>
                            <div className="space-y-1">
                                {occasion && <div><span className="font-bold">Occasion:</span> {occasion}</div>}
                                {selectedAllergies.length > 0 && (
                                    <div><span className="font-bold">Dietary Restrictions:</span> {selectedAllergies.join(", ")}</div>
                                )}
                                {dietaryNote && <div className="text-sm text-gray-600"><span className="font-bold">Dietary Note:</span> {dietaryNote}</div>}
                                {specialRequests && <div className="text-sm text-gray-600"><span className="font-bold">Additional Requests:</span> {specialRequests}</div>}
                            </div>
                        </div>
                    )}
                    <div className="pt-2 text-xs text-gray-500">
                        Times are local to America/New York (EST).
                    </div>
                </div>
            </Modal>

            <form
                id="manual-booking-form"
                onSubmit={submit}
                className="space-y-6 max-h-[70vh] overflow-y-auto pr-2"
            >
                {submitError && (
                    <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                        {submitError}
                    </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                        <label className="block text-sm mb-1">
                            Name <span className="text-rose-500">*</span>
                        </label>

                        <input
                            className={`w-full rounded border px-3 py-2 ${
                                nameTouched && errors.name ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-gray-300"
                            }`}
                            placeholder="Search by name"
                            value={bookeeSearch}
                            onFocus={() => {
                                setBookeeOpen(true);
                                setNameTouched(true);
                            }}
                            onBlur={() => setNameTouched(true)}
                            onChange={(e) => {
                                const newValue = e.target.value;
                                setBookeeSearch(newValue);
                                setBookeeOpen(true);
                                setNameTouched(true);
                                // Clear selection if search doesn't match selected bookee
                                if (selectedBookee) {
                                    const display = displayNameFor(selectedBookee);
                                    if (newValue.trim() !== display) {
                                        setBookeeUuid("");
                                    }
                                }
                            }}
                            onKeyDown={(e) => {
                                // Allow backspace and delete to work normally
                                if (e.key === "Backspace" || e.key === "Delete") {
                                    // Clear selection if user is deleting the entire search
                                    if (bookeeSearch.length <= 1) {
                                        setBookeeUuid("");
                                    }
                                }
                            }}
                            style={{ whiteSpace: 'normal', wordWrap: 'break-word' }}
                            disabled={membersLoading}
                        />
                        {membersLoading && (
                            <div className="absolute right-3 top-9 flex items-center">
                                <svg className="animate-spin h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            </div>
                        )}

                        <BookeeResults
                            options={bookeeOptions}
                            value={bookeeUuid}
                            onChange={(uuid) => {
                                setBookeeUuid(uuid);
                                // Update search to match selected bookee
                                const selected = members.find((m: any) => m.uuid === uuid);
                                if (selected) {
                                    const display = displayNameFor(selected);
                                    setBookeeSearch(display);
                                }
                            }}
                            query={bookeeSearch}
                            open={bookeeOpen}
                            onOpenChange={setBookeeOpen}
                            loading={membersLoading}
                        />

                        {errors.name && (
                            <p className="text-xs text-red-600 mt-1">{errors.name}</p>
                        )}
                        {errors.bookee && (
                            <p className="text-xs text-red-600 mt-1">{errors.bookee}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm mb-1">Team</label>
                        <input
                            className="w-full rounded border px-3 py-2"
                            placeholder="e.g., Sales, Ops"
                            value={team}
                            onChange={(e) => setTeam(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm mb-1">Cooperation</label>
                        <input
                            className="w-full rounded border px-3 py-2"
                            placeholder="e.g., Partner A"
                            value={cooperation}
                            onChange={(e) => setCooperation(e.target.value)}
                        />
                    </div>
                </div>

                {cfg.requireRestaurant && (
                    <div className="space-y-3">
                        {restaurantsLoading && (
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Loading restaurants...
                            </div>
                        )}
                        <RestaurantCombobox
                            options={safeRestaurantOptions}
                            value={restaurantUuid}
                            onChange={(v) => {
                                setRestaurantUuid(v); // v is the uuid string
                                setPickedStartISO(undefined);
                                setPickedReservationUuid(undefined);
                            }}
                            loading={restaurantsLoading}
                            disabled={false}
                        />
                        {!restaurantUuid && !!bookeeUuid && (
                            <p className="text-xs text-red-600 mt-1">Pick a restaurant</p>
                        )}
                        {!bookeeUuid && (
                            <p className="text-xs text-gray-500 mt-1">
                                Select a bookee to choose a restaurant.
                            </p>
                        )}

                        {restaurantUuid && (
                            <AvailableSlots
                                restaurantUuid={restaurantUuid}
                                onPick={onPickSlot}
                                autoScrollToFirstFuture
                                maxHeightRem={28}
                                // No time window filter - only use specific time if provided
                                timeWindowNY={undefined}
                                dateFilterNY={date}
                                desiredPartySize={guests}
                                includeUnknownCapacities={true}
                                specificTimeFilter={specificTime || undefined}
                            />
                        )}
                    </div>
                )}

                <div className="flex gap-3">
                    <Block
                        className="flex-1"
                        label={cfg.guestLabel}
                        value={`${guests} ${cfg.guestLabel}`}
                        active={open === "guests"}
                        onClick={() => setOpen(open === "guests" ? null : "guests")}
                    >
                        <Stepper
                            value={guests}
                            onChange={(v) => setGuests(v)}
                            min={cfg.min}
                            max={cfg.max}
                        />
                    </Block>

                    <Block
                        className="flex-1"
                        label="Date"
                        value={
                            pickedStartISO
                                ? (() => {
                                    const pickedDate = DateTime.fromISO(pickedStartISO).setZone("America/New_York").toISODate()!;
                                    if (pickedDate === todayNY) return "Today";
                                    if (pickedDate === tomorrowNY) return "Tomorrow";
                                    return DateTime.fromISO(pickedStartISO)
                                        .setZone("America/New_York")
                                        .toFormat("ccc, LLL d");
                                })()
                                : (() => {
                                    if (date === todayNY) return "Today";
                                    if (date === tomorrowNY) return "Tomorrow";
                                    return fmtNYDate(date);
                                })()
                        }
                        active={open === "date"}
                        onClick={() => setOpen(open === "date" ? null : "date")}
                    >
                        <div className="p-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
                            <input
                                type="date"
                                className="w-full rounded-lg border px-3 py-2"
                                    min={todayNY}
                                value={
                                    pickedStartISO
                                            ? DateTime.fromISO(pickedStartISO).setZone("America/New_York").toISODate()!
                                        : date
                                }
                                onChange={(e) => {
                                    setPickedStartISO(undefined);
                                    setPickedReservationUuid(undefined);
                                    setDate(e.target.value);
                                }}
                            />
                            {!date && <p className="text-xs text-red-600 mt-1">Required</p>}
                            </div>
                        </div>
                    </Block>

                    <Block
                        className="flex-1"
                        label="Time"
                        value={
                            pickedStartISO
                                ? DateTime.fromISO(pickedStartISO)
                                    .setZone("America/New_York")
                                      .toFormat("h:mm a")
                                : specificTime
                                ? (() => {
                                    // Format the time input value for display
                                    const timeParts = specificTime.split(':');
                                    if (timeParts.length === 2) {
                                        const hour = parseInt(timeParts[0]);
                                        const minute = timeParts[1];
                                        const period = hour >= 12 ? 'PM' : 'AM';
                                        const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
                                        return `${displayHour}:${minute} ${period}`;
                                    }
                                    return specificTime;
                                })()
                                : "All Day"
                        }
                        active={open === "time"}
                        onClick={() => setOpen(open === "time" ? null : "time")}
                    >
                        <div className="p-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Time</label>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Specific Time</label>
                                    <input
                                        type="time"
                                        className="w-full rounded-lg border px-3 py-2 text-sm"
                                        value={specificTime}
                                        onChange={(e) => {
                                            setSpecificTime(e.target.value);
                                            if (e.target.value) {
                                                setPickedStartISO(undefined);
                                                setPickedReservationUuid(undefined);
                                            }
                                        }}
                                        placeholder="--:-- --"
                                    />
                                </div>
                            </div>
                        </div>
                    </Block>
                </div>


                <div className="flex justify-end gap-2 pt-1">
                    <button
                        type="button"
                        className="px-3 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                        onClick={() => (onCancel ? onCancel() : onDone?.())}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </>
    );
}
