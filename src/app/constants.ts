// constants.ts

// --- UI ---
export const UIMode = {
    Light: "light",
    Dark: "dark",
} as const;
export type UIMode = typeof UIMode[keyof typeof UIMode];

export const Severity = {
    Success: "success",
    Error: "error",
    Info: "info",
    Warning: "warning",
} as const;
export type Severity = typeof Severity[keyof typeof Severity];

export const modalStyle = {
    position: "absolute" as const,
    top: "30%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 400,
    maxWidth: "90%",
    bgcolor: "background.paper",
    borderRadius: 2,
    boxShadow: 24,
    py: 2,
    px: 2,
};

// --- Auth / Storage ---
export const LocalStorageKeys = {
    Token: "arp-management-token",
    RefreshToken: "arp-management-refresh-token",
    UiMode: "arp-ui-mode",
} as const;
export type LocalStorageKeys = typeof LocalStorageKeys[keyof typeof LocalStorageKeys];

// --- i18n / time ---
export const Languages = {
    EN: "en",
    DE: "de",
    ES: "es",
} as const;
export type Languages = typeof Languages[keyof typeof Languages];

export const Timezones = {
    New_York: "America/New_York",
} as const;
export type Timezones = typeof Timezones[keyof typeof Timezones];

// --- Domain used in queries/mutations / UI filters ---
export const ReservationStatus = {
    LISTED: "LISTED",
    RESERVED: "RESERVED",
    FREE_BOOKED: "FREE_BOOKED",
    CANCELED: "CANCELED",
    RELEASED: "RELEASED",
    CANCEL_PENDING: "CANCEL_PENDING",
    RESERVATION_PENDING: "RESERVATION_PENDING",
} as const;
export type ReservationStatus = typeof ReservationStatus[keyof typeof ReservationStatus];

// Currency
export const Currency = {
    USD: "USD",
} as const;
export type Currency = typeof Currency[keyof typeof Currency];

export const CurrencySymbol = {
    USD: "$",
} as const;
export type CurrencySymbol = typeof CurrencySymbol[keyof typeof CurrencySymbol];

// Basic cuisine list
export const Cuisine = {
    American: "American",
    Sushi: "Sushi",
    Italian: "Italian",
    Japanese: "Japanese",
    Chinese: "Chinese",
} as const;
export type Cuisine = typeof Cuisine[keyof typeof Cuisine];

// Platform tags
export const RestaurantPlatforms = {
    Resy: "resy",
    Resy_Concierge: "resy-concierge",
    OpenTable: "open-table",
} as const;
export type RestaurantPlatforms = typeof RestaurantPlatforms[keyof typeof RestaurantPlatforms];

// Simple table sizes & weekdays
export const TableSizes = [1, 2, 3, 4, 5, 6] as const;
export type TableSize = (typeof TableSizes)[number];

export const Weekdays = {
    Monday: "MONDAY",
    Tuesday: "TUESDAY",
    Wednesday: "WEDNESDAY",
    Thursday: "THURSDAY",
    Friday: "FRIDAY",
    Saturday: "SATURDAY",
    Sunday: "SUNDAY",
} as const;
export type Weekdays = typeof Weekdays[keyof typeof Weekdays];

// Countries (small set; expand later)
export const CountryList = {
    US: "US",
    CA: "CA",
} as const;
export type CountryList = typeof CountryList[keyof typeof CountryList];

// Keycloak IDs (placeholders)
export const KEYCLOAK_REALM = "ACCESS";
export const KEYCLOAK_CLIENT_ID = "ACCESS";
