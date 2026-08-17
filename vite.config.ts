import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages serves project sites under /<repo>/ — set BASE_PATH in CI; local dev/preview stays at "/".
export default defineConfig({
  plugins: [react()],
  base: process.env.BASE_PATH ?? "/",
});
