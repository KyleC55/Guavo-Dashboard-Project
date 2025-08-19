import { MdOutlineDashboard } from "react-icons/md";
import { CiCalendar } from "react-icons/ci";
import { HiOutlineUsers } from "react-icons/hi";
import { LuClock4 } from "react-icons/lu";
import { IoBusiness } from "react-icons/io5";
import { CiChat1 } from "react-icons/ci";
import { PiRobot } from "react-icons/pi";
import { CiSettings } from "react-icons/ci";
import { useNavigate } from "react-router-dom";

const Sidebar = () => {
    const navigate = useNavigate();
    return (
        <div className="font-sans font-bold">
            <div className="p-5 border-b border-sidebar-border text-2xl flex">
                Guavo Admin
            </div>

            <ul className="p-6 space-y-2 text-l">
                <li className="flex items-center gap-1 px-2 py-2 rounded cursor-pointer hover:bg-gray-200"
                    onClick={() => navigate("/Dashboard")}>
                    <MdOutlineDashboard size={23}/>
                    Dashboard
                </li>
                <li className="flex items-center gap-1 px-2 py-2 rounded cursor-pointer hover:bg-gray-200"
                    onClick={() => navigate("/bookings")}><CiCalendar size={23}/>
                    Bookings
                </li>
                <li className="flex items-center gap-1 px-2 py-2 rounded cursor-pointer hover:bg-gray-200"
                    onClick={() => navigate("/availability")}><LuClock4 size={23}/>
                    Availability
                </li>
                <li className="flex items-center gap-1 px-2 py-2 rounded cursor-pointer hover:bg-gray-200"
                    onClick={() => navigate("/venues")}>
                    <IoBusiness size={23}/>
                    Venues
                </li>
                <li className="flex items-center gap-1 px-2 py-2 rounded cursor-pointer"
                    onClick={() => navigate("/inquires")}>
                    <CiChat1 size={23}/>
                    Inquiries
                </li>
                <li className="flex items-center gap-1 px-2 py-2 rounded cursor-pointer"
                    onClick={() => navigate("/aichatmonitor")}>
                    <PiRobot size={23}/>
                    Ai Chat Monitor
                </li>
                <li className="flex items-center gap-1 px-2 py-2 rounded cursor-pointer"
                    onClick={() => navigate("/members")}>
                    <HiOutlineUsers size={23}/>
                    Companies & Members
                </li>
                <li className="flex items-center gap-1 px-2 py-2 rounded cursor-pointer"
                    onClick={() => navigate("/configuration")}>
                    <CiSettings size={23}/>
                    Settings
                </li>
            </ul>
        </div>
    );
};


export default Sidebar;