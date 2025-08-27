import React, { useEffect } from "react";

type DrawerProps = {
    open: boolean;
    title?: string;
    onClose: () => void;
    children: React.ReactNode;
    widthClass?: string;
};

export default function Drawer({
                                   open,
                                   title,
                                   onClose,
                                   children,
                                   widthClass = "w-[520px]",
                               }: DrawerProps) {
    useEffect(() => {
        const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        document.addEventListener("keydown", onEsc);
        return () => document.removeEventListener("keydown", onEsc);
    }, [onClose]);

    return (
        <div
            className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`}
            aria-hidden={!open} >
            <div
                className={`absolute inset-0 bg-black/40 transition-opacity ${
                    open ? "opacity-100" : "opacity-0"
                }`}
                onClick={onClose} />

            <aside
                className={`absolute right-0 top-0 h-full bg-white shadow-xl overflow-auto transition-transform duration-300
          ${widthClass} ${open ? "translate-x-0" : "translate-x-full"}`}
                role="dialog"
                aria-modal="true">

                <header className="sticky top-0 bg-white/80 backdrop-blur border-b p-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{title}</h3>
                    <button
                        onClick={onClose}
                        className="rounded-md border px-2 py-1 text-sm hover:bg-gray-50">
                        Close
                    </button>
                </header>

                <div className="p-4">{children}</div>
            </aside>
        </div>
    );
}
