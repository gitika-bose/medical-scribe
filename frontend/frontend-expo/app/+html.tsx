import { ScrollViewStyleReset } from 'expo-router/html';

// This file is web-only and used to configure the root HTML for every
// web page during static rendering.
// The contents of this function only run in Node.js environments and
// do not have access to the DOM or browser APIs.
export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        {/* App title & favicon */}
        <title>Juno</title>
        <link rel="icon" type="image/png" sizes="32x32" href="/assets/images/favicon.png" />
        <link rel="apple-touch-icon" href="/assets/images/icon.png" />

        {/* Open Graph meta tags for link previews (Messenger, Slack, iMessage, etc.) */}
        <meta property="og:title" content="Juno" />
        <meta property="og:description" content="Medical clarity, when it matters the most" />
        <meta property="og:image" content="/assets/images/icon.png" />
        <meta property="og:type" content="website" />

        {/* Twitter / X card meta */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Juno" />
        <meta name="twitter:description" content="Medical clarity, when it matters the most" />
        <meta name="twitter:image" content="/assets/images/icon.png" />

        {/* General description */}
        <meta name="description" content="Medical clarity, when it matters the most" />

        {/* 
          Disable body scrolling on web. This makes ScrollView components work closer to how they do on native. 
          However, body scrolling is often nice to have for mobile web. If you want to enable it, remove this line.
        */}
        <ScrollViewStyleReset />

        {/* Using raw CSS styles as an escape-hatch to ensure the background color never flickers in dark-mode. */}
        <style dangerouslySetInnerHTML={{ __html: responsiveBackground }} />
        {/* Add any additional <head> elements that you want globally available on web... */}
      </head>
      <body>{children}</body>
    </html>
  );
}

const responsiveBackground = `
body {
  background-color: #fff;
}
@media (prefers-color-scheme: dark) {
  body {
    background-color: #000;
  }
}`;
