import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dialektoz | Plataforma de Inglés",
  description: "Plataforma de aprendizaje de inglés moderna y premium",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark antialiased">
      <body className="min-h-screen flex flex-col bg-background text-foreground font-sans">
        {children}
      </body>
    </html>
  );
}
