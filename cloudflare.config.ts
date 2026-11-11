import { defineConfig } from "cf/config";

export default defineConfig({
  accountId: "160d4d33acd4258d2d67c59d7123a282",
  worker: {
    name: "happy-feed",
    compatibilityDate: "2026-11-11",
    domains: ["feed.poom.dev"],
  },
});
