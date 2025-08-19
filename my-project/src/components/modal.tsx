// src/components/Modal.ts (no JSX)
import React, { useEffect, useRef } from "react";

type ModalProps = {
    open: boolean;
    title?: string;
    onClose: () => void;
    children: React.ReactNode;
};

export default function Modal({ open, title, onClose, children }: ModalProps) {
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    useEffect(() => {
        if (!open) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        setTimeout(() => panelRef.current?.focus(), 0);
        return () => { document.body.style.overflow = prev; };
    }, [open]);

    if (!open) return null;

    return React.createElement(
        "div",
        { className: "fixed inset-0 z-[9999] flex items-center justify-center" },
        React.createElement("div", {
            className: "absolute inset-0 bg-black/50",
            onClick: onClose,
            "aria-hidden": "true",
        }),
        // Panel
        React.createElement(
            "div",
            {
                ref: panelRef as any,
                role: "dialog",
                "aria-modal": "true",
                tabIndex: -1,
                className:
                    "relative z-10 w-full max-w-lg rounded-xl bg-white p-6 shadow-xl outline-none",
                onClick: (e: any) => e.stopPropagation(),
            },
            title
                ? React.createElement(
                    "h2",
                    { className: "mb-4 text-xl font-semibold" },
                    title
                )
                : null,
            children,
            React.createElement(
                "div",
                { className: "mt-6 flex justify-end" },
                React.createElement(
                    "button",
                    {
                        type: "button",
                        onClick: onClose,
                        className: "rounded border px-4 py-2 hover:bg-gray-100",
                    },
                    "Close"
                )
            )
        )
    );
}
