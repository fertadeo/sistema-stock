import { redirect } from 'next/navigation';

export default async function ClienteRepartidorDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/repartidor/rapido?cliente=${id}`);
}
