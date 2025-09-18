// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
    plugins: [react(), tailwindcss()],
    server: {
        port: 3000, // your dev port
        proxy: {
            "/api": {
                target: "http://localhost:8000",   // backend
                changeOrigin: true,
                rewrite: p => p.replace(/^\/api/, ""), // /api/adminGQL -> /adminGQL
            },
            "/auth": {
                target: "http://localhost:8080",   // keycloak
                changeOrigin: true,
            },
        },
    },
});
