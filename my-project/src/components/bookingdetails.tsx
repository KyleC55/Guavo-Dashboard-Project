import * as React from "react";
import type { BookingRow } from "../../types/types";
import { venueOptions } from "../data/venuelist.ts";
import SearchableSelect from "./venuesearch.tsx";

function formatDateTime(s: string) {
    const d = new Date(s);
    if (isNaN(d.getTime())) return s;
    return d.toLocaleString(undefined, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
}

const venueSelect = Array.isArray(venueOptions)
    ? venueOptions.map(v => ({ value: v.name, label: v.name }))
    : [];

const StatusPill: React.FC<{ status: BookingRow["status"] }> = ({ status }) => (
    <span className="inline-block rounded-full px-2.5 py-1 text-xs font-medium bg-black text-white">
    {status}
  </span>
);

const SourceBadge: React.FC<{ source: BookingRow["source"] }> = ({ source }) => (
    <span className="inline-block rounded-md px-2 py-1 text-xs bg-blue-100 text-blue-700">
    {source}
  </span>
);

const Field: React.FC<{ label: string; children?: React.ReactNode }> = ({ label, children }) => (
    <div>
        <div className="text-sm text-gray-500">{label}</div>
        <div className="mt-1 font-medium">{children ?? "—"}</div>
    </div>
);

type Props = {
    row: BookingRow;
    onUpdate?: (updated: BookingRow) => void;
    onClose?: () => void;
    editable?: boolean;
};

export const BookingDetails: React.FC<Props> = ({ row, onUpdate, onClose }) => {
    const [mode, setMode] = React.useState<"view" | "edit">("view");
    const [form, setForm] = React.useState<BookingRow>(row);

    React.useEffect(() => setForm(row), [row]);

    const set = <K extends keyof BookingRow>(k: K, v: BookingRow[K]) =>
        setForm(prev => ({ ...prev, [k]: v }));

    const handleSave = () => {
        if (!onUpdate) {
            console.warn("BookingDetails: onUpdate not provided; nothing to save.");
            setMode("view");
            return;
        }
        onUpdate(form);
        setMode("view");
    };

    return (
        <div className="space-y-5">
            {/* Header actions */}
            <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">Booking ID</div>
                <div className="flex items-center gap-2">
                    {mode === "view" ? (
                        <button
                            className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
                            onClick={() => setMode("edit")}
                        >
                            Edit
                        </button>
                    ) : (
                        <>
                            <button
                                className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
                                onClick={() => { setForm(row); setMode("view"); }}
                            >
                                Cancel
                            </button>
                            <button
                                className="rounded-md px-3 py-1.5 text-sm bg-black text-white"
                                onClick={handleSave}
                            >
                                Save
                            </button>
                        </>
                    )}
                    {onClose && (
                        <button
                            className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
                            onClick={onClose}
                        >
                            Close
                        </button>
                    )}
                </div>
            </div>

            <div className="font-semibold text-lg">{form.id}</div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Venue */}
                <Field label="Venue">
                    {mode === "edit" ? (
                        venueSelect.length > 0 ? (
                            <SearchableSelect
                                options={venueSelect}
                                value={form.venue}
                                onChange={(next: string) => set("venue", next)}
                            />
                        ) : (
                            <input
                                className="border rounded-md px-3 py-2 w-full"
                                value={form.venue}
                                onChange={(e) => set("venue", e.target.value)}
                            />
                        )
                    ) : (
                        row.venue
                    )}
                </Field>

                {/* Booker */}
                <Field label="Booker">
                    {mode === "view" ? (
                        <>
                            <div>{row.booker}</div>
                            {row.email && <div className="text-sm text-gray-500">{row.email}</div>}
                        </>
                    ) : (
                        <div className="space-y-2">
                            <input
                                className="border rounded-md px-3 py-2 w-full"
                                value={form.booker}
                                onChange={(e) => set("booker", e.target.value)}
                                placeholder="Name"
                            />
                            <input
                                className="border rounded-md px-3 py-2 w-full"
                                value={form.email ?? ""}
                                onChange={(e) => set("email", e.target.value)}
                                placeholder="Email (optional)"
                            />
                        </div>
                    )}
                </Field>

                {/* Company / Role */}
                <Field label="Company">
                    {mode === "view" ? (
                        [row.company, row.role].filter(Boolean).join(" • ") || "—"
                    ) : (
                        <div className="space-y-2">
                            <input
                                className="border rounded-md px-3 py-2 w-full"
                                value={form.company ?? ""}
                                onChange={(e) => set("company", e.target.value)}
                                placeholder="Company"
                            />
                            <input
                                className="border rounded-md px-3 py-2 w-full"
                                value={form.role ?? ""}
                                onChange={(e) => set("role", e.target.value)}
                                placeholder="Role"
                            />
                        </div>
                    )}
                </Field>

                {/* Party Size */}
                <Field label="Party Size">
                    {mode === "view" ? (
                        `${row.partysize} guests`
                    ) : (
                        <input
                            type="number"
                            min={1}
                            className="border rounded-md px-3 py-2 w-full"
                            value={form.partysize}
                            onChange={(e) => set("partysize", Number(e.target.value))}
                        />
                    )}
                </Field>

                {/* Date & Time */}
                <Field label="Date & Time">
                    {mode === "view" ? (
                        formatDateTime(row.date)
                    ) : (
                        <input
                            className="border rounded-md px-3 py-2 w-full"
                            value={form.date}
                            onChange={(e) => set("date", e.target.value)}
                            placeholder="ISO or parseable date"
                        />
                    )}
                </Field>

                {/* Status */}
                <Field label="Status">
                    {mode === "view" ? (
                        <StatusPill status={row.status} />
                    ) : (
                        <select
                            className="border rounded-md px-3 py-2 w-full"
                            value={form.status}
                            onChange={(e) => set("status", e.target.value as BookingRow["status"])}
                        >
                            <option value="confirmed">confirmed</option>
                            <option value="pending">pending</option>
                            <option value="cancelled">cancelled</option>
                        </select>
                    )}
                </Field>

                {/* Source */}
                <Field label="Source">
                    {mode === "view" ? (
                        <SourceBadge source={row.source} />
                    ) : (
                        <input
                            className="border rounded-md px-3 py-2 w-full"
                            value={form.source}
                            onChange={(e) => set("source", e.target.value as BookingRow["source"])}
                        />
                    )}
                </Field>

                {/* City */}
                <Field label="City">
                    {mode === "view" ? (
                        row.city
                    ) : (
                        <input
                            className="border rounded-md px-3 py-2 w-full"
                            value={form.city}
                            onChange={(e) => set("city", e.target.value)}
                        />
                    )}
                </Field>
            </div>

            {/* Notes */}
            <div>
                <div className="text-sm text-gray-500 mb-2">Notes</div>
                {mode === "view" ? (
                    <div className="rounded-md border bg-gray-50 px-3 py-2 text-gray-700">
                        {row.notes || "—"}
                    </div>
                ) : (
                    <textarea
                        className="w-full border rounded-md px-3 py-2"
                        rows={4}
                        value={form.notes ?? ""}
                        onChange={(e) => set("notes", e.target.value)}
                        placeholder="Notes"
                    />
                )}
            </div>
        </div>
    );
};
