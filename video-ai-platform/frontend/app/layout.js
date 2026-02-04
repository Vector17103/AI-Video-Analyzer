import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AmplifyProvider } from "../lib/AmplifyProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Video AI Detection Platform",
  description: "AI-powered video object detection",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AmplifyProvider>
          {children}
        </AmplifyProvider>
      </body>
    </html>
  );
}