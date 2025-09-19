import { useAllReservations } from "../hooks/getreservation.tsx";

const toDate = (ms?: string | null) => (ms ? new Date(Number(ms)) : null)
const fmt = (d?: Date | null) => (d ? d.toLocaleString() : '—')

export default function ReservationsTable() {
    const {
        rows, count, loading, error, refetch,
        limit, offset, setLimit, setOffset, canPrev, canNext,
    } = useAllReservations(25)

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">All Reservations</h2>
                <div className="flex items-center gap-2">
                    <select
                        className="border rounded px-2 py-1"
                        value={limit}
                        onChange={(e) => { setOffset(0); setLimit(Number(e.target.value)) }}
                    >
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>
                    <button className="rounded px-3 py-2 border" onClick={() => refetch()} disabled={loading}>
                        Refresh
                    </button>
                </div>
            </div>

            {error && (
                <div className="rounded border border-red-300 bg-red-50 p-3 text-red-700">
                    {error.message}
                </div>
            )}

            <div className="rounded-xl border overflow-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                    <tr>
                        <th className="text-left p-3">Start</th>
                        <th className="text-left p-3">End</th>
                        <th className="text-left p-3">Restaurant</th>
                        <th className="text-left p-3">Table</th>
                        <th className="text-left p-3">Party</th>
                        <th className="text-left p-3">Status</th>
                        <th className="text-left p-3">Created</th>
                        <th className="text-left p-3">Updated</th>
                    </tr>
                    </thead>
                    <tbody>
                    {loading && rows.length === 0 ? (
                        <tr><td className="p-3" colSpan={8}>Loading…</td></tr>
                    ) : rows.length === 0 ? (
                        <tr><td className="p-3" colSpan={8}>No reservations found.</td></tr>
                    ) : (
                        rows.map((r) => {
                            const start = fmt(toDate(r.date?.start))
                            const end = fmt(toDate(r.date?.end))
                            const created = fmt(toDate(r.createdAt))
                            const updated = fmt(toDate(r.updatedAt))
                            const party =
                                r.table?.reservedPartySize ??
                                r.table?.recommendedPartySize ??
                                r.table?.minPartySize ?? '—'

                            return (
                                <tr key={r.uuid} className="border-t">
                                    <td className="p-3 whitespace-nowrap">{start}</td>
                                    <td className="p-3 whitespace-nowrap">{end}</td>
                                    <td className="p-3">
                                        <div className="font-medium">{r.restaurant?.name ?? '—'}</div>
                                        <div className="text-xs text-gray-500">{r.restaurant?.timezone ?? '—'}</div>
                                    </td>
                                    <td className="p-3">
                                        <div>{r.table?.label ?? r.table?.type ?? '—'}</div>
                                        <div className="text-xs text-gray-500">{r.table?.location ?? '—'}</div>
                                    </td>
                                    <td className="p-3">{party}</td>
                                    <td className="p-3">{r.status}</td>
                                    <td className="p-3 whitespace-nowrap">{created}</td>
                                    <td className="p-3 whitespace-nowrap">{updated}</td>
                                </tr>
                            )
                        })
                    )}
                    </tbody>
                </table>
            </div>

            <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">Showing {rows.length} of {count}</div>
                <div className="flex items-center gap-2">
                    <button
                        className="rounded px-3 py-2 border"
                        onClick={() => setOffset(Math.max(0, offset - limit))}
                        disabled={!canPrev || loading}
                    >
                        Prev
                    </button>
                    <button
                        className="rounded px-3 py-2 border"
                        onClick={() => setOffset(offset + limit)}
                        disabled={!canNext || loading}
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    )
}
