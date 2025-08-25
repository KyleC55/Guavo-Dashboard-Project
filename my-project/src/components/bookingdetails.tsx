import * as React from "react";
import type { BookingRow } from "../../types/types";

function formatDateTime(s: string) {
    const d = new Date(s);
    if (isNaN(d.getTime())) return s;
    return d.toLocaleString(undefined, {
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit"
    });
}

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

export const BookingDetails: React.FC<{ row: BookingRow }> = ({ row }) => {
    return (
        <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Field label="Venue">{row.venue}</Field>
                <Field label="Booker">
                    <div>{row.booker}</div>
                    {row.email && (
                        <div className="text-sm text-gray-500">{row.email}</div>
                    )}
                </Field>

                <Field label="Company">
                    {[row.company, row.role].filter(Boolean).join(" • ") || "—"}
                </Field>
                <Field label="Party Size">{row.partysize} guests</Field>

                <Field label="Date & Time">{formatDateTime(row.date)}</Field>
                <Field label="Status"><StatusPill status={row.status} /></Field>

                <Field label="Source"><SourceBadge source={row.source} /></Field>
                <Field label="City">{row.city}</Field>
            </div>

            <div>
                <div className="text-sm text-gray-500 mb-2">Notes</div>
                <div className="rounded-md border bg-gray-50 px-3 py-2 text-gray-700">
                    {row.notes || "—"}
                </div>
            </div>
        </div>
    );
};
