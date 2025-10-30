import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 检查值是否有内容可以显示
 * 排除: null, undefined, 空对象{}, 空数组[]
 * 保留: 0, false, 空字符串''等
 *
 * @example
 * hasValue(0) // true - 0是有效值
 * hasValue(null) // false
 * hasValue([]) // false - 空数组
 * hasValue({}) // false - 空对象
 * hasValue([1,2]) // true
 */
export function hasValue(value: any): boolean {
  // 检查 null 和 undefined
  if (value === null || value === undefined) return false;

  // 检查空数组
  if (Array.isArray(value) && value.length === 0) return false;

  // 检查空对象
  if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0) return false;

  return true;
}

/**
 * 检查值是否非零且有效
 * 排除: null, undefined, 空对象{}, 空数组[], 0
 * 保留: 非零数字, 字符串, false等
 *
 * @example
 * nonZero(0) // false - 0不显示
 * nonZero(100) // true
 * nonZero(null) // false
 * nonZero([]) // false - 空数组
 * nonZero({}) // false - 空对象
 */
export function nonZero(value: any): boolean {
  // 检查 null 和 undefined
  if (value === null || value === undefined) return false;

  // 检查 0
  if (value === 0) return false;

  // 检查空数组
  if (Array.isArray(value) && value.length === 0) return false;

  // 检查空对象
  if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0) return false;

  return true;
}
