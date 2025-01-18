import ConditionalLayout from '../components/conditionalLayout';
import { Metadata } from 'next'

export const metadata: Metadata = {
  manifest: '/manifest.json',
  themeColor: '#000000',
  viewport: 'minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, viewport-fit=cover'
}

export default function RootLayout({
    children,
  }: {
    children: React.ReactNode
  }) {
    return (
      <html lang="es">
        <body>
        <ConditionalLayout>
          <main>{children}</main>
        </ConditionalLayout>
      
          
        </body>
      </html>
    )
  }