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

const Bookings = () => {
    const [manualOpen, setManualOpen] = useState(false);

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
                            Managing 2,000 bookings across all venues
                        </p>
                    </div>
                    <div className="ml-auto shrink-0">
                        <AddManualBookingButton onClick={() => setManualOpen(true)} />
                    </div>
                </div>

                <Modal
                    open={manualOpen}
                    onClose={() => setManualOpen(false)}
                    title="Add Manual Booking"
                    footer={
                        <button
                            type="submit"
                            form="manual-booking-form"
                            className="rounded-md px-4 py-2 bg-black text-white"
                        >
                            Save
                        </button>
                    }
                >
                    <ManualBookingForm onDone={() => setManualOpen(false)} />
                </Modal>

                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
                    {bookingData.map((card) => (
                        <BookingMetricCard key={card.title} {...card} />
                    ))}
                </section>

                <div className="mt-6">
                    <BookingFilters />
                </div>
            </main>
        </div>
    );
};

export default Bookings;
