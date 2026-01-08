/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const brand = {
  lightPink: "#FFC0CB",
  darkPink: "#FF407D",
  blue: "#1E88E5",
};

// Skeleton Theme Configuration
const skeleton = {
  light: {
    base: "#E8E8E8",
    highlight: "#F5F5F5",
    opacityRange: [0.4, 0.8],
  },
  dark: {
    base: "#2A2D2E",
    highlight: "#3A3D3E",
    opacityRange: [0.3, 0.6],
  },
  // Animation settings
  animation: {
    duration: 1000,
    easing: 'ease-in-out',
  },
  // Common border radius presets
  borderRadius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
};

export const Colors = {
  brand,
  skeleton,
  light: {
    text: "#11181C",
    background: "#ffffff",
    tint: brand.blue,
    icon: "#687076",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: brand.darkPink,
    card: "#ffffff",
    border: "#e6e6e6",
  },
  dark: {
    text: "#ECEDEE",
    background: "#151718",
    tint: brand.blue,
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: brand.lightPink,
    card: "#1E1E1E",
    border: "#2A2D2E",
  },
};
