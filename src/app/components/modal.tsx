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
    const sizeClass = (() => {
        switch (size) {
            case 'sm':
                return 'w-[24rem] max-w-[90vw] min-h-0';
            case 'lg':
                return 'w-[56rem] max-w-[95vw] min-h-[24rem]';
            case 'xl':
                return 'w-[72rem] max-w-[98vw] min-h-[24rem]';
            case 'md':
            default:
                return 'w-[42rem] max-w-[95vw] min-h-[24rem]';
        }
    })();

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

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" aria-hidden onClick={onClose} />
            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                tabIndex={-1}
                className={`relative z-10 ${sizeClass} max-h-[90vh] rounded-xl bg-white shadow-xl outline-none flex flex-col`}
                onClick={(e) => e.stopPropagation()}
            >
                {title && (
                    <div className="px-6 pt-6 pb-4 text-xl font-semibold flex items-center justify-between flex-shrink-0">
                        <span>{title}</span>
                        <div className="flex items-center gap-3">
                            {logo && (
                                <div className="flex-shrink-0">
                                    {logo}
                                </div>
                            )}
                            {showCloseButton && (
                                <button
                                    onClick={onClose}
                                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                                    aria-label="Close modal"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto min-h-0 px-6">
                    <div className="pr-4">
                    {children}
                    </div>
                </div>

                {showCloseButton && (
                    <div className="px-6 pt-4 pb-6 flex justify-end">
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
