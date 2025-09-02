import { useEffect, useMemo, useRef, useState } from "react";
import type { BookingRow } from "../../types/types";

type Props = {
    row: BookingRow;
    onUpdate?: (updated: BookingRow) => void;
};

export default function EditBookingDetails({ row, onUpdate }: Props) {
    const [form, setForm] = useState<BookingRow>(row);
    const venueRef = useRef<HTMLInputElement>(null);

    useEffect(() => setForm(row), [row]);

    useEffect(() => {
        const t = setTimeout(() => venueRef.current?.focus(), 0);
        return () => clearTimeout(t);
    }, [row.id]);

    const setField = <K extends keyof BookingRow>(key: K, value: BookingRow[K]) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    const toLocalInput = (iso?: string) => {
        if (!iso) return "";
        const d = new Date(iso);
        const pad = (n: number) => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
            d.getHours()
        )}:${pad(d.getMinutes())}`;
    };

    const fromLocalInput = (val: string) => (val ? new Date(val).toISOString() : val);

    const statusOptions = useMemo<string[]>(
        () =>
            Array.from(
                new Set(
                    [row.status as unknown as string, "confirmed", "pending", "cancelled"].filter(Boolean)
                )
            ),
        [row.status]
    );

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Edit Booking</h2>
                <button
                    type="button"
                    onClick={() => onUpdate?.({ ...row, ...form, id: row.id })}
                    className="rounded-md px-3 py-1 bg-black text-white"
                >
                    Save
                </button>
            </div>

            {/* Form */}
            <form
                className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6"
                onSubmit={(e) => {
                    e.preventDefault();
                    onUpdate?.({ ...row, ...form, id: row.id });
                }}
            >
                {/* Venue */}
                <div>
                    <label className="block text-sm text-gray-600 mb-1">Venue</label>
                    <input
                        ref={venueRef}
                        type="text"
                        className="w-full rounded-md border px-3 py-2"
                        value={form.venue ?? ""}
                        onChange={(e) => setField("venue", e.target.value)}
                    />
                </div>

                {/* Booker */}
                <div>
                    <label className="block text-sm text-gray-600 mb-1">Booker</label>
                    <input
                        type="text"
                        className="w-full rounded-md border px-3 py-2"
                        value={form.booker ?? ""}
                        onChange={(e) => setField("booker", e.target.value)}
                    />
                </div>

                {/* Email */}
                <div>
                    <label className="block text-sm text-gray-600 mb-1">Email (optional)</label>
                    <input
                        type="email"
                        className="w-full rounded-md border px-3 py-2"
                        value={form.email ?? ""}
                        onChange={(e) => setField("email", e.target.value)}
                    />
                </div>

                {/* Party Size */}
                <div>
                    <label className="block text-sm text-gray-600 mb-1">Party Size</label>
                    <input
                        type="number"
                        min={1}
                        className="w-full rounded-md border px-3 py-2"
                        value={((form as any).partySize ?? (form as any).partysize ?? "") as number | string}
                        onChange={(e) =>
                            setForm((prev) => {
                                const n = Number(e.target.value || 0);
                                if ("partySize" in prev) {
                                    return { ...(prev as any), partySize: n } as BookingRow;
                                }
                                return { ...(prev as any), partysize: n } as BookingRow;
                            })
                        }
                    />
                </div>

                {/* Company */}
                <div>
                    <label className="block text-sm text-gray-600 mb-1">Company</label>
                    <input
                        type="text"
                        className="w-full rounded-md border px-3 py-2"
                        value={form.company ?? ""}
                        onChange={(e) => setField("company", e.target.value)}
                    />
                </div>

                {/* Role */}
                <div>
                    <label className="block text-sm text-gray-600 mb-1">Role</label>
                    <input
                        type="text"
                        className="w-full rounded-md border px-3 py-2"
                        value={form.role ?? ""}
                        onChange={(e) => setField("role", e.target.value)}
                    />
                </div>

                {/* Date & Time (fixed) */}
                <div>
                    <label className="block text-sm text-gray-600 mb-1">Date &amp; Time</label>
                    <input
                        type="datetime-local"
                        className="w-full rounded-md border px-3 py-2"
                        value={toLocalInput(form.date)}
                        onChange={(e) =>
                            setForm((prev) => ({
                                ...prev,
                                date: fromLocalInput(e.target.value) as BookingRow["date"],
                            }))
                        } />
                </div>

                {/* Status */}
                <div>
                    <label className="block text-sm text-gray-600 mb-1">Status</label>
                    <select
                        className="w-full rounded-md border px-3 py-2"
                        value={(form.status as unknown as string) ?? ""}
                        onChange={(e) => setField("status", e.target.value as BookingRow["status"])}
                    >
                        {statusOptions.map((s) => (
                            <option key={s} value={s}>
                                {s}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Source */}
                <div>
                    <label className="block text-sm text-gray-600 mb-1">Source</label>
                    <input
                        type="text"
                        className="w-full rounded-md border px-3 py-2"
                        value={(form.source as unknown as string) ?? ""}
                        onChange={(e) => setField("source", e.target.value as BookingRow["source"])}
                    />
                </div>

                {/* City */}
                <div>
                    <label className="block text-sm text-gray-600 mb-1">City</label>
                    <input
                        type="text"
                        className="w-full rounded-md border px-3 py-2"
                        value={form.city ?? ""}
                        onChange={(e) => setField("city", e.target.value)}
                    />
                </div>

                {/* Notes */}
                <div className="md:col-span-2">
                    <label className="block text-sm text-gray-600 mb-1">Notes</label>
                    <textarea
                        className="w-full min-h-[140px] rounded-md border px-3 py-2"
                        value={form.notes ?? ""}
                        onChange={(e) => setField("notes", e.target.value)}
                    />
                </div>
            </form>
        </div>
    );
}
