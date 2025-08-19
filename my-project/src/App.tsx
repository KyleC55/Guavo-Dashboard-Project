import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/dashboard.tsx";
import Booking from "./pages/booking.tsx";
import Venues from "./pages/venues.tsx";
import Inquiries from "./pages/inquiries.tsx";
import Members from "./pages/members.tsx";

export default function App() {
    return (
        <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/bookings" element={<Booking />} />
            <Route path="/inquiries" element={<Inquiries />} />
            <Route path="/venues" element={<Venues />} />
            <Route path="/members" element={<Members />} />
        </Routes>
    );
}
