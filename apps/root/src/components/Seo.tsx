type SeoProps = {
  title: string;
  description?: string;
  url?: string;
};

export function Seo({ title, description }: SeoProps) {
  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description ?? ""} />

      <meta property="og:title" content="My Feed | Veille Tech" />
      <meta property="og:description" content="Find your latest articles." />
      <meta
        property="og:image"
        content="https://veille.safecoffi.app/og-image.jpg"
      />
      <meta property="og:url" content="https://veille.safecoffi.app/feed" />
      <meta property="og:type" content="website" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="My Feed | Veille Tech" />
      <meta name="twitter:description" content="Find your latest articles." />
      <meta
        name="twitter:image"
        content="https://veille.safecoffi.app/og-image.jpg"
      />

      <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      <link
        rel="icon"
        type="image/png"
        sizes="96x96"
        href="/favicon-96x96.png"
      />
      <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      <link
        rel="apple-touch-icon"
        sizes="180x180"
        href="/apple-touch-icon.png"
      />
      <link rel="manifest" href="/site.webmanifest" />
    </>
  );
}
