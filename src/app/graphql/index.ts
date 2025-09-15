import {
    ApolloClient,
    createHttpLink,
    from,
    InMemoryCache,
} from "@apollo/client";
import { LocalStorageKeys } from "../constants";

import { setContext } from "@apollo/client/link/context";
import { logout } from "../../keycloak";
import { onError } from "@apollo/client/link/error";


export const errorLink = onError((raw) => {
    const err = raw as any;
    if (err.graphQLErrors?.length) {
        for (const g of err.graphQLErrors) console.warn("[GQL]", g.message);
    }
    const status =
        err.networkError?.status ??
        err.networkError?.statusCode ??
        err.networkError?.response?.status;
    if (status === 401) logout();
});


const httpLink = createHttpLink({
    uri: `/api/adminGQL`,
});

const authLink = setContext((_, { headers }) => {
    // get the authentication token from local storage if it exists
    // return the headers to the context so httpLink can read them
    return {
        headers: {
            ...headers,
            authorization: `Bearer ${getToken()}`,
        },
    };
});

export const client = new ApolloClient({
    link: from([errorLink, authLink, httpLink]),
    cache: new InMemoryCache(),
});

function getToken() {
    return localStorage.getItem(LocalStorageKeys.Token);
}

export * from "./queries";
export * from "./mutations";