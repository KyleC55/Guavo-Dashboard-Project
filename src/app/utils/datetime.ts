import { DateTime } from "luxon";

export function makeStartAtISO(dateStr: string, timeStr: string, tz?: string) {
    const local = DateTime.fromISO(`${dateStr}T${timeStr}`, { zone: tz || "UTC" });
    if (!local.isValid) throw new Error("Invalid date or time");
    return local.toUTC().toISO({ suppressMilliseconds: true });
}
