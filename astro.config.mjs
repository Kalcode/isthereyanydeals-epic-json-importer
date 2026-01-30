// @ts-check
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import solidJs from "@astrojs/solid-js";

// https://astro.build/config
export default defineConfig({
	output: "server",
	adapter: cloudflare({
		imageService: "compile",
	}),
	integrations: [solidJs()],
	vite: {
		ssr: {
			external: [
				"node:crypto",
				"node:fs",
				"node:stream",
				"node:os",
				"node:path",
				"node:util",
				"node:child_process",
				"node:events",
			],
		},
	},
});
