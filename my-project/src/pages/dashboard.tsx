import Sidebar from "../components/sidebar.tsx";
import Search from "../components/search.tsx";

const Dashboard = () => {
    return (
        <div className="flex h-screen gap-4">
            <aside className="border-r"> <Sidebar/> </aside>
            <Search />
        </div>
    )
}

export default Dashboard;