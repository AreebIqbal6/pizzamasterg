import { Analytics } from '@vercel/analytics/next'
import type { Metadata } from 'next'
import { Poppins, Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import { CartProvider } from '@/components/cart/cart-context'
import { CookieBanner } from '@/components/cookie-banner'
import './globals.css'

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})
const poppins = Poppins({
  variable: '--font-heading',
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
})

export const metadata: Metadata = {
  title: 'Pizza Master G | Karachi Ka Best Pizza',
  description:
    'Order from Pizza Master G — Karachi Ka Best Pizza. Hot & spicy flavours, value deals and fast delivery across Karachi.',
  generator: 'v0.app',
  manifest: '/manifest.json',
  icons: {
    icon: '/chef-logo-removebg-preview.png',
    shortcut: '/chef-logo-removebg-preview.png',
    apple: '/chef-logo-removebg-preview.png',
  },
}

import { ErrorBoundary } from '@/components/error-boundary'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${poppins.variable} bg-background`}>
      <body className="font-sans antialiased">
        <ErrorBoundary>
          <CartProvider>
            {children}
            <CookieBanner />
          </CartProvider>
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
        {process.env.NODE_ENV === 'production' && <Analytics />}
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
