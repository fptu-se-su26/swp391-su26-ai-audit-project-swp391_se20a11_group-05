// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
// @cloudflare/vite-plugin builds from this — wrangler.jsonc main alone is insufficient.
//
// Vercel sets process.env.VERCEL during its build. When present, we skip the
// Cloudflare Workers plugin (its output isn't something Vercel can route to)
// and instead register src/server.ts as a catch-all Vercel Edge Function via
// vite-plugin-vercel, which understands the Vercel Build Output API.
const isVercel = !!process.env.VERCEL;
const vercelPlugin = isVercel
  ? (await import("vite-plugin-vercel/vite")).default({
      entries: [
        {
          id: "/src/server.ts",
          route: "/**",
          vercel: { edge: true, streaming: true },
        },
      ],
    })
  : null;

export default defineConfig({
  cloudflare: isVercel ? false : undefined,
  tanstackStart: {
    server: { entry: "server" },
  },
  plugins: vercelPlugin ?? [],
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
