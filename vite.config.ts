// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    // Pre-bundle the UI libraries up-front. Without this, Vite discovers them
    // lazily (e.g. when a dialog is opened for the first time), re-optimizes
    // mid-session and forces a reload that can leave an open tab with stale
    // module URLs ("Importing a module script failed" / blank screen).
    optimizeDeps: {
      include: [
        "clsx",
        "tailwind-merge",
        "lucide-react",
        "date-fns",
        "@radix-ui/react-dialog",
        "@radix-ui/react-popover",
        "@radix-ui/react-select",
      ],
    },
  },
});
