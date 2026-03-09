"use client";

import { useEffect } from "react";
import { App } from "konsta/react";
import "./globals.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js");
    }
  }, []);

  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="theme-color" content="#ffffff" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <title>Vocafast</title>
        <meta name="description" content="Learn vocabulary fast with spaced repetition" />
      </head>
      <body className="antialiased">
        <App theme="ios" safeAreas>
          {children}
        </App>
      </body>
    </html>
  );
}
