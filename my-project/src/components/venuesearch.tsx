import{ useEffect, useMemo, useRef, useState } from "react";

export type Option = { value: string; label: string };

type Props = {
    options: Option[];
    value: string;
    onChange: (next: string) => void;
    placeholder?: string;
    emptyText?: string;
    className?: string;
};

export default function SearchableSelect({
                                             options,
                                             value,
                                             onChange,
                                             placeholder = "Search venues…",
                                             emptyText = "No matches",
                                             className = "",
                                         }: Props) {
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef  = useRef<HTMLDivElement>(null);
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [activeIdx, setActiveIdx] = useState(0);

    useEffect(() => {
        if (!open) {
            const current = options.find(o => o.value === value);
            setQuery(current?.label ?? "");
        }
    }, [open, options, value]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return options;
        return options.filter(o =>
            o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q)
        );
    }, [options, query]);

    useEffect(() => {
        function onDocClick(e: MouseEvent) {
            if (
                inputRef.current &&
                !inputRef.current.contains(e.target as Node) &&
                listRef.current &&
                !listRef.current.contains(e.target as Node)
            ) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", onDocClick);
        return () => document.removeEventListener("mousedown", onDocClick);
    }, []);

    const selectAt = (idx: number) => {
        const opt = filtered[idx];
        if (!opt) return;
        onChange(opt.value);
        setQuery(opt.label);
        setOpen(false);
    };

    return (
        <div className={`relative ${className}`}>
            <input
                ref={inputRef}
                className="w-full border rounded-md px-3 py-2 outline-none focus:ring focus:ring-black/10"
                placeholder={placeholder}
                value={open ? query : (options.find(o => o.value === value)?.label ?? "")}
                onChange={(e) => { setQuery(e.target.value); setOpen(true); setActiveIdx(0); }}
                onFocus={() => setOpen(true)}
                onKeyDown={(e) => {
                    if (e.key === "ArrowDown") {
                        e.preventDefault();
                        setOpen(true);
                        setActiveIdx(i => Math.min(i + 1, filtered.length - 1));
                    } else if (e.key === "ArrowUp") {
                        e.preventDefault();
                        setActiveIdx(i => Math.max(i - 1, 0));
                    } else if (e.key === "Enter") {
                        e.preventDefault();
                        if (!open) { setOpen(true); return; }
                        selectAt(activeIdx);
                    } else if (e.key === "Escape") {
                        setOpen(false);
                    }
                }}
            />

            {open && (
                <div
                    ref={listRef}
                    className="absolute z-50 mt-1 w-full max-h-64 overflow-auto rounded-md border bg-white shadow-lg"
                >
                    {filtered.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-500">{emptyText}</div>
                    ) : (
                        filtered.map((opt, idx) => (
                            <div
                                key={opt.value}
                                role="option"
                                aria-selected={value === opt.value}
                                onMouseDown={(e) => { e.preventDefault(); selectAt(idx); }}
                                onMouseEnter={() => setActiveIdx(idx)}
                                className={`px-3 py-2 cursor-pointer text-sm ${
                                    idx === activeIdx ? "bg-gray-100" : ""
                                }`}>
                                {opt.label}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
