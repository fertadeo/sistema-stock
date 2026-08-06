/** Formatea un monto en pesos ARS sin centavos: `$1.234` */
export function formatMonto(n: number): string {
  return `$${Math.abs(Math.round(n)).toLocaleString('es-AR')}`;
}

/** Valor numérico entero para inputs de precio (sin decimales forzados). */
export function precioInputValue(n: number | string | null | undefined): string {
  const num = typeof n === 'string' ? parseFloat(n) : Number(n);
  if (!Number.isFinite(num) || num === 0) return '';
  return String(Math.round(num));
}
