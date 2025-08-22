import React, { useMemo, useState } from "react";
import type { BookingRow } from "../../types/types"; // ← adjust path

type Props = {
    rows: BookingRow[];
    onDelete?: (id: string) => void;
    onView?: (row: BookingRow) => void;
};

export default function BookingsTable({ rows, onDelete, onView }: Props) {
    const [selected, setSelected] = useState<Set<string>>(new Set());

    const allSelected = useMemo(
        () => rows.length > 0 && rows.every(r => selected.has(r.id)),
        [rows, selected]
    );

    const toggleAll = () => {
        if (allSelected) setSelected(new Set());
        else setSelected(new Set(rows.map(r => r.id)));
    };

    const toggleOne = (id: string) =>
        setSelected(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });

    return (
        <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200">
            <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                <tr className="text-left">
                    <Th className="w-10">
                        <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all" />
                    </Th>
                    <Th>Booking ID</Th>
                    <Th>Venue</Th>
                    <Th>Booker</Th>
                    <Th>Party</Th>
                    <Th>
                        <div className="inline-flex items-center gap-1">Date &amp; Time <span className="text-gray-400">▲</span></div>
                    </Th>
                    <Th>Status</Th>
                    <Th>Source</Th>
                    <Th className="text-right pr-4">Actions</Th>
                </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                {rows.map(r => {
                    const dt = splitDateTime(r.date);
                    return (
                        <tr key={r.id} className="bg-white hover:bg-gray-50">
                            <Td className="w-10">
                                <input
                                    type="checkbox"
                                    checked={selected.has(r.id)}
                                    onChange={() => toggleOne(r.id)}
                                    aria-label={`Select ${r.id}`}
                                />
                            </Td>

                            <Td className="font-medium text-gray-900">{r.id}</Td>

                            <Td>
                                <div className="font-medium text-gray-900">{r.venue}</div>
                                <div className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                                    <MapPin className="h-3 w-3" /> {r.city}
                                </div>
                            </Td>

                            <Td>
                                <div className="font-medium text-gray-900">{r.booker}</div>
                                <div className="mt-0.5 text-xs text-gray-500">
                                    {r.company} • {r.role}
                                </div>
                            </Td>

                            <Td className="tabular-nums">{r.partysize}</Td>

                            <Td>
                                <div className="tabular-nums">{dt.date}</div>
                                <div className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                                    <Clock className="h-3 w-3" /> {dt.time}
                                </div>
                            </Td>

                            <Td><StatusBadge status={r.status} /></Td>
                            <Td><SourceBadge source={r.source} /></Td>

                            <Td className="text-right pr-4">
                                <div className="inline-flex items-center gap-3">
                                    <button className="p-1 hover:opacity-80" aria-label="View" onClick={() => onView?.(r)}>
                                        <Eye className="h-4 w-4" />
                                    </button>
                                    <button className="p-1 hover:opacity-80" aria-label="Delete" onClick={() => onDelete?.(r.id)}>
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            </Td>
                        </tr>
                    );
                })}
                </tbody>
            </table>
        </div>
    );
}


function splitDateTime(s: string) {
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
        const pad = (n: number) => String(n).padStart(2, "0");
        return {
            date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
            time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
        };
    }
    const [date, time = ""] = s.split(/[T ]/);
    return { date, time };
}

function Th({ children, className = "" }: React.PropsWithChildren<{ className?: string }>) {
    return <th className={`p-3 font-medium ${className}`}>{children}</th>;
}
function Td({ children, className = "" }: React.PropsWithChildren<{ className?: string }>) {
    return <td className={`p-3 align-top ${className}`}>{children}</td>;
}

function StatusBadge({ status }: { status: BookingRow["status"] }) {
    const cls: Record<BookingRow["status"], string> = {
        confirmed: "bg-black text-white",
        pending: "bg-amber-500/95 text-white",
        cancelled: "bg-red-500/95 text-white",
    } as const;
    return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${cls[status]}`}>{status}</span>;
}
function SourceBadge({ source }: { source: BookingRow["source"] }) {
    const cls: Record<BookingRow["source"], string> = {
        Resy: "bg-blue-100 text-blue-700",
        OpenTable: "bg-green-100 text-green-700",
        Manual: "bg-amber-100 text-amber-700",
    } as const;
    return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${cls[source]}`}>{source}</span>;
}

function MapPin({ className = "" }: { className?: string }) {
    return <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
        <path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/>
    </svg>;
}
function Clock({ className = "" }: { className?: string }) {
    return <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
        <path d="M12 2a10 10 0 1 0 .001 20.001A10 10 0 0 0 12 2Zm.75 5.5h-1.5v5l4 2.4.75-1.24-3.25-1.94V7.5Z"/>
    </svg>;
}
function Eye({ className = "" }: { className?: string }) {
    return <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
        <path d="M12 5c-5 0-9 4.5-10 7 1 2.5 5 7 10 7s9-4.5 10-7c-1-2.5-5-7-10-7Zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8Z"/>
    </svg>;
}
function X({ className = "" }: { className?: string }) {
    return <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
        <path d="M6.4 5l-.9.9L11.1 11l-5.6 5.1.9.9L12 11.9l5.6 5.1.9-.9L12.9 11l5.6-5.1-.9-.9L12 10.1 6.4 5Z"/>
    </svg>;
}
