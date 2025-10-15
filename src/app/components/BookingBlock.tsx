import React, { useEffect, useRef, useState } from "react";

type Props = {
    guests?: number;
    date?: string;
    time?: string;
    onChange: (next: { guests?: number; date?: string; time?: string }) => void;
    className?: string;
};

export default function BookingBlocks({
                                          guests = 2,
                                          date,
                                          time = "All Day",
                                          onChange,
                                          className = "",
                                      }: Props) {
    const [open, setOpen] = useState<"guests" | "date" | "time" | null>(null);

    // close on outside click
    const popRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        const h = (e: MouseEvent) => {
            if (!popRef.current) return;
            if (!popRef.current.contains(e.target as Node)) setOpen(null);
        };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);

    const prettyDate = date
        ? new Date(date).toDateString().split(" ").slice(0, 3).join(" ")
        : "Today";

    return (
        <div className={`grid grid-cols-1 sm:grid-cols-3 gap-3 ${className}`} ref={popRef}>
            <Block
                active={open === "guests"}
                label="Guests"
                value={`${guests} Guest${guests === 1 ? "" : "s"}`}
                onClick={() => setOpen(open === "guests" ? null : "guests")}
            >
                <div className="p-3 space-y-3">
                    <Stepper
                        value={guests}
                        min={1}
                        onChange={(v) => onChange({ guests: v })}
                        label="Select number of guests"
                    />
                </div>
            </Block>

            <Block
                active={open === "date"}
                label="Date"
                value={prettyDate}
                onClick={() => setOpen(open === "date" ? null : "date")}
            >
                <div className="p-3">
                    <input
                        type="date"
                        className="w-full rounded-lg border px-3 py-2"
                        value={date ?? new Date().toISOString().slice(0, 10)}
                        onChange={(e) => onChange({ date: e.target.value })}
                    />
                    <p className="mt-2 text-xs text-gray-500">Pick a date</p>
                </div>
            </Block>

            <Block
                active={open === "time"}
                label="Time"
                value={time}
                onClick={() => setOpen(open === "time" ? null : "time")}
            >
                <div className="p-2">
                    <ul className="text-sm">
                        {["All Day", "12:00", "17:30", "18:00", "18:30", "19:00", "19:30"].map((t) => (
                            <li key={t}>
                                <button
                                    type="button"
                                    onClick={() => onChange({ time: t })}
                                    className={`w-full rounded-md px-3 py-2 text-left hover:bg-gray-50 ${
                                        time === t ? "font-semibold" : ""
                                    }`}
                                >
                                    {t}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </Block>
        </div>
    );
}

/* ---------- subcomponents ---------- */

function Block({
                   label,
                   value,
                   active,
                   onClick,
                   children,
               }: {
    label: string;
    value: string;
    active?: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <div className="relative">
            <button
                type="button"
                onClick={onClick}
                className={[
                    "w-full rounded-[28px] border bg-white px-5 py-3 text-left",
                    "shadow-sm hover:shadow transition",
                    active ? "ring-2 ring-gray-300" : "",
                ].join(" ")}
            >
                <div className="flex items-center">
                    <div className="flex-1">
                        <div className="text-xs text-gray-500">{label}</div>
                        <div className="text-lg font-extrabold">{value}</div>
                    </div>
                    <span className="ml-3 text-gray-700">▾</span>
                </div>
            </button>

            {active && (
                <div className="absolute z-50 mt-2 w-full rounded-2xl border bg-white shadow-xl">
                    {children}
                </div>
            )}
        </div>
    );
}

function Stepper({
                     value,
                     onChange,
                     min = 0,
                     max = 50,
                     label,
                 }: {
    value: number;
    onChange: (v: number) => void;
    min?: number;
    max?: number;
    label?: string;
}) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{label}</span>
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => onChange(Math.max(min, value - 1))}
                    className="h-9 w-9 rounded-full border text-xl leading-none hover:bg-gray-50"
                >
                    −
                </button>
                <div className="w-10 text-center font-semibold">{value}</div>
                <button
                    type="button"
                    onClick={() => onChange(Math.min(max, value + 1))}
                    className="h-9 w-9 rounded-full border text-xl leading-none hover:bg-gray-50"
                >
                    ＋
                </button>
            </div>
        </div>
    );
}
