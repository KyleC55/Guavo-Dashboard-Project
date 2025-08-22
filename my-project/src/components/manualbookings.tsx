import React, { useMemo, useState } from "react";
import type { AddBookings } from "../../types/types";
import type { BookingRow } from "../../types/types";

type ManualBookingFormProps = {
    onCreate: (data: Omit<BookingRow, "id">) => void;
    onDone?: () => void;
    onCancel?: () => void;
};

function generateTimes(stepMinutes = 30, startHour = 8, endHour = 22) {
    const out: string[] = [];
    for (let h = startHour; h <= endHour; h++) {
        for (let m = 0; m < 60; m += stepMinutes) {
            const hh = String(h).padStart(2, "0");
            const mm = String(m).padStart(2, "0");
            out.push(`${hh}:${mm}`);
        }
    }
    return out;
}

export default function ManualBookingForm({ onDone }: ManualBookingFormProps) {
    const [form, setForm] = useState<AddBookings>({
        venue: "",
        name: "",
        company: "",
        email: "",
        phonenumber: "",
        partysize: 1,
        date: "",
        startTime: "",
        endTime: "",
        notes: "",
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const allTimes = useMemo(() => generateTimes(30, 8, 22), []);
    const endTimeOptions = useMemo(() => {
        if (!form.startTime) return allTimes;
        return allTimes.filter((t) => t > form.startTime);
    }, [allTimes, form.startTime]);

    const update = (key: keyof AddBookings, value: string | number) =>
        setForm((prev) => ({ ...prev, [key]: value as any }));

    const today = useMemo(() => new Date().toISOString().split("T")[0], []);

    const validate = () => {
        const e: Record<string, string> = {};
        // 🔧 make keys match what you render below
        if (!form.name.trim()) e.name = "Required";
        if (!form.venue) e.venue = "Required";
        if (!form.date) e.date = "Required";
        if (!form.startTime) e.startTime = "Required";
        if (!form.endTime) e.endTime = "Required";
        if (form.startTime && form.endTime && form.startTime >= form.endTime) {
            e.endTime = "End must be after start";
        }
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const submit = async (ev: React.FormEvent) => {
        ev.preventDefault();
        if (!validate()) return;

        setSubmitting(true);
        try {
            // simulate API
            await new Promise((res) => setTimeout(res, 400));
            setSuccessMsg("Manual booking created.");
            onDone?.(); // 👈 close modal (parent handles state)
        } catch {
            setErrors((prev) => ({
                ...prev,
                submit: "Failed to create booking. Try again.",
            }));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="p-1 sm:p-0">
            {successMsg && (
                <div className="mb-4 rounded border border-green-300 bg-green-50 px-3 py-2 text-green-800">
                    {successMsg}
                </div>
            )}
            {errors.submit && (
                <div className="mb-4 rounded border border-red-300 bg-red-50 px-3 py-2 text-red-800">
                    {errors.submit}
                </div>
            )}

            {/* 👇 ID so your header button can requestSubmit() */}
            <form id="manual-booking-form" onSubmit={submit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm mb-1">Customer Name *</label>
                        <input
                            className="w-full rounded border px-3 py-2"
                            value={form.name}
                            onChange={(e) => update("name", e.target.value)}
                            placeholder="Jane Doe"
                        />
                        {errors.name && (
                            <p className="text-xs text-red-600 mt-1">{errors.name}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm mb-1">Venue *</label>
                        <select
                            className="w-full rounded border px-3 py-2"
                            value={form.venue}
                            onChange={(e) => update("venue", e.target.value)}
                        >
                            <option value="">Select a venue</option>
                            {/* TODO: map venues */}
                        </select>
                        {errors.venue && (
                            <p className="text-xs text-red-600 mt-1">{errors.venue}</p>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm mb-1">Email</label>
                        <input
                            type="email"
                            className="w-full rounded border px-3 py-2"
                            value={form.email ?? ""}
                            onChange={(e) => update("email", e.target.value)}
                            placeholder="jane@example.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm mb-1">Phone</label>
                        <input
                            className="w-full rounded border px-3 py-2"
                            value={form.phonenumber ?? ""}
                            onChange={(e) => update("phonenumber", e.target.value)}
                            placeholder="+1 555 123 4567"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm mb-1">Date *</label>
                        <input
                            type="date"
                            min={today}
                            className="w-full rounded border px-3 py-2"
                            value={form.date}
                            onChange={(e) => update("date", e.target.value)}
                        />
                        {errors.date && (
                            <p className="text-xs text-red-600 mt-1">{errors.date}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm mb-1">Start Time *</label>
                        <select
                            className="w-full rounded border px-3 py-2"
                            value={form.startTime}
                            onChange={(e) => update("startTime", e.target.value)}
                        >
                            <option value="">Select time</option>
                            {allTimes.map((t) => (
                                <option key={t} value={t}>
                                    {t}
                                </option>
                            ))}
                        </select>
                        {errors.startTime && (
                            <p className="text-xs text-red-600 mt-1">{errors.startTime}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm mb-1">End Time *</label>
                        <select
                            className="w-full rounded border px-3 py-2"
                            value={form.endTime}
                            onChange={(e) => update("endTime", e.target.value)}
                            disabled={!form.startTime}
                        >
                            <option value="">
                                {form.startTime ? "Select time" : "Pick start time first"}
                            </option>
                            {endTimeOptions.map((t) => (
                                <option key={t} value={t}>
                                    {t}
                                </option>
                            ))}
                        </select>
                        {errors.endTime && (
                            <p className="text-xs text-red-600 mt-1">{errors.endTime}</p>
                        )}
                    </div>
                </div>

                <div>
                    <label className="block text-sm mb-1">Notes</label>
                    <textarea
                        className="w-full rounded border px-3 py-2"
                        rows={3}
                        value={form.notes ?? ""}
                        onChange={(e) => update("notes", e.target.value)}
                        placeholder="Any special requests…"
                    />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                    <button
                        type="button"
                        className="px-3 py-2 rounded border hover:bg-gray-100"
                        onClick={() => onDone?.()} // cancel closes modal via parent
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="px-4 py-2 rounded bg-black text-white hover:bg-gray-800 disabled:opacity-60"
                    >
                        {submitting ? "Saving…" : "Add Booking"}
                    </button>
                </div>
            </form>
        </div>
    );
}
