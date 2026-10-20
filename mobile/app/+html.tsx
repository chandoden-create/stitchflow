import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

/**
 * Customizes the web root HTML for StitchFlow.
 * Enables standalone PWA installation on iOS/iPhone so it behaves as an independent native app.
 */
export default function RootHtml({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
        />
        <title>StitchFlow</title>
        
        {/* Web App Manifest */}
        <link rel="manifest" href="/manifest.json" />

        {/* iOS Web App Meta Tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="StitchFlow" />
        <meta name="application-name" content="StitchFlow" />
        <meta name="theme-color" content="#6B2D3E" />
        
        {/* iOS App Icons */}
        <link rel="apple-touch-icon" href="/icon.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icon.png" />

        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: `
          html, body, #root {
            height: 100%;
            width: 100%;
            margin: 0;
            padding: 0;
            overflow: hidden;
            background-color: #FDFAF6;
            -webkit-tap-highlight-color: transparent;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          }
          input, textarea {
            -webkit-user-select: text !important;
            user-select: text !important;
            font-size: 16px !important;
            outline: none !important;
          }
          /* Hide scrollbar for a clean mobile app feel */
          ::-webkit-scrollbar {
            width: 0px;
            background: transparent;
          }
        `}} />
      </head>
      <body>{children}</body>
    </html>
  );
}
