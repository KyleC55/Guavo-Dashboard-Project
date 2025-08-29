import Sidebar from "../components/sidebar.tsx";
import Search from "../components/searchbar.tsx";
import { ProfileCard } from "../components/profilecard.tsx";
import { displayProfile } from "../data/profile.ts";
import { bookingData } from "../data/metricCards.ts";
import BookingMetricCard from "../components/bookingmetriccard.tsx";
import BookingFilters from "../components/bookingfilters.tsx";
import Modal from "../components/modal.tsx";
import ManualBookingForm from "../components/manualbookings.tsx";
import { useState , useMemo } from "react";
import AddManualBookingButton from "../components/manualbookingadd.tsx";
import BookingsTable from "../components/bookingrows.tsx";
import { mockBooking } from "../data/mockbookings.ts";
import type { BookingRow } from "../../types/types.ts";
import {BookingDetails} from "../components/bookingdetails.tsx";
import type {BookingFilterState} from "../../types/types.ts";

const Bookings = () => {
    const [manualOpen, setManualOpen] = useState(false);
    const [viewOpen, setViewOpen] = useState(false);
    const [selected, setSelected] = useState<BookingRow | null>(null);
    const [rows, setRows] = useState<BookingRow[]>(mockBooking);
    const [editMode] = useState(false);
    const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

    // Filters state (for search, dropdowns, dates, pagination summary)
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

    const handleCancel = (id: string) =>
        setRows(prev => prev.map(r => (r.id === id ? { ...r, status: "cancelled" } : r)));

    const handleCancelMany = (ids: string[]) =>
        setRows(prev => prev.map(r => (ids.includes(r.id) ? { ...r, status: "cancelled" } : r)));

    const genBookingId = (list: BookingRow[]) => {
        const max = Math.max(0, ...list.map(r => parseInt(r.id.replace(/\D/g, "") || "0", 10)));
        return `BK${String(max + 1).padStart(4, "0")}`;
    };

    const handleDelete = (id: string) =>
        setRows(prev => prev.filter(r => r.id !== id));

    const handleCreate = (data: Omit<BookingRow,"id">) => {
        try {
            setRows(prev => [{ id: genBookingId(prev), ...data }, ...prev]);
            setManualOpen(false);
            setToast({ type: "success", message: "Booking successfully created ✅" });

            setTimeout(() => setToast(null), 3000);
        } catch {
            setToast({ type: "error", message: "Booking not created ❌" });
            setTimeout(() => setToast(null), 3000);
        }
    };


    const cities = useMemo(
        () => [...new Set(rows.map(r => r.city).filter(Boolean))].sort(),
        [rows]
    );
    const sources = useMemo(
        () => [...new Set(rows.map(r => r.source).filter(Boolean))].sort(),
        [rows]
    );
    const statuses = useMemo(
        () => [...new Set(rows.map(r => r.status).filter(Boolean))].sort(),
        [rows]
    );
    const companies = useMemo(
        () => [...new Set(rows.map(r => r.company).filter(Boolean))].sort(),
        [rows]
    );

    const filteredRows = useMemo(() => {
        const q = filters.query.trim().toLowerCase();
        const from = filters.dateFrom ? new Date(filters.dateFrom + "T00:00:00") : null;
        const to   = filters.dateTo   ? new Date(filters.dateTo   + "T23:59:59") : null;

        return rows
            .filter(r => {
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
                        r.id, r.venue, r.booker, r.email, r.company, r.role,
                        r.city, r.source, r.status, r.notes
                    ].filter(Boolean).join(" ").toLowerCase();
                    if (!hay.includes(q)) return false;
                }
                return true;
            })
            .sort((a, b) => a.city.localeCompare(b.city));
    }, [rows, filters]);

    const total = filteredRows.length;


    return (
        // Bookings Page
        // Sidebar
        <div className="flex min-h-screen">
            <aside className="w-64 border-r">
                <Sidebar />
            </aside>
            {/* Search Bar and Profile Display */}
            <main className="flex-1 flex flex-col p-6">
                <div className="flex items-center gap-4">
                    <div className="flex-1">
                        <Search />
                    </div>
                    <ProfileCard profile={displayProfile[0]} />
                </div>
                {/* Bookings Title and Description */}
                <div className="mt-6 flex items-end">
                    <div className="ml-2">
                        <h1 className="text-black text-4xl font-bold">Bookings Management</h1>
                        <p className="text-gray-500 mt-2 max-w-2xl">Managing {rows.length} bookings across all venues</p>
                    </div>
                    {/* Manual Button  */}
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
                            <button type="button" onClick={() => setManualOpen(false)}
                                    className="rounded-md border px-4 py-2">Cancel</button>
                            <button type="submit" form="manual-booking-form"
                                    className="ml-2 rounded-md px-4 py-2 bg-black text-white">
                                Add Booking
                            </button>
                        </> } >
                    <ManualBookingForm
                        onCreate={handleCreate}
                        onDone={() => setManualOpen(false)}
                    />
                </Modal>

                {/* Metrics */}
                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
                    {bookingData.map(card => (
                            <BookingMetricCard key={card.title} {...card} />
                        )
                    )
                    }

                </section>
                {/* Filters */}
                <div className="mt-6">
                    <BookingFilters
                        value={filters}
                        onChange={(patch) => setFilters(prev => ({ ...prev, ...patch }))}
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
                    onDelete={handleDelete}
                    onView={(row) => { setSelected(row); setViewOpen(true); }} // used by Edit button
                    onCancel={handleCancel}
                    onCancelMany={handleCancelMany} />

                <Modal
                    open={viewOpen}
                    onClose={() => setViewOpen(false)}
                    title={selected ? `Booking Details - ${selected.id}` : "Booking Details"}>

                    {selected && (
                        <BookingDetails
                            row={selected}
                            editable={editMode}
                            onUpdate={(updated) => {
                                setRows(prev =>
                                    prev.map(r => (r.id === updated.id ? updated : r))
                                );
                                setSelected(updated);
                                setViewOpen(false);
                            }} />
                    )}
                </Modal>
                {toast && (
                    <div className={`fixed bottom-6 right-6 px-4 py-2 rounded shadow-lg text-white
                     ${toast.type === "success" ? "bg-green-600" : "bg-red-600"}`} >
                        {toast.message}
                    </div>
                )}

            </main>
        </div>
    );
};

export default Bookings;