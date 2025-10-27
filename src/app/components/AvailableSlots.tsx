import { useEffect, useMemo, useRef, useState } from "react";
import { DateTime } from "luxon";
import { useRestaurantReservations } from "../hooks/useRestaurantReservations";

const pickStartISO = (r: any) => r?.dateStart ?? r?.date?.start ?? null;
const pickEndISO   = (r: any) => r?.dateEnd   ?? r?.date?.end   ?? null;

const formatRangeFromISO = (startISO?: string | null, endISO?: string | null) => {
    if (!startISO || !endISO) return "All Day";
    const s = DateTime.fromISO(startISO, { zone: "utc" });
    const e = DateTime.fromISO(endISO,   { zone: "utc" });
    if (!s.isValid || !e.isValid) return "All Day";
    return `${s.toFormat("HH:mm")} – ${e.toFormat("HH:mm")}`;
};

// Always return a string UTC date key (skip invalids upstream)
const asUTCDateKey = (iso: string): string | null => {
    const d = DateTime.fromISO(iso, { zone: "utc" });
    return d.isValid ? d.toISODate()! : null; // yyyy-MM-dd (UTC)
};

const niceFromUTCDateKey = (dateKey: string) =>
    DateTime.fromISO(dateKey, { zone: "utc" }).toFormat("ccc, LLL d");

function todayISO_UTC() {
    return DateTime.utc().startOf("day").toISODate()!;
}
function addDaysISO_UTC(isoDay: string, n: number) {
    return DateTime.fromISO(isoDay, { zone: "utc" }).plus({ days: n }).toISODate()!;
}

/* ───────── Time-of-day windows in NY (no date anchoring) ───────── */
const TIME_WINDOWS_NY: Record<string, { startHour: number; endHour: number } | null> = {
    "All Day": null,                       // no filtering
    Breakfast: { startHour: 6,  endHour: 11 }, // 06:00–10:59
    Lunch:     { startHour: 11, endHour: 15 }, // 11:00–14:59
    Dinner:    { startHour: 17, endHour: 22 }, // 17:00–21:59
    "Early Evening": { startHour: 16, endHour: 18 },
    Evening:         { startHour: 18, endHour: 22 },
};

/** true if slot (in NY local) overlaps the named window */
function slotMatchesLabelNY(startISO: string, endISO: string, label: string) {
    const win = TIME_WINDOWS_NY[label] ?? null;
    if (!win) return true; // "All Day" or unknown -> keep all

    const sNY = DateTime.fromISO(startISO, { zone: "utc" }).setZone("America/New_York");
    const eNY = DateTime.fromISO(endISO,   { zone: "utc" }).setZone("America/New_York");
    if (!(sNY.isValid && eNY.isValid)) return false;

    // time-of-day in hours (ignore date)
    const sH = sNY.hour + sNY.minute / 60;
    const eH = eNY.hour + eNY.minute / 60;

    const { startHour: wStart, endHour: wEnd } = win;

    // normal (doesn't cross midnight)
    if (eH >= sH) return sH < wEnd && eH > wStart;

    // crosses midnight: [sH,24) ∪ [0,eH)
    const overlapsLate  = sH < wEnd && 24 > wStart;
    const overlapsEarly = 0 < wEnd && eH > wStart;
    return overlapsLate || overlapsEarly;
}

/* ─────────────────────────── Component ─────────────────────────── */
export function AvailableSlots({
                                   restaurantUuid,
                                   onPick,
                                   days = 30,
                                   autoScrollToFirstFuture = true,
                                   maxHeightRem = 28,
                                   timeWindowNY,
                               }: {
    restaurantUuid: string;
    onPick: (sel: { date: string; time: string; partySize: number }) => void;
    days?: number;
    autoScrollToFirstFuture?: boolean;
    maxHeightRem?: number;
    timeWindowNY?: { label?: string };
}) {
    const fromISO = todayISO_UTC();
    const toISO   = addDaysISO_UTC(fromISO, days);

    const { listed: available, loading, error } = useRestaurantReservations(
        restaurantUuid,
        fromISO,
        toISO,
        1000
    );

    // Only respect labels we know; otherwise default to "All Day"
    const activeLabel = (timeWindowNY?.label && timeWindowNY.label in TIME_WINDOWS_NY)
        ? timeWindowNY.label
        : "All Day";

    type Slot = { startISO: string; endISO: string; label: string };

    const grouped = useMemo(() => {
        const m = new Map<string, Slot[]>();
        for (const r of available) {
            const startISO = pickStartISO(r);
            const endISO   = pickEndISO(r);
            if (!startISO || !endISO) continue;

            if (!slotMatchesLabelNY(startISO, endISO, activeLabel)) continue;

            const dateKey = asUTCDateKey(startISO);
            if (!dateKey) continue;

            const label = formatRangeFromISO(startISO, endISO);
            const arr = m.get(dateKey) ?? [];
            arr.push({ startISO, endISO, label });
            m.set(dateKey, arr);
        }
        // sort + dedupe
        for (const [k, arr] of m) {
            arr.sort((a, b) => (a.startISO < b.startISO ? -1 : a.startISO > b.startISO ? 1 : 0));
            const dedup: Slot[] = [];
            const seen = new Set<string>();
            for (const s of arr) {
                if (!seen.has(s.label)) {
                    seen.add(s.label);
                    dedup.push(s);
                }
            }
            m.set(k, dedup);
        }
        return m;
    }, [available, activeLabel]);

    const daysList = useMemo(
        () =>
            Array.from(grouped.entries())
                .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
                .map(([dateKey, slots]) => ({
                    dateKey,
                    nice: niceFromUTCDateKey(dateKey),
                    slots,
                })),
        [grouped]
    );

    // expand/collapse
    const [expanded, setExpanded] = useState<Set<string>>(new Set());
    const toggleDay = (key: string) =>
        setExpanded(prev => {
            const next = new Set(prev);
            next.has(key) ? next.delete(key) : next.add(key);
            return next;
        });

    // scroll helpers
    const scrollWrapRef = useRef<HTMLDivElement | null>(null);
    const dayRefs = useRef<Record<string, HTMLLIElement | null>>({});

    useEffect(() => {
        if (!autoScrollToFirstFuture || daysList.length === 0) return;
        const firstFuture = daysList.find(d => d.dateKey >= fromISO);
        if (!firstFuture) return;
        const node = dayRefs.current[firstFuture.dateKey];
        const wrap = scrollWrapRef.current;
        if (node && wrap) node.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoScrollToFirstFuture, daysList.length]);

    return (
        <div className="border rounded-2xl overflow-hidden">
            <div className="px-3 py-2 border-b text-sm text-gray-600 sticky top-0 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60 z-10">
                Available (LISTED) slots • {fromISO} → {toISO}
            </div>

            {loading && <div className="p-4 text-sm text-gray-500">Loading reservations…</div>}

            {error && (
                <div className="p-4 text-sm text-red-600">
                    Failed to load reservations.
                    <div className="mt-1 text-xs text-red-500 whitespace-pre-wrap">
                        {(error as any)?.message ??
                            (Array.isArray((error as any)?.graphQLErrors) &&
                                (error as any).graphQLErrors.map((e: any) => e.message).join("\n"))}
                    </div>
                </div>
            )}

            {!loading && !error && daysList.length === 0 && (
                <div className="p-4 text-sm text-gray-500">No available slots in this window.</div>
            )}

            {!loading && !error && daysList.length > 0 && (
                <div
                    ref={scrollWrapRef}
                    className="overflow-auto"
                    style={{ maxHeight: `${maxHeightRem}rem`, scrollBehavior: "smooth" }}
                >
                    <div className="min-w-[720px]">
                        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-gray-200">
                            {daysList.map(({ dateKey, nice, slots }) => {
                                const isOpen = expanded.has(dateKey);
                                const MAX = 8;
                                const visible = isOpen ? slots : slots.slice(0, MAX);
                                const moreCount = Math.max(0, slots.length - visible.length);

                                return (
                                    <li
                                        key={dateKey}
                                        ref={el => (dayRefs.current[dateKey] = el)}
                                        className="bg-white"
                                    >
                                        <div className="w-full h-full p-3">
                                            <div className="text-xs text-gray-500">{nice}</div>
                                            <div className="mt-1 mb-2 text-lg font-semibold">
                                                {slots.length > 0 ? "Available times" : "All Day"}
                                            </div>

                                            <div className="flex flex-wrap gap-2 max-h-52 overflow-auto pr-1">
                                                {visible.map((s, idx) => (
                                                    <button
                                                        key={idx}
                                                        type="button"
                                                        onClick={() =>
                                                            onPick({
                                                                date: dateKey,      // UTC day
                                                                time: s.label,
                                                                partySize: 2,
                                                            })
                                                        }
                                                        className="rounded-full border px-3 py-1 text-sm hover:bg-gray-50"
                                                        title={`Use ${s.label}`}
                                                    >
                                                        {s.label}
                                                    </button>
                                                ))}

                                                {moreCount > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleDay(dateKey)}
                                                        className="rounded-full border px-3 py-1 text-sm bg-gray-50 text-gray-700 hover:bg-gray-100"
                                                        aria-expanded={isOpen}
                                                    >
                                                        +{moreCount} more
                                                    </button>
                                                )}

                                                {isOpen && slots.length > MAX && (
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleDay(dateKey)}
                                                        className="rounded-full border px-3 py-1 text-sm text-gray-700 hover:bg-gray-50"
                                                    >
                                                        Show less
                                                    </button>
                                                )}
                                            </div>

                                            <span className="mt-2 inline-block text-[11px] px-2 py-0.5 rounded bg-green-100 text-green-700">
                        LISTED • {slots.length} slot{slots.length === 1 ? "" : "s"}
                      </span>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
}
