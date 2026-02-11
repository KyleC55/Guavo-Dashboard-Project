import React, { useState } from "react";
import { useQuery } from "@apollo/client/react";
import {
    HiOutlineOfficeBuilding,
    HiOutlineCalendar,
    HiOutlineClipboardList,
    HiOutlineClock,
    HiOutlineLightningBolt,
    HiOutlineCheckCircle,
    HiOutlineCurrencyDollar,
} from "react-icons/hi";
import { GET_INQUIRIES } from "../../graphql/queries";

const ChevronDownIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
        <path
            d="m6 9 6 6 6-6"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

export default function InquiryList() {
    const [expandedInquiry, setExpandedInquiry] = useState<string | null>(null);
    const [inquiryActions, setInquiryActions] = useState<
        Record<string, { status: "REQUEST" | "CONNECTING" | "SENT"; budget: string }>
    >({});
    const { data, loading, error, refetch } = useQuery<any>(GET_INQUIRIES, {
        variables: {
            filter: {
                page: 0,
                size: 25,
                timeframe: "ALL",
            },
        },
        fetchPolicy: "network-only",
    });

    const inquiries = data?.searchInquiries?.items ?? [];
    const totalCount = data?.searchInquiries?.count ?? inquiries.length;
    const pendingCount = inquiries.filter((inquiry: any) => inquiry.state === "DRAFT").length;
    const activeCount = inquiries.filter((inquiry: any) => inquiry.state === "OPEN").length;
    const reviewCount = inquiries.filter((inquiry: any) => inquiry.approval).length;
    const successCount = inquiries.filter((inquiry: any) => inquiry.bookingUuid).length;

    const budgetTotals = inquiries.reduce(
        (acc: { amount: number; currency: string | null }, inquiry: any) => {
            const amount = Number(inquiry?.estimatedBudget?.amount ?? 0);
            const currency = inquiry?.estimatedBudget?.currency ?? null;
            if (!Number.isNaN(amount)) acc.amount += amount;
            if (!acc.currency && currency) acc.currency = currency;
            return acc;
        },
        { amount: 0, currency: null }
    );

    const formatCompactCurrency = (amount: number, currency?: string | null) => {
        if (!amount) return "—";
        try {
            if (currency) {
                return new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency,
                    notation: "compact",
                    maximumFractionDigits: 1,
                }).format(amount);
            }
            return new Intl.NumberFormat("en-US", {
                notation: "compact",
                maximumFractionDigits: 1,
            }).format(amount);
        } catch {
            return amount.toLocaleString();
        }
    };
    const todayLabel = new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
    }).format(new Date());

    return (
        <div className="px-6 pb-10">
            <div className="w-full space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                            Inquiries
                        </p>
                        <h1 className="text-3xl font-semibold text-gray-900">
                            Private Dining Dashboard
                        </h1>
                        <p className="text-sm text-gray-500 mt-2">
                            Manage inquiries and restaurant connections
                        </p>
                    </div>
                    <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 shadow-sm">
                        <HiOutlineCalendar className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">Today</span>
                        <span className="text-gray-400">•</span>
                        <span>{todayLabel}</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                    {[
                        {
                            label: "Total",
                            value: totalCount,
                            sub: "Inquiries",
                            icon: HiOutlineClipboardList,
                            tone: "text-blue-600",
                        },
                        {
                            label: "Pending",
                            value: pendingCount,
                            sub: "Waiting to connect",
                            icon: HiOutlineClock,
                            tone: "text-amber-500",
                        },
                        {
                            label: "Active",
                            value: activeCount,
                            sub: "In progress",
                            icon: HiOutlineLightningBolt,
                            tone: "text-yellow-500",
                        },
                        {
                            label: "Review",
                            value: reviewCount,
                            sub: "User reviewing",
                            icon: HiOutlineOfficeBuilding,
                            tone: "text-violet-500",
                        },
                        {
                            label: "Success",
                            value: successCount,
                            sub: "Contracts",
                            icon: HiOutlineCheckCircle,
                            tone: "text-emerald-500",
                        },
                        {
                            label: "Total Value",
                            value: formatCompactCurrency(budgetTotals.amount, budgetTotals.currency),
                            sub: "Budget pool",
                            icon: HiOutlineCurrencyDollar,
                            tone: "text-sky-600",
                        },
                    ].map((card) => {
                        const Icon = card.icon;
                        return (
                            <div
                                key={card.label}
                                className="rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm"
                            >
                                <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
                                    <span className="uppercase tracking-wide">{card.label}</span>
                                    <Icon className={`h-4 w-4 ${card.tone}`} />
                                </div>
                                <div className="mt-2 text-2xl font-semibold text-gray-900">
                                    {card.value}
                                </div>
                                <div className="text-xs text-gray-500">{card.sub}</div>
                            </div>
                        );
                    })}
                </div>

                {loading ? (
                    <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-8 py-12 text-center text-sm text-gray-500">
                        Loading inquiries…
                    </div>
                ) : error ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-600">
                        Failed to load inquiries. {error.message}
                    </div>
                ) : inquiries.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-8 py-12 text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                            <HiOutlineOfficeBuilding className="h-6 w-6" />
                        </div>
                        <div className="text-base font-semibold text-gray-900">
                            No inquiries yet
                        </div>
                        <p className="mt-2 text-sm text-gray-500">
                            Once requests come in, they will show up here for review.
                        </p>
                        <button
                            type="button"
                            onClick={() => refetch()}
                            className="mt-6 inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Refresh
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {inquiries.map((inquiry: any) => {
                            const requestCount = inquiry.schedules?.length ?? 0;
                            const displayRequestCount =
                                requestCount === 0 ? 1 : requestCount;
                            const location = [inquiry.city, inquiry.country]
                                .filter(Boolean)
                                .join(", ");
                            const idLabel = inquiry.uuid
                                ? `INQ-${String(inquiry.uuid).slice(0, 8).toUpperCase()}`
                                : "INQ";
                            const isExpanded = expandedInquiry === inquiry.uuid;
                            const preferredDates =
                                inquiry.schedules?.map((schedule: any) => schedule.rangeWallStartDate).filter(Boolean) ??
                                [];
                            const action = inquiryActions[inquiry.uuid] || {
                                status: "REQUEST",
                                budget: "",
                            };
                            const effectiveBudget =
                                action.budget !== ""
                                    ? action.budget
                                    : inquiry?.estimatedBudget?.amount
                                    ? String(inquiry.estimatedBudget.amount)
                                    : "";
                            const statusLabel =
                                action.status === "REQUEST"
                                    ? "Request"
                                    : action.status === "CONNECTING"
                                    ? "Connecting"
                                    : "Sent";
                            const statusTone =
                                action.status === "REQUEST"
                                    ? "bg-amber-50 text-amber-600"
                                    : action.status === "CONNECTING"
                                    ? "bg-blue-50 text-blue-600"
                                    : "bg-emerald-50 text-emerald-600";
                            return (
                                <div
                                    key={inquiry.uuid}
                                    className="rounded-xl border border-gray-200 bg-white shadow-sm"
                                >
                                    <button
                                        type="button"
                                        className="flex w-full items-center justify-between px-5 py-4"
                                        onClick={() =>
                                            setExpandedInquiry(isExpanded ? null : inquiry.uuid)
                                        }
                                    >
                                        <div className="flex items-center gap-6">
                                            <div className="text-sm font-semibold text-gray-700">
                                                {idLabel}
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-700">
                                                <HiOutlineOfficeBuilding className="h-4 w-4 text-gray-400" />
                                                <span className="font-medium text-gray-900">
                                                    {inquiry.title || inquiry.teamName || "Untitled inquiry"}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <HiOutlineCalendar className="h-4 w-4 text-gray-400" />
                                                {location || "—"}
                                            </div>
                                            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                                                {displayRequestCount}{" "}
                                                {displayRequestCount === 1 ? "request" : "requests"}
                                            </span>
                                            <ChevronDownIcon
                                                className={`h-4 w-4 text-gray-400 transition-transform ${
                                                    isExpanded ? "rotate-180" : ""
                                                }`}
                                            />
                                        </div>
                                    </button>

                                    {isExpanded && (
                                        <div className="border-t border-gray-100 px-6 pb-6 pt-4">
                                            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                                                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
                                                    <span className="h-4 w-1 rounded-full bg-blue-600" />
                                                    Event Details
                                                </div>
                                                <div className="grid gap-4 text-sm text-gray-600 md:grid-cols-3">
                                                    <div>
                                                        <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                                            Party Size
                                                        </div>
                                                        <div className="mt-1 font-semibold text-gray-900">
                                                            —
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                                            Budget
                                                        </div>
                                                        <div className="mt-1 font-semibold text-gray-900">
                                                            {formatCompactCurrency(
                                                                Number(inquiry?.estimatedBudget?.amount ?? 0),
                                                                inquiry?.estimatedBudget?.currency ?? null
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                                            Preferred Dates
                                                        </div>
                                                        <div className="mt-2 flex flex-wrap gap-2">
                                                            {preferredDates.length === 0 ? (
                                                                <span className="text-sm text-gray-500">—</span>
                                                            ) : (
                                                                preferredDates.slice(0, 4).map((date: string) => (
                                                                    <span
                                                                        key={date}
                                                                        className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600"
                                                                    >
                                                                        {date}
                                                                    </span>
                                                                ))
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-5 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
                                                <div className="space-y-4">
                                                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                                        <span className="h-4 w-1 rounded-full bg-amber-500" />
                                                        Restaurant Options
                                                    </div>
                                                    <div className="rounded-2xl border border-gray-200 bg-white p-5">
                                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                                            <div>
                                                                <div className="text-sm font-semibold text-gray-900">
                                                                    Restaurant options
                                                                </div>
                                                                <div className="mt-1 text-xs text-gray-500">
                                                                    Options will appear once venues respond
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span
                                                                    className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone}`}
                                                                >
                                                                    {statusLabel}
                                                                </span>
                                                                {action.status === "REQUEST" ? (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            window.confirm(
                                                                                "Start connecting this inquiry? The user will be notified once you send the budget."
                                                                            ) &&
                                                                            setInquiryActions((prev) => ({
                                                                                ...prev,
                                                                                [inquiry.uuid]: {
                                                                                    ...action,
                                                                                    status: "CONNECTING",
                                                                                },
                                                                            }))
                                                                        }
                                                                        className="rounded-full bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                                                                    >
                                                                        Start Connecting
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            setInquiryActions((prev) => ({
                                                                                ...prev,
                                                                                [inquiry.uuid]: {
                                                                                    ...action,
                                                                                    status: "SENT",
                                                                                },
                                                                            }))
                                                                        }
                                                                        disabled={
                                                                            action.status !== "CONNECTING" ||
                                                                            !effectiveBudget
                                                                        }
                                                                        className="rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-200"
                                                                    >
                                                                        Send to User
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="rounded-2xl border border-gray-200 bg-white p-5">
                                                        <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                                            User Request
                                                        </div>
                                                        <div className="mt-2 text-sm text-gray-700">
                                                            {inquiry.title ||
                                                                inquiry.teamName ||
                                                                "No request details provided."}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                                        <span className="h-4 w-1 rounded-full bg-emerald-500" />
                                                        Restaurant Response
                                                    </div>
                                                    <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-4">
                                                        <div>
                                                            <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                                                Available Dates
                                                            </div>
                                                            <div className="mt-2 flex flex-wrap gap-2">
                                                                {preferredDates.length === 0 ? (
                                                                    <span className="text-sm text-gray-500">—</span>
                                                                ) : (
                                                                    preferredDates.slice(0, 3).map((date: string) => (
                                                                        <span
                                                                            key={date}
                                                                            className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600"
                                                                        >
                                                                            {date}
                                                                        </span>
                                                                    ))
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                                                Proposed Budget
                                                            </div>
                                                            <div className="mt-2 flex items-center gap-2">
                                                                <div className="flex items-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
                                                                    <span className="text-gray-400">$</span>
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        step="1"
                                                                        value={effectiveBudget}
                                                                        onChange={(event) =>
                                                                            setInquiryActions((prev) => ({
                                                                                ...prev,
                                                                                [inquiry.uuid]: {
                                                                                    ...action,
                                                                                    budget: event.target.value,
                                                                                },
                                                                            }))
                                                                        }
                                                                        className="w-24 border-none bg-transparent text-sm font-semibold text-gray-900 focus:outline-none"
                                                                        placeholder="0"
                                                                    />
                                                                </div>
                                                                <span className="text-xs text-gray-400">
                                                                    {inquiry?.estimatedBudget?.currency ?? "USD"}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                                                Menu Details
                                                            </div>
                                                            <div className="mt-2 text-sm text-gray-700">
                                                                —
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                                                Additional Notes
                                                            </div>
                                                            <div className="mt-2 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
                                                                —
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
