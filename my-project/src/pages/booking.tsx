import Sidebar from "../components/sidebar.tsx";
import Search from "../components/searchbar.tsx";
import { ProfileCard } from "../components/profilecard.tsx";
import { displayProfile } from "../data/profile.ts";
import { bookingData } from "../data/metricCards.ts";
import BookingMetricCard from "../components/bookingmetriccard.tsx";
import BookingFilters from "../components/bookingfilters.tsx";
import Modal from "../components/modal.tsx";
import ManualBookingForm from "../components/manualbookings.tsx";
import { useState } from "react";
import AddManualBookingButton from "../components/manualbookingadd.tsx";
import BookingsTable from "../components/bookingrows.tsx";
import { mockBooking } from "../data/mockbookings.ts";
import type { BookingRow } from "../../types/types.ts";
import {BookingDetails} from "../components/bookingdetails.tsx";


const Bookings = () => {
    const [manualOpen, setManualOpen] = useState(false);
    const [viewOpen, setViewOpen] = useState(false);
    const [selected, setSelected] = useState<BookingRow | null>(null);
    const [rows, setRows] = useState<BookingRow[]>(mockBooking);
    const [editMode] = useState(false);


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
        setRows(prev => [{ id: genBookingId(prev), ...data }, ...prev]);
        setManualOpen(false);
    };

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
                    <BookingFilters />
                </div>

                {/* Display Bookings into forms */}
                <BookingsTable
                    rows={rows}
                    onDelete={handleDelete}
                    onView={(row) => { setSelected(row); setViewOpen(true); }} // used by Edit button
                    onCancel={handleCancel}
                    onCancelMany={handleCancelMany} />

                <Modal
                    open={viewOpen}
                    onClose={() => setViewOpen(false)}
                    title={selected ? `Booking Details - ${selected.id}` : "Booking Details"}
                >
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
                            }}
                        />
                    )}
                </Modal>
            </main>
        </div>
    );
};

export default Bookings;
