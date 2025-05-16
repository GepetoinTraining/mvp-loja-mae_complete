import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { Toaster } from "@/src/components/ui/sonner"; // For shadcn/ui toast, or use react-hot-toast
import { AuthProvider } from "@/components/auth/AuthProvider"; // Assuming you have an AuthProvider

const APP_NAME = "MVP Loja Mae";
const APP_DEFAULT_TITLE = "MVP Loja Mae - Gestão Completa";
const APP_TITLE_TEMPLATE = "%s - MVP Loja Mae";
const APP_DESCRIPTION = "Sistema de gestão completo para lojas de móveis planejados.";

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_DEFAULT_TITLE,
    template: APP_TITLE_TEMPLATE,
  },
  description: APP_DESCRIPTION,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_DEFAULT_TITLE,
    // startUpImage: [], // Add startup images if needed
  },
  formatDetection: {
    telephone: false,
  },
  // openGraph: { // Add Open Graph meta tags if needed for social sharing
  //   type: "website",
  //   siteName: APP_NAME,
  //   title: {
  //     default: APP_DEFAULT_TITLE,
  //     template: APP_TITLE_TEMPLATE,
  //   },
  //   description: APP_DESCRIPTION,
  // },
  // twitter: { // Add Twitter card meta tags if needed
  //   card: "summary",
  //   title: {
  //     default: APP_DEFAULT_TITLE,
  //     template: APP_TITLE_TEMPLATE,
  //   },
  //   description: APP_DESCRIPTION,
  // },
};

export const viewport: Viewport = {
    themeColor: "#FFFFFF", // Or your primary theme color
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${GeistSans.variable} ${GeistMono.variable} antialiased`} suppressHydrationWarning>
      <body>
        <AuthProvider>
          {children}
          <Toaster richColors />
        </AuthProvider>
      </body>
    </html>
  );
}

