import React, { useMemo, useState } from "react";
// @ts-ignore - project lacks typed declaration for luxon in this workspace
import { DateTime } from "luxon";
import { useRestaurantReservations } from "../hooks/useRestaurantReservations";

const TIME_BUCKETS = [
    { key: "breakfast", label: "Breakfast (05–11)", start: 5, end: 11 },
    { key: "lunch", label: "Lunch (11–15)", start: 11, end: 15 },
    { key: "dinner", label: "Dinner (17–23)", start: 17, end: 23 },
];

type NormalizedReservation = {
    raw: any;
    status: string;
    startISO: string | null;
    dateKey: string | null;
    dateLabel: string;
    timeLabel: string;
    hourNY: number | null;
    partySize: number | null;
};

const derivePartySize = (reservation: any): number | null => {
    const r = reservation ?? {};
    const table = r.table ?? {};
    const candidates = [
        r.partySize,
        table?.reservedPartySize,
    ];

    for (const value of candidates) {
        if (typeof value === "number" && Number.isFinite(value) && value > 0) {
            return value;
}
    }
    return null;
};

const normalizeReservation = (reservation: any): NormalizedReservation => {
    const status = (reservation?.status ?? "").toString().toUpperCase();
    const startISO = reservation?.dateStart ?? reservation?.date?.start ?? null;
    const startNY = startISO ? DateTime.fromISO(startISO, { zone: "utc" }).setZone("America/New_York") : null;
    const dateKey = startNY && startNY.isValid ? startNY.toISODate() : null;
    const dateLabel = startNY && startNY.isValid ? startNY.toFormat("ccc, LLL d") : "—";
    const timeLabel = startNY && startNY.isValid ? startNY.toFormat("HH:mm") : "All Day";
    const hourNY = startNY && startNY.isValid ? startNY.hour + startNY.minute / 60 : null;
    const partySize = derivePartySize(reservation);

    return {
        raw: reservation,
        status,
        startISO,
        dateKey,
        dateLabel,
        timeLabel,
        hourNY,
        partySize,
    };
};

const STATUS_BADGE: Record<string, string> = {
    LISTED:   "bg-green-100 text-green-700",
    RESERVED: "bg-amber-100 text-amber-700",
    RELEASED: "bg-gray-100 text-gray-600",
};

export default function ReservationPicker(props: {
    restaurantUuid: string;
    onPick: (sel: { date: string; time: string; partySize: number }) => void;
    days?: number;
}) {
    const { restaurantUuid, onPick } = props;
    const { items, loading, error } = useRestaurantReservations(restaurantUuid, { limit: 500 });

    const [filters, setFilters] = useState({
        breakfast: false,
        lunch: true,
        dinner: true,
        minParty: 1,
        maxParty: 20,
        onlyAvailable: true, // AVAILABLE == status === "LISTED"
        strictParty: true,
    });

    const normalized = useMemo(() => {
        const source = Array.isArray(items) ? items : [];
        return source.map(normalizeReservation);
    }, [items]);

    const filtered = useMemo(() => {
        const activeBuckets = TIME_BUCKETS.filter(b => (filters as any)[b.key]);
        return normalized.filter(entry => {
            if (filters.onlyAvailable && entry.status !== "LISTED") return false; // only show bookable
            if (filters.strictParty) {
                if (entry.partySize == null) return false;
                if (entry.partySize < filters.minParty || entry.partySize > filters.maxParty) return false;
            }
            if (activeBuckets.length === 0) return true;
            if (entry.hourNY == null) return false;
            return activeBuckets.some(b => entry.hourNY! >= b.start && entry.hourNY! < b.end);
        });
    }, [normalized, filters]);

    return (
        <div className="space-y-3">
            {/* Filters */}
            <div className="flex items-center gap-3 flex-wrap">
                {TIME_BUCKETS.map(b => (
                    <label key={b.key} className="inline-flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            className="rounded border-gray-300"
                            checked={(filters as any)[b.key]}
                            onChange={e => setFilters(prev => ({ ...prev, [b.key]: e.target.checked }))}
                        />
                        {b.label}
                    </label>
                ))}

                <label className="inline-flex items-center gap-2 text-sm">
                    <input
                        type="checkbox"
                        className="rounded border-gray-300"
                        checked={filters.onlyAvailable}
                        onChange={e => setFilters(prev => ({ ...prev, onlyAvailable: e.target.checked }))}
                    />
                    Only available (LISTED)
                </label>

                <label className="inline-flex items-center gap-2 text-sm">
                    <input
                        type="checkbox"
                        className="rounded border-gray-300"
                        checked={filters.strictParty}
                        onChange={e => setFilters(prev => ({ ...prev, strictParty: e.target.checked }))}
                    />
                    Match guest range
                </label>

                <div className="ml-auto flex items-center gap-2 text-sm">
                    <span>Party</span>
                    <input
                        type="number"
                        className="w-16 rounded border px-2 py-1"
                        min={1}
                        value={filters.minParty}
                        onChange={e => setFilters(prev => ({ ...prev, minParty: Math.max(1, Number(e.target.value || 1)) }))}
                    />
                    <span>–</span>
                    <input
                        type="number"
                        className="w-16 rounded border px-2 py-1"
                        min={filters.minParty}
                        value={filters.maxParty}
                        onChange={e =>
                            setFilters(prev => ({ ...prev, maxParty: Math.max(prev.minParty, Number(e.target.value || prev.minParty)) }))
                        }
                    />
                </div>
            </div>

            {/* Grid */}
            <div className="border rounded-2xl overflow-hidden">
                {loading && <div className="p-4 text-sm text-gray-500">Loading reservations…</div>}
                {error && <div className="p-4 text-sm text-red-600">Failed to load reservations.</div>}
                {!loading && filtered.length === 0 && (
                    <div className="p-4 text-sm text-gray-500">No reservations match filters.</div>
                )}

                {filtered.length > 0 && (
                    <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-px bg-gray-200">
                        {filtered.map(entry => {
                            const { raw, status, partySize, dateLabel, timeLabel, dateKey, startISO } = entry;
                            const isAvailable = status === "LISTED";
                            const badge = STATUS_BADGE[status] ?? "bg-gray-100 text-gray-600";
                            const partyLabel = partySize != null ? `${partySize} guests` : "— guests";
                            const pickDate =
                                dateKey ??
                                (startISO
                                    ? (() => {
                                          const dt = DateTime.fromISO(startISO, { zone: "utc" }).setZone("America/New_York");
                                          return dt.isValid ? dt.toISODate() : "";
                                      })()
                                    : "");
                            const pickPartySize = partySize ?? filters.minParty ?? 1;
                            return (
                                <li key={raw.uuid} className="bg-white">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            onPick({
                                                date: pickDate,
                                                time: timeLabel,
                                                partySize: pickPartySize,
                                            })
                                        }
                                        className={`w-full h-full text-left p-3 hover:bg-gray-50 transition ${
                                            !isAvailable ? "opacity-60 cursor-not-allowed" : ""
                                        }`}
                                        disabled={!isAvailable}
                                        title={isAvailable ? "Use this slot" : status}
                                    >
                                        <div className="text-xs text-gray-500">{dateLabel}</div>
                                        <div className="text-lg font-semibold">{timeLabel}</div>
                                        <div className="text-sm text-gray-700">{partyLabel}</div>
                                        <span className={`mt-1 inline-block text-[11px] px-2 py-0.5 rounded ${badge}`}>
                      {status}
                    </span>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
}
