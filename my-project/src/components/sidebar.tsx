import { MdOutlineDashboard } from "react-icons/md";
import { CiCalendar } from "react-icons/ci";
import { HiOutlineUsers } from "react-icons/hi";
import { LuClock4 } from "react-icons/lu";
import { IoBusiness } from "react-icons/io5";
import { CiChat1 } from "react-icons/ci";
import { PiRobot } from "react-icons/pi";
import { CiSettings } from "react-icons/ci";

const Sidebar = () => {
    return (
        <div className="font-sans font-bold">
            <div className="p-6 border-b border-sidebar-border text-2xl flex">
                Guavo Admin
            </div>

            <ul className="p-6 space-y-6 text-l">
                <li className="flex space-x-8 gap-2"><MdOutlineDashboard size={23}/> Dashboard</li>
                <li className="flex space-x-8 gap-2"><CiCalendar size={23}/> Bookings </li>
                <li className="flex space-x-8 gap-2"><LuClock4 size={23}/> Availability </li>
                <li className="flex space-x-8 gap-2"><IoBusiness size={23}/> Venues </li>
                <li className="flex space-x-8 gap-2"><CiChat1 size={23}/> Inquiries </li>
                <li className="flex space-x-8 gap-2"><PiRobot size={23}/> Ai Chat Monitor </li>
                <li className="flex space-x-8 gap-2 whitespace-nowrap"><HiOutlineUsers size={23}/> Companies & Members </li>
                <li className="flex space-x-8 gap-2"><CiSettings size={23}/> Settings</li>
            </ul>
        </div>
    );
};


export default Sidebar;