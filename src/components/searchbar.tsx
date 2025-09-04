
const Search = () => {
    return (
        <div className="p-4">
            <div className="relative w-[480px]">
                <input
                    type="search"
                    placeholder="Search bookings, venues, users..."
                    className="h-8 w-full pl-10 pr-4 rounded-lg border border-gray-300
                     bg-gray-50 text-gray-700 placeholder-gray-400
                     focus:outline-none focus:border-gray-500"
                />
                <svg
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1110.5 3a7.5 7.5 0 016.15 13.65z"/>
                </svg>
            </div>
        </div>
    );
};





export default Search;