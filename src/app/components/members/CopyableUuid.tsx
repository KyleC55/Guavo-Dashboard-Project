import { useState } from "react";

export function CopyableUuid({ uuid }: { uuid?: string | null }) {
    const [copied, setCopied] = useState(false);
    if (!uuid) return <span className="text-gray-500">—</span>;
    const short = `${uuid.slice(0, 5)}…`;
    const doCopy = async () => {
        try {
            await navigator.clipboard.writeText(uuid);
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
        } catch {
            // noop
        }
    };
    return (
        <div className="flex flex-col items-start gap-1">
            <span className="font-mono" title={uuid}>
                {short}
            </span>
            <button
                type="button"
                onClick={doCopy}
                className="text-[10px] rounded border px-1.5 py-0.5 hover:bg-gray-50"
                title="Copy full UUID"
            >
                {copied ? "Copied" : "Copy"}
            </button>
        </div>
    );
}

