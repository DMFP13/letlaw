import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LetLaw — Landlord Compliance for England",
  description:
    "Manage your rental properties in line with the Renters' Rights Act and current English landlord law.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.className} h-full`}>
      <body className="min-h-full bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
