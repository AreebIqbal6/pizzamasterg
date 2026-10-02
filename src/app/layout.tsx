import type { Metadata } from 'next'
import { Outfit, Plus_Jakarta_Sans, Caveat } from 'next/font/google'
import { Toaster } from 'sonner'
import { CookieBanner } from '@/components/cookie-banner'
import { ErrorBoundary } from '@/components/error-boundary'
import { SmoothScroll } from '@/components/smooth-scroll'
import './globals.css'

const fontSans = Plus_Jakarta_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

const fontHeading = Outfit({
  variable: '--font-heading',
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
})

const fontAccent = Caveat({
  variable: '--font-accent',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'Pizza Master G | Karachi Ka Best Pizza',
  description:
    'Order from Pizza Master G — Karachi Ka Best Pizza. Hot & spicy flavours, value deals and fast delivery across Karachi.',
  manifest: '/manifest.json',
  icons: {
    icon: '/chef-logo-removebg-preview.png',
    shortcut: '/chef-logo-removebg-preview.png',
    apple: '/chef-logo-removebg-preview.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${fontSans.variable} ${fontHeading.variable} ${fontAccent.variable} bg-background`}>
      <body className="font-sans antialiased text-foreground bg-background">
        <SmoothScroll>
          <ErrorBoundary>
            {children}
            <CookieBanner />
            <Toaster
              position="top-center"
              theme="dark"
              toastOptions={{
                style: {
                  background: 'rgb(33, 33, 33)',
                  color: '#fbbf24',
                  border: '1px solid rgb(51, 51, 51)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                },
              }}
            />
          </ErrorBoundary>
        </SmoothScroll>
        <script
          dangerouslySetInnerHTML={{
            __html: `
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
            `,
          }}
        />
      </body>
    </html>
  )
}
