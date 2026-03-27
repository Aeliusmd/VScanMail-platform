import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "VScanMail — Secure Digital Mail Custodian",
  description:
    "AI-powered mail scanning, cheque processing, and subscription management platform.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
