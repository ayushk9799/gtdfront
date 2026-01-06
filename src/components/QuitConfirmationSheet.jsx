import React, { forwardRef, useCallback, useImperativeHandle, useMemo, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../../constants/Colors';
import LinearGradient from 'react-native-linear-gradient';

const QuitConfirmationSheet = forwardRef(function QuitConfirmationSheet({ onConfirmQuit }, ref) {
    const sheetRef = useRef(null);
    const snapPoints = useMemo(() => ['35%'], []);

    const backdrop = useCallback((props) => (
        <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.4} pressBehavior="close" />
    ), []);

    useImperativeHandle(ref, () => ({
        present: () => sheetRef.current?.present(),
        dismiss: () => sheetRef.current?.dismiss(),
    }), []);

    const handleQuit = useCallback(() => {
        sheetRef.current?.dismiss();
        // Small delay to let the sheet close smoothly
        setTimeout(() => {
            onConfirmQuit?.();
        }, 150);
    }, [onConfirmQuit]);

    const handleCancel = useCallback(() => {
        sheetRef.current?.dismiss();
    }, []);

    return (
        <BottomSheetModal
            ref={sheetRef}
            snapPoints={snapPoints}
            backdropComponent={backdrop}
            enablePanDownToClose={true}
            backgroundStyle={styles.sheetBackground}
            handleIndicatorStyle={styles.handleIndicator}
        >
            <BottomSheetView style={styles.container}>
                {/* Icon */}
                <View style={styles.iconContainer}>
                    <MaterialCommunityIcons name="alert-circle-outline" size={48} color={Colors.brand.darkPink} />
                </View>

                {/* Title */}
                <Text style={styles.title}>Quit Case?</Text>

                {/* Message */}
                <Text style={styles.message}>
                    Are you sure you want to quit solving this case? Your progress will be lost.
                </Text>

                {/* Buttons */}
                <View style={styles.buttonRow}>
                    {/* Continue Button */}
                    <TouchableOpacity
                        style={styles.continueButton}
                        onPress={handleCancel}
                        activeOpacity={0.9}
                    >
                        <Text style={styles.continueButtonText}>Continue</Text>
                    </TouchableOpacity>

                    {/* Quit Button */}
                    <TouchableOpacity
                        style={styles.quitButton}
                        onPress={handleQuit}
                        activeOpacity={0.9}
                    >
                        <LinearGradient
                            colors={["#F472B6", "#FB7185"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={StyleSheet.absoluteFill}
                        />
                        <Text style={styles.quitButtonText}>Quit Case</Text>
                    </TouchableOpacity>
                </View>
            </BottomSheetView>
        </BottomSheetModal>
    );
});

const styles = StyleSheet.create({
    sheetBackground: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },
    handleIndicator: {
        backgroundColor: '#C8D1DA',
        width: 40,
    },
    container: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 8,
        paddingBottom: 48,
        alignItems: 'center',
    },
    iconContainer: {
        marginBottom: 12,
    },
    title: {
        fontSize: 22,
        fontWeight: '900',
        color: '#1E1E1E',
        marginBottom: 8,
    },
    message: {
        fontSize: 15,
        fontWeight: '500',
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
        paddingHorizontal: 16,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    continueButton: {
        flex: 1,
        height: 52,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: Colors.brand.darkPink,
        justifyContent: 'center',
        alignItems: 'center',
    },
    continueButtonText: {
        fontSize: 16,
        fontWeight: '800',
        color: Colors.brand.darkPink,
    },
    quitButton: {
        flex: 1,
        height: 52,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    quitButtonText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#FFFFFF',
    },
});

export default QuitConfirmationSheet;
