type SeoProps = {
  title: string;
  description?: string;
};

export function Seo({ title, description }: SeoProps) {
  return (
    <>
      <title>{title}</title>
      {description && <meta name="description" content={description} />}

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
