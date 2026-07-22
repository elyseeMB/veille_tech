type SeoProps = {
	title: string;
	description?: string;
	url?: string;
	image?: string;
};

export function Seo({
	title,
	description = "",
	url = "https://veille.safecoffi.app",
	image = "https://veille.safecoffi.app/og-image.jpg",
}: SeoProps) {
	return (
		<>
			<title>{title}</title>
			<meta name="description" content={description} />

			<meta property="og:title" content={title} />
			<meta property="og:description" content={description} />
			<meta property="og:image" content={image} />
			<meta property="og:url" content={url} />
			<meta property="og:type" content="website" />

			<meta name="twitter:card" content="summary_large_image" />
			<meta name="twitter:title" content={title} />
			<meta name="twitter:description" content={description} />
			<meta name="twitter:image" content={image} />

			<link rel="icon" type="image/x-icon" href="/favicon.ico" />
			<link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png" />
			<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
			<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
			<link rel="manifest" href="/site.webmanifest" />
		</>
	);
}
