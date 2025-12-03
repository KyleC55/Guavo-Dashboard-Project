import { DateTime } from "luxon";
import type { GqlReservation } from "../hooks/getreservation";

export function formatReservationStart(r: GqlReservation): string {
    const iso =
        r.dateStart ??
        r?.date?.start ??
        null;

    if (!iso) return "";


    const zone = r?.restaurant?.timezone || "UTC";
    const dtUtc = DateTime.fromISO(String(iso), { zone: "utc" });
    if (!dtUtc.isValid) return "";

    const local = dtUtc.setZone(zone);
    return local.isValid ? local.toFormat("ccc, LLL d • t") : "";
}

export function partySize(r: GqlReservation): number | string {
    return (
        r?.table?.reservedPartySize ??
        r?.table?.recommendedPartySize ??
        r?.table?.minPartySize ??
        ""
    );
}

export function teamName(r: GqlReservation): string {
    return ((r as any).teamName ?? (r as any).member?.team ?? "").trim();
}

export function companyName(r: GqlReservation): string {
    return ((r as any).corporation?.name ?? "").trim();
}
