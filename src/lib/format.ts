const rupees = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

/** Prices are whole rupees end to end (see the backend README). */
export const formatMoney = (v: number) => rupees.format(v);

export const formatCompactMoney = (v: number) =>
  v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : rupees.format(v);

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
