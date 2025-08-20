import Sidebar from "../components/sidebar.tsx";
import Search from "../components/searchbar.tsx";
import {ProfileCard} from "../components/profilecard.tsx";
import {displayProfile} from "../data/profile.ts";
import {bookingData} from "../data/metricCards.ts";
import BookingMetricCard from "../components/bookingmetriccard.tsx";
import BookingFilters from "../components/bookingfilters.tsx";

const Bookings = () => {
    return (

        <div className="flex h-screen">
            <div className="w-64 border-r">
                <Sidebar/>
            </div>

            <div className="flex-1 flex flex-col p-6">
                <div className="flex gap-4">
                    <Search/>
                    <ProfileCard profile={displayProfile[0]} />
                </div>
                <h1 className="text-black text-4xl font-bold mt-6 ml-2">Booking Mangement</h1>
                <h2 className="text-gray-500 mt-2 ml-2 max-w-2xl">
                    Managing 2,000 bookings across all venues
                </h2>

                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
                        {bookingData.map((card) => (
                            <BookingMetricCard key={card.title} {...card} />
                        ))}
                </section>
                <BookingFilters/>
            </div>
        </div>
    )
};


export default Bookings;