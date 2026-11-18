import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import basicSsl from "@vitejs/plugin-basic-ssl";
import { defineConfig } from "vite";

const backendPath =
    "/PROJECTS/Cinema-%20Ticket-BookingWebsite/Cinema-Ticket-OnlineBooking/Backend";

export default defineConfig({
    plugins: [
        react(),
        babel({
            presets: [reactCompilerPreset()]
        }),
        basicSsl()
    ],

    server: {
        host: "0.0.0.0",
        https: true,

        proxy: {
            "/api": {
                target: "http://127.0.0.1",
                changeOrigin: true,

                rewrite: (path) =>
                    path.replace(
                        /^\/api/,
                        `${backendPath}/api`
                    )
            },

            "/uploads": {
                target: "http://127.0.0.1",
                changeOrigin: true,

                rewrite: (path) =>
                    `${backendPath}${path}`
            }
        }
    }
});