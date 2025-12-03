import type {BookingFilterState} from "../../../types/types.ts";
import SearchableSelect from "./SearchableSelect";

type Props = {
    value: BookingFilterState;
    onChange: (patch: Partial<BookingFilterState>) => void;
    states: string[];
    neighborhoods: string[];
    sources: string[];
    statuses: string[];
    companies: string[];
    members: string[];
    total: number;
    onRefetch?: () => void;
    loading?: boolean;
};

export default function BookingFilters({
                                           value,
                                           onChange,
                                           states,
                                           neighborhoods,
                                           sources,
                                           statuses,
                                           companies,
                                           members,
                                           total,
                                           onRefetch,
                                           loading,
                                       }: Props) {
    const shownFrom = total === 0 ? 0 : (value.page - 1) * value.pageSize + 1;
    const shownTo = Math.min(value.page * value.pageSize, total);

    const update = (patch: Partial<BookingFilterState>) => {
        const resetKeys = ["query","state","neighborhood","source","status","company","member","startDate"];
        const needsReset = Object.keys(patch).some(k => resetKeys.includes(k));
        onChange({ ...patch, ...(needsReset ? { page: 1 } : {}) });
    };

    const resetFilters = () => {
        onChange({
            query: "",
            state: "",
            neighborhood: "",
            source: "",
            status: "",
            company: "",
            member: "",
            startDate: "",
            page: 1,
        });
    };

    const hasActiveFilters = !!(
        value.query ||
        value.state ||
        value.neighborhood ||
        value.source ||
        value.status ||
        value.company ||
        value.member ||
        value.startDate
    );

    return (
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
            {/* Header with title and actions */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b">
                <h2 className="text-xl font-semibold text-gray-900">All Reservations</h2>
                <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600 whitespace-nowrap">Rows:</label>
                    <select
                        className="border rounded px-2 py-1 text-sm"
                        value={value.pageSize}
                        onChange={(e) => onChange({ pageSize: Number(e.target.value), page: 1 })}
                    >
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>
                    {onRefetch && (
                        <button 
                            className="rounded px-3 py-1.5 text-sm border shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                            onClick={onRefetch} 
                            disabled={!!loading}
                        >
                            {loading ? "Refreshing..." : "Refresh"}
                        </button>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <input
                    type="text"
                    placeholder="Search bookings, venues, users..."
                    className="px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-48 h-9"
                    value={value.query}
                    onChange={(e) => update({ query: e.target.value })}
                />

            <div className="w-[160px]">
                <SearchableSelect
                    options={states}
                    value={value.state}
                    onChange={(v) => update({ state: v, neighborhood: "" })}
                    placeholder="Search states..."
                    emptyLabel="All States"
                    className="w-full"
                />
            </div>

            <select
                className={`px-3 py-2 rounded-lg transition-all w-[160px] h-9 ${
                    !value.state
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed opacity-60 border border-gray-200"
                        : "bg-gray-50 text-gray-900 cursor-pointer border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                }`}
                value={value.neighborhood}
                onChange={(e) => update({ neighborhood: e.target.value })}
                disabled={!value.state}
                title={!value.state ? "Please select a state first" : "Select a neighborhood"}
            >
                <option value="">{!value.state ? "Neighborhoods" : "All Neighborhoods"}</option>
                {neighborhoods.map(n => <option key={n} value={n}>{n}</option>)}
            </select>

            <select
                className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-[140px] h-9"
                value={value.source}
                onChange={(e) => update({ source: e.target.value })}
            >
                <option value="">All Sources</option>
                <option value="MANUAL">Manual</option>
                <option value="RESY_CONCIERGE">Resy</option>
                <option value="OPEN-TABLE">Open Table</option>
            </select>

            <select
                className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-[160px] h-9"
                value={value.status}
                onChange={(e) => update({ status: e.target.value })}
            >
                <option value="">All Status</option>
                {statuses.map(s => {
                    const formatted = s
                        .replace(/_/g, " ")
                        .split(" ")
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                        .join(" ");
                    return <option key={s} value={s}>{formatted}</option>;
                })}
            </select>

            <div className="w-[180px]">
                <SearchableSelect
                    options={companies}
                    value={value.company}
                    onChange={(v) => update({ company: v, member: "" })}
                    placeholder="Search companies..."
                    emptyLabel="All Companies"
                    className="w-full"
                />
            </div>

            <select
                className={`px-3 py-2 rounded-lg transition-all w-[160px] h-9 ${
                    !value.company
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed opacity-60 border border-gray-200"
                        : "bg-gray-50 text-gray-900 cursor-pointer border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                }`}
                value={value.member}
                onChange={(e) => update({ member: e.target.value })}
                disabled={!value.company}
                title={!value.company ? "Please select a company first" : "Select a member"}
            >
                <option value="">{!value.company ? "Members" : "All Members"}</option>
                {members.map(m => <option key={m} value={m}>{m}</option>)}
            </select>

            <input
                type="date"
                className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm w-[160px] h-9"
                value={value.startDate}
                onChange={(e) => update({ startDate: e.target.value })}
                placeholder="Start Date"
            />

            {hasActiveFilters && (
                <button
                    onClick={resetFilters}
                    className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium border border-gray-300 transition-colors h-9 whitespace-nowrap flex items-center gap-2"
                    title="Reset all filters"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Reset Filters
                </button>
            )}

                <div className="flex items-center gap-4 ml-auto">
                    <span className="text-sm text-gray-600 whitespace-nowrap">
                        {total === 0
                            ? "Showing 0"
                            : `Showing ${shownFrom.toLocaleString()}–${shownTo.toLocaleString()} of ${total.toLocaleString()} bookings`}
                    </span>
                </div>
            </div>
        </div>
    );
}
