import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ApolloProvider } from "@apollo/client/react";
import App from "./App";
import { client } from "./app/graphql";
import { keycloak, persistToken, logout } from "./keycloak";
import "./index.css";

async function bootstrap() {
    try {
        const auth = await keycloak.init({
            onLoad: "login-required",
            responseMode: "fragment",
            checkLoginIframe: false,
            // pkceMethod: "S256", // only if PKCE enabled in Keycloak client
        });
        if (!auth || !keycloak.token || !keycloak.refreshToken) return logout();

        persistToken(keycloak.token, keycloak.refreshToken);

        ReactDOM.createRoot(document.getElementById("root")!).render(
            <BrowserRouter>
                <ApolloProvider client={client}>
                    <React.StrictMode>
                        <App />
                    </React.StrictMode>
                </ApolloProvider>
            </BrowserRouter>
        );
    } catch {
        logout();
    }
}
bootstrap();
