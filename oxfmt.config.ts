export default {
	$schema: "./node_modules/oxfmt/configuration_schema.json",
	sortImports: {
		groups: ["side_effect", "builtin", "external", "internal", "parent", "sibling", "index", "type", "unknown"],
		internalPattern: ["#*", "~/*", "@/*"],
		newlinesBetween: false,
		order: "asc",
	},
	trailingComma: "all",
	semi: true,
	singleQuote: false,
	quoteProps: "as-needed",
	bracketSpacing: true,
	arrowParens: "always",
	printWidth: 120,
	useTabs: true,
	experimentalTailwindcss: {
		functions: ["tv", "clsx", "cn", "cva"],
	},
	ignorePatterns: ["node_modules/**", "dist/**", "build/**", "*.yml"],
};
