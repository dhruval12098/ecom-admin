export const formatCurrency = (value: number) => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR'
  });
  return formatter.format(Number.isFinite(value) ? value : 0);
};
