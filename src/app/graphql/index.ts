import { ApolloClient, InMemoryCache, createHttpLink, from, ApolloLink } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { onError } from "@apollo/client/link/error";
import { LocalStorageKeys} from "../constants.ts";
import { logout } from "../../keycloak.ts";
const base = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "";
const isLocalhost =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1");
const uri = isLocalhost
    ? "/api/adminGQL"
    : base
    ? `${base}/adminGQL`
    : "/api/adminGQL";

const httpLink = createHttpLink({
    uri,
    credentials: "include",
    fetchOptions: { method: "POST" },
});

const authLink = setContext((_, { headers }) => {
    const raw = localStorage.getItem(LocalStorageKeys.Token);
    const token = raw && raw.trim() ? `Bearer ${raw.trim()}` : "";
    const next = { ...headers };
    if (token) next.Authorization = token;
    return { headers: next };
});

const csrfLink = new ApolloLink((operation, forward) => {
    operation.setContext(({ headers = {} }) => ({
        headers: {
            ...headers,
            "content-type": "application/json",
            "x-apollo-operation-name": operation.operationName || "AnonymousOperation",
            "apollo-require-preflight": "true",
        },
    }));
    return forward(operation);
});

const sanitizeLink = new ApolloLink((operation, forward) => {
    const ctx = operation.getContext();
    const h = ctx.headers || {};
    if (h.Authorization === "Bearer null" || h.Authorization === "Bearer undefined") {
        const { Authorization, ...rest } = h;
        operation.setContext({ headers: rest });
    }
    return forward(operation);
});

const errorLink = onError(({ graphQLErrors, networkError, operation }) => {
    if (graphQLErrors?.length) {
        console.error("[GQL]", operation.operationName || "(unnamed)", graphQLErrors);
        const shouldLogout = graphQLErrors.some(
            (e: any) => e?.extensions?.code === "UNAUTHENTICATED" || e?.extensions?.code === "UNAUTHORIZED"
        );
        if (shouldLogout) logout();
    }
    if (networkError) {
        console.error("[NET]", networkError);
        const status =
            (networkError as any)?.statusCode ??
            (networkError as any)?.status ??
            (networkError as any)?.response?.status;
        if (status === 401) logout();
    }
});

export const client = new ApolloClient({
    link: from([errorLink, csrfLink, sanitizeLink, authLink, httpLink]),
    cache: new InMemoryCache(),
});
