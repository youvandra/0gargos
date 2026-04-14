import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "0GArgos MVP",
  description: "Programmable physical security layer MVP"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen">
          <header className="border-b border-black/10">
            <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-center">
              <Link href="/" className="select-none">
                <Image
                  src="/0gargos.png"
                  alt="0GArgos"
                  width={320}
                  height={96}
                  priority
                  className="h-7 w-auto"
                />
              </Link>
            </div>
          </header>
          <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
