export const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('en-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount) + ' EGP';
