import React, { useEffect, useMemo, useRef, useState } from "react";
import type { BookingRow } from "../../../types/types.ts";

export type RestaurantOption = { value: string; label: string; meta?: string };

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

    const selected = useMemo(() => options.find(o => o.value === value), [options, value]);
    const filtered = useMemo(() => {
        const s = q.trim().toLowerCase();
        if (!s) return options;
        return options.filter(o => o.label.toLowerCase().includes(s) || o.meta?.toLowerCase().includes(s));
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
                onClick={() => setOpen(o => !o)}
                className={[
                    "w-full rounded-[28px] border bg-white px-4 py-3 text-left shadow-sm hover:shadow",
                    disabled ? "opacity-60 cursor-not-allowed" : "",
                    "flex items-center justify-between",
                ].join(" ")}
            >
                <div className="min-w-0">
                    <div className="text-xs text-gray-500">Restaurant</div>
                    <div className={selected ? "font-extrabold whitespace-nowrap overflow-hidden text-ellipsis" : "text-gray-400"}>
                        {selected ? selected.label : "Select a restaurant"}
                    </div>
                </div>
                <span className="ml-3 text-gray-700">▾</span>
            </button>

            {open && (
                <div ref={panelRef} className="absolute z-50 mt-2 w-full rounded-2xl border bg-white shadow-xl">
                    <div className="p-2 border-b">
                        <input
                            autoFocus
                            value={q}
                            onChange={e => setQ(e.target.value)}
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
                                {filtered.map(o => (
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
                                            <span className="font-medium">{o.label}</span>
                                            {o.meta && <span className="ml-auto text-xs text-gray-500">{o.meta}</span>}
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

/* ─────────────────────────── Pill Blocks UI ─────────────────────────── */
const fmtDate = (iso: string) =>
    new Intl.DateTimeFormat(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
    }).format(new Date(iso)); // → "Tue, Oct 14"

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
    return (
        <div className={`relative ${className}`}>
            <button
                type="button"
                onClick={onClick}
                className={[
                    "w-full rounded-[28px] border bg-white px-5 py-3 text-left shadow-sm hover:shadow transition",
                    active ? "ring-2 ring-gray-300" : "",
                ].join(" ")}
            >
                <div className="flex items-center">
                    <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-500">{label}</div>
                        <div className="text-lg font-extrabold whitespace-nowrap overflow-hidden text-ellipsis">
                            {value}
                        </div>
                    </div>
                    <span className="ml-3 text-gray-700">▾</span>
                </div>
            </button>
            {active && <div className="absolute z-50 mt-2 w-full rounded-2xl border bg-white shadow-xl">{children}</div>}
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
        <div className="flex items-center justify-between p-3">
            <span className="text-sm text-gray-600">Select number of guests</span>
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => onChange(Math.max(min, value - 1))}
                    className="h-9 w-9 rounded-full border text-xl leading-none hover:bg-gray-50"
                >
                    −
                </button>
                <div className="w-10 text-center font-semibold">{value}</div>
                <button
                    type="button"
                    onClick={() => onChange(Math.min(max, value + 1))}
                    className="h-9 w-9 rounded-full border text-xl leading-none hover:bg-gray-50"
                >
                    ＋
                </button>
            </div>
        </div>
    );
}

/* ─────────────────────────── ManualBookingForm ─────────────────────────── */
type Props = {
    onCreate: (data: Omit<BookingRow, "id">) => void;
    onDone?: () => void;
    onCancel?: () => void;
    restaurantOptions: RestaurantOption[];   // pass API results here
    restaurantsLoading?: boolean;
};

type EventType = "Restaurant" | "Catering" | "Private Dining" | "Other";

export default function ManualBookingForm({
                                              onCreate,
                                              onDone,
                                              onCancel,
                                              restaurantOptions,
                                              restaurantsLoading,
                                          }: Props) {
    // top fields
    const [name, setName] = useState("");
    const [team, setTeam] = useState("");
    const [cooperation, setCooperation] = useState("");

    // event type (Restaurant flow)
    const [eventType, setEventType] = useState<EventType>("Restaurant");

    // restaurant (from API)
    const [restaurantId, setRestaurantId] = useState<string>("");
    const selectedRestaurant = useMemo(
        () => restaurantOptions.find(o => o.value === restaurantId),
        [restaurantId, restaurantOptions]
    );

    // pill blocks state
    const [open, setOpen] = useState<"guests" | "date" | "time" | null>(null);
    const [guests, setGuests] = useState(2);
    const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
    const [time, setTime] = useState("All Day");

    // validation
    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = "Required";
    if (eventType === "Restaurant" && !restaurantId) errors.restaurant = "Pick a restaurant";
    if (!date) errors.date = "Required";

    const disabled = !!(errors.name || errors.date || (eventType === "Restaurant" && !restaurantId));

    const submit: React.FormEventHandler<HTMLFormElement> = (e) => {
        e.preventDefault();
        if (disabled) return;

        const payload: Omit<BookingRow, "id"> = {
            venue: selectedRestaurant?.label ?? "",
            city: "",
            booker: name,
            company: team,         // map Team here (adjust if you have dedicated fields)
            role: cooperation,     // map Cooperation here
            partySize: guests,
            date,                  // yyyy-mm-dd (convert to datetime upstream if needed)
            status: "confirmed",
            source: "Manual",
            email: "",
            notes: `Time: ${time}`,
        };

        onCreate(payload);
        onDone?.();
    };

    return (
        <form id="manual-booking-form" onSubmit={submit} className="space-y-6">
            {/* Top: Name / Team / Cooperation */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm mb-1">
                        Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                        className="w-full rounded border px-3 py-2"
                        placeholder="e.g., Q4 Partnership Dinner"
                        value={name}
                        onChange={e => setName(e.target.value)}
                    />
                    {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
                </div>
                <div>
                    <label className="block text-sm mb-1">Team</label>
                    <input
                        className="w-full rounded border px-3 py-2"
                        placeholder="e.g., Sales, Ops"
                        value={team}
                        onChange={e => setTeam(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm mb-1">Cooperation</label>
                    <input
                        className="w-full rounded border px-3 py-2"
                        placeholder="e.g., Partner A"
                        value={cooperation}
                        onChange={e => setCooperation(e.target.value)}
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
                        onChange={e => {
                            const v = e.target.value as EventType;
                            setEventType(v);
                            if (v !== "Restaurant") setRestaurantId("");
                        }}
                    >
                        <option>Restaurant</option>
                        <option>Catering</option>
                        <option>Private Dining</option>
                        <option>Other</option>
                    </select>
                </div>
            </div>

            {/* Restaurant picker */}
            {eventType === "Restaurant" && (
                <div>
                    <RestaurantCombobox
                        options={restaurantOptions}
                        value={restaurantId}
                        onChange={setRestaurantId}
                        loading={restaurantsLoading}
                    />
                    {errors.restaurant && <p className="text-xs text-red-600 mt-1">{errors.restaurant}</p>}
                </div>
            )}

            {/* Pills on ONE ROW */}
            <div className="flex gap-3">
                <Block
                    className="flex-1"
                    label="Guests"
                    value={`${guests} Guest${guests === 1 ? "" : "s"}`}
                    active={open === "guests"}
                    onClick={() => setOpen(open === "guests" ? null : "guests")}
                >
                    <Stepper value={guests} onChange={v => setGuests(v)} />
                </Block>

                <Block
                    className="flex-1"
                    label="Date"
                    value={fmtDate(date)}   // single line like "Tue, Oct 14"
                    active={open === "date"}
                    onClick={() => setOpen(open === "date" ? null : "date")}
                >
                    <div className="p-3">
                        <input
                            type="date"
                            className="w-full rounded-lg border px-3 py-2"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                        />
                        {errors.date && <p className="text-xs text-red-600 mt-1">{errors.date}</p>}
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
                            {["All Day", "12:00", "17:30", "18:00", "18:30", "19:00", "19:30"].map(t => (
                                <li key={t}>
                                    <button
                                        type="button"
                                        onClick={() => setTime(t)}
                                        className={`w-full rounded-md px-3 py-2 text-left hover:bg-gray-50 ${
                                            time === t ? "font-semibold" : ""
                                        }`}
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
                    value={""}
                    onChange={() => {}}
                />
            </div>

            {/* Actions (you can rely on modal footer instead) */}
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
    );
}
