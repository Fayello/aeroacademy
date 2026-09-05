import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import Providers from "./providers";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import RootErrorBoundary from "@/components/RootErrorBoundary";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#0F203A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  colorScheme: "dark light",
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://xpertclass.academy"),
  title: {
    default: "XpertClass | Master Tech Skills with Hands-On Labs",
    template: "%s | XpertClass",
  },
  description: "Hands-on training platform for security, Linux, DevOps, and cloud infrastructure. Deploy real labs, break real systems, build real skills.",
  keywords: ["security training", "linux training", "devops", "cloud", "cybersecurity", "CTF", "labs", "penetration testing", "master classes", "1-on-1 training"],
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/logo-icon.svg", type: "image/svg+xml" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "XpertClass",
  },
  openGraph: {
    title: "XpertClass | Master Tech Skills with Hands-On Labs",
    description: "Hands-on training platform for security, Linux, DevOps, and cloud infrastructure.",
    type: "website",
    siteName: "XpertClass",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "XpertClass | Master Tech Skills with Hands-On Labs",
    description: "Hands-on training platform for security, Linux, DevOps, and cloud infrastructure.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* PWA: manifest is also declared via metadata.manifest; keep explicit link for broader compat */}
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/logo-icon.svg" />
      </head>
      <body className={inter.className}>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})();`,
          }}
        />
        <RootErrorBoundary>
          <CurrencyProvider>
            <Providers>
              {children}
            </Providers>
          </CurrencyProvider>
        </RootErrorBoundary>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#ffffff",
              color: "#0f172a",
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              fontSize: "14px",
            },
            success: {
              iconTheme: { primary: "#229C62", secondary: "#ffffff" },
            },
            error: {
              iconTheme: { primary: "#dc2626", secondary: "#ffffff" },
            },
          }}
        />
        {/* PWA: register service worker */}
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){})});}`,
          }}
        />
      </body>
    </html>
  );
}
