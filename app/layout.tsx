import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { cookies } from "next/headers";
import { createClient } from "@/utills/server";
import { signInWithGoogle, signOut } from "@/lib/auth";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hike Explorer",
  description: "Explore your hikes",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <nav className="navbar bg-base-100 border-b border-base-200 px-6">
          <div className="flex-1">
            <Link href="/" className="text-lg font-semibold tracking-tight">
              Hike Explorer
            </Link>
          </div>
          <div className="flex-none">
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-base-content/60">
                  {user.email}
                </span>
                <form action={signOut}>
                  <button type="submit" className="btn btn-ghost btn-sm">
                    Sign out
                  </button>
                </form>
              </div>
            ) : (
              <form action={signInWithGoogle}>
                <button type="submit" className="btn btn-outline btn-sm">
                  Login with Google
                </button>
              </form>
            )}
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
