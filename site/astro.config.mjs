import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://zall.dev",
  output: "static",
  vite: {
    // Dev only. The physics engine (Rapier) is a WASM module that must exist exactly once.
    // Vite serves pre-bundled packages as "immutable", so a browser that cached them from
    // an earlier bundling pass can mix old and new files, load Rapier twice, and the cubes
    // crash on start. Bundle the 3D packages in one pass, in a cache folder no browser has
    // seen, and never let the browser cache them.
    cacheDir: "node_modules/.vite-site-2",
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react-dom/client",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "three",
        "three/examples/jsm/geometries/RoundedBoxGeometry.js",
        "@react-three/fiber",
        "@react-three/rapier",
      ],
    },
    plugins: [
      {
        name: "no-store-optimized-deps",
        apply: "serve",
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            if (req.url?.includes("/node_modules/.vite")) {
              const setHeader = res.setHeader.bind(res);
              res.setHeader = (name, value) =>
                setHeader(name, String(name).toLowerCase() === "cache-control" ? "no-store" : value);
            }
            next();
          });
        },
      },
    ],
  },
  integrations: [
    react(),
    tailwind({
      applyBaseStyles: false,
    }),
    sitemap({ filter: (page) => !page.includes("/lab/") }),
  ],
});
