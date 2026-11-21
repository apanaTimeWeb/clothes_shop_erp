import type { Metadata } from "next";
import { LocaleProvider } from "@/components/ui/LocaleProvider";
import { Inter } from "next/font/google";
import "@/app/globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Thread & Form — Clothing Showroom Demo",
  description:
    "A fictional, browser-local clothing showroom. Search, shortlist, pick and complete demo sales.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const s = localStorage.getItem("theme");
                if (s === "dark" || (!s && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
                  document.documentElement.classList.add("dark");
                } else {
                  document.documentElement.classList.remove("dark");
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <LocaleProvider messages={{}}>{children}</LocaleProvider>
      </body>
    </html>
  );
}
