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
            "text-white font-semibold shadow-sm",
            "active:scale-[0.99]",
            "disabled:opacity-60 disabled:cursor-not-allowed",
            "whitespace-nowrap",
            sizeClass[size],
        ].join(" ")}
        style={{
            backgroundColor: "#064126",
        }}
        onMouseEnter={(e) => {
            if (!disabled) {
                e.currentTarget.style.backgroundColor = "#052a1a";
            }
        }}
        onMouseLeave={(e) => {
            if (!disabled) {
                e.currentTarget.style.backgroundColor = "#064126";
            }
        }}
    >
        <span className="text-xl leading-none">＋</span>
        <span>Add Manual Booking</span>
    </button>
);
export default AddManualBookingButton;
