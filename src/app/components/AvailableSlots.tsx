import React, { useEffect, useMemo, useRef, useState } from "react";
// @ts-ignore - project lacks typed declaration for luxon in this workspace
import { DateTime } from "luxon";
import { useRestaurantReservations } from "../hooks/useRestaurantReservations";

type ThinReservation = {
    uuid: string;
    status?: string | null;
    createdAt?: string | null;
    dateStart?: string | null;
    dateEnd?: string | null;
    date?: { start?: string | null; end?: string | null } | null;
    table?: {
        label?: string | null;
        type?: string | null;
        location?: string | null;
        reservedPartySize?: number | null;
        recommendedPartySize?: number | null;
        minPartySize?: number | null;
        maxPartySize?: number | null;
    } | null;
};

const toPositiveNumber = (value: unknown): number | null => {
    const num = typeof value === "number" ? value : Number(value);
    return Number.isFinite(num) && num > 0 ? num : null;
};

type SlotPick = {
    date: string;
    time: string;
    partySize: number;
    startAtISO?: string;
    reservationUuid?: string;
    table?: {
        label?: string | null;
        type?: string | null;
        location?: string | null;
    } | null;
};

const pickStartISO = (r: ThinReservation) => r?.dateStart ?? r?.date?.start ?? null;
const pickEndISO   = (r: ThinReservation) => r?.dateEnd   ?? r?.date?.end   ?? null;

// Helper to parse date from ISO string, MySQL datetime, or numeric timestamp
// MySQL datetime format: "2025-08-26 00:45:00" (already in Eastern time)
const parseDate = (value: string | number | null | undefined): DateTime | null => {
    if (!value) return null;
    
    // If it's a number (timestamp in milliseconds), convert it
    if (typeof value === 'number') {
        const dt = DateTime.fromMillis(value, { zone: "utc" });
        return dt.isValid ? dt : null;
    }
    
    // If it's a string, try different formats
    if (typeof value === 'string') {
        // Try MySQL datetime format first: "2025-08-26 00:45:00" (already in Eastern time)
        // This format is common from MySQL databases
        const mysqlDateTimeMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/);
        if (mysqlDateTimeMatch) {
            const dt = DateTime.fromObject({
                year: parseInt(mysqlDateTimeMatch[1], 10),
                month: parseInt(mysqlDateTimeMatch[2], 10),
                day: parseInt(mysqlDateTimeMatch[3], 10),
                hour: parseInt(mysqlDateTimeMatch[4], 10),
                minute: parseInt(mysqlDateTimeMatch[5], 10),
                second: parseInt(mysqlDateTimeMatch[6], 10),
            }, { zone: "America/New_York" }); // Already in Eastern time
            return dt.isValid ? dt : null;
        }
        
        // Try ISO format (assumes UTC)
        let dt = DateTime.fromISO(value, { zone: "utc" });
        if (dt.isValid) return dt;
        
        // Try parsing as numeric string (timestamp)
        const num = Number(value);
        if (!isNaN(num) && isFinite(num)) {
            dt = DateTime.fromMillis(num, { zone: "utc" });
            if (dt.isValid) return dt;
        }
    }
    
    return null;
};

const asNYDateKey = (iso: string | number | null | undefined): string | null => {
    if (!iso) {
        return null;
    }
    
    const dt = parseDate(iso);
    if (!dt) {
        return null;
    }
    
    // If parseDate already returned a DateTime in Eastern time (from MySQL format),
    // we don't need to convert again. Otherwise, convert from UTC to Eastern.
    // parseDate returns dates in their original timezone, so we ensure it's in Eastern
    const d = dt.zoneName === "America/New_York" ? dt : dt.setZone("America/New_York");
    if (!d.isValid) {
        return null;
    }
    
    const dateKey = d.toISODate();
    return dateKey ?? null;
};

const niceFromNYDateKey = (dateKey: string) => {
    const date = DateTime.fromISO(dateKey, { zone: "America/New_York" });
    if (!date.isValid) return dateKey;
    
    const today = DateTime.now().setZone("America/New_York").startOf("day");
    const tomorrow = today.plus({ days: 1 });
    const dateStart = date.startOf("day");
    
    if (dateStart.equals(today)) {
        return "Today";
    } else if (dateStart.equals(tomorrow)) {
        return "Tomorrow";
    } else {
        return date.toFormat("cccc, LLL d");
    }
};

const formatRangeFromISO = (startISO?: string | number | null, endISO?: string | number | null) => {
    if (!startISO) return "All Day";
    
    // Parse date (handles MySQL datetime, ISO strings, and numeric timestamps)
    const sDt = parseDate(startISO);
    if (!sDt) return "All Day";
    // parseDate already handles timezone, so ensure it's in Eastern
    const s = sDt.zoneName === "America/New_York" ? sDt : sDt.setZone("America/New_York");
    if (!s.isValid) return "All Day";
    
    const eDt = endISO ? parseDate(endISO) : null;
    const e = eDt ? (eDt.zoneName === "America/New_York" ? eDt : eDt.setZone("America/New_York")) : null;
    
    if (!(e && e.isValid) || e <= s) return s.toFormat("h:mm a");
    return `${s.toFormat("h:mm a")} – ${e.toFormat("h:mm a")}`;
};

const TIME_WINDOWS_NY: Record<string, { startHour: number; endHour: number } | null> = {
    "All Day": null,
    Breakfast: { startHour: 6,  endHour: 11 },
    Lunch:     { startHour: 11, endHour: 15 },
    Dinner:    { startHour: 17, endHour: 22 },
    "Early Evening": { startHour: 16, endHour: 18 },
    Evening:         { startHour: 18, endHour: 22 },
};

function slotMatchesLabelNY(startISO: string | number, endISO: string | number | null, label: string) {
    const win = TIME_WINDOWS_NY[label] ?? null;
    if (!win) return true;
    
    const sDt = parseDate(startISO);
    if (!sDt) return false;
    // parseDate already handles timezone, so ensure it's in Eastern
    const sNY = sDt.zoneName === "America/New_York" ? sDt : sDt.setZone("America/New_York");
    if (!sNY.isValid) return false;
    
    const eDt = endISO ? parseDate(endISO) : null;
    const eNY = eDt ? (eDt.zoneName === "America/New_York" ? eDt : eDt.setZone("America/New_York")) : null;
    const end = eNY && eNY.isValid ? eNY : sNY.plus({ minutes: 1 });

    const sH = sNY.hour + sNY.minute / 60;
    const eH = end.hour + end.minute / 60;
    const { startHour: wStart, endHour: wEnd } = win;

    if (eH >= sH) return sH < wEnd && eH > wStart;
    const overlapsLate  = sH < wEnd && 24 > wStart;
    const overlapsEarly = 0 < wEnd && eH > wStart;
    return overlapsLate || overlapsEarly;
}

export default function AvailableSlots(props: {
    restaurantUuid: string;
    onPick: (sel: SlotPick) => void;
    days?: number;
    autoScrollToFirstFuture?: boolean;
    maxHeightRem?: number;
    timeWindowNY?: { label?: string };
    dateFilterNY?: string;
    desiredPartySize?: number;
    includeUnknownCapacities?: boolean;
    specificTimeFilter?: string; // Time in format "HH:mm" or "h:mm a" (e.g., "14:30" or "2:30 PM")
}) {
    const {
        restaurantUuid,
        onPick,
        days = 30,
        autoScrollToFirstFuture = true,
        maxHeightRem = 28,
        timeWindowNY,
        dateFilterNY,
        desiredPartySize,
        includeUnknownCapacities = false,
        specificTimeFilter,
    } = props;

    if (!restaurantUuid || restaurantUuid.trim() === "") {
        return (
            <div className="border rounded-2xl p-4 text-sm text-gray-600">
                Pick a restaurant to load reservations.
            </div>
        );
    }

    const { listed: available, loading, error, items: allItems } = useRestaurantReservations(restaurantUuid, {
        limit: 1000,
        offset: 0,
    });
    
    // Debug logging
    useEffect(() => {
        if (restaurantUuid && !loading) {
            console.log('[AvailableSlots]', {
        restaurantUuid,
                availableCount: available?.length ?? 0,
                allItemsCount: allItems?.length ?? 0,
                loading,
                error,
                sampleAvailable: available?.slice(0, 3),
            });
        }
    }, [restaurantUuid, available, allItems, loading, error]);

    const activeLabel =
        timeWindowNY?.label && timeWindowNY.label in TIME_WINDOWS_NY
            ? timeWindowNY.label
            : "All Day";

    const normalizedFilterDate = useMemo(() => {
        if (!dateFilterNY) return null;
        const dt = DateTime.fromISO(dateFilterNY, { zone: "America/New_York" });
        return dt.isValid ? dt.toISODate() : null;
    }, [dateFilterNY]);

    // Normalize specific time filter to minutes since midnight (NY timezone)
    const normalizedSpecificTime = useMemo(() => {
        if (!specificTimeFilter) return null;
        const trimmed = specificTimeFilter.trim();
        if (!trimmed) return null;
        
        // HTML time input returns "HH:mm" format (24-hour), try that first
        let time = DateTime.fromFormat(trimmed, "HH:mm", { zone: "America/New_York" });
        if (!time.isValid) {
            // Try parsing as "h:mm a" format (e.g., "2:30 PM")
            time = DateTime.fromFormat(trimmed, "h:mm a", { zone: "America/New_York" });
        }
        if (!time.isValid) {
            // Try parsing as "h:mma" format (e.g., "2:30PM")
            time = DateTime.fromFormat(trimmed, "h:mma", { zone: "America/New_York" });
        }
        if (!time.isValid) {
            // Try parsing as "H:mm" format (single digit hour, 24-hour)
            time = DateTime.fromFormat(trimmed, "H:mm", { zone: "America/New_York" });
        }
        
        if (!time.isValid) return null;
        
        // Return minutes since midnight
        return time.hour * 60 + time.minute;
    }, [specificTimeFilter]);

    type Slot = {
        startISO: string;
        endISO: string | null;
        label: string;
        reservationUuid: string; // keep uuid (first reservation's UUID when deduplicated)
        reservationUuids?: string[]; // all reservation UUIDs at this time (for deduplicated slots)
        partySize?: number | null;
        min?: number | null;
        max?: number | null;
        table?: {
            label?: string | null;
            type?: string | null;
            location?: string | null;
        } | null;
    };

    const grouped = useMemo(() => {
        const source = (available ?? []) as ThinReservation[];
        console.log('[AvailableSlots] grouped useMemo:', {
            availableCount: available?.length ?? 0,
            sourceCount: source.length,
            activeLabel,
            normalizedFilterDate,
            desiredPartySize,
            includeUnknownCapacities,
            normalizedSpecificTime,
            sampleSource: source.slice(0, 3).map((r: any) => ({
                uuid: r.uuid,
                status: r.status,
                dateStart: r.dateStart || r.date?.start,
                dateEnd: r.dateEnd || r.date?.end,
            })),
        });
        
        const m = new Map<string, Slot[]>();
        let filteredByStartISO = 0;
        let filteredByTimeWindow = 0;
        let filteredBySpecificTime = 0;
        let filteredByPartySize = 0;
        let filteredByDate = 0;
        let processed = 0;

        for (const r of source) {
            processed++;
            const startISO = pickStartISO(r);
            const endISO   = pickEndISO(r);
            if (!startISO) {
                filteredByStartISO++;
                console.log('[AvailableSlots] Filtered out - no startISO:', { uuid: r.uuid, status: r.status });
                continue;
            }

            if (!slotMatchesLabelNY(startISO, endISO ?? null, activeLabel)) {
                filteredByTimeWindow++;
                console.log('[AvailableSlots] Filtered out - time window:', { 
                    uuid: r.uuid, 
                    startISO, 
                    activeLabel,
                    status: r.status 
                });
                continue;
            }

            // Filter by specific time if provided
            // Show slots from 30 minutes before the selected time onwards
            if (normalizedSpecificTime != null) {
                const slotStartDt = parseDate(startISO);
                if (!slotStartDt) {
                    filteredBySpecificTime++;
                    continue;
                }
                // parseDate already handles timezone, so ensure it's in Eastern
                const slotStartNY = slotStartDt.zoneName === "America/New_York" ? slotStartDt : slotStartDt.setZone("America/New_York");
                if (!slotStartNY.isValid) {
                    filteredBySpecificTime++;
                    continue;
                }
                const slotMinutes = slotStartNY.hour * 60 + slotStartNY.minute;
                // Show slots from 30 minutes before selected time onwards
                const minTime = normalizedSpecificTime - 30;
                if (slotMinutes < minTime) {
                    filteredBySpecificTime++;
                    continue;
                }
            }

            const table = r.table ?? null;

            const positiveNumbers = (...values: Array<number | string | null | undefined>) => {
                const result: number[] = [];
                for (const v of values) {
                    const num = toPositiveNumber(v);
                    if (num != null) result.push(num);
                }
                return result;
            };

            const candidateSizes = positiveNumbers(
                table?.reservedPartySize,
                table?.recommendedPartySize,
                table?.maxPartySize,
                table?.minPartySize
            );

            const slotMin =
                typeof table?.minPartySize === "number" && table.minPartySize > 0
                    ? table.minPartySize
                    : candidateSizes.length > 0
                    ? Math.min(...candidateSizes)
                    : null;

            const slotMax =
                typeof table?.maxPartySize === "number" && table.maxPartySize > 0
                    ? table.maxPartySize
                    : candidateSizes.length > 0
                    ? Math.max(...candidateSizes)
                    : null;

            const slotPartySize =
                toPositiveNumber(table?.reservedPartySize) ??
                toPositiveNumber(table?.recommendedPartySize) ??
                slotMax ??
                slotMin;

            if (
                typeof desiredPartySize === "number" &&
                Number.isFinite(desiredPartySize) &&
                desiredPartySize > 0
            ) {
                if (slotMin != null && slotMax != null) {
                    if (desiredPartySize < slotMin || desiredPartySize > slotMax) {
                        filteredByPartySize++;
                        continue;
                    }
                } else if (slotPartySize != null) {
                    if (desiredPartySize > slotPartySize) {
                        filteredByPartySize++;
                        continue;
                    }
                } else if (!includeUnknownCapacities) {
                    filteredByPartySize++;
                    continue;
                }
            } else if (
                !includeUnknownCapacities &&
                slotPartySize == null &&
                slotMin == null &&
                slotMax == null
            ) {
                filteredByPartySize++;
                continue;
            }

            const dateKey = asNYDateKey(startISO);
            if (!dateKey) {
                filteredByDate++;
                console.log('[AvailableSlots] Filtered out - invalid dateKey:', { 
                    uuid: r.uuid, 
                    startISO, 
                    dateKey,
                    status: r.status 
                });
                continue;
            }
            if (normalizedFilterDate && dateKey !== normalizedFilterDate) {
                filteredByDate++;
                console.log('[AvailableSlots] Filtered out - date filter mismatch:', { 
                    uuid: r.uuid, 
                    dateKey, 
                    normalizedFilterDate,
                    status: r.status 
                });
                continue;
            }

            const label = formatRangeFromISO(startISO, endISO);
            const arr = m.get(dateKey) ?? [];
            arr.push({
                startISO,
                endISO: endISO ?? null,
                label,
                reservationUuid: r.uuid,
                partySize: slotPartySize,
                min: slotMin,
                max: slotMax,
                table: table ? {
                    label: table.label ?? null,
                    type: table.type ?? null,
                    location: table.location ?? null,
                } : null,
            });
            m.set(dateKey, arr);
        }

        for (const [k, arr] of m) {
            arr.sort((a, b) => (a.startISO < b.startISO ? -1 : a.startISO > b.startISO ? 1 : 0));
            
            // Group slots by time AND table type/location to show separate boxes for different seating
            const slotMap = new Map<string, Slot>();
            for (const slot of arr) {
                // Use time + table identifier as the key to separate different seating types
                const timeDt = parseDate(slot.startISO);
                if (!timeDt) continue;
                // parseDate already handles timezone, so ensure it's in Eastern
                const timeNY = timeDt.zoneName === "America/New_York" ? timeDt : timeDt.setZone("America/New_York");
                if (!timeNY.isValid) continue;
                const timeKey = timeNY.toFormat("HH:mm"); // e.g., "12:30"
                
                // Create a unique key that includes table type/location to separate different seating
                const tableKey = slot.table 
                    ? `${slot.table.location || ''}-${slot.table.type || ''}-${slot.table.label || ''}`
                    : 'default';
                const uniqueKey = `${timeKey}-${tableKey}`;
                
                const existing = slotMap.get(uniqueKey);
                
                if (existing) {
                    // Combine min/max: take the minimum of mins, maximum of maxes
                    const existingMin = existing.min ?? null;
                    const existingMax = existing.max ?? null;
                    const slotMin = slot.min ?? null;
                    const slotMax = slot.max ?? null;
                    const combinedMin = existingMin !== null && slotMin !== null 
                        ? Math.min(existingMin, slotMin) 
                        : (existingMin ?? slotMin ?? null);
                    const combinedMax = existingMax !== null && slotMax !== null 
                        ? Math.max(existingMax, slotMax) 
                        : (existingMax ?? slotMax ?? null);
                    
                    // Track all reservation UUIDs for this time+table combination
                    if (!existing.reservationUuids) {
                        existing.reservationUuids = [existing.reservationUuid];
                    }
                    existing.reservationUuids.push(slot.reservationUuid);
                    
                    // Update the existing slot with combined values
                    existing.min = combinedMin;
                    existing.max = combinedMax;
                    // Keep the first reservation UUID as the primary one
                } else {
                    // First slot with this time+table combination, add it
                    slotMap.set(uniqueKey, { ...slot });
                }
            }
            
            // Convert back to array
            m.set(k, Array.from(slotMap.values()));
        }
        
        const finalSlots = Array.from(m.values()).flat();
        console.log('[AvailableSlots] Filtering summary:', {
            totalProcessed: processed,
            filteredByStartISO,
            filteredByTimeWindow,
            filteredBySpecificTime,
            filteredByPartySize,
            filteredByDate,
            finalSlotsCount: finalSlots.length,
            datesWithSlots: Array.from(m.keys()),
            sampleFinalSlots: finalSlots.slice(0, 3),
            mapSize: m.size,
            entries: Array.from(m.entries()).map(([date, slots]) => ({ date, slotCount: slots.length })),
        });
        
        return m;
    }, [available, activeLabel, normalizedFilterDate, desiredPartySize, includeUnknownCapacities, normalizedSpecificTime]);

    // Helper function to determine meal period
    const getMealPeriod = (startISO: string | number): "Breakfast" | "Lunch" | "Dinner" | null => {
        const slotDt = parseDate(startISO);
        if (!slotDt) return null;
        // parseDate already handles timezone, so ensure it's in Eastern
        const slotNY = slotDt.zoneName === "America/New_York" ? slotDt : slotDt.setZone("America/New_York");
        if (!slotNY.isValid) return null;
        const hour = slotNY.hour;
        if (hour >= 6 && hour < 11) return "Breakfast";
        if (hour >= 11 && hour < 17) return "Lunch";
        if (hour >= 17 && hour < 22) return "Dinner";
        return null;
    };

    const daysList = useMemo(
        () =>
            Array.from(grouped.entries())
                .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
                .map(([dateKey, slots]) => {
                    // Group slots by meal period when "All Day" is active
                    if (activeLabel === "All Day") {
                        const breakfast: typeof slots = [];
                        const lunch: typeof slots = [];
                        const dinner: typeof slots = [];
                        const other: typeof slots = [];

                        for (const slot of slots) {
                            const period = getMealPeriod(slot.startISO);
                            if (period === "Breakfast") breakfast.push(slot);
                            else if (period === "Lunch") lunch.push(slot);
                            else if (period === "Dinner") dinner.push(slot);
                            else other.push(slot);
                        }

                        return {
                            dateKey,
                            nice: niceFromNYDateKey(dateKey),
                            slots,
                            mealPeriods: {
                                Breakfast: breakfast.length > 0 ? breakfast : null,
                                Lunch: lunch.length > 0 ? lunch : null,
                                Dinner: dinner.length > 0 ? dinner : null,
                                Other: other.length > 0 ? other : null,
                            },
                        };
                    }
                    return {
                    dateKey,
                        nice: niceFromNYDateKey(dateKey),
                    slots,
                        mealPeriods: null,
                    };
                }),
        [grouped, activeLabel]
    );

    const [expanded, setExpanded] = useState<Set<string>>(new Set());
    const toggleDay = (key: string) =>
        setExpanded((prev) => {
            const next = new Set(prev);
            next.has(key) ? next.delete(key) : next.add(key);
            return next;
        });

    const scrollWrapRef = useRef<HTMLDivElement | null>(null);
    const dayRefs = useRef<Record<string, HTMLDivElement | null>>({});
    useEffect(() => {
        if (!autoScrollToFirstFuture || daysList.length === 0) return;
        const todayNY = DateTime.now().setZone("America/New_York").toISODate()!;
        const firstFuture = daysList.find((d) => d.dateKey >= todayNY);
        if (!firstFuture) return;
        const node = dayRefs.current[firstFuture.dateKey];
        const wrap = scrollWrapRef.current;
        if (node && wrap) node.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
    }, [autoScrollToFirstFuture, daysList]);

    const rangeLabel = normalizedFilterDate
        ? niceFromNYDateKey(normalizedFilterDate)
        : `${DateTime.utc().toISODate()!} → ${DateTime.utc().plus({ days }).toISODate()!}`;

    return (
        <div className="border rounded-2xl overflow-hidden w-full">
            <div className="px-2.5 py-1.5 border-b text-sm text-gray-600 sticky top-0 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60 z-10">
                Reservations Available For {rangeLabel}
            </div>

            {loading && <div className="p-3 text-sm text-gray-500">Loading reservations…</div>}

            {error && (
                <div className="p-3 text-sm text-red-600">
                    Failed to load reservations.
                    <div className="mt-1 text-xs text-red-500 whitespace-pre-wrap">
                        {(() => {
                            const e: any = error;
                            if (e?.message) return e.message;
                            if (Array.isArray(e?.graphQLErrors) && e.graphQLErrors.length)
                                return e.graphQLErrors.map((x: any) => x?.message ?? String(x)).join("\n");
                            return String(e ?? "");
                        })()}
                    </div>
                </div>
            )}

            {!loading && !error && daysList.length === 0 && (
                <div className="p-3 text-sm text-gray-500">No available slots in this window.</div>
            )}

            {!loading && !error && daysList.length > 0 && (
                <div
                    ref={scrollWrapRef}
                    className="overflow-auto"
                    style={{ maxHeight: `${maxHeightRem}rem`, scrollBehavior: "smooth" }}
                >
                    <div className="min-w-full p-4">
                        {daysList.map(({ dateKey, nice, slots, mealPeriods }) => {
                                const isOpen = expanded.has(dateKey);
                                const MAX = 8;
                            
                            // Render meal period groups if "All Day" is active
                            if (mealPeriods && activeLabel === "All Day") {
                                const renderMealPeriod = (period: "Breakfast" | "Lunch" | "Dinner", periodSlots: typeof slots | null) => {
                                    if (!periodSlots || periodSlots.length === 0) return null;
                                    
                                    const visible = isOpen ? periodSlots : periodSlots.slice(0, MAX);
                                    const moreCount = Math.max(0, periodSlots.length - visible.length);

                                return (
                                        <div key={period} className="mb-6">
                                            <h3 className="text-base font-bold mb-3">{period}</h3>
                                            <div className="grid grid-cols-3 gap-2">
                                                {visible.map((s) => {
                                                    return renderSlotButton(s, dateKey);
                                                })}
                                                {moreCount > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleDay(dateKey)}
                                                        className="rounded-md border border-gray-300 px-3 py-2 text-xs bg-white text-gray-700 hover:bg-gray-50"
                                                    >
                                                        +{moreCount} more
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                };

                                return (
                                    <div
                                        key={dateKey}
                                        ref={(el) => { dayRefs.current[dateKey] = el; }}
                                        className="mb-6"
                                    >
                                        <div className="text-sm font-semibold mb-4">{nice}</div>
                                        {renderMealPeriod("Breakfast", mealPeriods.Breakfast)}
                                        {renderMealPeriod("Lunch", mealPeriods.Lunch)}
                                        {renderMealPeriod("Dinner", mealPeriods.Dinner)}
                                        {mealPeriods.Other && mealPeriods.Other.length > 0 && (
                                            <div className="mb-6">
                                                <div className="grid grid-cols-3 gap-2">
                                                    {mealPeriods.Other.map((s) => renderSlotButton(s, dateKey))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            }

                            // Original layout for specific time windows
                            const visible = isOpen ? slots : slots.slice(0, MAX);
                            const moreCount = Math.max(0, slots.length - visible.length);

                            return (
                                <div
                                    key={dateKey}
                                    ref={(el) => { dayRefs.current[dateKey] = el; }}
                                    className="mb-6"
                                >
                                    <div className="text-sm font-semibold mb-4">{nice}</div>
                                    <div className="grid grid-cols-3 gap-2">
                                        {visible.map((s) => {
                                            return renderSlotButton(s, dateKey);
                                        })}
                                        {moreCount > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleDay(dateKey)}
                                                className="rounded-md border border-gray-300 px-3 py-2 text-xs bg-white text-gray-700 hover:bg-gray-50"
                                                    >
                                                +{moreCount} more
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                );
                            })}
                    </div>
                </div>
            )}
        </div>
    );

    // Helper function to render a slot button
    function renderSlotButton(s: Slot, dateKey: string) {
        const reservation = available?.find(
            (r: ThinReservation) => r.uuid === s.reservationUuid
        );

        const firstPositive = (...vals: Array<number | null | undefined>) => {
            for (const val of vals) {
                const num = toPositiveNumber(val);
                if (num != null) return num;
            }
            return null;
        };

        const slotMin =
            firstPositive(
                s.min,
                reservation?.table?.minPartySize,
                reservation?.table?.recommendedPartySize,
                reservation?.table?.reservedPartySize
            ) ?? null;

        const slotMax =
            firstPositive(
                s.max,
                reservation?.table?.maxPartySize,
                reservation?.table?.reservedPartySize,
                reservation?.table?.recommendedPartySize
            ) ?? slotMin;

        const slotPartySize =
            firstPositive(
                s.partySize,
                reservation?.table?.reservedPartySize,
                reservation?.table?.recommendedPartySize,
                slotMax,
                slotMin
            ) ?? null;

        const tableLabel = (() => {
            const table = s.table ?? reservation?.table;
            if (!table) return null;
            
            const location = table.location?.trim();
            const type = table.type?.trim();
            const label = table.label?.trim();
            
            const value = location || type || label;
            if (!value) return null;
            
            if (/^[a-z][a-zA-Z]*$/.test(value)) {
                return value.charAt(0).toUpperCase() + value.slice(1);
            }
            return value
                .split(/[\s\-_]+/)
                .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');
        })();

        const pickPartySize =
            slotPartySize ??
            (slotMin && slotMax ? Math.max(slotMin, Math.min(slotMax, desiredPartySize ?? slotMin)) : null) ??
            desiredPartySize ??
            slotMin ??
            slotMax ??
            2;

        const tableKey = s.table 
            ? `${s.table.location || ''}-${s.table.type || ''}-${s.table.label || ''}`
            : '';
        const uniqueKey = `${s.reservationUuid}-${s.startISO}-${tableKey}`;

        // Format time for display
        const timeDisplay = (() => {
            const timeDt = parseDate(s.startISO);
            if (!timeDt) return s.label;
            // parseDate already handles timezone, so ensure it's in Eastern
            const timeNY = timeDt.zoneName === "America/New_York" ? timeDt : timeDt.setZone("America/New_York");
            if (!timeNY.isValid) return s.label;
            return timeNY.toFormat("h:mm a");
        })();

        return (
            <button
                key={uniqueKey}
                type="button"
                onClick={() =>
                    onPick({
                        date: dateKey,
                        time: s.label,
                        partySize: pickPartySize,
                        startAtISO: s.startISO,
                        reservationUuid: s.reservationUuid,
                        table: reservation?.table ? {
                            label: reservation.table.label,
                            type: reservation.table.type,
                            location: reservation.table.location,
                        } : null,
                    })
                }
                className="rounded-md px-2 py-1.5 text-xs font-medium text-white hover:opacity-90 transition-opacity"
                style={{ backgroundColor: "#064126" }}
                title={`${timeDisplay}${tableLabel ? ` • ${tableLabel}` : ""}${slotMin && slotMax ? ` • ${slotMin}-${slotMax} guests` : slotMin ? ` • ${slotMin}+ guests` : ""}`}
            >
                <div className="text-center">
                    <div className="font-semibold text-xs whitespace-nowrap">{timeDisplay}</div>
                    {tableLabel && (
                        <div className="text-[10px] opacity-90 mt-0.5">{tableLabel}</div>
                    )}
                    {slotMin && slotMax && slotMin !== slotMax && (
                        <div className="text-[10px] opacity-90 mt-0.5">{slotMin}-{slotMax} guests</div>
                    )}
                    {slotMin && (!slotMax || slotMin === slotMax) && (
                        <div className="text-[10px] opacity-90 mt-0.5">{slotMin} guests</div>
                    )}
                </div>
            </button>
        );
    }
}
