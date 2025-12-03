import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ApolloProvider } from "@apollo/client/react";
import App from "./App";
import { client } from "./app/graphql";
import { keycloak, persistToken, logout } from "./keycloak";
import "./index.css";

function renderApp() {
    ReactDOM.createRoot(document.getElementById("root")!).render(
        <BrowserRouter>
            <ApolloProvider client={client}>
                <React.StrictMode>
                    <App />
                </React.StrictMode>
            </ApolloProvider>
        </BrowserRouter>
    );
}

async function bootstrap() {
    try {
        const authenticated = await keycloak.init({
            onLoad: "login-required",
            responseMode: "fragment",
            checkLoginIframe: false,
            // pkceMethod: "S256",
        });

        if (!authenticated || !keycloak.token || !keycloak.refreshToken) {
            return logout();
        }

        persistToken(keycloak.token, keycloak.refreshToken);

        keycloak.onTokenExpired = async () => {
            try {
                const refreshed = await keycloak.updateToken(30);
                if (refreshed && keycloak.token && keycloak.refreshToken) {
                    persistToken(keycloak.token, keycloak.refreshToken);
                } else {
                    logout();
                }
            } catch {
                logout();
            }
        };

        keycloak.onAuthRefreshSuccess = () => {
            if (keycloak.token && keycloak.refreshToken) {
                persistToken(keycloak.token, keycloak.refreshToken);
            }
        };

        keycloak.onAuthRefreshError = () => logout();
        keycloak.onAuthLogout = () => logout();

        setInterval(() => {
            keycloak.updateToken(60).then((refreshed) => {
                if (refreshed && keycloak.token && keycloak.refreshToken) {
                    persistToken(keycloak.token, keycloak.refreshToken);
                }
            }).catch(() => logout());
        }, 20_000);

        renderApp();
    } catch {
        logout();
    }
}

bootstrap();
