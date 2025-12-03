import React, { useEffect, useRef } from "react";

type ModalProps = {
    open: boolean;
    title?: React.ReactNode;
    onClose: () => void;
    children: React.ReactNode;
    showCloseButton?: boolean;
    footer?: React.ReactNode;
    logo?: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
};

export default function Modal({
                                  open,
                                  title,
                                  onClose,
                                  children,
                                  showCloseButton = true, // default keeps old behavior
                                  logo,
                                  size = 'md',
                              }: ModalProps) {
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
        const t = setTimeout(() => panelRef.current?.focus(), 0);
        return () => {
            document.body.style.overflow = prev;
            clearTimeout(t);
        };
    }, [open]);

    if (!open) return null;

    const sizeClasses = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-lg',
        xl: 'max-w-lg', // Revert to original width, focus on height expansion
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" aria-hidden />
            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                tabIndex={-1}
                className={`relative z-10 w-full ${sizeClasses[size]} max-h-[95vh] rounded-xl bg-white p-6 shadow-xl outline-none flex flex-col`}
                onClick={(e) => e.stopPropagation()}
            >
                {title && (
                    <div className="mb-4 text-xl font-semibold flex items-center justify-between flex-shrink-0">
                        <span>{title}</span>
                        {logo && (
                            <div className="flex-shrink-0 ml-4">
                                {logo}
                            </div>
                        )}
                    </div>
                )}

                <div className="flex-1 overflow-y-auto min-h-0">
                    {children}
                </div>

                {showCloseButton && (
                    <div className="mt-6 flex justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded border px-4 py-2 hover:bg-gray-100"
                        >
                            Close
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
