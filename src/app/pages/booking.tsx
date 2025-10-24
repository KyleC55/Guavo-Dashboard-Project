import { useEffect, useState } from "react";
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
import { FiSidebar } from "react-icons/fi";
import { useListedRestaurantsOnOpen } from "../hooks/useListedRestaurants.tsx";

type RestaurantOption = { value: string; label: string; meta?: string };

const Bookings = () => {
    const [manualOpen, setManualOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
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

    // Load ONLY listed restaurants when the modal is opened
    const {
        options: restaurantOptions,
        loading: restaurantsLoading,
        error: restaurantsError,
    } = useListedRestaurantsOnOpen(manualOpen, 500);

    // Sidebar behavior
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSidebarOpen(false);
        if (sidebarOpen) document.body.style.overflow = "hidden";
        else document.body.style.overflow = "";
        window.addEventListener("keydown", onKey);
        return () => {
            window.removeEventListener("keydown", onKey);
            document.body.style.overflow = "";
        };
    }, [sidebarOpen]);

    const handleCreate = (_data: any) => {
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
        <div className="relative flex min-h-screen bg-white">
            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 z-40 h-full w-64 bg-white border-r border-neutral-200 transform transition-transform duration-300 ease-in-out ${
                    sidebarOpen ? "translate-x-0" : "-translate-x-full"
                }`}
                aria-hidden={!sidebarOpen}
            >
                <Sidebar onClose={() => setSidebarOpen(false)} />
            </aside>

            {/* Overlay */}
            {sidebarOpen && (
                <button
                    aria-label="Close sidebar overlay"
                    onClick={() => setSidebarOpen(false)}
                    className="fixed inset-0 z-30 bg-black/30"
                />
            )}

            <main className="flex-1 flex flex-col w-full">
                {/* Header */}
                <div className="w-full px-6 py-6 relative">
                    <button
                        aria-label="Toggle sidebar"
                        onClick={() => setSidebarOpen((s) => !s)}
                        className="absolute top-6 left-6 inline-flex items-center justify-center rounded-md border border-neutral-300 bg-white p-2 shadow-sm hover:bg-neutral-100 active:scale-[0.98] transition"
                        title="Toggle Sidebar"
                    >
                        <FiSidebar size={18} />
                    </button>

                    <div className="flex items-center gap-3 pl-14">
                        <div className="flex-1 min-w-0">
                            <Search />
                        </div>
                        <ProfileCard profile={displayProfile[0]} />
                    </div>

                    <div className="mt-5 flex flex-wrap items-center gap-3">
                        <h1 className="text-3xl font-bold">Bookings Management</h1>
                        <div className="ml-auto">
                            <AddManualBookingButton onClick={() => setManualOpen(true)} />
                        </div>
                    </div>
                    <p className="text-gray-500 text-sm mt-2">
                        Viewing reservations from the new API (all venues)
                    </p>

                    <section className="mt-6">
                        <MetricsBar />
                    </section>

                    <div className="mt-5">
                        <BookingFilters
                            value={filters}
                            onChange={(patch) => setFilters({ ...filters, ...patch })}
                            cities={[]}
                            sources={[]}
                            statuses={[]}
                            companies={[]}
                            total={0}
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="px-6 pb-10">
                    <div className="w-full rounded-lg border border-neutral-200 shadow-sm overflow-hidden bg-white">
                        <div className="flex items-center justify-between px-4 py-4 border-b">
                            <h2 className="text-xl font-semibold text-gray-900">All Reservations</h2>
                            <div className="flex items-center gap-2">
                                <label className="text-sm text-gray-600">Rows:</label>
                                <select className="border rounded px-2 py-1">
                                    <option value={25}>25</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                </select>
                                <button className="rounded px-3 py-2 border shadow-sm hover:bg-gray-50">
                                    Refresh
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto table-fit">
                            <ReservationsTable />
                        </div>
                    </div>
                </div>

                {/* Modal: Add Manual Booking */}
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
                    {/* Scrollable form body START */}
                    <div className="max-h-[75vh] overflow-auto custom-scroll pr-1">
                        {/* Optional inline error for restaurants */}
                        {restaurantsError && (
                            <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                                Failed to load restaurants. Try reopening the modal.
                            </div>
                        )}

                        <ManualBookingForm
                            onCreate={handleCreate}
                            onDone={() => setManualOpen(false)}
                            restaurantOptions={restaurantOptions as RestaurantOption[]}
                            restaurantsLoading={restaurantsLoading}
                        />
                    </div>
                    {/* Scrollable form body END */}
                </Modal>

                {/* Other modals */}
                <Modal
                    open={confirmMultiOpen}
                    onClose={() => setConfirmMultiOpen(false)}
                    title="Cancel Multiple Bookings"
                    showCloseButton={false}
                >
                    <div className="space-y-6">
                        <p className="text-gray-600">Bulk actions are not wired yet.</p>
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
                        <p className="text-gray-600">Delete is not wired yet.</p>
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

            <style>{`
        .table-fit table {
          table-layout: auto !important;
          width: 100% !important;
          font-size: 0.875rem;
          line-height: 1.25rem;
          border-collapse: separate;
          border-spacing: 0 4px;
        }
        .table-fit thead th,
        .table-fit tbody td {
          padding: 0.65rem 0.8rem;
          vertical-align: middle;
        }
        .table-fit thead th {
          white-space: nowrap;
          background-color: #fafafa;
        }
        .table-fit tbody td {
          white-space: normal;
        }
      `}</style>
        </div>
    );
};

export default Bookings;

/* ───────────────────── Optional: scrollbar styling (global-friendly) ───────────────────── */
/* If you don't already have this in globals.css, you can paste it there instead: */
