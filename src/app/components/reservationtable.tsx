import React, { useMemo, useRef, useEffect, useState } from "react";
import { DateTime } from "luxon";
import { useAllReservations, type GqlReservation } from "../hooks/getreservation";
import { useMutation } from "@apollo/client/react";
import { CANCEL_RESERVATION, UPDATE_RESERVATION_STATUS } from "../graphql/queries";
import Modal from "./modal";
import ReservationDetails from "./reservationdetails";

type ReservationRow = GqlReservation & {
    type?: string | null;
    teamName?: string | null;
    // use the schema’s field name
    corporate?: { uuid?: string; name?: string | null } | null;
};

type StartParts = { time: string; date: string };

function reservationStartParts(r: GqlReservation): StartParts | null {
    const iso =
        r.dateStart ??
        r?.date?.start ??
        null;

    if (!iso) return "";

    const zone = r?.restaurant?.timezone || "UTC";

    let dt = DateTime.fromISO(String(iso), { zone: "utc" });
    if (!dt.isValid) {
        const n = Number(iso);
        if (!Number.isNaN(n)) dt = DateTime.fromMillis(n, { zone: "utc" });
    }
    if (!dt.isValid) return null;

    const local = dt.setZone(zone);
    if (!local.isValid) return null;

    return {
        time: local.toFormat("h:mm a"),
        date: local.toFormat("LLL d, yyyy"),
    };
}

const prettyTz = (tz?: string | null) =>
    tz ? tz.split("/").pop()?.replace(/_/g, " ") ?? "—" : "—";

const neighborhoodLabel = (restaurant?: GqlReservation["restaurant"]): string => {
    const rawNeighborhood = restaurant?.city?.neighborhood;
    if (typeof rawNeighborhood === "string" && rawNeighborhood.trim().length > 0) {
        return rawNeighborhood.trim();
    }

    const rawLocation = restaurant?.city?.location;
    if (typeof rawLocation === "string" && rawLocation.trim().length > 0) {
        return rawLocation.trim();
    }

    return "";
};

function partySize(r: GqlReservation): number | string {
    return (
        r?.table?.reservedPartySize ??
        r?.table?.recommendedPartySize ??
        r?.table?.minPartySize ??
        "—"
    );
}

// Teams come from plain teamName in your working query
function teamFor(r: ReservationRow): string {
    return (r.teamName ?? "").trim() || "—";
}

// Company comes from corporate.name in your working query
function companyFor(r: ReservationRow): string {
    return (r.corporate?.name ?? "").trim();
}

// Format string: first letter uppercase, rest lowercase, underscores to spaces
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

function StatusPill({ 
    status, 
    onStatusChange,
    disabled,
    showDropdown = false,
    onToggleDropdown
}: { 
    status: string; 
    onStatusChange?: (newStatus: string) => void;
    disabled?: boolean;
    showDropdown?: boolean;
    onToggleDropdown?: () => void;
}) {
    const color = STATUS_COLORS[status] ?? "bg-gray-200 text-gray-800";
    const label = STATUS_LABELS[status] ?? formatLabel(status);
    // All statuses are now editable
    const isEditable = onStatusChange && !disabled;
    
    const baseClasses = `inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap leading-none ${color}`;
    const clickableClasses = isEditable ? "cursor-pointer hover:opacity-80 transition-opacity" : "";
    const disabledClasses = disabled ? "opacity-50 cursor-not-allowed" : "";
    
    // Only allow these three statuses: RESERVED, CANCELED, CANCEL_PENDING
    const allowedStatuses = ['RESERVED', 'CANCELED', 'CANCEL_PENDING'];
    
    // Always include the current status even if it's not in the allowed list (so user can see current status)
    const availableStatuses = allowedStatuses.includes(status) 
        ? allowedStatuses 
        : [...allowedStatuses, status].filter((s, i, arr) => arr.indexOf(s) === i); // Remove duplicates
    
    // Sort: CANCEL_PENDING first, then RESERVED, then CANCELED
    availableStatuses.sort((a, b) => {
        const order: Record<string, number> = {
            'CANCEL_PENDING': 1,
            'RESERVED': 2,
            'CANCELED': 3,
        };
        return (order[a] ?? 99) - (order[b] ?? 99);
    });
    
    if (isEditable) {
        return (
            <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleDropdown?.();
                    }}
                    disabled={disabled}
                    className={`${baseClasses} ${clickableClasses} ${disabledClasses}`}
                    title="Click to change status"
                >
                    {label}
                    {showDropdown && (
                        <span className="ml-1">▼</span>
                    )}
                </button>
                {showDropdown && (
                    <div className="absolute z-50 mt-1 bg-white border border-gray-300 rounded-md shadow-lg min-w-[180px]" onClick={(e) => e.stopPropagation()}>
                        <div className="py-1">
                            {availableStatuses.map((s) => {
                                const statusColor = STATUS_COLORS[s] ?? "bg-gray-200 text-gray-800";
                                const statusLabel = STATUS_LABELS[s] ?? formatLabel(s);
                                const isSelected = s === status;
                                return (
                                    <button
                                        key={s}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (s !== status) {
                                                onStatusChange?.(s);
                                            }
                                            onToggleDropdown?.();
                                        }}
                                        disabled={isSelected}
                                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
                                            isSelected ? "bg-gray-50" : ""
                                        }`}
                                    >
                                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColor}`}>
                                            {statusLabel}
                                        </span>
                                        {isSelected && <span className="text-xs text-gray-500">(current)</span>}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        );
    }
    
    return (
        <span className={`${baseClasses} ${disabledClasses}`}>
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
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${style}`}>
      {label}
    </span>
    );
}


const EyeIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" strokeWidth="1.8" />
        <circle cx="12" cy="12" r="3" strokeWidth="1.8" />
    </svg>
);

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
            // noop
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

type ReservationsTableProps = {
    rows?: GqlReservation[];
    loading?: boolean;
    total?: number;
    page?: number;
    totalPages?: number;
    onPrevPage?: () => void;
    onNextPage?: () => void;
    onRefetch?: () => void;
};

export default function ReservationsTable({
    rows: propsRows,
    loading: propsLoading,
    total,
    page,
    totalPages,
    onPrevPage,
    onNextPage,
    onRefetch,
}: ReservationsTableProps = {}) {
    // Use internal hook only if props are not provided (for backward compatibility)
    const internal = useAllReservations(25);
    const rows = propsRows ?? internal.rows;
    const loading = propsLoading ?? internal.loading;
    const refetch = onRefetch ?? internal.refetch;

    const [open, setOpen] = useState(false);
    const [current, setCurrent] = useState<ReservationRow | null>(null);
    const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
    const [reservationToCancel, setReservationToCancel] = useState<ReservationRow | null>(null);
    const [cancelling, setCancelling] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
    const [openStatusDropdown, setOpenStatusDropdown] = useState<string | null>(null);
    const [statusChangeToast, setStatusChangeToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [statusChangeConfirmOpen, setStatusChangeConfirmOpen] = useState(false);
    const [pendingStatusChange, setPendingStatusChange] = useState<{ reservation: ReservationRow; newStatus: string } | null>(null);

    const [cancelReservation] = useMutation(CANCEL_RESERVATION);
    const [updateReservationStatus] = useMutation(UPDATE_RESERVATION_STATUS);

    const handleCancelClick = (reservation: ReservationRow) => {
        setReservationToCancel(reservation);
        setCancelConfirmOpen(true);
    };

    const handleConfirmCancel = async () => {
        if (!reservationToCancel) return;
        
        setCancelling(true);
        try {
            await cancelReservation({
                variables: { uuid: reservationToCancel.uuid },
            });
            // Refresh the data
            await refetch();
            setCancelConfirmOpen(false);
            setReservationToCancel(null);
            // Show success message
            setStatusChangeToast({ 
                message: "Reservation successfully cancelled", 
                type: 'success' 
            });
            setTimeout(() => setStatusChangeToast(null), 3000);
        } catch (error: any) {
            console.error("Failed to cancel reservation:", error);
            setStatusChangeToast({ 
                message: `Failed to cancel reservation: ${error?.message || "Unknown error"}`, 
                type: 'error' 
            });
            setTimeout(() => setStatusChangeToast(null), 4000);
        } finally {
            setCancelling(false);
        }
    };

    const handleStatusChangeClick = (reservation: ReservationRow, newStatus: string) => {
        if (reservation.status === newStatus || updatingStatus === reservation.uuid) {
            return;
        }
        // Show confirmation modal
        setPendingStatusChange({ reservation, newStatus });
        setStatusChangeConfirmOpen(true);
        setOpenStatusDropdown(null); // Close dropdown
    };

    const handleConfirmStatusChange = async () => {
        if (!pendingStatusChange) return;
        
        const { reservation, newStatus } = pendingStatusChange;
        setUpdatingStatus(reservation.uuid);
        setStatusChangeConfirmOpen(false);
        
        try {
            await updateReservationStatus({
                variables: { 
                    uuid: reservation.uuid, 
                    status: newStatus 
                },
                refetchQueries: ['AllReservations'], // Also refresh the all reservations query
            });
            // Refresh the data
            await refetch();
            
            // Show success message
            const oldStatusLabel = STATUS_LABELS[reservation.status] || formatLabel(reservation.status);
            const newStatusLabel = STATUS_LABELS[newStatus] || formatLabel(newStatus);
            setStatusChangeToast({ 
                message: `Status changed from ${oldStatusLabel} to ${newStatusLabel}`, 
                type: 'success' 
            });
            setTimeout(() => setStatusChangeToast(null), 3000);
        } catch (error: any) {
            console.error("Failed to update reservation status:", error);
            setStatusChangeToast({ 
                message: `Failed to update status: ${error?.message || "Unknown error"}`, 
                type: 'error' 
            });
            setTimeout(() => setStatusChangeToast(null), 4000);
        } finally {
            setUpdatingStatus(null);
            setPendingStatusChange(null);
        }
    };

    const toggleStatusDropdown = (uuid: string) => {
        setOpenStatusDropdown(openStatusDropdown === uuid ? null : uuid);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (openStatusDropdown) {
                setOpenStatusDropdown(null);
            }
        };
        if (openStatusDropdown) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [openStatusDropdown]);

    return (
        <div className="space-y-4">
            <div className="rounded-xl border overflow-auto">
                <table className="w-full text-sm table-fixed">
                    <thead className="bg-gray-50">
                    <tr>
                        <th className="text-left p-3 whitespace-nowrap pr-1">Start</th>
                        <th className="text-left p-3 pl-1">UUID</th>
                        <th className="text-left p-3">Restaurant</th>
                        <th className="text-left p-3">Bookee</th>
                        <th className="text-left p-3">Booker</th>
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
                    {rows.map((r: ReservationRow) => {
                        const startParts = reservationStartParts(r);
                        const startTime = startParts?.time ?? "—";
                        const startDate = startParts?.date ?? "";
                        const bookeeName =
                            [
                                r.member?.firstName ? formatLabel(r.member.firstName) : null,
                                r.member?.lastName ? formatLabel(r.member.lastName) : null
                            ].filter(Boolean).join(" ") || "—";
                        const bookeeEmail = r.member?.email ?? "";
                        
                        const bookerName =
                            r.actor
                                ? [
                                    r.actor.firstName ? formatLabel(r.actor.firstName) : null,
                                    r.actor.lastName ? formatLabel(r.actor.lastName) : null
                                ].filter(Boolean).join(" ") || r.actor.email || "—"
                                : "—";
                        const bookerEmail = r.actor?.email ?? "";
                        const partyLabel = String(partySize(r));

                        const restaurantNeighborhood = neighborhoodLabel(r.restaurant);

                        return (
                            <tr key={r.uuid} className="border-t">
                                <td className="p-3 pr-1 text-sm">
                                    <div className="font-mono">{startTime}</div>
                                    {startDate && (
                                        <div className="font-mono text-xs text-gray-600">{startDate}</div>
                                    )}
                                </td>

                                <td className="p-3 pl-1">
                                    <CopyableUuid uuid={r.uuid} />
                                </td>

                                <td className="p-3">
                                    <div className="font-medium">{r.restaurant?.name ?? "—"}</div>
                                    {restaurantNeighborhood && (
                                        <div className="text-xs text-gray-600">{restaurantNeighborhood}</div>
                                    )}
                                    <div className="text-xs text-gray-500">{prettyTz(r.restaurant?.timezone)}</div>
                                </td>

                                <td className="p-3">
                                    <div className="font-medium">{bookeeName}</div>
                                    {bookeeEmail && <div className="text-xs text-blue-700">{bookeeEmail}</div>}
                                </td>

                                <td className="p-3">
                                    <div className="font-medium">{bookerName}</div>
                                    {bookerEmail && <div className="text-xs text-blue-700">{bookerEmail}</div>}
                                </td>

                                <td className="p-3 whitespace-nowrap">{teamFor(r)}</td>
                                <td className="p-3 whitespace-nowrap">{companyFor(r) || "—"}</td>

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
                                    <StatusPill 
                                        status={r.status} 
                                        onStatusChange={(newStatus) => handleStatusChangeClick(r, newStatus)}
                                        disabled={updatingStatus === r.uuid}
                                        showDropdown={openStatusDropdown === r.uuid}
                                        onToggleDropdown={() => toggleStatusDropdown(r.uuid)}
                                    />
                                </td>

                                <td className="p-3 text-center align-middle">
                                    <SourcePill value={r.type ?? null} />
                                </td>

                                <td className="p-3 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                    <button
                                        className="inline-flex items-center justify-center rounded-md border px-2 py-1 hover:bg-gray-50"
                                        onClick={() => {
                                            setCurrent(r);
                                            setOpen(true);
                                        }}
                                        title={
                                            r.actor
                                                ? `View details - Booker: ${[r.actor.firstName, r.actor.lastName].filter(Boolean).join(" ").trim() || r.actor.email || "—"}`
                                                : "View details"
                                        }
                                    >
                                        <EyeIcon className="h-4 w-4" />
                                    </button>
                                        {(r.status === "RESERVED" || r.status === "FREE_BOOKED" || r.status === "CASH_BOOKED") && (
                                            <button
                                                className="inline-flex items-center justify-center rounded-md bg-red-600 text-white px-2 py-1 hover:bg-red-700 disabled:opacity-50"
                                                onClick={() => handleCancelClick(r)}
                                                disabled={cancelling}
                                                title="Cancel reservation"
                                            >
                                                {cancelling && reservationToCancel?.uuid === r.uuid ? "..." : "✕"}
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {(onPrevPage || onNextPage) && (
                <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
                    <div className="text-sm text-gray-700">
                        {loading ? (
                            "Loading..."
                        ) : total !== undefined ? (
                            <>
                                Showing {rows.length} of {total} result{total !== 1 ? 's' : ''}
                            </>
                        ) : (
                            `Showing ${rows.length} result${rows.length !== 1 ? 's' : ''}`
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onPrevPage}
                            disabled={!onPrevPage || loading || (page ?? 1) === 1}
                            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        <span className="text-sm text-gray-700">
                            Page {page ?? 1} of {totalPages ?? 1}
                        </span>
                        <button
                            onClick={onNextPage}
                            disabled={!onNextPage || loading || (page && totalPages && page >= totalPages)}
                            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            {open && current && (
                <Modal
                    open={open}
                    onClose={() => setOpen(false)}
                    title={
                        <div>
                            <div className="text-xl font-semibold">Booking Details:</div>
                            <div className="text-sm text-gray-600 mt-1 font-mono">{current.uuid}</div>
                        </div>
                    }
                    showCloseButton
                >
                    <ReservationDetails reservation={current} showHistoryTab={false} />
                </Modal>
            )}

            {/* Cancel Confirmation Modal */}
            {cancelConfirmOpen && reservationToCancel && (
                <Modal
                    open={cancelConfirmOpen}
                    onClose={() => {
                        if (!cancelling) {
                            setCancelConfirmOpen(false);
                            setReservationToCancel(null);
                        }
                    }}
                    title="Cancel Reservation"
                    showCloseButton={false}
                >
                    <div className="space-y-4">
                        <p className="text-gray-700">
                            Are you sure you want to cancel this reservation? This will set it back to LISTED status.
                        </p>
                        <div className="text-sm text-gray-600 space-y-1">
                            <p><strong>Restaurant:</strong> {reservationToCancel.restaurant?.name}</p>
                            <p><strong>Member:</strong> {reservationToCancel.member?.firstName} {reservationToCancel.member?.lastName}</p>
                            <p><strong>Status:</strong> {reservationToCancel.status}</p>
                            <p><strong>UUID:</strong> {reservationToCancel.uuid}</p>
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <button
                                type="button"
                                onClick={() => {
                                    setCancelConfirmOpen(false);
                                    setReservationToCancel(null);
                                }}
                                disabled={cancelling}
                                className="px-4 py-2 border rounded-md hover:bg-gray-50 disabled:opacity-50"
                            >
                                No, Keep It
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmCancel}
                                disabled={cancelling}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                            >
                                {cancelling && (
                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                )}
                                {cancelling ? "Cancelling..." : "Yes, Cancel Reservation"}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Status Change Confirmation Modal */}
            {statusChangeConfirmOpen && pendingStatusChange && (
                <Modal
                    open={statusChangeConfirmOpen}
                    onClose={() => {
                        if (!updatingStatus) {
                            setStatusChangeConfirmOpen(false);
                            setPendingStatusChange(null);
                        }
                    }}
                    title="Confirm Status Change"
                    showCloseButton={false}
                >
                    <div className="space-y-4">
                        {/* Custom message based on status transition */}
                        {pendingStatusChange.reservation.status === "CANCEL_PENDING" && pendingStatusChange.newStatus === "CANCELED" ? (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <p className="text-red-900 font-semibold text-lg mb-2">
                                    Are you sure this booking has been canceled?
                                </p>
                                <p className="text-red-700 text-sm">
                                    This will permanently mark the reservation as canceled.
                                </p>
                            </div>
                        ) : pendingStatusChange.reservation.status === "RESERVATION_PENDING" && pendingStatusChange.newStatus === "RESERVED" ? (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <p className="text-green-900 font-semibold text-lg mb-2">
                                    Are you sure this booking has been created?
                                </p>
                                <p className="text-green-700 text-sm">
                                    This will confirm the reservation and mark it as active.
                                </p>
                            </div>
                        ) : (
                            <p className="text-gray-700">
                                Are you sure you want to change the status of this reservation?
                            </p>
                        )}
                        
                        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-600">Restaurant:</span>
                                <span className="text-sm text-gray-900">{pendingStatusChange.reservation.restaurant?.name || "—"}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-600">Member:</span>
                                <span className="text-sm text-gray-900">
                                    {pendingStatusChange.reservation.member?.firstName} {pendingStatusChange.reservation.member?.lastName || "—"}
                                </span>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                                <span className="text-sm font-medium text-gray-600">Current Status:</span>
                                <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[pendingStatusChange.reservation.status] ?? "bg-gray-200 text-gray-800"}`}>
                                    {STATUS_LABELS[pendingStatusChange.reservation.status] || formatLabel(pendingStatusChange.reservation.status)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-600">New Status:</span>
                                <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[pendingStatusChange.newStatus] ?? "bg-gray-200 text-gray-800"}`}>
                                    {STATUS_LABELS[pendingStatusChange.newStatus] || formatLabel(pendingStatusChange.newStatus)}
                                </span>
                            </div>
                        </div>
                        
                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setStatusChangeConfirmOpen(false);
                                    setPendingStatusChange(null);
                                }}
                                disabled={updatingStatus}
                                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmStatusChange}
                                disabled={updatingStatus}
                                className={`px-4 py-2 rounded-md text-white disabled:opacity-50 transition-colors font-medium flex items-center gap-2 ${
                                    pendingStatusChange.reservation.status === "CANCEL_PENDING" && pendingStatusChange.newStatus === "CANCELED"
                                        ? "bg-red-600 hover:bg-red-700"
                                        : pendingStatusChange.reservation.status === "RESERVATION_PENDING" && pendingStatusChange.newStatus === "RESERVED"
                                        ? "bg-green-600 hover:bg-green-700"
                                        : "bg-black hover:bg-gray-800"
                                }`}
                            >
                                {updatingStatus && (
                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                )}
                                {updatingStatus ? "Updating..." : "Yes, Confirm"}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Status Change Toast Notification */}
            {statusChangeToast && (
                <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg text-white flex items-center gap-3 animate-in slide-in-from-bottom-5 ${
                    statusChangeToast.type === "success" ? "bg-green-600" : "bg-red-600"
                }`}>
                    <div className="flex-1">
                        {statusChangeToast.message}
                    </div>
                    <button
                        onClick={() => setStatusChangeToast(null)}
                        className="text-white hover:text-gray-200 transition-colors"
                        aria-label="Close notification"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            )}
        </div>
    );
}
