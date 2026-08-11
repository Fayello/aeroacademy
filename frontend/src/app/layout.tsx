import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import Providers from "./providers";
import RootErrorBoundary from "@/components/RootErrorBoundary";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "AEROACADEMY | Master Tech Skills with Hands-On Labs",
    template: "%s | AEROACADEMY",
  },
  description: "Hands-on training platform for security, Linux, DevOps, and cloud infrastructure. Deploy real labs, break real systems, build real skills.",
  keywords: ["security training", "linux training", "devops", "cloud", "cybersecurity", "CTF", "labs", "penetration testing", "master classes", "1-on-1 training"],
  openGraph: {
    title: "AEROACADEMY | Master Tech Skills with Hands-On Labs",
    description: "Hands-on training platform for security, Linux, DevOps, and cloud infrastructure.",
    type: "website",
    siteName: "AEROACADEMY",
  },
  twitter: {
    card: "summary_large_image",
    title: "AEROACADEMY | Master Tech Skills with Hands-On Labs",
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
      <body className={inter.className}>
        <RootErrorBoundary>
          <Providers>
            {children}
          </Providers>
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
              iconTheme: { primary: "#059669", secondary: "#ffffff" },
            },
            error: {
              iconTheme: { primary: "#dc2626", secondary: "#ffffff" },
            },
          }}
        />
      </body>
    </html>
  );
}
