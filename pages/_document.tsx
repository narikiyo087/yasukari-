import Document, {
  Html,
  Head,
  Main,
  NextScript,
  DocumentContext,
  DocumentInitialProps,
} from 'next/document'

type DocProps = DocumentInitialProps & { lang: string }

export default function AppDocument({ lang }: DocProps) {
  return (
    <Html lang={lang}>
      <Head>
        {/* External styles and icons */}
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        {/* Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap"
          rel="stylesheet"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        {/* Tailwind CSS */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css"
        />
        <script src="https://applepay.cdn-apple.com/jsapi/v1/apple-pay-sdk.js" />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.YasukariApp = { env: '${process.env.NODE_ENV ?? 'production'}' };`,
          }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
        <div id="payjp-root" />
      </body>
    </Html>
  )
}

// Set <html lang> per locale: English under /en, Japanese elsewhere.
// Runs for both SSR and SSG so the raw HTML reports the correct language.
AppDocument.getInitialProps = async (
  ctx: DocumentContext
): Promise<DocProps> => {
  const initialProps = await Document.getInitialProps(ctx)
  const path = ctx.asPath || ctx.pathname || ''
  const lang = path === '/en' || path.startsWith('/en/') ? 'en' : 'ja'
  return { ...initialProps, lang }
}
