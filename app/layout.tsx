import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import toast, { ToastBar, Toaster } from "react-hot-toast";
import "bootstrap/dist/css/bootstrap.css"
import "./globals.css"
import ToasterWrapper from "./ToasterWrapper";
import Breadcrumbs from "./Breadcrumbs";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tâches",
  description: "Outil de gestion des tâches",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <ToasterWrapper />
        <Breadcrumbs />
        {children}
      </body>
    </html>
  );
}
