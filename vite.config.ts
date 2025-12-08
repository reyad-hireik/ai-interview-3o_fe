import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
    plugins: [react()],
    define: {
        global: "window", // ✅ THIS FIXES YOUR ERROR
    },
    optimizeDeps: {
        include: ["simple-peer", "buffer", "process"],
    },
    resolve: {
        alias: {
            buffer: "buffer",
            process: "process/browser",
        },
    },
});
