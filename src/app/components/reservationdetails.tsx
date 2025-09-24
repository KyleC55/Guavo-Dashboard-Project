import type { GqlReservation } from "../hooks/getreservation";


const toDate = (ms?: string | null) => (ms ? new Date(Number(ms)) : null);
const fmt = (d?: Date | null) => (d ? d.toLocaleString() : "—");

type Props = { reservation: GqlReservation };

export default function ReservationDetails({ reservation: r }: Props) {
    const startStr = fmt(toDate(r?.date?.start));

    const party =
        r.table?.reservedPartySize ??
        r.table?.recommendedPartySize ??
        r.table?.minPartySize ??
        "—";

    const fullName =
        [r.member?.firstName, r.member?.lastName].filter(Boolean).join(" ").trim() || "—";

    return (
        <div className="space-y-6">
            {/* crumb line under title */}
            <div className="text-sm text-gray-600">
                <span className="text-blue-700">{r.restaurant?.name ?? "—"}</span>
                <span className="mx-2">•</span>
                {startStr}
            </div>

            {/* tabs look (static) */}
            <div className="flex gap-2">
                <button className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium">Details</button>
                <button className="rounded-full px-3 py-1 text-sm text-gray-500 hover:bg-gray-50">
                    History
                </button>
            </div>

            {/* two-column summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                    <div className="text-sm text-gray-500">Venue</div>
                    <div className="font-medium">{r.restaurant?.name ?? "—"}</div>
                    <div className="text-xs text-gray-500">{r.restaurant?.timezone ?? "—"}</div>
                </div>

                <div>
                    <div className="text-sm text-gray-500">Booker</div>
                    <div className="font-medium">{fullName}</div>
                    <div className="text-sm text-blue-700">{r.member?.email ?? "—"}</div>
                </div>

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

                <div className="flex items-center gap-4">
                    <div>
                        <div className="text-sm text-gray-500">Status</div>
                        <StatusPill status={r.status} />
                    </div>
                    <div>
                        <div className="text-sm text-gray-500">Source</div>
                        <SourcePill value={(r as any).type as string} />
                    </div>
                </div>

                <div className="sm:col-span-2">
                    <div className="text-sm text-gray-500 mb-1">Notes</div>
                    <div className="rounded-lg border bg-gray-50 px-3 py-2 text-sm text-gray-700">
                        {r.note?.trim() || "—"}
                    </div>
                </div>
            </div>
        </div>
    );
}
