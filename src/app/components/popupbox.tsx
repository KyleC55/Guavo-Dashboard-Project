// src/pages/dashboard.tsx
import { useState } from "react";
import ManualBookingForm from "./manualbookings.tsx";
import Modal from "./modal.tsx";

export default function Dashboard() {
    const [open, setOpen] = useState(false);

    return (
        <div className="p-6">
            <h2 className="text-lg font-medium mb-3">Quick Actions</h2>
            <div className="flex gap-3">
                <button
                    onClick={() => setOpen(true)}
                    className="px-4 py-2 rounded border hover:bg-gray-200"
                >
                    Add Manual Booking
                </button>
            </div>

            <Modal open={open} title="Add Manual Booking" onClose={() => setOpen(false)}>
                <ManualBookingForm />
            </Modal>
        </div>
    );
}
