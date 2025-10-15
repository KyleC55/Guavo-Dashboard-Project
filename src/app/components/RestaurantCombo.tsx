import { useEffect, useMemo, useRef, useState } from "react";

export type RestaurantOption = {
    value: string;           // usually the restaurant id
    label: string;           // display name
    meta?: string;
};

type Props = {
    options: RestaurantOption[];
    value: string;                         // selected value
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    loading?: boolean;
};

export default function RestaurantCombobox({
                                               options,
                                               value,
                                               onChange,
                                               placeholder = "Search restaurants…",
                                               disabled,
                                               loading,
                                           }: Props) {
    const [open, setOpen] = useState(false);
    const [q, setQ] = useState("");
    const buttonRef = useRef<HTMLButtonElement | null>(null);
    const panelRef = useRef<HTMLDivElement | null>(null);

    const selected = useMemo(
        () => options.find(o => o.value === value),
        [options, value]
    );

    const filtered = useMemo(() => {
        const s = q.trim().toLowerCase();
        if (!s) return options;
        return options.filter(
            o => o.label.toLowerCase().includes(s) || o.meta?.toLowerCase().includes(s)
        );
    }, [options, q]);

    // close on outside click
    useEffect(() => {
        if (!open) return;
        const onDocClick = (e: MouseEvent) => {
            const t = e.target as Node;
            if (panelRef.current?.contains(t) || buttonRef.current?.contains(t)) return;
            setOpen(false);
        };
        document.addEventListener("mousedown", onDocClick);
        return () => document.removeEventListener("mousedown", onDocClick);
    }, [open]);

    // keyboard nav
    const [activeIdx, setActiveIdx] = useState(0);
    useEffect(() => setActiveIdx(0), [q, open]);

    return (
        <div className="relative">
            {/* Trigger */}
            <button
                ref={buttonRef}
                type="button"
                disabled={disabled}
                onClick={() => setOpen(o => !o)}
                className={[
                    "w-full rounded border px-3 py-2 text-left",
                    "flex items-center justify-between",
                    disabled ? "bg-gray-50 text-gray-500" : "bg-white",
                ].join(" ")}
            >
        <span className={selected ? "" : "text-gray-400"}>
          {selected ? selected.label : "Select a restaurant"}
        </span>
                <span className="ml-2 text-sm">▾</span>
            </button>

            {/* Panel */}
            {open && (
                <div
                    ref={panelRef}
                    className="absolute z-50 mt-2 w-full rounded-lg border bg-white shadow-lg"
                >
                    <div className="p-2 border-b">
                        <input
                            autoFocus
                            value={q}
                            onChange={e => setQ(e.target.value)}
                            placeholder={placeholder}
                            className="w-full rounded border px-3 py-2"
                        />
                    </div>

                    <div className="max-h-64 overflow-auto">
                        {loading ? (
                            <div className="p-3 text-sm text-gray-500">Loading…</div>
                        ) : filtered.length === 0 ? (
                            <div className="p-3 text-sm text-gray-500">No matches.</div>
                        ) : (
                            <ul className="divide-y">
                                {filtered.map((o, i) => {
                                    const isActive = i === activeIdx;
                                    const isSelected = o.value === value;
                                    return (
                                        <li key={o.value}>
                                            <button
                                                type="button"
                                                onMouseEnter={() => setActiveIdx(i)}
                                                onClick={() => {
                                                    onChange(o.value);
                                                    setOpen(false);
                                                    setQ("");
                                                }}
                                                className={[
                                                    "w-full flex items-center gap-3 p-3 text-left",
                                                    isActive ? "bg-gray-50" : "bg-white",
                                                ].join(" ")}
                                            >
                                                <span className="font-medium">{o.label}</span>
                                                {o.meta && (
                                                    <span className="ml-auto text-xs text-gray-500">{o.meta}</span>
                                                )}
                                                {isSelected && <span className="ml-2 text-xs">✓</span>}
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
