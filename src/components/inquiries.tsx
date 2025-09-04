import React from 'react';
import { ItemRow } from "./itemrows.tsx";
import { Badge} from "./badge.tsx";
import type { PendingInquiries} from "../../types/types.ts";
import { FiPhoneCall } from 'react-icons/fi';
import { TbArrowsExchange } from 'react-icons/tb';

const statusBadge = (s?: PendingInquiries['status']) => {
    const icon =
        s === 'connecting' ? (
            <FiPhoneCall className="-ml-0.5 mr-1 h-3.5 w-3.5" />
        ) : (
            <TbArrowsExchange className="-ml-0.5 mr-1 h-3.5 w-3.5" />
        );

    return (
        <Badge tone="neutral" className="flex items-center">
            {icon}
            {s}
        </Badge>
    );
};

export const InquiryItem: React.FC<{ inquiry: PendingInquiries }> = ({ inquiry }) => {
    const tag = <Badge tone="neutral">{inquiry.company}</Badge>;

    return (
        <ItemRow
            title={inquiry.venue}
            tag={tag}
            subtitle={`${inquiry.location} · ${inquiry.guests} guests`}
            meta={inquiry.date}
            rightBadge={statusBadge(inquiry.status)}
        />
    );
};
