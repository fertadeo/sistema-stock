import ConditionalLayout from '../components/conditionalLayout';
import { Metadata } from 'next'
import '../styles/globals.css'

export const metadata: Metadata = {
  title: 'Sistema Stock',
  description: 'Sistema de control de stock',
  manifest: '/manifest.json',
  themeColor: '#000000',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Sistema Stock',
  },
  formatDetection: {
    telephone: false,
  },
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