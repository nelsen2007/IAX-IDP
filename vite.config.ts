import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "admin-development-headers",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url?.startsWith("/admin")) {
            // Vite's HTML middleware otherwise replaces this with no-cache.
            const setHeader = res.setHeader;
            res.setHeader = function (name, value) {
              return setHeader.call(this, name, name.toLowerCase() === 'cache-control' ? 'no-store' : value);
            };
            res.setHeader("Cache-Control", "no-store");
            res.setHeader("X-Robots-Tag", "noindex, nofollow");
          }
          next();
        });
      },
    },
  ],
  server: { proxy: { "/api/admin": "http://127.0.0.1:3001" } },
  build: { sourcemap: false },
});
