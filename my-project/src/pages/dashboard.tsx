import Sidebar from "../components/sidebar.tsx";
import Search from "../components/searchbar.tsx";

const Dashboard = () => {
    return (
        <div className="flex h-screen gap-4">
            <Sidebar/>
            <Search />
        </div>
    )
}

export default Dashboard;