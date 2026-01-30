import type { Metadata } from "next";
import "./globals.css";
import { VisualEditsMessenger } from "orchids-visual-edits";
import ErrorReporter from "@/components/ErrorReporter";
import Script from "next/script";
import { AuthProvider } from "@/lib/auth-context";
import { EditorProvider } from "@/components/AdminEditor";
import { Toaster } from "sonner";
 
export const metadata: Metadata = {
  title: "जनसेवक | Jansevak - Mrs. Aasawari Kedar Navare | BJP Corporator Ward 26 KDMC",
  description: "जनसेवक - वॉर्ड 26 नागरिक पोर्टल | Official app of BJP Corporator Mrs. Aasawari Kedar Navare - Ward 26 KDMC. Lodge complaints, connect with your representative.",
  manifest: "/manifest.json",
  themeColor: "#FF6B00",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "जनसेवक",
  },
};
 
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Script id="register-sw" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(
                  function(registration) {
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                  },
                  function(err) {
                    console.log('ServiceWorker registration failed: ', err);
                  }
                );
              });
            }
          `}
        </Script>
        <Script
          id="orchids-browser-logs"
          src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts/orchids-browser-logs.js"
          strategy="afterInteractive"
          data-orchids-project-id="2c3db9e3-da35-40a2-84ce-14903d3fe260"
        />
        <ErrorReporter />
        <Script
          src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts//route-messenger.js"
          strategy="afterInteractive"
          data-target-origin="*"
          data-message-type="ROUTE_CHANGE"
          data-include-search-params="true"
          data-only-in-iframe="true"
          data-debug="true"
          data-custom-data='{"appName": "YourApp", "version": "1.0.0", "greeting": "hi"}'
        />
        <AuthProvider>
          <EditorProvider>
            {children}
          </EditorProvider>
        </AuthProvider>
        <Toaster richColors position="top-center" />
        <VisualEditsMessenger />
      </body>
    </html>
  );
}