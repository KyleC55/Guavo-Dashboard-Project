import React, { useMemo, useRef, useEffect, useState } from "react";
import { useAllReservations, type GqlReservation } from "../hooks/getreservation.tsx";
import Modal from "./modal.tsx";
type ReservationRow = GqlReservation & { type?: string | null };

const toDate = (ms?: string | null) => (ms ? new Date(Number(ms)) : null);
const fmt = (d?: Date | null) => (d ? d.toLocaleString() : "—");

const prettyTz = (tz?: string | null) => {
    if (!tz) return "—";
    const leaf = tz.includes("/") ? tz.split("/").pop()! : tz;
    const spaced = leaf.replace(/_/g, " ");
    return spaced.replace(/\b\w/g, (c) => c.toUpperCase());
};

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
const STATUS_DESCRIPTIONS: Record<string, string> = {
    LISTED: "Redundant.",
    RESERVED: "Booked with keys.",
    FREE_BOOKED: "Free booked by admin; no keys charged or charge back.",
    CASH_BOOKED: "Booked with cash.",
    CANCELED: "Problematic.",
    RELEASED: "Expired for all systems.",
    CANCEL_PENDING: "For event space reservation & PDR.",
    RESERVATION_PENDING: "For manual booking.",
};
function StatusPill({ status }: { status: string }) {
    const color = STATUS_COLORS[status] ?? "bg-gray-200 text-gray-800";
    const label = STATUS_LABELS[status] ?? status;
    const desc = STATUS_DESCRIPTIONS[status] ?? "—";
    return (
        <span
            className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${color}`}
            title={desc}
            aria-label={`${label}: ${desc}`}
        >
      {label}
    </span>
    );
}

const SOURCE_LABELS: Record<string, string> = {
    RESY_CONCIERGE: "Resy",
    "OPEN-TABLE": "OpenTable",
    MANUAL: "Manual",
};
const SOURCE_STYLES: Record<string, string> = {
    RESY_CONCIERGE: "bg-blue-100 text-blue-800 ring-1 ring-inset ring-blue-200",
    "OPEN-TABLE": "bg-green-100 text-green-800 ring-1 ring-inset ring-green-200",
    MANUAL: "bg-amber-100 text-amber-800 ring-1 ring-inset ring-amber-200",
};
function SourcePill({ value }: { value?: string | null }) {
    if (!value) {
        return (
            <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-200">
        —
      </span>
        );
    }
    const label = SOURCE_LABELS[value] ?? value;
    const style = SOURCE_STYLES[value] ?? "bg-gray-100 text-gray-700 ring-1 ring-inset ring-gray-200";
    return <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${style}`}>{label}</span>;
}

function HeaderCheckbox({
                            checked,
                            indeterminate,
                            onChange,
                            disabled,
                        }: {
    checked: boolean;
    indeterminate: boolean;
    onChange: (next: boolean) => void;
    disabled?: boolean;
}) {
    const ref = useRef<HTMLInputElement | null>(null);
    useEffect(() => {
        if (ref.current) ref.current.indeterminate = indeterminate && !checked;
    }, [indeterminate, checked]);
    return (
        <input
            ref={ref}
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            disabled={disabled}
            aria-label="Select all on this page"
        />
    );
}

const EyeIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" strokeWidth="1.8" />
        <circle cx="12" cy="12" r="3" strokeWidth="1.8" />
    </svg>
);

function ReservationDetails({ r }: { r: ReservationRow }) {
    const startStr = fmt(toDate(r?.date?.start));

    const partyNum =
        r?.table?.reservedPartySize ??
        r?.table?.recommendedPartySize ??
        r?.table?.minPartySize;
    const hasParty = typeof partyNum === "number";
    const partyLabel = hasParty ? String(partyNum) : "—";

    const fullName =
        [r?.member?.firstName, r?.member?.lastName].filter(Boolean).join(" ").trim() || "—";

    return (
        <div className="space-y-6">
            <div className="text-sm text-gray-600">
                <span className="text-blue-700">{r?.restaurant?.name ?? "—"}</span>
                <span className="mx-2">•</span>
                {startStr}
            </div>

            <div className="flex gap-2">
                <button className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium">Details</button>
                <button className="rounded-full px-3 py-1 text-sm text-gray-500 hover:bg-gray-50">History</button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                    <div className="text-sm text-gray-500">Venue</div>
                    <div className="font-medium">{r?.restaurant?.name ?? "—"}</div>
                    <div className="text-xs text-gray-500">{prettyTz(r?.restaurant?.timezone)}</div>
                </div>

                <div>
                    <div className="text-sm text-gray-500">Booker</div>
                    <div className="font-medium">{fullName}</div>
                    <div className="text-sm text-blue-700">{r?.member?.email ?? "—"}</div>
                </div>

                <div>
                    <div className="text-sm text-gray-500">Party Size</div>
                    <div className="font-medium">
                        {partyLabel} {hasParty ? "guests" : ""}
                    </div>
                </div>

                <div>
                    <div className="text-sm text-gray-500">Date &amp; Time</div>
                    <div className="font-medium">{startStr}</div>
                </div>

                <div className="flex items-center gap-4">
                    <div>
                        <div className="text-sm text-gray-500">Status</div>
                        <StatusPill status={r?.status} />
                    </div>
                    <div>
                        <div className="text-sm text-gray-500">Source</div>
                        <SourcePill value={r.type ?? null} />
                    </div>
                </div>

                <div className="sm:col-span-2">
                    <div className="text-sm text-gray-500 mb-1">Notes</div>
                    <div className="rounded-lg border bg-gray-50 px-3 py-2 text-sm text-gray-700">
                        {r?.note?.trim() || "—"}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ---------------- main table ----------------
export default function ReservationsTable() {
    const {
        rows,
        count,
        loading,
        error,
        refetch,
        limit,
        offset,
        setLimit,
        setOffset,
        canPrev,
        canNext,
    } = useAllReservations(25);

    const [selected, setSelected] = useState<Set<string>>(new Set());
    useEffect(() => setSelected(new Set()), [limit, offset, rows.length]);
    const pageIds = useMemo(() => rows.map((r) => r.uuid), [rows]);
    const selectedOnPage = useMemo(() => pageIds.filter((id) => selected.has(id)), [pageIds, selected]);
    const allOnPageSelected = selectedOnPage.length === pageIds.length && pageIds.length > 0;
    const someOnPageSelected = selectedOnPage.length > 0 && !allOnPageSelected;

    const toggleSelectAllOnPage = (next: boolean) => {
        const set = new Set(selected);
        if (next) pageIds.forEach((id) => set.add(id));
        else pageIds.forEach((id) => set.delete(id));
        setSelected(set);
    };
    const toggleOne = (id: string, next: boolean) => {
        const set = new Set(selected);
        if (next) set.add(id);
        else set.delete(id);
        setSelected(set);
    };

    const [open, setOpen] = useState<boolean>(false);
    const [current, setCurrent] = useState<ReservationRow | null>(null);
    const openDetails = (row: ReservationRow) => {
        setCurrent(row);
        setOpen(true);
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">All Reservations</h2>
                <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">Rows:</label>
                    <select
                        className="border rounded px-2 py-1"
                        value={limit}
                        onChange={(e) => {
                            setOffset(0);
                            setLimit(Number(e.target.value));
                        }}
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

            {selected.size > 0 && (
                <div className="text-sm text-gray-700">
                    Selected <strong>{selected.size}</strong> {selected.size === 1 ? "item" : "items"} — ready for Edit
                </div>
            )}

            {error && (
                <div className="rounded border border-red-300 bg-red-50 p-3 text-red-700">
                    {error.message}
                </div>
            )}

            {/* Table */}
            <div className="rounded-xl border overflow-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                    <tr>
                        <th className="p-3 w-10">
                            <HeaderCheckbox
                                checked={allOnPageSelected}
                                indeterminate={someOnPageSelected}
                                onChange={toggleSelectAllOnPage}
                                disabled={rows.length === 0}
                            />
                        </th>
                        <th className="text-left p-3">Start</th>
                        <th className="text-left p-3">End</th>
                        <th className="text-left p-3">Restaurant</th>
                        <th className="text-left p-3">Name</th>
                        <th className="text-left p-3">Table</th>
                        <th className="text-left p-3">Party</th>
                        <th className="text-left p-3">Status</th>
                        <th className="text-left p-3">Source</th>
                        <th className="text-left p-3 w-20">Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {loading && rows.length === 0 ? (
                        <tr><td className="p-3" colSpan={11}>Loading…</td></tr>
                    ) : rows.length === 0 ? (
                        <tr><td className="p-3" colSpan={11}>No reservations found.</td></tr>
                    ) : (
                        rows.map((r: ReservationRow) => {
                            const start = fmt(toDate(r.date?.start));
                            const end = fmt(toDate(r.date?.end));

                            // ✅ TS-safe party display
                            const partyNum =
                                r.table?.reservedPartySize ??
                                r.table?.recommendedPartySize ??
                                r.table?.minPartySize;
                            const hasParty = typeof partyNum === "number";
                            const partyLabel = hasParty ? String(partyNum) : "—";

                            const fullName =
                                [r.member?.firstName, r.member?.lastName].filter(Boolean).join(" ").trim() || "—";
                            const isChecked = selected.has(r.uuid);

                            return (
                                <tr key={r.uuid} className="border-t">
                                    <td className="p-3">
                                        <input
                                            type="checkbox"
                                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            checked={isChecked}
                                            onChange={(e) => toggleOne(r.uuid, e.target.checked)}
                                            aria-label={`Select ${r.uuid}`}
                                        />
                                    </td>
                                    <td className="p-3 whitespace-nowrap">{start}</td>
                                    <td className="p-3 whitespace-nowrap">{end}</td>
                                    <td className="p-3">
                                        <div className="font-medium">{r.restaurant?.name ?? "—"}</div>
                                        <div className="text-xs text-gray-500">{prettyTz(r.restaurant?.timezone)}</div>
                                    </td>
                                    <td className="p-3">{fullName}</td>
                                    <td className="p-3">
                                        {/* show only the table type, not the label code */}
                                        <div>{r.table?.type ?? "—"}</div>
                                        <div className="text-xs text-gray-500">{r.table?.location ?? "—"}</div>
                                    </td>
                                    <td className="p-3">{partyLabel}</td>
                                    <td className="p-3">
                                        <StatusPill status={r.status} />
                                    </td>
                                    <td className="p-3">
                                        <SourcePill value={r.type ?? null} />
                                    </td>
                                    <td className="p-3">
                                        <button
                                            className="inline-flex items-center justify-center rounded-md border px-2 py-1 hover:bg-gray-50"
                                            title="View"
                                            aria-label="View"
                                            onClick={() => openDetails(r)}
                                        >
                                            <EyeIcon className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })
                    )}
                    </tbody>
                </table>
            </div>

            {/* Footer (pagination) */}
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

            {/* Modal */}
            <Modal
                open={open}
                onClose={() => setOpen(false)}
                title={
                    current && (
                        <div className="text-xl font-semibold">
                            Booking Details — {current.uuid}
                        </div>
                    )
                }
                showCloseButton
            >
                {current ? <ReservationDetails r={current} /> : null}
            </Modal>
        </div>
    );
}
