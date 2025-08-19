import Sidebar from "../components/Sidebar";
import Search from "../components/SearchBar";

const Bookings = () => {
    return (
        <div className="flex h-screen">
            <div className="w-64 border-r">
                <Sidebar/>
            </div>
            <div>
                <Search/>
            </div>
            <div>
                <h1> Bookings </h1>
            </div>
        </div>
    );
};


export default Bookings;