export const formatCurrency = (value: number, currency: 'BRL' | 'USD' | 'USDT') => {
  const locales = {
    BRL: 'pt-BR',
    USD: 'en-US',
    USDT: 'en-US'
  };

  if (currency === 'USDT') {
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value) + ' USDT';
  }

  return new Intl.NumberFormat(locales[currency], {
    style: 'currency',
    currency: currency,
  }).format(value);
};
