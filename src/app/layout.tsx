import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Outlaw Apps - We're Having Fun Here!",
  description:
    "The official hub for apps built by Johnny Outlaw, LLC. Shutterfield, SixGuess, What a Great Day, and more.",
  keywords: ["Outlaw Apps", "Johnny Outlaw", "Shutterfield", "SixGuess", "What a Great Day"],
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/deadwax-icon-32.png', type: 'image/png', sizes: '32x32' },
    ],
    apple: { url: '/deadwax-icon.png', sizes: '192x192', type: 'image/png' },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
