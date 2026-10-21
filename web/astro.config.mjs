import { defineConfig } from "astro/config";

// Served from the custom subdomain root, so no `base` is needed. If this ever moves to a path
// like <user>.github.io/neighborly/, set `base: "/neighborly"`; all links, data fetches and the
// share URL already go through import.meta.env.BASE_URL.
export default defineConfig({
  site: "https://neighborly.amandapatricks.com",
});
