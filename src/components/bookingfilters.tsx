import type {BookingFilterState} from "../../types/types.ts";

type Props = {
    value: BookingFilterState;
    onChange: (patch: Partial<BookingFilterState>) => void;
    cities: string[];
    sources: string[];
    statuses: string[];
    companies: string[];
    total: number;
};

export default function BookingFilters({
                                           value,
                                           onChange,
                                           cities,
                                           sources,
                                           statuses,
                                           companies,
                                       }: Props) {
    const shownFrom = value.total === 0 ? 0 : (value.page - 1) * value.pageSize + 1;
    const shownTo = Math.min(value.page * value.pageSize, value.total);
    const pageCount = Math.max(1, Math.ceil(value.total / value.pageSize));

    const update = (patch: Partial<BookingFilterState>) => {
        const resetKeys = ["query","city","source","status","company","dateFrom","dateTo"];
        const needsReset = Object.keys(patch).some(k => resetKeys.includes(k));
        onChange({ ...patch, ...(needsReset ? { page: 1 } : {}) });
    };

    return (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-wrap items-center gap-3">
            <input
                type="text"
                placeholder="Search bookings, venues, users..."
                className="px-2 py-1 rounded-lg border border-gray-300 focus:outline-none focus:ring w-64"
                value={value.query}
                onChange={(e) => update({ query: e.target.value })}
            />

            <select
                className="px-2 py-1 rounded-lg bg-gray-50"
                value={value.city}
                onChange={(e) => update({ city: e.target.value })}
            >
                <option value="">All Cities</option>
                {cities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <select
                className="px-2 py-1 rounded-lg bg-gray-50"
                value={value.source}
                onChange={(e) => update({ source: e.target.value })}
            >
                <option value="">All Sources</option>
                {sources.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <select
                className="px-2 py-1 rounded-lg bg-gray-50"
                value={value.status}
                onChange={(e) => update({ status: e.target.value })}
            >
                <option value="">All Status</option>
                {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <select
                className="px-2 py-1 rounded-lg bg-gray-50"
                value={value.company}
                onChange={(e) => update({ company: e.target.value })}
            >
                <option value="">All Companies</option>
                {companies.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <input
                type="date"
                className="px-2 py-1 rounded-lg bg-gray-50"
                value={value.dateFrom}
                onChange={(e) => update({ dateFrom: e.target.value })}
            />
            <input
                type="date"
                className="px-2 py-1 rounded-lg bg-gray-50"
                value={value.dateTo}
                onChange={(e) => update({ dateTo: e.target.value })}
            />

            <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            {value.total === 0
                ? "Showing 0"
                : `Showing ${shownFrom.toLocaleString()}–${shownTo.toLocaleString()} of ${value.total.toLocaleString()} bookings`}
          </span>
                    <select
                        className="px-2 py-1 rounded bg-gray-50"
                        value={value.pageSize}
                        onChange={(e) => onChange({ pageSize: Number(e.target.value), page: 1 })}
                    >
                        {[25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        className="px-2 py-1 border rounded"
                        onClick={() => onChange({ page: Math.max(1, value.page - 1) })}
                        disabled={value.page <= 1}
                    >
                        &lt;
                    </button>
                    <span className="text-sm text-gray-600">
            Page {value.page} of {pageCount}
          </span>
                    <button
                        className="px-2 py-1 border rounded"
                        onClick={() => onChange({ page: Math.min(pageCount, value.page + 1) })}
                        disabled={value.page >= pageCount}
                    >
                        &gt;
                    </button>
                </div>
            </div>
        </div>
    );
}
