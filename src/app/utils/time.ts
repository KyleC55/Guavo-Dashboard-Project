import { DateTime } from 'luxon';

export const fmtNY = (utcISO?: string | null) => {
    if (!utcISO) return '';
    const dt = DateTime.fromISO(utcISO, { zone: 'utc' }).setZone('America/New_York');
    return dt.isValid ? dt.toFormat("ccc, LLL d, t ZZZ") : '';
};

export const fmtRangeNY = (startISO?: string|null, endISO?: string|null) => {
    if (!startISO || !endISO) return '';
    const s = DateTime.fromISO(startISO, { zone: 'utc' }).setZone('America/New_York');
    const e = DateTime.fromISO(endISO,   { zone: 'utc' }).setZone('America/New_York');
    if (!(s.isValid && e.isValid)) return '';
    return s.hasSame(e, 'day')
        ? `${s.toFormat("ccc, LLL d, t")}–${e.toFormat("t ZZZ")}`
        : `${s.toFormat("ccc, LLL d, t ZZZ")} → ${e.toFormat("ccc, LLL d, t ZZZ")}`;
};
