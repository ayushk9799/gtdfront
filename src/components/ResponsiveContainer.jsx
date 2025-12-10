import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useResponsive } from '../hooks/useResponsive';

/**
 * A container component that automatically applies responsive styles.
 * Centers content and constrains max width on tablets.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components
 * @param {Object} props.style - Additional styles to apply
 * @param {boolean} props.fullWidth - If true, don't constrain max width
 * @param {boolean} props.center - If true, center the container (default: true)
 */
export function ResponsiveContainer({
    children,
    style,
    fullWidth = false,
    center = true,
}) {
    const { maxContentWidth, horizontalPadding, isTablet } = useResponsive();

    return (
        <View style={[
            styles.container,
            { paddingHorizontal: horizontalPadding },
            !fullWidth && maxContentWidth && { maxWidth: maxContentWidth },
            center && styles.centered,
            style,
        ]}>
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    centered: {
        alignSelf: 'center',
    },
});

export default ResponsiveContainer;
