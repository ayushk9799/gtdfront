/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const brand = {
  lightPink: "#FFC0CB",
  darkPink: "#C2185B",
  blue: "#1E88E5",
};

export const Colors = {
  brand,
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
