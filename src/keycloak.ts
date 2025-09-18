// src/keycloak.ts
import Keycloak from "keycloak-js";
import {LocalStorageKeys } from "./app/constants";

export const keycloak = new Keycloak({
    url: import.meta.env.VITE_KEYCLOAK_URL,     // http://localhost:8080
    realm: import.meta.env.VITE_KEYCLOAK_REALM, // ACCESS
    clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID, // ACCESS
});
// Save tokens in localStorage under the keys from constants.ts
export const persistToken = (token: string, refreshToken: string) => {
    localStorage.setItem(LocalStorageKeys.Token, token);
    localStorage.setItem(LocalStorageKeys.RefreshToken, refreshToken);
};

// Logout clears tokens and calls Keycloak logout
export const logout = () => {
    try {
        localStorage.removeItem(LocalStorageKeys.Token);
        localStorage.removeItem(LocalStorageKeys.RefreshToken);
    } finally {
        keycloak.logout();
    }
};

// 🔁 Auto refresh when token is about to expire
keycloak.onTokenExpired = async () => {
    try {
        const refreshed = await keycloak.updateToken(30); // refresh if <30s left
        if (refreshed && keycloak.token && keycloak.refreshToken) {
            persistToken(keycloak.token, keycloak.refreshToken);
            console.log("[Keycloak] token refreshed");
        } else {
            logout();
        }
    } catch {
        logout();
    }
};

// (optional) heartbeat refresher — keeps tokens alive even if iframe polling is off
let heartbeat: number | undefined;
export function startTokenHeartbeat() {
    stopTokenHeartbeat();
    heartbeat = window.setInterval(async () => {
        if (!keycloak.authenticated) return;
        try {
            const refreshed = await keycloak.updateToken(30);
            if (refreshed && keycloak.token && keycloak.refreshToken) {
                persistToken(keycloak.token, keycloak.refreshToken);
            }
        } catch {
            logout();
        }
    }, 20_000);
}
export function stopTokenHeartbeat() {
    if (heartbeat) {
        clearInterval(heartbeat);
        heartbeat = undefined;
    }
}
