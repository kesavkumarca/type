import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_Tamil } from "next/font/google";
import "./globals.css";
import ClientLayout from "@/components/ClientLayout";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoSansTamil = Noto_Sans_Tamil({
  variable: "--font-noto-tamil",
  subsets: ["tamil"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Lakshmi Technical Institute - Typing Tests",
    template: "%s | Lakshmi Technical Institute",
  },
  description: "Master your typing skills with our professional typing test platform",
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${notoSansTamil.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col cursor-[url('/my-cursor.png'),_url('/my-cursor.svg'),_auto]">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}