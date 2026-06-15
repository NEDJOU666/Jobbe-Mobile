import { Dimensions, PixelRatio } from 'react-native';

const { width: W, height: H } = Dimensions.get('window');
const BASE_W = 390; // iPhone 14 / Pixel 7 baseline
const BASE_H = 844;

/** Scale a size proportionally to screen width */
export const scale = (n: number) =>
  Math.round(PixelRatio.roundToNearestPixel((W / BASE_W) * n));

/** Scale a font size — less aggressive than full scale to avoid giant text */
export const fs = (n: number) =>
  Math.round(PixelRatio.roundToNearestPixel((W / BASE_W) * n * 0.97));

/** Scale spacing/padding */
export const sp = scale;

/** Screen dimensions */
export const SW = W;
export const SH = H;

/** Device size class */
export const isSmall = W < 360;   // old Android (Galaxy A-series, etc.)
export const isMedium = W >= 360 && W < 430;
export const isLarge = W >= 430;  // Pro Max, tablets

/** Responsive value by size class */
export function rv<T>(small: T, medium: T, large?: T): T {
  if (isSmall) return small;
  if (isLarge) return large ?? medium;
  return medium;
}
