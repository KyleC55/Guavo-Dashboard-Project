import { useState } from "react";
import Sidebar from "../components/sidebar";
import Search from "../components/searchbar";
import MetricCard from "../components/metriccard";
import { metricCards } from "../data/metricCards";
import { bookingsPlaceholder, inquiriesPlaceholder } from "../data/bookingsandinquiries";
import { BookingItem } from "../components/bookings";
import { InquiryItem } from "../components/inquiries";
import { SectionCard } from "../components/sectioncard";
import { VenueCard } from "../components/venuecard";
import { venuePerformanceMock } from "../data/venue";
import { ProfileCard } from "../components/profilecard";
import { displayProfile } from "../data/profile";
import { Quickactionbox } from "../components/quickactionbox";
import { MdOutlineDashboard } from "react-icons/md";
import { FaRegClock } from "react-icons/fa";
import { HiOutlineChat } from "react-icons/hi";
import { CiCalendar } from "react-icons/ci";
import { useNavigate } from "react-router-dom";
import Modal from "../components/modal";
import ManualBookingForm from "../components/manualbookings.tsx";

const Dashboard = () => {
    const navigate = useNavigate();

    // NEW: modal open/close state
    const [manualOpen, setManualOpen] = useState(false);

    return (
        <div className="flex h-screen">
            <div className="w-64 border-r">
                <Sidebar />
            </div>
            <div className="flex-1 flex flex-col p-6">
                <div className="flex gap-4">
                    <Search />
                    <ProfileCard profile={displayProfile[0]} />
                </div>
                <h1 className="text-black text-4xl font-bold mt-6 ml-2">Dashboard</h1>
                <h2 className="text-gray-500 mt-2 ml-2 max-w-2xl">
                    Enterprise venue management overview across all locations
                </h2>

                <div className="mt-6 mx-2 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                    {metricCards.map((card) => (
                        <MetricCard key={card.title} {...card} />
                    ))}
                </div>

                <div className="grid gap-6 md:grid-cols-2 mt-6">
                    <SectionCard title="Recent Bookings" onViewAll={() => navigate("/bookings")}>
                        {bookingsPlaceholder.map((b) => (
                            <BookingItem key={b.id} booking={b} />
                        ))}
                    </SectionCard>

                    <SectionCard title="Pending Inquiries" onViewAll={() => navigate("/inquiries")}>
                        {inquiriesPlaceholder.map((i) => (
                            <InquiryItem key={i.id} inquiry={i} />
                        ))}
                    </SectionCard>
                </div>

                <div className="grid gap-6 md:grid-cols-2 mt-6">
                    <SectionCard
                        title="Venue Performance"
                        onViewAll={() => {
                            navigate("/venues");
                        }}
                    >
                        <div className="space-y-3">
                            {venuePerformanceMock.map((v, i) => (
                                <VenueCard key={i} data={v} />
                            ))}
                        </div>
                    </SectionCard>

                    <SectionCard title="Quick Actions" onViewAll={() => {}}>
                        <Quickactionbox
                            icon={<CiCalendar />}
                            title="Add Manual Booking"
                            subtitle="Create a new reservation"
                            onClick={() => setManualOpen(true)}/>

                        <Quickactionbox
                            icon={<HiOutlineChat />}
                            title="Review Inquiries"
                            subtitle="156 pending requests"
                            onClick={() => navigate("/inquiries")}/>

                        <Quickactionbox
                            icon={<FaRegClock />}
                            title="Check Availability"
                            subtitle="View and manage time slots"
                            onClick={() => navigate("/availability")}/>

                        <Quickactionbox
                            icon={<MdOutlineDashboard />}
                            title="Add New Venue"
                            subtitle="Expand your venue portfolio"
                            onClick={() => navigate("/addvenue")}
                        />
                    </SectionCard>
                </div>
            </div>

            <Modal
                open={manualOpen}
                title="Add Manual Booking"
                onClose={() => setManualOpen(false)}>
                <ManualBookingForm />
            </Modal>
        </div>
    );
};

export default Dashboard;

