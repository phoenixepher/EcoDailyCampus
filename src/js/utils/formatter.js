/**
 * Data Formatting Utilities
 */

/**
 * Format currency to IDR (Indonesian Rupiah)
 * @param {number} amount 
 * @returns {string}
 */
export const formatCurrency = (amount) => {
  const value = typeof amount === 'number' ? amount : parseFloat(amount);
  const safeValue = isNaN(value) ? 0 : value;
  
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(safeValue);
};

/**
 * Truncate long strings for summaries or titles
 * @param {string} str 
 * @param {number} length 
 * @returns {string}
 */
export const truncateString = (str, length = 100) => {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
};
