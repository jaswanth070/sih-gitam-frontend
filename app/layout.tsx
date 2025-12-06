import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { GlobalHeader } from "@/components/navigation/global-header"
import { PageContainer } from "@/components/navigation/page-container"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  // <CHANGE> Updated metadata for SIH GITAM application
  metadataBase: new URL("https://sih-gitam-frontend.vercel.app"),
  title: {
    default: "SIH GRAND FINAL - GITAM",
    template: "%s | SIH GRAND FINAL - GITAM",
  },
  applicationName: "Smart India Hackathon Portal",
  description: "Official Smart India Hackathon Grand Final portal by GITAM, Visakhapatnam for managing technology initiatives and team logistics.",
  keywords: [
    "Smart India Hackathon",
    "SIH",
    "AICTE",
    "GITAM",
    "Visakhapatnam",
    "Gandhi Institute of Technology and Management",
    "Technology",
    "Innovation",
    "Hackathon",
    "Engineering",
    "Student Projects",
  ],
  robots: {
    index: true,
    follow: true,
  },
  category: "Technology",
  authors: [{ name: "Jaswanth Madiya" }],
  publisher: "Gandhi Institute of Technology and Management",
  creator: "Jaswanth Madiya",
  referrer: "origin-when-cross-origin",
  formatDetection: {
    telephone: false,
    address: false,
    email: false,
  },
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/SIH.png",
    apple: "/SIH.png",
    shortcut: "/SIH.png",
  },
  other: {
    "distribution": "global",
    "rating": "general",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased bg-white min-h-screen flex flex-col`}>
        <GlobalHeader />
        <PageContainer>{children}</PageContainer>
        <Analytics />
      </body>
    </html>
  )
}
