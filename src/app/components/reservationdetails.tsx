import type { GqlReservation } from "../hooks/getreservation"
// @ts-ignore - local workspace lacks luxon type declarations
import { DateTime } from "luxon"

const formatDateTime = (iso?: string | null, restaurantTimezone?: string | null): string => {
    if (!iso) return "—"
    
    // Parse as UTC (backend returns ISO strings in UTC)
    let dt = DateTime.fromISO(String(iso), { zone: "utc" })
    if (!dt.isValid) {
        const n = Number(iso)
        if (!Number.isNaN(n)) {
            dt = DateTime.fromMillis(n, { zone: "utc" })
        }
    }
    if (!dt.isValid) return "—"
    
    // Convert to restaurant's timezone (or UTC if not specified)
    const zone = restaurantTimezone || "UTC"
    const local = dt.setZone(zone)
    if (!local.isValid) return "—"
    
    // Format as: M/d/yyyy, h:mm:ss a (e.g., "2/14/2026, 5:30:00 PM")
    return local.toFormat("M/d/yyyy, h:mm:ss a")
}

type Props = { 
    reservation: GqlReservation;
    showHistoryTab?: boolean;
}

function formatLabel(str: string): string {
    if (!str) return str;
    return str
        .replace(/_/g, " ")
        .split(" ")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ");
}

const STATUS_COLORS: Record<string, string> = {
    LISTED: "bg-gray-200 text-gray-700",
    RESERVED: "bg-green-600 text-white",
    FREE_BOOKED: "bg-blue-600 text-white",
    CASH_BOOKED: "bg-yellow-500 text-white",
    CANCELED: "bg-red-600 text-white",
    RELEASED: "bg-gray-400 text-white",
    CANCEL_PENDING: "bg-orange-500 text-white",
    RESERVATION_PENDING: "bg-purple-600 text-white",
};

const STATUS_LABELS: Record<string, string> = {
    LISTED: "Listed",
    RESERVED: "Reserved",
    FREE_BOOKED: "Free Booked",
    CASH_BOOKED: "Cash Booked",
    CANCELED: "Canceled",
    RELEASED: "Released",
    CANCEL_PENDING: "Cancel Pending",
    RESERVATION_PENDING: "Pending (Manual)",
};

function StatusPill({ status }: { status: string }) {
    const color = STATUS_COLORS[status] ?? "bg-gray-200 text-gray-800";
    const label = STATUS_LABELS[status] ?? formatLabel(status);
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}>
            {label}
    </span>
    )
}

function SourcePill({ value }: { value?: string | null }) {
    const v = value || "—"
    return (
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-800">
      {v}
    </span>
    )
}

function parseNotes(notes?: string | null): {
    bookee?: string;
    occasion?: string;
    dietaryRestrictions?: string;
    dietaryNote?: string;
    additionalRequests?: string;
    other?: string[];
} {
    if (!notes) return { other: [] };
    
    const lines = notes.split('\n').filter(line => line.trim());
    
    const parsed: {
        bookee?: string;
        occasion?: string;
        dietaryRestrictions?: string;
        dietaryNote?: string;
        additionalRequests?: string;
        other?: string[];
    } = {
        other: []
    };
    
    lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith('Bookee:')) {
            parsed.bookee = trimmed.replace('Bookee:', '').trim();
        } else if (trimmed.startsWith('Occasion:')) {
            parsed.occasion = trimmed.replace('Occasion:', '').trim();
        } else if (trimmed.startsWith('Dietary Restrictions:')) {
            parsed.dietaryRestrictions = trimmed.replace('Dietary Restrictions:', '').trim();
        } else if (trimmed.startsWith('Dietary Note:')) {
            parsed.dietaryNote = trimmed.replace('Dietary Note:', '').trim();
        } else if (trimmed.startsWith('Additional Requests:')) {
            parsed.additionalRequests = trimmed.replace('Additional Requests:', '').trim();
        } else if (!trimmed.startsWith('Time:')) {
            // Include other lines but not Time
            parsed.other?.push(trimmed);
        }
    });
    
    return parsed;
}

export default function ReservationDetails({ reservation: r, showHistoryTab = true }: Props) {
    const startISO = (r as any).dateStart ?? r?.date?.start ?? null
    const startStr = formatDateTime(startISO, r?.restaurant?.timezone)

    const party =
        r.table?.reservedPartySize ??
        r.table?.recommendedPartySize ??
        r.table?.minPartySize ??
        "—"

    // Booker is the actor (person who made the booking), not the member (bookee)
    const bookerName = r.actor
        ? [r.actor.firstName, r.actor.lastName].filter(Boolean).join(" ").trim() || r.actor.email || "—"
        : "—"
    const bookerEmail = r.actor?.email ?? "—"

    // Bookee is the member (person the booking is for)
    const bookeeName = r.member
        ? [r.member.firstName, r.member.lastName].filter(Boolean).join(" ").trim() || r.member.email || "—"
        : "—"
    const bookeeEmail = r.member?.email ?? "—"

    const team = r.teamName?.trim() || "—"
    const company = r.corporation?.name?.trim?.() || (r as any).corporate?.name?.trim?.() || "—"

    return (
        <div className="space-y-6">

            {/* tabs look (static) */}
            {showHistoryTab && (
            <div className="flex gap-2">
                <button className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium">Details</button>
                <button className="rounded-full px-3 py-1 text-sm text-gray-500 hover:bg-gray-50">History</button>
            </div>
            )}

            {/* two-column summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="sm:col-span-2">
                    <div className="text-sm text-gray-500">Bookee</div>
                    <div className="font-medium">{bookeeName}</div>
                    {bookeeEmail && bookeeEmail !== "—" && (
                        <div className="text-sm text-blue-700">{bookeeEmail}</div>
                    )}
                </div>

                <div>
                    <div className="text-sm text-gray-500">Venue</div>
                    <div className="font-medium">{r.restaurant?.name ?? "—"}</div>
                    <div className="text-xs text-gray-500">{r.restaurant?.timezone ?? "—"}</div>
                </div>

                <div>
                    <div className="text-sm text-gray-500">Booker</div>
                    <div className="font-medium">{bookerName}</div>
                    {bookerEmail && bookerEmail !== "—" && (
                        <div className="text-sm text-blue-700">{bookerEmail}</div>
                    )}
                </div>

                {team !== "—" && (
                <div>
                    <div className="text-sm text-gray-500">Team</div>
                    <div className="font-medium">{team}</div>
                </div>
                )}

                {company !== "—" && (
                <div>
                    <div className="text-sm text-gray-500">Company</div>
                    <div className="font-medium">{company}</div>
                </div>
                )}

                <div>
                    <div className="text-sm text-gray-500">Party Size</div>
                    <div className="font-medium">
                        {party} {party !== "—" ? "guests" : ""}
                    </div>
                </div>

                <div>
                    <div className="text-sm text-gray-500">Date &amp; Time</div>
                    <div className="font-medium">{startStr}</div>
                </div>

                    <div>
                        <div className="text-sm text-gray-500">Status</div>
                    <div className="flex items-center gap-2">
                        <StatusPill status={r.status} />
                    </div>
                </div>

                    <div>
                        <div className="text-sm text-gray-500">Source</div>
                    <div className="flex items-center gap-2">
                        <SourcePill value={r.type} />
                    </div>
                </div>

                {(() => {
                    const parsed = parseNotes(r.note);
                    return (
                        <>
                            <div>
                                <div className="text-sm text-gray-500">Occasion</div>
                                <div className="font-medium">{parsed.occasion || "—"}</div>
                            </div>
                            <div>
                                <div className="text-sm text-gray-500">Dietary Restrictions</div>
                                <div className="font-medium">{parsed.dietaryRestrictions || "—"}</div>
                            </div>
                            {parsed.dietaryNote && (
                                <div>
                                    <div className="text-sm text-gray-500">Dietary Note</div>
                                    <div className="font-medium">{parsed.dietaryNote}</div>
                                </div>
                            )}
                            <div className="sm:col-span-2">
                                <div className="text-sm text-gray-500 mb-1">Special Requests</div>
                                <div className="rounded-lg border bg-gray-50 px-3 py-2 text-sm text-gray-700">
                                    {parsed.additionalRequests ? (
                                        <div className="whitespace-pre-wrap">{parsed.additionalRequests}</div>
                                    ) : parsed.other && parsed.other.length > 0 ? (
                                        <div className="whitespace-pre-wrap">{parsed.other.join('\n')}</div>
                                    ) : (
                                        "—"
                                    )}
                                </div>
                            </div>
                        </>
                    );
                })()}
            </div>
        </div>
    )
}