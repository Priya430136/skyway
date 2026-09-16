// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import type { Plugin } from "vite";

function suppressModuleDirectivesPlugin(): Plugin {
  return {
    name: "suppress-module-directives",
    enforce: "pre",
    transform(code: string, id: string) {
      if (id.includes("node_modules") && (code.includes('"use client"') || code.includes("'use client'"))) {
        return {
          code: code.replace(/(^|\n)(['"])use client\2;?/g, "$1/* use client */"),
          map: null,
        };
      }
      return null;
    },
    options(opts: any) {
      const origOnwarn = opts.onwarn;
      opts.onwarn = (warning: any, warn: any) => {
        if (
          warning.code === "MODULE_LEVEL_DIRECTIVE" ||
          (typeof warning.message === "string" &&
            (warning.message.includes('"use client"') ||
              warning.message.includes("'use client'") ||
              warning.message.includes("Module level directives")))
        ) {
          return;
        }
        if (origOnwarn) {
          origOnwarn(warning, warn);
        } else if (typeof warn === "function") {
          warn(warning);
        }
      };

      const origOnLog = opts.onLog;
      if (origOnLog) {
        opts.onLog = (level: any, log: any, handler: any) => {
          if (
            log.code === "MODULE_LEVEL_DIRECTIVE" ||
            (typeof log.message === "string" &&
              (log.message.includes('"use client"') ||
                log.message.includes("'use client'") ||
                log.message.includes("Module level directives")))
          ) {
            return;
          }
          origOnLog(level, log, handler);
        };
      }
      return opts;
    },
  };
}

function expressApiPlugin(): Plugin {
  return {
    name: "express-api-plugin",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || "";
        if (url === "/api" || url.startsWith("/api/") || url.startsWith("/api?")) {
          try {
            const { getExpressApiApp } = await server.ssrLoadModule("/src/server/apiApp.ts");
            const apiApp = getExpressApiApp();
            return apiApp(req, res, next);
          } catch (err) {
            console.error("Express API error:", err);
            return next(err);
          }
        }
        next();
      });
    },
  };
}

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "src/server.ts" },
  },
  nitro: {
    hooks: {
      "rollup:before"(_nitro: any, rollupConfig: any) {
        if (rollupConfig) {
          const orig = rollupConfig.onwarn;
          rollupConfig.onwarn = (warning: any, warn: any) => {
            if (
              warning.code === "MODULE_LEVEL_DIRECTIVE" ||
              (typeof warning.message === "string" &&
                (warning.message.includes('"use client"') ||
                  warning.message.includes("'use client'") ||
                  warning.message.includes("Module level directives")))
            ) {
              return;
            }
            if (orig) orig(warning, warn);
            else if (typeof warn === "function") warn(warning);
          };
        }
      },
    },
    rollupConfig: {
      onwarn(warning: any, warn: any) {
        if (
          warning.code === "MODULE_LEVEL_DIRECTIVE" ||
          (typeof warning.message === "string" &&
            (warning.message.includes('"use client"') ||
              warning.message.includes("'use client'") ||
              warning.message.includes("Module level directives")))
        ) {
          return;
        }
        warn(warning);
      },
    },
  },
  vite: {
    server: {
      host: "0.0.0.0",
      port: 3000,
      strictPort: true,
    },
    plugins: [expressApiPlugin(), suppressModuleDirectivesPlugin()],
    build: {
      rollupOptions: {
        external: ["fsevents"],
        onwarn(warning, warn) {
          if (
            warning.code === "MODULE_LEVEL_DIRECTIVE" ||
            (typeof warning.message === "string" &&
              (warning.message.includes('"use client"') ||
                warning.message.includes("'use client'") ||
                warning.message.includes("Module level directives")))
          ) {
            return;
          }
          warn(warning);
        },
      },
    },
  },
});

