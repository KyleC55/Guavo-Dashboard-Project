import React, { useEffect, useMemo, useRef, useState } from "react";

type Props = {
    options: string[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    emptyLabel?: string;
};

export default function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = "Search...",
    disabled = false,
    className = "",
    emptyLabel = "All",
}: Props) {
    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const btnRef = useRef<HTMLButtonElement | null>(null);
    const panelRef = useRef<HTMLDivElement | null>(null);

    const selectedLabel = useMemo(() => {
        if (!value) return emptyLabel;
        return options.find((o) => o === value) || value;
    }, [value, options, emptyLabel]);

    const filtered = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return options;
        return options.filter((o) => o.toLowerCase().includes(query));
    }, [searchQuery, options]);

    useEffect(() => {
        if (!open) {
            setSearchQuery("");
            return;
        }
        const onDoc = (e: MouseEvent) => {
            const t = e.target as Node;
            if (panelRef.current?.contains(t) || btnRef.current?.contains(t)) return;
            setOpen(false);
        };
        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, [open]);

    return (
        <div className={`relative ${className}`}>
            <button
                ref={btnRef}
                type="button"
                disabled={disabled}
                onClick={() => setOpen((o) => !o)}
                className={[
                    "px-3 py-2 rounded-lg bg-gray-50 text-left border border-gray-300",
                    "hover:ring-2 hover:ring-blue-500 hover:border-blue-500 transition",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                    disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer",
                    "flex items-center justify-between w-full h-9",
                    open ? "ring-2 ring-blue-500 border-blue-500" : "",
                ].join(" ")}
            >
                <span className="truncate">{selectedLabel}</span>
                <span className="ml-2 text-gray-700 flex-shrink-0">▾</span>
            </button>

            {open && !disabled && (
                <div
                    ref={panelRef}
                    className="absolute z-50 mt-2 w-full min-w-[200px] rounded-xl border bg-white shadow-lg overflow-hidden"
                >
                    <div className="p-2 border-b">
                        <input
                            autoFocus
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={placeholder}
                            className="w-full rounded border px-3 py-2 text-sm"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                    <div className="max-h-64 overflow-auto">
                        {filtered.length === 0 ? (
                            <div className="p-3 text-sm text-gray-500">No matches.</div>
                        ) : (
                            <ul className="divide-y">
                                <li>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onChange("");
                                            setOpen(false);
                                            setSearchQuery("");
                                        }}
                                        className={`w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 ${
                                            !value ? "bg-gray-100 font-medium" : ""
                                        }`}
                                    >
                                        <span>{emptyLabel}</span>
                                        {!value && <span className="ml-auto text-xs">✓</span>}
                                    </button>
                                </li>
                                {filtered.map((option) => (
                                    <li key={option}>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                onChange(option);
                                                setOpen(false);
                                                setSearchQuery("");
                                            }}
                                            className={`w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 ${
                                                value === option ? "bg-gray-100 font-medium" : ""
                                            }`}
                                        >
                                            <span className="truncate">{option}</span>
                                            {value === option && <span className="ml-auto text-xs flex-shrink-0">✓</span>}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

