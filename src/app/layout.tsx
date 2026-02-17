import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Huddle Duck — Connect Your Ad Account",
  description: "Connect your Meta ad account to Huddle Duck in 30 seconds.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="bg-effects">
          <div className="bg-orb bg-orb-1" />
          <div className="bg-orb bg-orb-2" />
        </div>
        <div className="relative z-1">{children}</div>
      </body>
    </html>
  );
}
