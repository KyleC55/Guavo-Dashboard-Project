import Sidebar from "../components/sidebar.tsx";
import Search from "../components/searchbar.tsx";
import MetricCard from "../components/metriccard.tsx";
import { metricCards} from "../data/metricCards.ts";


const Dashboard = () => {
    return (
        <div className="flex h-screen">
            <div className="w-64 border-r">
                <Sidebar />
            </div>

            <div className="flex-1 flex flex-col p-6">
                <Search />

                <h1 className="text-black text-4xl font-bold mt-6 ml-2">Dashboard</h1>
                <h2 className="text-gray-500 mt-2 ml-2 max-w-2xl">
                    Enterprise venue management overview across all locations
                </h2>

                <div className="mt-6 mx-2 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                    {metricCards.map((card) => (
                        <MetricCard key={card.title} {...card} />
                    ))}
                </div>
            </div>
        </div>
    );
};
export default Dashboard;