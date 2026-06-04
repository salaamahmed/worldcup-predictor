import './globals.css'
import LayoutClient from './layoutClient'

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