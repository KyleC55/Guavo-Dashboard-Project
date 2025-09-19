export const toDate = (ms?: string | null) =>
    ms ? new Date(Number(ms)) : null

export const fmt = (d?: Date | null) =>
    d ? d.toLocaleString() : '—'
