/**
 * 数字格式化工具函数
 */

/**
 * 格式化数字为 K/M/B 格式
 * @param value 数字值
 * @param precision 小数位数，默认 1
 * @returns 格式化后的字符串
 *
 * @example
 * formatNumber(1234) => "1.2K"
 * formatNumber(1234567) => "1.2M"
 * formatNumber(1234567890) => "1.2B"
 * formatNumber(999) => "999"
 */
export function formatNumber(value: number, precision: number = 1): string {
  if (value < 1000) {
    return value.toString();
  }

  if (value < 1000000) {
    return (value / 1000).toFixed(precision) + 'K';
  }

  if (value < 1000000000) {
    return (value / 1000000).toFixed(precision) + 'M';
  }

  return (value / 1000000000).toFixed(precision) + 'B';
}

/**
 * 格式化数字为带千分位的字符串
 * @param value 数字值
 * @returns 格式化后的字符串
 *
 * @example
 * formatNumberWithCommas(1234567) => "1,234,567"
 */
export function formatNumberWithCommas(value: number): string {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
