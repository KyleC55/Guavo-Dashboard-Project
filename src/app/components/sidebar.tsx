import { MdOutlineDashboard } from "react-icons/md";
import { CiCalendar, CiChat1, CiSettings } from "react-icons/ci";
import { HiOutlineUsers } from "react-icons/hi";
import { LuClock4 } from "react-icons/lu";
import { IoBusiness } from "react-icons/io5";
import { PiRobot } from "react-icons/pi";
import { FiX } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

interface SidebarProps {
    onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
    const navigate = useNavigate();

    return (
        <div className="font-sans font-bold h-full flex flex-col">
            {/* Header: Guavo Admin + X button */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 text-2xl">
                <span>Guavo Admin</span>
                {onClose && (
                    <button
                        onClick={onClose}
                        aria-label="Close sidebar"
                        className="p-1.5 rounded-md hover:bg-gray-100 active:scale-95 transition"
                    >
                        <FiX size={22} />
                    </button>
                )}
            </div>

            {/* Menu Items */}
            <ul className="p-4 space-y-2 text-base">
                <li
                    className="flex items-center gap-2 px-2 py-2 rounded cursor-pointer hover:bg-gray-200"
                    onClick={() => navigate("/Dashboard")}
                >
                    <MdOutlineDashboard size={23} />
                    Dashboard
                </li>
                <li
                    className="flex items-center gap-2 px-2 py-2 rounded cursor-pointer hover:bg-gray-200"
                    onClick={() => navigate("/bookings")}
                >
                    <CiCalendar size={23} />
                    Bookings
                </li>
                <li
                    className="flex items-center gap-2 px-2 py-2 rounded cursor-pointer hover:bg-gray-200"
                    onClick={() => navigate("/availability")}
                >
                    <LuClock4 size={23} />
                    Availability
                </li>
                <li
                    className="flex items-center gap-2 px-2 py-2 rounded cursor-pointer hover:bg-gray-200"
                    onClick={() => navigate("/venues")}
                >
                    <IoBusiness size={23} />
                    Venues
                </li>
                <li
                    className="flex items-center gap-2 px-2 py-2 rounded cursor-pointer hover:bg-gray-200"
                    onClick={() => navigate("/inquiries")}
                >
                    <CiChat1 size={23} />
                    Inquiries
                </li>
                <li
                    className="flex items-center gap-2 px-2 py-2 rounded cursor-pointer hover:bg-gray-200"
                    onClick={() => navigate("/aichatmonitor")}
                >
                    <PiRobot size={23} />
                    AI Chat Monitor
                </li>
                <li
                    className="flex items-center gap-2 px-2 py-2 rounded cursor-pointer hover:bg-gray-200"
                    onClick={() => navigate("/members")}
                >
                    <HiOutlineUsers size={23} />
                    Companies & Members
                </li>
                <li
                    className="flex items-center gap-2 px-2 py-2 rounded cursor-pointer hover:bg-gray-200"
                    onClick={() => navigate("/configuration")}
                >
                    <CiSettings size={23} />
                    Settings
                </li>
            </ul>
        </div>
    );
};

export default Sidebar;
