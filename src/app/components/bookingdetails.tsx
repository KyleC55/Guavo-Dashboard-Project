import type { BookingRow } from "../../../types/types.ts";

type Props = {
    row: BookingRow;
    showTitle?: boolean;
};

export function BookingDetails({ row, showTitle = false }: Props) {
    return (
        <div>
            {showTitle && (
                <h2 className="text-2xl font-bold">{`Booking Details - ${row.id}`}</h2>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="md:col-span-2">
                    <p className="text-sm text-gray-600">Booking ID</p>
                    <p className="text-xl font-semibold">{row.id}</p>
                </div>

                <div>
                    <p className="text-sm text-gray-600">Venue</p>
                    <p className="font-medium">{row.venue || "—"}</p>
                </div>

                <div>
                    <p className="text-sm text-gray-600">Booker</p>
                    <p className="font-medium">{row.booker || "—"}</p>
                </div>

                <div>
                    <p className="text-sm text-gray-600">Company</p>
                    <p className="font-medium">
                        {row.company || "—"}{row.role ? ` • ${row.role}` : ""}
                    </p>
                </div>

                <div>
                    <p className="text-sm text-gray-600">Party Size</p>
                    <p className="font-medium">
                        {(row as any).partySize ?? (row as any).partysize ?? "—"}
                        {((row as any).partySize ?? (row as any).partysize) ? " guests" : ""}
                    </p>
                </div>

                <div>
                    <p className="text-sm text-gray-600">Date &amp; Time</p>
                    <p className="font-medium">
                        {row.date ? new Date(row.date).toLocaleString() : "—"}
                    </p>
                </div>

                <div>
                    <p className="text-sm text-gray-600">Status</p>
                    {row.status ? (
                        <span className="inline-block rounded px-2 py-1 text-xs font-medium bg-black text-white">
              {row.status}
            </span>
                    ) : (
                        <span className="text-gray-500">—</span>
                    )}
                </div>

                <div>
                    <p className="text-sm text-gray-600">Source</p>
                    <p className="font-medium">{row.source || "—"}</p>
                </div>

                <div>
                    <p className="text-sm text-gray-600">City</p>
                    <p className="font-medium">{row.city || "—"}</p>
                </div>

                <div className="md:col-span-2">
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{row.email || "—"}</p>
                </div>

                <div className="md:col-span-2">
                    <p className="text-sm text-gray-600">Notes</p>
                    <p className="font-medium whitespace-pre-wrap">{row.notes || "—"}</p>
                </div>
            </div>
        </div>
    );
}
