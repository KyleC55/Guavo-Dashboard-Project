import React, { useEffect, useMemo, useRef, useState } from "react";
import type { BookingRow } from "../../../types/types";
import { DateTime } from "luxon";
import { AvailableSlots } from "./AvailableSlots";
import { useMembersForBooking } from "../hooks/getmembers";

export type RestaurantOption = { value: string; label: string; meta?: string };

type Props = {
    onCreate: (data: Omit<BookingRow, "id">) => void;
    onDone?: () => void;
    onCancel?: () => void;
    restaurantOptions: RestaurantOption[];
    restaurantsLoading?: boolean;
};

/* ================= Helpers ================= */
const fmtNYDate = (isoDate: string) =>
    DateTime.fromISO(isoDate, { zone: "America/New_York" }).toFormat("ccc, LLL d");

const fmtNYDateTimeRangeLabel = (dateISO: string, timeLabel: string) => {
    const d = DateTime.fromISO(dateISO, { zone: "America/New_York" });
    return `${d.toFormat("ccc, LLL d")} • ${timeLabel}`;
};

const companyFromEmail = (email?: string | null) => {
    if (!email) return undefined;
    const domain = email.split("@")[1];
    const root = domain?.split(".")[0];
    if (!root) return undefined;
    return root.charAt(0).toUpperCase() + root.slice(1);
};

// Prefer "First Last" if both exist; otherwise fall back gracefully
const displayNameFor = (m: any) => {
    if (!m) return "";
    if (m.firstName && m.lastName) return `${m.firstName} ${m.lastName}`;
    return m.preferredName || m.firstName || m.username || m.email || "";
};

/* ================= Modal ================= */
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

/* ================= Restaurant Combobox ================= */
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

    const selected = useMemo(() => options.find((o) => o.value === value), [options, value]);
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
                    className="absolute z-50 mt-2 w-full rounded-2xl border bg-white shadow-xl overflow-hidden"
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
                    <div className="max-h-64 overflow-auto">
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
                                                onChange(o.value);
                                                setOpen(false);
                                                setQ("");
                                            }}
                                            className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50"
                                        >
                                            <span className="font-medium truncate">{o.label}</span>
                                            {o.meta && <span className="ml-auto text-xs text-gray-500 truncate">{o.meta}</span>}
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

/* ================= Bookee Results Panel (Compact) ================= */
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
            className="absolute z-50 mt-1 w-full rounded-xl border bg-white shadow-lg overflow-hidden"
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
                                    className="w-full flex items-center gap-3 px-3 py-1.5 text-left hover:bg-gray-50"
                                >
                                    <span className="font-medium truncate">{o.label}</span>
                                    {o.meta && (
                                        <span className="ml-auto text-xs text-gray-500 truncate">{o.meta}</span>
                                    )}
                                    {value === o.value && <span className="ml-2 text-xs">✓</span>}
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

/* ================= Blocks / Stepper ================= */
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

/* ================= Main Form ================= */
type EventType = "Restaurant" | "Catering" | "Private Dining" | "Other";

const EVENT_CONFIG: Record<
    EventType,
    { guestLabel: string; min: number; max: number; timeOptions: string[]; requireRestaurant: boolean }
> = {
    Restaurant: { guestLabel: "Guests", min: 2, max: 20, timeOptions: ["All Day", "Breakfast", "Lunch", "Dinner"], requireRestaurant: true },
    "Private Dining": { guestLabel: "Guests", min: 6, max: 60, timeOptions: ["All Day", "Early Evening", "Evening"], requireRestaurant: true },
    Catering: { guestLabel: "Attendees", min: 10, max: 500, timeOptions: ["All Day", "Morning", "Afternoon", "Evening"], requireRestaurant: false },
    Other: { guestLabel: "Attendees", min: 1, max: 200, timeOptions: ["All Day", "Morning", "Afternoon", "Evening"], requireRestaurant: false },
};

export default function ManualBookingForm({
                                              onCreate,
                                              onDone,
                                              onCancel,
                                              restaurantOptions,
                                              restaurantsLoading,
                                          }: Props) {
    // Bookee search + list
    const [bookeeSearch, setBookeeSearch] = useState("");
    const [bookeeOpen, setBookeeOpen] = useState(false);
    const { members, loading: membersLoading } = useMembersForBooking(bookeeSearch);

    const bookeeOptions = useMemo(() => {
        return members.map((m: any) => {
            const label = displayNameFor(m); // ensures "First Last" if available
            const rightMeta =
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

    // Form fields
    const [name, setName] = useState("");
    const [team, setTeam] = useState("");
    const [cooperation, setCooperation] = useState("");

    const [eventType, setEventType] = useState<EventType>("Restaurant");
    const cfg = EVENT_CONFIG[eventType];

    const [restaurantId, setRestaurantId] = useState<string>("");
    const selectedRestaurant = useMemo(
        () => restaurantOptions.find((o) => o.value === restaurantId),
        [restaurantId, restaurantOptions]
    );

    const [open, setOpen] = useState<"guests" | "date" | "time" | null>(null);
    const [guests, setGuests] = useState(cfg.min);
    const _todayNY = DateTime.now().setZone("America/New_York").toISODate()!;
    const [date, setDate] = useState<string>(_todayNY);
    const [time, setTime] = useState(cfg.timeOptions[0]);
    const [notes, setNotes] = useState("");
    const [confirmOpen, setConfirmOpen] = useState(false);

    // Reset type changes
    useEffect(() => {
        setGuests(cfg.min);
        setTime(cfg.timeOptions[0]);
        if (!cfg.requireRestaurant) setRestaurantId("");
    }, [eventType]);

    // Autofill from selected bookee, and reflect label in the input
    useEffect(() => {
        if (!selectedBookee) return;
        const display = displayNameFor(selectedBookee); // <-- "First Last" if available
        setName(display);
        setBookeeSearch(display); // show selected full name in the search box
        if (selectedBookee.team) setTeam(selectedBookee.team);
        if (selectedBookee.cooperation) setCooperation(selectedBookee.cooperation);
    }, [selectedBookee]);

    // Validation
    const errors: Record<string, string> = {};
    if (!bookeeUuid) errors.bookee = "Required";
    if (cfg.requireRestaurant && !restaurantId) errors.restaurant = "Pick a restaurant";
    if (!date) errors.date = "Required";
    const disabled = Object.keys(errors).length > 0;
    const restaurantDisabled = !bookeeUuid;

    // Build payload — booker is the full display name
    const buildPayload = (): Omit<BookingRow, "id"> => ({
        venue: selectedRestaurant?.label ?? "",
        city: "",
        booker: name, // "First Last" if available
        company: team,
        role: cooperation,
        partySize: guests,
        date,
        status: "confirmed",
        source: "Manual",
        email: selectedBookee?.email ?? "",
        notes: `Bookee: ${name}${selectedBookee ? ` (${selectedBookee.uuid})` : ""}\nTime: ${time}${notes ? `\n${notes}` : ""}`,
    });

    const submit: React.FormEventHandler<HTMLFormElement> = (e) => {
        e.preventDefault();
        if (disabled) return;
        onCreate(buildPayload());
        onDone?.();
    };

    const onPickSlot = ({ date: d, time: t, partySize }: { date: string; time: string; partySize: number }) => {
        setDate(d);
        setTime(t || "All Day");
        const bounded = Math.max(cfg.min, Math.min(cfg.max, partySize));
        setGuests(bounded);
        setOpen(null);
        setConfirmOpen(true);
    };

    const confirmFooter = (
        <div className="flex justify-end gap-2">
            <button type="button" className="px-3 py-2 rounded border hover:bg-gray-100" onClick={() => setConfirmOpen(false)}>
                Back
            </button>
            <button
                type="button"
                className="px-4 py-2 rounded bg-black text-white hover:bg-neutral-800"
                onClick={() => {
                    onCreate(buildPayload());
                    setConfirmOpen(false);
                    onDone?.();
                }}
            >
                Confirm booking
            </button>
        </div>
    );

    return (
        <>
            {/* Confirm modal */}
            <Modal title="Confirm booking" open={confirmOpen} onClose={() => setConfirmOpen(false)} footer={confirmFooter}>
                <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-3">
                        <div className="w-24 text-gray-500">Bookee</div>
                        <div className="font-medium">
                            {selectedBookee ? `${name} (${selectedBookee.email})` : "—"}
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-24 text-gray-500">Restaurant</div>
                        <div className="font-medium">
                            {selectedRestaurant?.label || "—"}
                            {selectedRestaurant?.meta && <div className="text-xs text-gray-500 mt-0.5">{selectedRestaurant.meta}</div>}
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-24 text-gray-500">When</div>
                        <div className="font-medium">{fmtNYDateTimeRangeLabel(date, time)}</div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-24 text-gray-500">{cfg.guestLabel}</div>
                        <div className="font-medium">{guests}</div>
                    </div>
                    {(team || cooperation) && (
                        <div className="flex items-start gap-3">
                            <div className="w-24 text-gray-500">Details</div>
                            <div className="font-medium">
                                {team && <div>Team: {team}</div>}
                                {cooperation && <div>Cooperation: {cooperation}</div>}
                            </div>
                        </div>
                    )}
                    {notes && (
                        <div className="flex items-start gap-3">
                            <div className="w-24 text-gray-500">Notes</div>
                            <div className="font-medium whitespace-pre-wrap">{notes}</div>
                        </div>
                    )}
                    <div className="pt-2 text-xs text-gray-500">Times shown are local to America/New_York.</div>
                </div>
            </Modal>

            {/* Main form */}
            <form id="manual-booking-form" onSubmit={submit} className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
                {/* === Bookee / Team / Cooperation === */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Bookee search + results (no select box) */}
                    <div className="relative">
                        <label className="block text-sm mb-1">
                            Bookee <span className="text-rose-500">*</span>
                        </label>

                        <input
                            className="w-full rounded border px-3 py-2"
                            placeholder="Search by name"
                            value={bookeeSearch}
                            onFocus={() => setBookeeOpen(true)}
                            onChange={(e) => {
                                setBookeeSearch(e.target.value);
                                setBookeeOpen(true);
                            }}
                        />

                        {/* Results dropdown, anchored under the input */}
                        <BookeeResults
                            options={bookeeOptions}
                            value={bookeeUuid}
                            onChange={setBookeeUuid}
                            query={bookeeSearch}
                            open={bookeeOpen}
                            onOpenChange={setBookeeOpen}
                            loading={membersLoading}
                        />

                        {!bookeeUuid && <p className="text-xs text-red-600 mt-1">Required</p>}
                    </div>

                    {/* Team */}
                    <div>
                        <label className="block text-sm mb-1">Team</label>
                        <input
                            className="w-full rounded border px-3 py-2"
                            placeholder="e.g., Sales, Ops"
                            value={team}
                            onChange={(e) => setTeam(e.target.value)}
                        />
                    </div>

                    {/* Cooperation */}
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

                {/* Event Type */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm mb-1">Event Type</label>
                        <select
                            className="w-full rounded border px-3 py-2"
                            value={eventType}
                            onChange={(e) => setEventType(e.target.value as EventType)}
                        >
                            <option>Restaurant</option>
                            <option>Catering</option>
                            <option>Private Dining</option>
                            <option>Other</option>
                        </select>
                    </div>
                </div>

                {/* Restaurant picker + Available slots */}
                {cfg.requireRestaurant && (
                    <div className="space-y-3">
                        <RestaurantCombobox
                            options={restaurantOptions}
                            value={restaurantId}
                            onChange={setRestaurantId}
                            loading={restaurantsLoading}
                            disabled={restaurantDisabled}
                        />
                        {!restaurantId && !restaurantDisabled && (
                            <p className="text-xs text-red-600 mt-1">Pick a restaurant</p>
                        )}
                        {restaurantDisabled && (
                            <p className="text-xs text-gray-500 mt-1">
                                Select a bookee to choose a restaurant.
                            </p>
                        )}

                        {restaurantId && (
                            <AvailableSlots
                                restaurantUuid={restaurantId}
                                onPick={onPickSlot}
                                autoScrollToFirstFuture
                                maxHeightRem={28}
                                timeWindowNY={{ label: time }}
                            />
                        )}
                    </div>
                )}

                {/* Guests / Date / Time */}
                <div className="flex gap-3">
                    <Block
                        className="flex-1"
                        label={cfg.guestLabel}
                        value={`${guests} ${cfg.guestLabel}`}
                        active={open === "guests"}
                        onClick={() => setOpen(open === "guests" ? null : "guests")}
                    >
                        <Stepper value={guests} onChange={(v) => setGuests(v)} min={cfg.min} max={cfg.max} />
                    </Block>

                    <Block
                        className="flex-1"
                        label="Date"
                        value={fmtNYDate(date)}
                        active={open === "date"}
                        onClick={() => setOpen(open === "date" ? null : "date")}
                    >
                        <div className="p-3">
                            <input
                                type="date"
                                className="w-full rounded-lg border px-3 py-2"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                            />
                            {!date && <p className="text-xs text-red-600 mt-1">Required</p>}
                        </div>
                    </Block>

                    <Block
                        className="flex-1"
                        label="Time"
                        value={time}
                        active={open === "time"}
                        onClick={() => setOpen(open === "time" ? null : "time")}
                    >
                        <div className="p-2">
                            <ul className="text-sm">
                                {cfg.timeOptions.map((t) => (
                                    <li key={t}>
                                        <button
                                            type="button"
                                            onClick={() => setTime(t)}
                                            className={`w-full rounded-md px-3 py-2 text-left hover:bg-gray-50 ${time === t ? "font-semibold" : ""}`}
                                        >
                                            {t}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </Block>
                </div>

                {/* Notes */}
                <div>
                    <label className="block text-sm mb-1">Notes</label>
                    <textarea
                        className="w-full rounded border px-3 py-2"
                        rows={3}
                        placeholder="Any special requests…"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-1">
                    <button
                        type="button"
                        className="px-3 py-2 rounded border hover:bg-gray-100"
                        onClick={() => (onCancel ? onCancel() : onDone?.())}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={disabled}
                        className="px-4 py-2 rounded bg-black text-white hover:bg-neutral-800 disabled:opacity-60"
                    >
                        Confirm
                    </button>
                </div>
            </form>
        </>
    );
}
