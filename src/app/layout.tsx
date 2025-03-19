import { ConvexClientProvider } from "@/components/convext-client-provider";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import type { Metadata } from "next";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import localFont from "next/font/local";
import "./globals.css";
import Modal from "@/components/modal";
import { Toaster } from "sonner";
import { JotaiProvider } from "@/components/jotai-provider";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Slackzz",
  description: "Slackzz clone from Baseless",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ConvexAuthNextjsServerProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <ConvexClientProvider>
            <NuqsAdapter>
              <JotaiProvider>
                <Toaster />
                <Modal />

                {children}
              </JotaiProvider>
            </NuqsAdapter>
          </ConvexClientProvider>
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}
