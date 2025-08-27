export default function BookingFilters() {
    return (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-wrap items-center gap-3">
            <input
                type="text"
                placeholder="Search bookings, venues, users..."
                className="px-2 py-1 rounded-lg border border-gray-300 focus:outline-none focus:ring w-64" />

            <select className="px-2 py-1 rounded-lg bg-gray-50">
                <option>All Cities</option>
            </select>

            <select className="px-2 py-1 rounded-lg bg-gray-50">
                <option>All Sources</option>
            </select>

            <select className="px-2 py-1 rounded-lg bg-gray-50">
                <option>All Status</option>
            </select>

            <select className="px-2 py-1 rounded-lg bg-gray-50">
                <option>All Companies</option>
            </select>

            <input type="date" className="px-2 py-1 rounded-lg bg-gray-50" />
            <input type="date" className="px-2 py-1 rounded-lg bg-gray-50" />


            <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">
                      Showing 50 of 2,000 bookings
                    </span>
                    <select className="px-2 py-1 rounded bg-gray-50">
                        <option>50</option>
                    </select>
                </div>

                <div className="flex items-center gap-2">
                    <button className="px-2 py-1 border rounded">&lt;</button>
                    <span className="text-sm text-gray-600">Page 1 of 40</span>
                    <button className="px-2 py-1 border rounded">&gt;</button>
                </div>
            </div>
        </div>
    );
}
