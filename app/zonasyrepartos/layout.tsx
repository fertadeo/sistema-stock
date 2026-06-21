'use client';

import { GoogleMapsProvider } from '@/components/GoogleMapsProvider';

export default function ZonasyRepartosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <GoogleMapsProvider>{children}</GoogleMapsProvider>;
}
