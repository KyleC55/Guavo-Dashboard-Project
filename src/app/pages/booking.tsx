import { useEffect, useState, useMemo, useRef } from "react";
import Sidebar from "../components/sidebar";
import Search from "../components/searchbar";
import { ProfileCard } from "../components/profilecard";
import { getDisplayProfile } from "../data/profile";
import Modal from "../components/modal";
import ManualBookingForm from "../components/manualbookings";
import AddManualBookingButton from "../components/manualbookingadd";
import ReservationsTable from "../components/reservationtable";
import MetricsBar from "../components/metricsbar";
import BookingFilters from "../components/bookingfilters";
import type { BookingFilterState } from "../../../types/types";
import { FiSidebar } from "react-icons/fi";
import { useListedRestaurantsOnOpen } from "../hooks/useListedRestaurants";
import { useAllReservations } from "../hooks/getreservation";
import { useReservationMetrics } from "../hooks/metricsCard";

type RestaurantOption = {
    value: string;           
    label: string;
    meta?: string;
    uuid: string;           
    id?: number | null;      
    addressLine1?: string | null;
    addressLine2?: string | null;
    cityLocation?: string | null;
};

const Bookings = () => {
    const [manualOpen, setManualOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [showSuccessToast, setShowSuccessToast] = useState(false);
    
    // Get total bookings for subtitle
    const { totalBookings, loading: metricsLoading } = useReservationMetrics();

    const [filters, setFilters] = useState<BookingFilterState>({
        query: "",
        state: "",
        neighborhood: "",
        source: "",
        status: "",
        company: "",
        member: "",
        startDate: "",
        page: 1,
        pageSize: 50,
        total: 0,
    });

    // Use a ref instead of state to avoid render-time updates
    const metricsRefetchRef = useRef<(() => Promise<void>) | null>(null);

    // Table data - use backend filtering
    const {
        rows,
        count,
        loading,
        error,
        refetch,
        limit,
        offset,
        setOffset,
        setLimit,
        canPrev,
        canNext,
    } = useAllReservations(filters.pageSize, {}, {
        status: filters.status || undefined,
        state: filters.state || undefined,
        neighborhood: filters.neighborhood || undefined,
        company: filters.company || undefined,
        member: filters.member || undefined,
        source: filters.source || undefined,
        startDate: filters.startDate || undefined,
        query: filters.query || undefined,
    });

    // Reset offset when filters change
    useEffect(() => {
        if (offset > 0) {
            setOffset(0);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        filters.startDate,
        filters.state,
        filters.neighborhood,
        filters.status,
        filters.company,
        filters.member,
        filters.source,
        filters.query,
    ]);

    useEffect(() => {
        setLimit(filters.pageSize);
    }, [filters.pageSize, setLimit]);


    // Extract unique filter values from data
    const filterOptions = useMemo(() => {
        const data = rows ?? [];
        const states = new Set<string>();
        const neighborhoodsByState = new Map<string, Set<string>>();
        const statuses = new Set<string>();
        const companies = new Set<string>();
        const membersByCompany = new Map<string, Set<string>>();
        const sources = new Set<string>();

        data.forEach((r) => {
            const state = r.restaurant?.city?.location;
            const neighborhood = r.restaurant?.city?.neighborhood;
            
            if (state) {
                states.add(state);
                if (neighborhood) {
                    if (!neighborhoodsByState.has(state)) {
                        neighborhoodsByState.set(state, new Set<string>());
                    }
                    neighborhoodsByState.get(state)!.add(neighborhood);
                }
            }
            
            if (r.status) {
                statuses.add(r.status);
            }
            
            const companyName = r.corporate?.name;
            if (companyName) {
                companies.add(companyName);
                
                // Extract member name for this company
                if (r.member) {
                    const memberName = [
                        r.member.firstName,
                        r.member.lastName
                    ].filter(Boolean).join(" ") || r.member.email || "";
                    
                    if (memberName) {
                        if (!membersByCompany.has(companyName)) {
                            membersByCompany.set(companyName, new Set<string>());
                        }
                        membersByCompany.get(companyName)!.add(memberName);
                    }
                }
            }
            
            // Source could be derived from type or other fields
            if (r.type) {
                sources.add(r.type);
            }
        });

        // Convert neighborhoods map to sorted arrays
        const neighborhoodsMap: Record<string, string[]> = {};
        neighborhoodsByState.forEach((neighborhoods, state) => {
            neighborhoodsMap[state] = Array.from(neighborhoods).sort();
        });

        // Convert members map to sorted arrays
        const membersMap: Record<string, string[]> = {};
        membersByCompany.forEach((members, company) => {
            membersMap[company] = Array.from(members).sort();
        });

        return {
            states: Array.from(states).sort(),
            neighborhoodsByState: neighborhoodsMap,
            statuses: Array.from(statuses).sort(),
            companies: Array.from(companies).sort(),
            membersByCompany: membersMap,
            sources: Array.from(sources).sort(),
        };
    }, [rows]);

    // No client-side filtering needed - backend handles it

    //  
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

    // Fetch listed restaurants when modal opens
    const {
        options: rawRestaurantOptions,
        loading: restaurantsLoading,
        error: restaurantsError,
    } = useListedRestaurantsOnOpen(manualOpen, 500);

    // Normalize options so ManualBookingForm always has value/uuid/label/meta, and id if available
    const restaurantOptions: RestaurantOption[] = useMemo(() => {
        return (rawRestaurantOptions ?? [])
            .filter((o: any) => o.value || o.uuid) // Only include options with a valid uuid
            .map((o: any) => {
                const uuid = o.uuid ?? o.value ?? "";
                return {
            id: typeof o.id === "number" ? o.id : (typeof o.numericId === "number" ? o.numericId : null),
                    value: uuid,                    // used by AvailableSlots
                    uuid: uuid,                     // required, equals value
            label: o.label ?? o.name ?? "(Unnamed)",
            meta: o.meta ?? o.city ?? o.timezone ?? "",
                    addressLine1: o.addressLine1 ?? null,
                    addressLine2: o.addressLine2 ?? null,
                    cityLocation: o.cityLocation ?? null,
                };
            });
    }, [rawRestaurantOptions]);

    // ManualBookingForm -> onCreate payload mapper
    // Note: The form now handles booking creation directly, so this is just a callback
    // that gets called after the booking is created (for any additional logic if needed)
    const handleCreate = async (_data: any) => {
        // The form already creates the booking and calls onBookingCreated for refresh
        // This callback is kept for backwards compatibility but doesn't need to do anything
        // since onBookingCreated already handles the refresh
    };

    // Pager helpers
    const safeLimit = Math.max(1, Number(limit || 1));
    const safeOffset = Math.max(0, Number(offset || 0));
    const safeCount = Math.max(0, Number(count || 0));

    const page = useMemo(() => Math.floor(safeOffset / safeLimit) + 1, [safeOffset, safeLimit]);
    const totalPages = useMemo(
        () => (safeLimit > 0 ? Math.max(1, Math.ceil(safeCount / safeLimit)) : 1),
        [safeCount, safeLimit]
    );

    // Backend handles filtering, so we just use the rows directly
    const tableRows = rows ?? [];
    const tableCount = safeCount;
    const tablePage = page;
    const tableTotalPages = totalPages;
    const handlePrevPage = canPrev
        ? () => setOffset(Math.max(0, safeOffset - safeLimit))
        : undefined;
    const handleNextPage = canNext
        ? () => setOffset(safeOffset + safeLimit)
        : undefined;

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
                        <ProfileCard profile={getDisplayProfile()} />
                    </div>

                    <div className="mt-5 flex flex-wrap items-center gap-3">
                        <h1 className="text-3xl font-bold">Bookings Management</h1>
                        <div className="ml-auto">
                            <AddManualBookingButton onClick={() => setManualOpen(true)} />
                        </div>
                    </div>
                    <p className="text-gray-500 text-sm mt-2">
                        Managing {metricsLoading ? "…" : totalBookings.toLocaleString()} bookings across all venues
                    </p>

                    <section className="mt-6">
                        <MetricsBar onRefetchReady={(refetch) => {
                            metricsRefetchRef.current = refetch;
                        }} />
                    </section>

                    <div className="mt-5">
                        <BookingFilters
                            value={filters}
                            onChange={(patch) => {
                                // Clear neighborhood if state changes
                                if (patch.state !== undefined && patch.state !== filters.state) {
                                    setFilters({ ...filters, ...patch, neighborhood: "" });
                                } 
                                // Clear member if company changes
                                else if (patch.company !== undefined && patch.company !== filters.company) {
                                    setFilters({ ...filters, ...patch, member: "" });
                                } else {
                                    setFilters({ ...filters, ...patch });
                                }
                            }}
                            states={filterOptions.states}
                            neighborhoods={filterOptions.neighborhoodsByState[filters.state] || []}
                            sources={filterOptions.sources}
                            statuses={filterOptions.statuses}
                            companies={filterOptions.companies}
                            members={filterOptions.membersByCompany[filters.company] || []}
                            total={tableCount}
                            onRefetch={() => {
                                if (refetch) {
                                    refetch().catch((err) => {
                                        console.error("Error refreshing reservations:", err);
                                    });
                                }
                            }}
                            loading={loading}
                        />
                    </div>

                    {error && (
                        <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                            Failed to load reservations. {String(error.message || "")}
                        </div>
                    )}
                </div>

                {/* Table */}
                <div className="px-6 pb-10">
                    <div className="w-full rounded-lg border border-neutral-200 shadow-sm overflow-hidden bg-white">
                        <div className="overflow-x-auto table-fit">
                            <ReservationsTable
                                rows={tableRows}
                                loading={!!loading}
                                total={tableCount}
                                page={tablePage}
                                totalPages={tableTotalPages}
                                onPrevPage={handlePrevPage}
                                onNextPage={handleNextPage}
                                onRefetch={refetch}
                            />
                        </div>
                    </div>
                </div>

                {/* Modal: Add Manual Booking */}
                <Modal
                    open={manualOpen}
                    onClose={() => setManualOpen(false)}
                    showCloseButton={false}
                    title="Add Manual Booking"
                    size="xl"
                    logo={
                        <img 
                            src="/GuavoLogo.png" 
                            alt="Guavo Logo" 
                            className="h-8 w-auto"
                        />
                    }
                    footer={
                        <>
                            <button type="button" onClick={() => setManualOpen(false)} className="rounded-md bg-red-600 text-white px-4 py-2 hover:bg-red-700">
                                Cancel
                            </button>
                            <button type="submit" form="manual-booking-form" className="ml-2 rounded-md px-4 py-2 bg-black text-white">
                                Add Booking
                            </button>
                        </>
                    }
                >
                    <div className="overflow-visible pr-1">
                        {restaurantsError && (
                            <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                                Failed to load restaurants. Try reopening the modal.
                            </div>
                        )}

                        <ManualBookingForm
                            onCreate={handleCreate}
                            onDone={() => setManualOpen(false)}
                            onBookingCreated={async () => {
                                // Refresh both reservations table and metrics
                                await Promise.all([
                                    refetch(),
                                    (metricsRefetchRef.current && typeof metricsRefetchRef.current === 'function') 
                                        ? metricsRefetchRef.current() 
                                        : Promise.resolve(),
                                ]);
                                // Show success toast after refresh completes
                                setShowSuccessToast(true);
                                setTimeout(() => {
                                    setShowSuccessToast(false);
                                }, 3000);
                                // Automatically close the modal after booking is created
                                setManualOpen(false);
                            }}
                            restaurantOptions={restaurantOptions as RestaurantOption[]}
                            restaurantsLoading={restaurantsLoading}
                        />
                    </div>
                </Modal>

                {/* Other modals */}
                <Modal open={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)} title="Remove Booking" showCloseButton={false}>
                    <div className="space-y-6">
                        <p className="text-gray-600">Delete is not wired yet.</p>
                        <div className="flex justify-end gap-3">
                            <button type="button" onClick={() => setConfirmDeleteOpen(false)} className="rounded-md border px-4 py-2">
                                Close
                            </button>
                        </div>
                    </div>
                </Modal>

                {/* Success Toast */}
                {showSuccessToast && (
                    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5">
                        <div className="bg-green-600 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px]">
                            <div className="flex-shrink-0">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <div className="font-semibold">Booking Successfully Created!</div>
                            </div>
                            <button
                                onClick={() => {
                                    setShowSuccessToast(false);
                                }}
                                className="flex-shrink-0 text-white hover:text-gray-200 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
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
