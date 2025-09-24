import { useState } from "react";
import Sidebar from "../components/sidebar.tsx";
import Search from "../components/searchbar.tsx";
import { ProfileCard } from "../components/profilecard.tsx";
import { displayProfile } from "../data/profile.ts";
import Modal from "../components/modal.tsx";
import ManualBookingForm from "../components/manualbookings.tsx";
import AddManualBookingButton from "../components/manualbookingadd.tsx";
import ReservationsTable from "../components/reservationtable.tsx";
import MetricsBar from "../components/metricsbar.tsx";
import BookingFilters from "../components/bookingfilters.tsx";
import type { BookingFilterState } from "../../../types/types.ts";

const Bookings = () => {
    const [manualOpen, setManualOpen] = useState(false);

    const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

    const [confirmMultiOpen, setConfirmMultiOpen] = useState(false);
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

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

    const handleCreate = (data: any) => {
        try {
            setManualOpen(false);
            setToast({ type: "success", message: "Booking successfully created ✅" });
            setTimeout(() => setToast(null), 3000);
        } catch {
            setToast({ type: "error", message: "Booking not created ❌" });
            setTimeout(() => setToast(null), 3000);
        }
    };

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
                            Viewing reservations from the new API (all venues)
                        </p>
                    </div>
                    <div className="ml-auto shrink-0">
                        <AddManualBookingButton onClick={() => setManualOpen(true)} />
                    </div>
                </div>

                <section className="mt-6">
                    <MetricsBar />
                </section>

                <div className="mt-6">
                    <BookingFilters
                        value={filters}
                        onChange={(patch) => {
                            const next = { ...filters, ...patch };
                            setFilters(next);
                        }}
                        cities={[]}
                        sources={[]}
                        statuses={[]}
                        companies={[]}
                        total={0}
                    />
                </div>

                <div className="mt-8">
                    <ReservationsTable />
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

                <Modal
                    open={confirmMultiOpen}
                    onClose={() => setConfirmMultiOpen(false)}
                    title="Cancel Multiple Bookings"
                    showCloseButton={false}
                >
                    <div className="space-y-6">
                        <p className="text-gray-600">Bulk actions are not wired to the new table yet.</p>
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setConfirmMultiOpen(false)}
                                className="rounded-md border px-4 py-2"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </Modal>

                <Modal
                    open={confirmDeleteOpen}
                    onClose={() => setConfirmDeleteOpen(false)}
                    title="Remove Booking"
                    showCloseButton={false}
                >
                    <div className="space-y-6">
                        <p className="text-gray-600">Delete is not wired to the new table yet.</p>
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setConfirmDeleteOpen(false)}
                                className="rounded-md border px-4 py-2"
                            >
                                Close
                            </button>
                        </div>
                    </div>
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
