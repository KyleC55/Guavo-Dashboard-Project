import React from 'react';
import { ItemRow} from "./itemrows.tsx";
import { Badge} from "./badge.tsx";
import type { RecentBookings } from "../../types/types.ts";

const providerTone = (p?: RecentBookings['provider']) =>
    p === 'Resy' ? 'neutral' :
        p === 'OpenTable' ? 'success' : 'warning' as const;

export const BookingItem: React.FC<{ booking: RecentBookings }> = ({ booking }) => {
    const tag = booking.provider && (
        <Badge tone={providerTone(booking.provider)}>{booking.provider}</Badge>
    );

    const right = (
        <Badge tone={booking.status === 'confirmed' ? 'ink' : 'neutral'}>
            {booking.status}
        </Badge>
    );

    return (
        <ItemRow
            title={booking.restaurant}
            tag={tag}
            subtitle={`${booking.name} · ${booking.company} · ${booking.guests} guests`}
            meta={booking.when}
            rightBadge={right}
        />
    );
};
