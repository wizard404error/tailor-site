import type { Metadata } from "next";
import { Playfair_Display, Poppins } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

const playfairDisplay = Playfair_Display({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

const poppins = Poppins({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Tailored for Her | Luxury Women's Atelier",
  description:
    "Discover bespoke elegance at Tailored for Her — a luxury women's tailor shop offering custom-fitted garments, expert alterations, and personalized styling services crafted for the modern woman.",
  keywords: [
    "women's tailor",
    "luxury atelier",
    "bespoke clothing",
    "custom tailoring",
    "alterations",
    "personal styling",
    "women's fashion",
    "made to measure",
  ],
  authors: [{ name: "Tailored for Her" }],
  openGraph: {
    title: "Tailored for Her | Luxury Women's Atelier",
    description:
      "Discover bespoke elegance at Tailored for Her — custom-fitted garments, expert alterations, and personalized styling for the modern woman.",
    type: "website",
    siteName: "Tailored for Her",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tailored for Her | Luxury Women's Atelier",
    description:
      "Discover bespoke elegance at Tailored for Her — custom-fitted garments, expert alterations, and personalized styling for the modern woman.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${playfairDisplay.variable} ${poppins.variable} font-sans antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
