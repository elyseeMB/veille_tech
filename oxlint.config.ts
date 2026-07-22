import { defineConfig } from "oxlint";

export default defineConfig({
	ignorePatterns: ["node_modules/**", "dist/**", "build/**", "public/**"],
	plugins: ["typescript", "react"],
	rules: {
		"typescript/no-namespace": "off",
	},
});
