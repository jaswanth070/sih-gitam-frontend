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
  title: "Smart India Hackathon - GITAM",
  description: "SIH Portal for Hardware Track Management",
  generator: "v0.app",
  icons: {
    icon: "/SIH.png",
    apple: "/SIH.png",
    shortcut: "/SIH.png",
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
