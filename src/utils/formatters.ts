export const formatNumber = (num: number, decimals = 2): string => {
  if (num === null || num === undefined) return '0';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(num);
};

export const formatCurrency = (num: number, decimals = 2): string => {
  if (num === null || num === undefined) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(num);
};

export const formatPercent = (num: number, decimals = 2): string => {
  if (num === null || num === undefined) return '0%';
  return `${formatNumber(num, decimals)}%`;
};

export const formatAddress = (address: string, start = 4, end = 4): string => {
  if (!address) return '';
  if (address.length <= start + end) return address;
  return `${address.slice(0, start)}...${address.slice(-end)}`;
};

export const formatDate = (timestamp: number): string => {
  if (!timestamp) return 'N/A';
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatTimeAgo = (timestamp: number): string => {
  if (!timestamp) return 'N/A';
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60
  };
  
  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return `${interval} ${unit}${interval === 1 ? '' : 's'} ago`;
    }
  }
  
  return 'just now';
};

export const getPNLColor = (pnl: number): string => {
  if (pnl > 0) return 'text-success';
  if (pnl < 0) return 'text-danger';
  return 'text-gray-400';
};

export const getWinrateColor = (winrate: number): string => {
  if (winrate >= 60) return 'text-success';
  if (winrate >= 45) return 'text-warning';
  return 'text-danger';
};

export const getROIColor = (roi: number): string => {
  if (roi > 100) return 'text-success';
  if (roi > 0) return 'text-warning';
  return 'text-danger';
};
