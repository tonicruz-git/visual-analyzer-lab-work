import { NumberFormat } from '../types/data';

export function formatValue(value: any, format: NumberFormat = 'auto', currencySymbol = '$'): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '—';
  }

  const num = typeof value === 'number' ? value : parseFloat(String(value));

  if (isNaN(num)) {
    return String(value);
  }

  switch (format) {
    case 'currency':
      if (Math.abs(num) >= 1_000_000_000) {
        return `${currencySymbol}${(num / 1_000_000_000).toFixed(1)}B`;
      }
      if (Math.abs(num) >= 1_000_000) {
        return `${currencySymbol}${(num / 1_000_000).toFixed(1)}M`;
      }
      if (Math.abs(num) >= 10_000) {
        return `${currencySymbol}${(num / 1_000).toFixed(1)}k`;
      }
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 1,
      }).format(num);

    case 'percent':
      return `${num >= 0 && num < 1 ? (num * 100).toFixed(1) : num.toFixed(1)}%`;

    case 'compact':
      if (Math.abs(num) >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
      if (Math.abs(num) >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
      if (Math.abs(num) >= 1_000) return `${(num / 1_000).toFixed(1)}k`;
      return num.toLocaleString();

    case 'decimal':
      return num.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 2 });

    case 'auto':
    default:
      if (Math.abs(num) >= 1_000_000) {
        return `${(num / 1_000_000).toFixed(1)}M`;
      }
      if (Math.abs(num) >= 10_000) {
        return `${(num / 1_000).toFixed(1)}k`;
      }
      if (Number.isInteger(num)) {
        return num.toLocaleString();
      }
      return num.toFixed(2);
  }
}

export function formatDateLabel(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}
