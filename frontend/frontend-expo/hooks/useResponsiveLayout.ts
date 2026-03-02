import { useWindowDimensions } from 'react-native';

/** Breakpoints (px) — adjust these to change when layout switches */
const PHONE_MAX = 600;
const DESKTOP_MIN = 768;

export function useResponsiveLayout() {
  const { width, height } = useWindowDimensions();

  return {
    /** Phone-sized screen (< 600px) */
    isPhone: width < PHONE_MAX,
    /** Tablet-sized screen (600–767px) */
    isTablet: width >= PHONE_MAX && width < DESKTOP_MIN,
    /** Desktop / laptop screen (≥ 768px) — shows sidebar */
    isDesktop: width >= DESKTOP_MIN,
    /** Raw window width */
    width,
    /** Raw window height */
    height,
  };
}
