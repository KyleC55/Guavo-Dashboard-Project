import Sidebar from "../components/sidebar.tsx";
import Search from "../components/searchbar.tsx";
import { ProfileCard } from "../components/profilecard.tsx";
import { displayProfile } from "../data/profile.ts";
import { bookingData } from "../data/metricCards.ts";
import BookingMetricCard from "../components/bookingmetriccard.tsx";
import BookingFilters from "../components/bookingfilters.tsx";
import Modal from "../components/modal.tsx";
import ManualBookingForm from "../components/manualbookings.tsx";
import { useState, useMemo, useEffect } from "react";
import AddManualBookingButton from "../components/manualbookingadd.tsx";
import BookingsTable from "../components/bookingrows.tsx";
import type { BookingRow } from "../../../types/types.ts";
import { BookingDetails } from "../components/bookingdetails.tsx";
import EditBookingDetails from "../components/editbookingdetails.tsx";
import type { BookingFilterState } from "../../../types/types.ts";
import {useAdminReservations} from "../hooks/getreservation.ts";


const statusMap: Record<string, BookingRow["status"]> = {
    BOOKED: "confirmed",
    CONFIRMED: "confirmed",
    HOLD: "pending",
    PENDING: "pending",
    CANCELLED: "cancelled",
    CANCELED: "cancelled",
};

// --- Mapper: backend Reservation -> your BookingRow shape ---
function mapReservationToRow(r: any): BookingRow {
    const memberName = [r?.member?.firstName, r?.member?.lastName].filter(Boolean).join(" ");
    const startISO = r?.date?.start;

    return {
        // Required
        id:
            r?.uuid ??
            (globalThis.crypto?.randomUUID?.() ?? `BK-${Math.random().toString(36).slice(2, 9)}`),
        status:
            statusMap[r?.status] ??
            (String(r?.status || "pending").toLowerCase() as BookingRow["status"]),
        date: startISO ? new Date(startISO).toISOString() : new Date().toISOString(),

        // Best-effort mappings (adjust to your BookingRow definition)
        venue: r?.table?.label ?? r?.table?.name ?? "—", // ⬅️ admin uses label; keep name as fallback
        booker: memberName || "—",
        email: r?.member?.email ?? "",
        notes: "",

        // Placeholders if your table shows these (tweak/remove if not needed)
        city: "",
        source: "system",
        company: "",
        role: "",
        phone: "",
    };
}

const Bookings = () => {
    const [manualOpen, setManualOpen] = useState(false);
    const [viewOpen, setViewOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [selected, setSelected] = useState<BookingRow | null>(null);

    // rows now come from backend; start empty and fill after query
    const [rows, setRows] = useState<BookingRow[]>([]);

    const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
    const [confirmMultiOpen, setConfirmMultiOpen] = useState(false);
    const [pendingCancelIds, setPendingCancelIds] = useState<string[]>([]);
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

    // Filters (dateFrom/dateTo drive GraphQL variables)
    const [filters, setFilters] = useState<BookingFilterState>({
        query: "",
        city: "",
        source: "",
        status: "",
        company: "",
        dateFrom: "",
        dateTo: "",
        page: 1,
        pageSize: 50,
        total: 0,
    });

    // --- GraphQL variables ---
    const vars = {
        from: filters.dateFrom || undefined,
        to: filters.dateTo || undefined,
        limit: filters.pageSize,
        offset: (filters.page - 1) * filters.pageSize,
    };

    // ⬇️ call the admin hook (returns { data, loading, error, refetch })
    const { data, loading, error, refetch } = useAdminReservations(vars);

    // Load backend data into rows when it arrives
    useEffect(() => {
        const items = data?.reservations?.items ?? [];
        const mapped = items.map(mapReservationToRow);
        setRows(mapped);

        if (typeof data?.reservations?.count === "number") {
            setFilters((prev) => ({ ...prev, total: data.reservations.count }));
        }
    }, [data]);

    // Single cancel (front-end only; replace with mutation if you want to persist)
    const handleCancel = (id: string) => {
        let changed = 0;
        setRows((prev) =>
            prev.map((r) => {
                if (r.id === id && r.status !== "cancelled") {
                    changed++;
                    return { ...r, status: "cancelled" };
                }
                return r;
            }),
        );
        setToast(
            changed
                ? { type: "success", message: "Booking successfully cancelled" }
                : { type: "error", message: "Cancelled unsuccessful" },
        );
        setTimeout(() => setToast(null), 3000);
    };

    // Multi cancel (front-end only)
    const handleCancelMany = (ids: string[]) => {
        let changed = 0;
        setRows((prev) =>
            prev.map((r) => {
                if (ids.includes(r.id) && r.status !== "cancelled") {
                    changed++;
                    return { ...r, status: "cancelled" };
                }
                return r;
            }),
        );
        setToast(
            changed > 0
                ? { type: "success", message: `${changed} booking${changed === 1 ? "" : "s"} cancelled ✅` }
                : { type: "error", message: "No bookings were cancelled ❌" },
        );
        setTimeout(() => setToast(null), 3000);
    };

    // Open confirm modal before bulk cancel
    const requestCancelMany = (ids: string[]) => {
        if (!ids || ids.length === 0) return;
        setPendingCancelIds(ids);
        setConfirmMultiOpen(true);
    };
    const doCancelMany = () => {
        handleCancelMany(pendingCancelIds);
        setConfirmMultiOpen(false);
        setPendingCancelIds([]);
    };

    const requestDelete = (id: string) => {
        setPendingDeleteId(id);
        setConfirmDeleteOpen(true);
    };
    const doDelete = () => {
        if (pendingDeleteId) {
            handleDelete(pendingDeleteId);
            setToast({ type: "success", message: `Booking ${pendingDeleteId} removed 🗑️` });
            setTimeout(() => setToast(null), 3000);
        }
        setConfirmDeleteOpen(false);
        setPendingDeleteId(null);
    };

    const openView = (row: BookingRow) => {
        setSelected(row);
        setViewOpen(true);
    };
    const openEdit = (row: BookingRow) => {
        setSelected(row);
        setEditOpen(true);
    };
    const openMultiEdit = (ids: string[]) => {
        const first = rows.find((r) => ids.includes(r.id));
        if (!first) return;
        setSelected(first);
        setEditOpen(true);
    };

    const genBookingId = (list: BookingRow[]) => {
        const max = Math.max(0, ...list.map((r) => parseInt(r.id.replace(/\D/g, "") || "0", 10)));
        return `BK${String(max + 1).padStart(4, "0")}`;
    };

    const handleDelete = (id: string) => setRows((prev) => prev.filter((r) => r.id !== id));

    const handleCreate = (data: Omit<BookingRow, "id">) => {
        try {
            setRows((prev) => [{ id: genBookingId(prev), ...data }, ...prev]);
            setManualOpen(false);
            setToast({ type: "success", message: "Booking successfully created ✅" });
            setTimeout(() => setToast(null), 3000);
        } catch {
            setToast({ type: "error", message: "Booking not created ❌" });
            setTimeout(() => setToast(null), 3000);
        }
    };

    const cities = useMemo(() => [...new Set(rows.map((r) => r.city).filter(Boolean))].sort(), [rows]);
    const sources = useMemo(() => [...new Set(rows.map((r) => r.source).filter(Boolean))].sort(), [rows]);
    const statuses = useMemo(() => [...new Set(rows.map((r) => r.status).filter(Boolean))].sort(), [rows]);
    const companies = useMemo(() => [...new Set(rows.map((r) => r.company).filter(Boolean))].sort(), [rows]);

    const filteredRows = useMemo(() => {
        const q = filters.query.trim().toLowerCase();
        const from = filters.dateFrom ? new Date(filters.dateFrom + "T00:00:00") : null;
        const to = filters.dateTo ? new Date(filters.dateTo + "T23:59:59") : null;

        return rows
            .filter((r) => {
                if (filters.city && r.city !== filters.city) return false;
                if (filters.source && r.source !== filters.source) return false;
                if (filters.status && r.status !== filters.status) return false;
                if (filters.company && r.company !== filters.company) return false;

                if (from || to) {
                    const d = new Date(r.date);
                    if (from && d < from) return false;
                    if (to && d > to) return false;
                }

                if (q) {
                    const hay = [
                        r.id,
                        r.venue,
                        r.booker,
                        r.email,
                        r.company,
                        r.role,
                        r.city,
                        r.source,
                        r.status,
                        r.notes,
                    ]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase();
                    if (!hay.includes(q)) return false;
                }
                return true;
            })
            .sort((a, b) => a.city.localeCompare(b.city));
    }, [rows, filters]);

    const total = filteredRows.length;

    return (
        <div className="flex min-h-screen">
            <aside className="w-64 border-r">
                <Sidebar />
            </aside>

            <main className="flex-1 flex flex-col p-6">
                <div className="flex items-center gap-4">
                    <div className="flex-1">
                        <Search />
                    </div>
                    <ProfileCard profile={displayProfile[0]} />
                </div>

                <div className="mt-6 flex items-end">
                    <div className="ml-2">
                        <h1 className="text-black text-4xl font-bold">Bookings Management</h1>
                        <p className="text-gray-500 mt-2 max-w-2xl">
                            Managing {rows.length}
                            {loading ? "…" : ""} bookings across all venues
                            {error && <span className="text-red-500 ml-2">({error.message})</span>}
                        </p>
                    </div>
                    <div className="ml-auto shrink-0">
                        <AddManualBookingButton onClick={() => setManualOpen(true)} />
                    </div>
                </div>

                <Modal
                    open={manualOpen}
                    onClose={() => setManualOpen(false)}
                    showCloseButton={false}
                    title="Add Manual Booking"
                    footer={
                        <>
                            <button
                                type="button"
                                onClick={() => setManualOpen(false)}
                                className="rounded-md border px-4 py-2"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="manual-booking-form"
                                className="ml-2 rounded-md px-4 py-2 bg-black text-white"
                            >
                                Add Booking
                            </button>
                        </>
                    }
                >
                    <ManualBookingForm onCreate={handleCreate} onDone={() => setManualOpen(false)} />
                </Modal>

                {/* Metrics */}
                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
                    {bookingData.map((card) => (
                        <BookingMetricCard key={card.title} {...card} />
                    ))}
                </section>

                {/* Filters */}
                <div className="mt-6">
                    <BookingFilters
                        value={filters}
                        onChange={(patch) => {
                            const next = { ...filters, ...patch };
                            setFilters(next);

                            // When dates or pagination change, refetch server data with new variables
                            if ("dateFrom" in patch || "dateTo" in patch || "page" in patch || "pageSize" in patch) {
                                refetch({
                                    from: next.dateFrom || undefined,
                                    to: next.dateTo || undefined,
                                    limit: next.pageSize,
                                    offset: (next.page - 1) * next.pageSize,
                                });
                            }
                        }}
                        cities={cities}
                        sources={sources}
                        statuses={statuses}
                        companies={companies}
                        total={total}
                    />
                </div>

                {/* Display Bookings into forms */}
                <BookingsTable
                    rows={filteredRows}
                    onDelete={requestDelete}
                    onView={openView}
                    onEdit={openEdit}
                    onEditMany={openMultiEdit}
                    onCancel={handleCancel}
                    onCancelMany={requestCancelMany}
                />

                {/* Confirm multiple cancel */}
                <Modal
                    open={confirmMultiOpen}
                    onClose={() => setConfirmMultiOpen(false)}
                    title="Cancel Multiple Bookings"
                    showCloseButton={false}
                >
                    <div className="space-y-6">
                        <p className="text-gray-600">
                            Are you sure you want to cancel{" "}
                            <span className="font-semibold">{pendingCancelIds.length}</span>{" "}
                            selected booking{pendingCancelIds.length === 1 ? "" : "s"}? This action
                            cannot be undone and will notify all affected parties.
                        </p>

                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setConfirmMultiOpen(false)}
                                className="rounded-md border px-4 py-2"
                            >
                                Keep Bookings
                            </button>
                            <button
                                type="button"
                                onClick={doCancelMany}
                                className="rounded-md px-4 py-2 bg-red-600 text-white"
                            >
                                Cancel Bookings
                            </button>
                        </div>
                    </div>
                </Modal>

                {/* Confirm single delete */}
                <Modal
                    open={confirmDeleteOpen}
                    onClose={() => setConfirmDeleteOpen(false)}
                    title="Remove Booking"
                    showCloseButton={false}
                >
                    <div className="space-y-6">
                        <p className="text-gray-600">
                            Are you sure you want to remove{" "}
                            <span className="font-semibold">{pendingDeleteId}</span>? This action cannot be undone.
                        </p>

                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setConfirmDeleteOpen(false)}
                                className="rounded-md border px-4 py-2"
                            >
                                Keep Booking
                            </button>
                            <button
                                type="button"
                                onClick={doDelete}
                                className="rounded-md px-4 py-2 bg-red-600 text-white"
                            >
                                Remove Booking
                            </button>
                        </div>
                    </div>
                </Modal>

                {/* VIEW modal */}
                <Modal
                    open={viewOpen}
                    onClose={() => setViewOpen(false)}
                    title={selected ? `Booking Details - ${selected.id}` : "Booking Details"}
                    footer={
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setViewOpen(false)}
                                className="rounded-md border px-4 py-2"
                            >
                                Close
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setViewOpen(false);
                                    setEditOpen(true);
                                }}
                                className="ml-2 rounded-md px-4 py-2 bg-blue-600 text-white"
                            >
                                Edit
                            </button>
                        </div>
                    }
                >
                    {selected && <BookingDetails key={`${selected.id}-view`} row={selected} showTitle={false} />}
                </Modal>

                {/* Edit modal */}
                <Modal
                    open={editOpen}
                    onClose={() => setEditOpen(false)}
                    title={selected ? `Edit Booking - ${selected.id}` : "Edit Booking"}
                    showCloseButton={false}
                >
                    {selected && (
                        <EditBookingDetails
                            key={`${selected.id}-edit`}
                            row={selected}
                            onUpdate={(updated) => {
                                setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
                                setSelected(updated);
                                setEditOpen(false);
                                setToast({ type: "success", message: "Booking updated ✅" });
                                setTimeout(() => setToast(null), 3000);
                            }}
                        />
                    )}
                </Modal>

                {toast && (
                    <div
                        className={`fixed bottom-6 right-6 px-4 py-2 rounded shadow-lg text-white ${
                            toast.type === "success" ? "bg-green-600" : "bg-red-600"
                        }`}
                    >
                        {toast.message}
                    </div>
                )}
            </main>
        </div>
    );
};

export default Bookings;
