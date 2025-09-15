// src/keycloak.ts
import Keycloak from "keycloak-js";
import type { KeycloakInitOptions } from "keycloak-js";
import { KEYCLOAK_CLIENT_ID, KEYCLOAK_REALM, LocalStorageKeys } from "./app/constants";

// Create the Keycloak instance (constructor takes a plain object)
export const keycloak = new Keycloak({
    url: "/auth",
    realm: KEYCLOAK_REALM,
    clientId: KEYCLOAK_CLIENT_ID,
});

// Optional: init options for .init()
const initOptions: KeycloakInitOptions = {
    responseMode: "fragment",
    checkLoginIframe: false,
    // pkceMethod: "S256", // enable if your client is configured for PKCE
};

type InitKeycloakResult = { keycloak: Keycloak; auth: boolean };

export interface InitKeycloakParams {
    access_token: string;
    refresh_token: string;
    expires_in?: string;
    refresh_expires_in?: string;
    token_type?: string;
    "not-before-policy"?: string;
    session_state?: string;
    scope?: string;
}

// Keep this structural so you don't fight Apollo generics
type ApolloLike = { resetStore: () => Promise<unknown> };

export const logout = (client?: ApolloLike) => {
    try {
        localStorage.removeItem(LocalStorageKeys.Token);
        localStorage.removeItem(LocalStorageKeys.RefreshToken);
    } catch {}
    void client?.resetStore();
    keycloak.logout();
};

export const persistToken = (token: string, refreshToken: string) => {
    localStorage.setItem(LocalStorageKeys.Token, token);
    localStorage.setItem(LocalStorageKeys.RefreshToken, refreshToken);
};

// Refresh on expiry
keycloak.onTokenExpired = async () => {
    await refreshToken();
};

let initialized = false;

export const initKeycloak = async (
    params: InitKeycloakParams,
): Promise<InitKeycloakResult> => {
    try {
        if (initialized) {
            // Assigning directly is acceptable here; cast to avoid TS nags
            (keycloak as any).token = params.access_token;
            (keycloak as any).refreshToken = params.refresh_token;
            return { keycloak, auth: !!keycloak.authenticated };
        }

        const auth = await keycloak.init({
            ...initOptions,
            token: params.access_token,
            refreshToken: params.refresh_token,
        });

        initialized = true;

        if (auth) {
            persistToken(keycloak.token!, keycloak.refreshToken!);
        } else {
            logout();
        }

        return { keycloak, auth };
    } catch {
        logout();
        return { keycloak, auth: false };
    }
};

async function refreshToken() {
    if (keycloak.authenticated) {
        const exp = keycloak.tokenParsed?.exp ?? 0; // seconds since epoch
        const secondsLeft = Math.round(exp - Date.now() / 1000);
        try {
            // refresh if <secondsLeft> seconds remain (at least 30)
            const refreshed = await keycloak.updateToken(Math.max(30, secondsLeft));
            if (refreshed) {
                persistToken(keycloak.token!, keycloak.refreshToken!);
            } else {
                logout();
            }
        } catch {
            logout();
        }
    } else if (!window.location.pathname.startsWith("/login")) {
        window.location.pathname = "/login";
    }
}
