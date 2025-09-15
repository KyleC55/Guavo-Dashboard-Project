export const Quickactionbox: React.FC<{
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    onClick: () => void;
}> = ({ icon, title, subtitle, onClick }) => { return (
    <button
        onClick={onClick}
        className="w-full rounded-lg border border-neutral-300 px-4 py-3 flex items-start space-x-3 hover:bg-neutral-50">
        <div className="text-neutral-700"> {icon} </div>
        <div>
            <p className="font-medium"> {title} </p>
            <p className=" text-smtext-neutral-500"> {subtitle}</p>
        </div>
    </button>
);
};