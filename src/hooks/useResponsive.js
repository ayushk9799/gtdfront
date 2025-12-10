import { useWindowDimensions } from 'react-native';

/**
 * Breakpoints for responsive design
 * - phone: 0-767px
 * - tablet: 768-1023px  
 * - desktop: 1024px+
 */
export const BREAKPOINTS = {
    phone: 0,
    tablet: 768,
    desktop: 1024,
};

/**
 * Hook for responsive design values based on screen dimensions
 * 
 * @returns {Object} Responsive utilities and values
 */
export function useResponsive() {
    const { width, height } = useWindowDimensions();

    // Determine device type based on width
    const isTablet = width >= BREAKPOINTS.tablet;
    const isDesktop = width >= BREAKPOINTS.desktop;
    const isPhone = !isTablet;

    // Check orientation
    const isLandscape = width > height;
    const isPortrait = !isLandscape;

    // Responsive spacing multiplier (larger screens get more spacing)
    const spacing = isTablet ? 1.5 : 1;

    // Max content width to prevent overly wide content on tablets
    const maxContentWidth = isTablet ? 700 : undefined;

    // Responsive font scale
    const fontScale = isTablet ? 1.15 : 1;

    // Responsive padding
    const horizontalPadding = isTablet ? 24 : 16;

    // Get current breakpoint name
    const breakpoint = isDesktop ? 'desktop'
        : isTablet ? 'tablet'
            : 'phone';

    // Helper to get responsive value
    const responsive = (phoneValue, tabletValue, desktopValue) => {
        if (isDesktop && desktopValue !== undefined) return desktopValue;
        if (isTablet && tabletValue !== undefined) return tabletValue;
        return phoneValue;
    };

    return {
        // Raw dimensions
        width,
        height,

        // Device type booleans
        isPhone,
        isTablet,
        isDesktop,

        // Orientation booleans
        isLandscape,
        isPortrait,

        // Responsive values
        spacing,
        maxContentWidth,
        fontScale,
        horizontalPadding,

        // Current breakpoint
        breakpoint,

        // Helper function
        responsive,
    };
}

export default useResponsive;
