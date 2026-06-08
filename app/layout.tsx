import './globals.css'
import LayoutClient from './layoutClient'

export const metadata = {
  title: {
    default: 'FIFA WC 2026 Predictor',
    template: '%s | FIFA WC 2026',
  },
  description: 'Predict matches and compete with friends.',

  icons: {
    icon: '/favicon.ico',
  },

  // ✅ NEW: Open Graph
  openGraph: {
    title: 'FIFA WC 2026 Predictor',
    description: 'Predict matches and compete with friends.',
    url: 'https://wc-26-fifa.com/', // 🔥 replace later
    siteName: 'FIFA WC 2026 Predictor',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'FIFA WC 2026 Predictor',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },

  // ✅ NEW: Twitter
  twitter: {
    card: 'summary_large_image',
    title: 'FIFA WC 2026 Predictor',
    description: 'Predict matches and compete with friends.',
    images: ['/og-image.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <div className="px-3 sm:px-6">
          <LayoutClient>{children}</LayoutClient>
        </div>
      </body>
    </html>
  )
}