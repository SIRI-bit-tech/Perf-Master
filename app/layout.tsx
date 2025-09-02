import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { Navigation } from "@/components/navigation"
import { ParticleBackground } from "@/components/particle-background"
import "./globals.css"

export const metadata: Metadata = {
  title: "PerfMaster - AI-Powered Performance Analyzer",
  description: "Real-time performance analysis and optimization for frontend engineers",
  generator: "PerfMaster v1.0",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        <ParticleBackground />
        <div className="relative z-10">
          <Navigation />
          <Suspense fallback={null}>{children}</Suspense>
        </div>
        <Analytics />
      </body>
    </html>
  )
}
