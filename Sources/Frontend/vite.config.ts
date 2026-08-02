// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { nitro } from "nitro/vite";

// Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
// @cloudflare/vite-plugin builds from this — wrangler.jsonc main alone is insufficient.
//
// Vercel sets process.env.VERCEL during its build. When present, skip the
// Cloudflare Workers plugin and let Nitro emit Vercel's production output.
// Without a production adapter, rendered HTML can retain Vite's virtual
// development client entry (/@id/virtual:...), which is a 404 on Vercel.
const isVercel = !!process.env.VERCEL;

export default defineConfig({
  cloudflare: isVercel ? false : undefined,
  tanstackStart: {
    server: { entry: "server" },
  },
  plugins: isVercel ? [nitro()] : [],
  vite: {
    server: {
      port: 5173,
      strictPort: true,
      proxy: {
        "/api": {
          target: "http://localhost:8081",
          changeOrigin: true,
          secure: false,
        },
        "/ws-native": {
          target: "http://localhost:8081",
          ws: true,
          changeOrigin: true,
        },
        "/ws": {
          target: "http://localhost:8081",
          ws: true,
          changeOrigin: true,
        },
      },
    },
  },
});
