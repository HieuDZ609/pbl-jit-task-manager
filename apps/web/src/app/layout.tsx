import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "PBL JIT Task Manager",
  description: "Task manager web app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  )
}
