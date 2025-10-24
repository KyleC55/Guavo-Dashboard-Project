import React, { useMemo, useState } from "react";
import { useRestaurantReservations } from "../hooks/useRestaurantReservations";

const TIME_BUCKETS = [
    { key: "breakfast", label: "Breakfast (05–11)", start: 5,  end: 11 },
    { key: "lunch",     label: "Lunch (11–15)",     start: 11, end: 15 },
    { key: "dinner",    label: "Dinner (17–23)",    start: 17, end: 23 },
];

function toHourNum(time: string): number {
    if (!time || /all\s*day/i.test(time)) return 12;
    const [h, m] = time.split(":").map(Number);
    return (Number.isFinite(h) ? h : 12) + (Number.isFinite(m) ? m / 60 : 0);
}
function inBucket(hour: number, b: { start: number; end: number }) {
    return hour >= b.start && hour < b.end;
}
function todayISO() { const d = new Date(); d.setHours(0,0,0,0); return d.toISOString().slice(0,10); }
function addDaysISO(iso: string, n: number) {
    const d = new Date(iso + "T00:00:00"); d.setDate(d.getDate() + n); d.setHours(0,0,0,0);
    return d.toISOString().slice(0,10);
}

const STATUS_BADGE: Record<string, string> = {
    LISTED:   "bg-green-100 text-green-700",
    RESERVED: "bg-amber-100 text-amber-700",
    RELEASED: "bg-gray-100 text-gray-600",
};

export default function ReservationPicker({
                                              restaurantUuid,
                                              onPick,
                                              days = 30,
                                          }: {
    restaurantUuid: string;
    onPick: (sel: { date: string; time: string; partySize: number }) => void;
    days?: number;
}) {
    const from = todayISO();
    const to = addDaysISO(from, days);

    const { items, loading, error } = useRestaurantReservations(restaurantUuid, from, to, 500);

    const [filters, setFilters] = useState({
        breakfast: false,
        lunch: true,
        dinner: true,
        minParty: 1,
        maxParty: 20,
        onlyAvailable: true, // AVAILABLE == status === "LISTED"
    });

    const filtered = useMemo(() => {
        const activeBuckets = TIME_BUCKETS.filter(b => (filters as any)[b.key]);
        return items.filter(r => {
            const status = (r.status || "").toUpperCase();
            if (filters.onlyAvailable && status !== "LISTED") return false; // only show bookable
            if (r.partySize < filters.minParty || r.partySize > filters.maxParty) return false;
            if (activeBuckets.length === 0) return true;
            const hour = toHourNum(r.time);
            return activeBuckets.some(b => inBucket(hour, b));
        });
    }, [items, filters]);

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
                        {filtered.map(r => {
                            const status = (r.status || "").toUpperCase();
                            const isAvailable = status === "LISTED";
                            return (
                                <li key={r.uuid} className="bg-white">
                                    <button
                                        type="button"
                                        onClick={() => onPick({ date: r.date, time: r.time, partySize: r.partySize })}
                                        className={`w-full h-full text-left p-3 hover:bg-gray-50 transition ${
                                            !isAvailable ? "opacity-60 cursor-not-allowed" : ""
                                        }`}
                                        disabled={!isAvailable}
                                        title={isAvailable ? "Use this slot" : status}
                                    >
                                        <div className="text-xs text-gray-500">{new Date(r.date).toDateString()}</div>
                                        <div className="text-lg font-semibold">{r.time || "All Day"}</div>
                                        <div className="text-sm text-gray-700">{r.partySize} guests</div>
                                        <span className={`mt-1 inline-block text-[11px] px-2 py-0.5 rounded ${STATUS_BADGE[status] ?? "bg-gray-100 text-gray-600"}`}>
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
