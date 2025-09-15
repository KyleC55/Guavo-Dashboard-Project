type Props = { onClick: () => void; disabled?: boolean; size?: "sm"|"md"|"lg" };

const sizeClass = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-5 py-2.5 text-base",
    lg: "px-6 py-3 text-lg",
};

const AddManualBookingButton: React.FC<Props> = ({ onClick, disabled, size="md" }) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={[
            "inline-flex items-center gap-2 rounded-full",
            "bg-black text-white font-semibold shadow-sm",
            "hover:bg-neutral-900 active:scale-[0.99]",
            "disabled:opacity-60 disabled:cursor-not-allowed",
            "w-auto shrink-0 whitespace-nowrap",   // <-- key bits
            sizeClass[size],
        ].join(" ")}
    >
        <span className="text-xl leading-none">＋</span>
        <span>Add Manual Booking</span>
    </button>
);
export default AddManualBookingButton;
