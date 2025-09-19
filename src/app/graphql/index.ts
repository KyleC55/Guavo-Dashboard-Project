import { ApolloClient, InMemoryCache, createHttpLink, from, ApolloLink } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { onError } from "@apollo/client/link/error";
import { LocalStorageKeys } from "../constants";
import { logout } from "../../keycloak";

const httpLink = createHttpLink({
    uri: "http://localhost:8000/adminGQL",
    fetchOptions: { method: "POST" },
    headers: {
        "content-type": "application/json",
        "x-apollo-operation-name": "ClientOperation",
        "apollo-require-preflight": "true",
    },
});

// attach Bearer token
const authLink = setContext((_, { headers }) => {
    const token = localStorage.getItem(LocalStorageKeys.Token);
    return {
        headers: {
            ...headers,
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    };
});

// keep your existing helpers
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

const sanitize = new ApolloLink((op, fwd) => {
    const h = op.getContext().headers || {};
    if (h.Authorization === "Bearer null" || h.Authorization === "Bearer undefined") {
        const { Authorization, ...rest } = h;
        op.setContext({ headers: rest });
    }
    return fwd(op);
});

const errors = onError(({ graphQLErrors, networkError }) => {
    if (graphQLErrors?.some((e: any) =>
        e?.extensions?.code === "UNAUTHORIZED" || e?.extensions?.code === "UNAUTHENTICATED")) {
        logout(); return;
    }
    const s = (networkError as any)?.statusCode
        ?? (networkError as any)?.status
        ?? (networkError as any)?.response?.status;
    if (s === 401) logout();
});

export const client = new ApolloClient({
    link: from([errors, csrfLink, sanitize, authLink, httpLink]),
    cache: new InMemoryCache(),
});
