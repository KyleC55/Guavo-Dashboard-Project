import { useMemo, useState } from "react";
import type { BookingRow } from "../../../types/types.ts";

type Props = {
    rows: BookingRow[];
    onDelete?: (id: string) => void;
    onView?: (row: BookingRow) => void;
    onEdit?: (row: BookingRow) => void;
    onCancel?: (id: string) => void;
    onCancelMany?: (ids: string[]) => void;
    onEditMany?: (ids: string[]) => void;
};

const StatusPill: React.FC<{ status: BookingRow["status"] }> = ({ status }) => {
    const colors: Record<BookingRow["status"], string> = {
        confirmed: "bg-black text-white",
        pending: "bg-amber-500/95 text-white",
        cancelled: "bg-red-500/95 text-white",
        rejected: "bg-gray-400 text-white",
    };

    return (
        <span
            className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${
                colors[status] || "bg-gray-200 text-gray-800"
            }`}
        >
      {status}
    </span>
    );
};

const SourceBadge: React.FC<{ source: BookingRow["source"] }> = ({ source }) => (
    <span className="inline-block rounded-md px-2 py-1 text-xs bg-blue-100 text-blue-700">
    {source}
  </span>
);

export default function BookingsTable({
                                          rows,
                                          onDelete,
                                          onView,
                                          onEdit,
                                          onCancel,
                                          onCancelMany,
                                          onEditMany,
                                      }: Props) {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
    const allSelected = rows.length > 0 && rows.every((r) => selectedSet.has(r.id));

    const toggleAll = () => {
        if (allSelected) setSelectedIds([]);
        else setSelectedIds(rows.map((r) => r.id));
    };

    const toggleOne = (id: string) => {
        const next = new Set(selectedSet);
        next.has(id) ? next.delete(id) : next.add(id);
        setSelectedIds([...next]);
    };

    return (
        <div className="w-full">
            {selectedIds.length > 0 && (
                <div className="mb-3 flex items-center justify-between rounded-xl border bg-gray-50 px-4 py-2">
                    <div className="text-sm">{selectedIds.length} selected</div>
                    <div className="flex items-center gap-2">
                        <button
                            className="rounded-md bg-red-600 text-white px-3 py-1.5"
                            onClick={() => onCancelMany?.(selectedIds)} >
                            Cancel selected
                        </button>

                        <button
                            className="rounded-md border px-3 py-1.5"
                            onClick={() => {
                                if (selectedIds.length === 1) {
                                    const row = rows.find((r) => r.id === selectedIds[0]);
                                    if (row) onEdit?.(row);
                                } else if (selectedIds.length > 1) {
                                    onEditMany?.(selectedIds);
                                }
                            }}
                        >
                            Edit
                        </button>

                        <button
                            className="rounded-md border px-3 py-1.5"
                            onClick={() => setSelectedIds([])}
                        >
                            Clear
                        </button>
                    </div>
                </div>
            )}

            <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                <tr>
                    <th className="px-4 py-3">
                        <input type="checkbox" checked={allSelected} onChange={toggleAll} />
                    </th>
                    <th className="text-left px-4 py-3">Booking ID</th>
                    <th className="text-left px-4 py-3">Venue</th>
                    <th className="text-left px-4 py-3">Booker</th>
                    <th className="text-left px-4 py-3">Party</th>
                    <th className="text-left px-4 py-3">Date & Time</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-left px-4 py-3">Source</th>
                    <th className="text-left px-4 py-3">Actions</th>
                </tr>
                </thead>

                <tbody>
                {rows.map((row) => (
                    <tr key={row.id} className="border-t">
                        <td className="px-4 py-3">
                            <input
                                type="checkbox"
                                checked={selectedSet.has(row.id)}
                                onChange={() => toggleOne(row.id)}
                                onClick={(e) => e.stopPropagation()} />
                        </td>
                        <td className="px-4 py-3 font-medium">{row.id}</td>
                        <td className="px-4 py-3">{row.venue}</td>
                        <td className="px-4 py-3">{row.booker}</td>
                        <td className="px-4 py-3">
                            {(row as any).partySize ?? (row as any).partysize ?? (row as any).partysize}
                        </td>
                        <td className="px-4 py-3">{new Date(row.date).toLocaleString()}</td>
                        <td className="px-4 py-3">
                            <StatusPill status={row.status} />
                        </td>
                        <td className="px-4 py-3">
                            <SourceBadge source={row.source} />
                        </td>
                        <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                                {/* Cancel per-row */}
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onCancel?.(row.id);
                                    }}
                                    className="px-2 py-1 rounded-md border hover:bg-gray-50"
                                    title="Cancel" >
                                    Cancel
                                </button>

                                {/* Quick View */}
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onView?.(row);
                                    }}
                                    className="p-2 rounded-lg hover:bg-gray-100"
                                    title="Quick View" >
                                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                                        <path d="M12 5c5.5 0 10 5.5 10 7s-4.5 7-10 7S2 14.5 2 12s4.5-7 10-7Zm0 3a4 4 0 1 0 .001 8.001A4 4 0 0 0 12 8Z" />
                                    </svg>
                                </button>

                                {/* Delete per-row */}
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete?.(row.id);
                                    }}
                                    className="p-2 rounded-lg hover:bg-gray-100"
                                    title="Delete" >
                                    ×
                                </button>
                            </div>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}
