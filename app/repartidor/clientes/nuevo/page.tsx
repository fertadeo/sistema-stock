import { redirect } from 'next/navigation';

export default function NuevoClienteRepartidorPage() {
  redirect('/repartidor/rapido?nuevo=1');
}
