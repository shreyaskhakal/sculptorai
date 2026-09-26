import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SculptorAI — Your AI Copilot for Blender",
  description:
    "An AI operating layer for Blender that turns natural language and reference images into structured modeling plans, executable Blender Python, automated scene debugging, and native add-on execution.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#090A0F] text-[#F0F2F8] min-h-screen antialiased selection:bg-[#F5792A]/30 selection:text-white">
        {children}
      </body>
    </html>
  );
}
