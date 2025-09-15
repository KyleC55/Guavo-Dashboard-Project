import type {BookingCard, MetricCardData} from "../../../types/types.ts";
import {FaCalendar} from "react-icons/fa";
import { IoIosTrendingUp } from "react-icons/io";
import { SlPeople } from "react-icons/sl";
import { PiClockThin } from "react-icons/pi";


export const metricCards: MetricCardData[] = [
    { title: "Total Bookings",   value: "2,847", change: "+12% from last month", notes: "2,419 confirmed" },
    { title: "Active Users",     value: "1,247", change: "+8% from last month",  notes: "This month" },
    { title: "Total Venues",     value: "2,700", change: "+3% from last month",  notes: "Across 6 cities" },
    { title: "Active Inquiries", value: "156",   change: "+15% from last month", notes: "Need attention" },
];

export const bookingData: BookingCard[] = [
    {title: "Total Bookings", value: 2000, subtitle: "1795 confirmed",  Icon: FaCalendar},
    {title: "Confirmed Bookings", value: 1795, subtitle:"90% confirmation rate", Icon: IoIosTrendingUp},
    {title: "Total Guest", value: 11646, subtitle:"Avg 6.5 per booking", Icon: SlPeople},
    {title: "Pending Review", value: 103, subtitle:"102 cancelled", Icon: PiClockThin}
]