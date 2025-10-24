import React, { useMemo, useRef, useEffect, useState } from "react";
import { useAllReservations, type GqlReservation } from "../hooks/getreservation";
import Modal from "./modal";

type ReservationRow = GqlReservation & {
    type?: string | null;
    teamName?: string | null;
    corporate?: { uuid?: string; name?: string | null } | null;
};

const toDate = (ms?: string | null) => (ms ? new Date(Number(ms)) : null);
const fmtShort = (d?: Date | null) => {
    if (!d) return "—";
    return d.toLocaleString(undefined, {
        month: "numeric",
        day: "numeric",
        year: "2-digit",
        hour: "numeric",
        minute: "2-digit",
    });
};
const prettyTz = (tz?: string | null) =>
    tz ? tz.split("/").pop()?.replace(/_/g, " ") ?? "—" : "—";

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
    const label = STATUS_LABELS[status] ?? status;
    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap leading-none ${color}`}
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
    if (!value)
        return (
            <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-200">
        —
      </span>
        );
    const label = SOURCE_LABELS[value] ?? value;
    const style =
        SOURCE_STYLES[value] ?? "bg-gray-100 text-gray-700 ring-1 ring-inset ring-gray-200";
    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${style}`}
        >
      {label}
    </span>
    );
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

/** Small UUID display with Copy button */
function CopyableUuid({ uuid }: { uuid?: string | null }) {
    const [copied, setCopied] = useState(false);
    if (!uuid) return <span className="text-gray-500">—</span>;
    const short = `${uuid.slice(0, 5)}…`;
    const doCopy = async () => {
        try {
            await navigator.clipboard.writeText(uuid);
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
        } catch {
            /* ignore */
        }
    };
    return (
        <div className="flex flex-col items-start gap-1">
      <span className="font-mono" title={uuid}>
        {short}
      </span>
            <button
                type="button"
                onClick={doCopy}
                className="text-[10px] rounded border px-1.5 py-0.5 hover:bg-gray-50"
                title="Copy full UUID"
            >
                {copied ? "Copied" : "Copy"}
            </button>
        </div>
    );
}

export default function ReservationsTable() {
    // Prefixing unused values with "_" since the header was removed.
    const {
        rows,
        count: _count,
        loading: _loading,
        error: _error,
        refetch: _refetch,
        limit: _limit,
        offset: _offset,
        setLimit: _setLimit,
        setOffset: _setOffset,
        canPrev: _canPrev,
        canNext: _canNext,
    } = useAllReservations(25);

    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [open, setOpen] = useState(false);
    const [current, setCurrent] = useState<ReservationRow | null>(null);

    const pageIds = useMemo(() => rows.map((r) => r.uuid), [rows]);
    const allOnPageSelected = selected.size === pageIds.length && pageIds.length > 0;
    const someOnPageSelected = selected.size > 0 && !allOnPageSelected;

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

    return (
        <div className="space-y-4">
            {/* ⛔️ Removed the internal header bar on purpose */}

            <div className="rounded-xl border overflow-auto">
                <table className="w-full text-sm table-fixed">
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
                        <th className="text-left p-3 whitespace-nowrap">Start</th>
                        <th className="text-left p-3">UUID</th>
                        <th className="text-left p-3">Restaurant</th>
                        <th className="text-left p-3">Name</th>
                        <th className="text-left p-3">Team</th>
                        <th className="text-left p-3">Company</th>
                        <th className="text-left p-3">Table</th>
                        <th className="text-center p-3">Party</th>
                        <th className="text-center p-3">Status</th>
                        <th className="text-center p-3">Source</th>
                        <th className="text-center p-3">Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {rows.map((r) => {
                        const start = fmtShort(toDate(r.date?.start));
                        const fullName =
                            [r.member?.firstName, r.member?.lastName].filter(Boolean).join(" ") || "—";
                        const email = r.member?.email ?? "";
                        const partyNum =
                            r.table?.reservedPartySize ??
                            r.table?.recommendedPartySize ??
                            r.table?.minPartySize;
                        const partyLabel = typeof partyNum === "number" ? String(partyNum) : "—";

                        return (
                            <tr key={r.uuid} className="border-t">
                                <td className="p-3">
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        checked={selected.has(r.uuid)}
                                        onChange={(e) => toggleOne(r.uuid, e.target.checked)}
                                    />
                                </td>

                                <td className="p-3 whitespace-nowrap font-mono text-sm">{start}</td>

                                <td className="p-3">
                                    <CopyableUuid uuid={r.uuid} />
                                </td>

                                <td className="p-3">
                                    <div className="font-medium">{r.restaurant?.name ?? "—"}</div>
                                    <div className="text-xs text-gray-500">{prettyTz(r.restaurant?.timezone)}</div>
                                </td>

                                <td className="p-3">
                                    <div className="font-medium">{fullName}</div>
                                    {email && <div className="text-xs text-blue-700">{email}</div>}
                                </td>

                                <td className="p-3 whitespace-nowrap">{r.teamName ?? "—"}</td>
                                <td className="p-3 whitespace-nowrap">{r.corporate?.name ?? "—"}</td>

                                {/* Table: two lines, location stays on single line */}
                                <td className="p-3">
                                    <div className="font-medium capitalize">{r.table?.type ?? "—"}</div>
                                    {r.table?.location && (
                                        <div className="text-xs text-gray-500 whitespace-nowrap">
                                            {r.table.location}
                                        </div>
                                    )}
                                </td>

                                <td className="p-3 text-center">{partyLabel}</td>

                                <td className="p-3 text-center align-middle">
                                    <StatusPill status={r.status} />
                                </td>

                                <td className="p-3 text-center align-middle">
                                    <SourcePill value={r.type ?? null} />
                                </td>

                                <td className="p-3 text-center">
                                    <button
                                        className="inline-flex items-center justify-center rounded-md border px-2 py-1 hover:bg-gray-50"
                                        onClick={() => {
                                            setCurrent(r);
                                            setOpen(true);
                                        }}
                                    >
                                        <EyeIcon className="h-4 w-4" />
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>

            {/* If you still need the modal: */}
            {open && current && (
                <Modal
                    open={open}
                    onClose={() => setOpen(false)}
                    title={<div className="text-xl font-semibold">Booking Details — {current.uuid}</div>}
                    showCloseButton
                >
                    {/* put your details view here if you have one */}
                    <div className="text-sm text-gray-600">Coming soon…</div>
                </Modal>
            )}
        </div>
    );
}
