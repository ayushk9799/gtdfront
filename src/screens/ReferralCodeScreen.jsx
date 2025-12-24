import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Keyboard,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../constants/Colors';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { MMKV } from 'react-native-mmkv';
import { API_BASE } from '../../constants/Api';

const { width: WINDOW_WIDTH } = Dimensions.get('window');
const storage = new MMKV();

export default function ReferralCodeScreen() {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const [referralCode, setReferralCode] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Track keyboard visibility
    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            () => setIsKeyboardVisible(true)
        );
        const keyboardDidHideListener = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
            () => setIsKeyboardVisible(false)
        );

        return () => {
            keyboardDidShowListener?.remove();
            keyboardDidHideListener?.remove();
        };
    }, []);

    const handleContinue = async () => {
        if (!referralCode.trim()) return;

        setIsLoading(true);
        try {
            // Get user ID from storage
            const userStr = storage.getString('user');
            const user = userStr ? JSON.parse(userStr) : null;
            const userId = user?.id || user?._id;

            const response = await fetch(`${API_BASE}/api/referral/apply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    referralCode: referralCode.trim().toUpperCase(),
                    userId
                }),
            });
            const data = await response.json();

            // Mark referral decision as made and navigate regardless of success
            storage.set('referralDecided', true);
            navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] });
        } catch (error) {
            console.error('Failed to apply referral code:', error);
            // Still navigate even if there's an error
            storage.set('referralDecided', true);
            navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSkip = () => {
        // Mark referral decision as made (skipped)
        storage.set('referralDecided', true);
        navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] });
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#FFF7FA', '#FFEAF2', '#FFD6E5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFill}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
            >
                <View style={{ flex: 1 }}>
                    <ScrollView
                        contentContainerStyle={[
                            styles.scrollContent,
                            { paddingTop: insets.top + 20 }
                        ]}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View style={styles.header}>
                            <View style={styles.logoBadge}>
                                <Ionicons name="gift" size={28} color="#ffffff" />
                            </View>
                            <Text style={styles.title}>Got a referral code?</Text>
                            <Text style={styles.subtitle}>
                                If a friend invited you, enter their code below to give them a reward!
                            </Text>
                        </View>

                        <View style={[styles.infoCard, styles.cardShadow]}>
                            <Text style={styles.sectionTitle}>Enter Referral Code</Text>

                            <View style={[
                                styles.inputContainer,
                                isFocused && styles.inputContainerFocused
                            ]}>
                                <Ionicons
                                    name="ticket-outline"
                                    size={20}
                                    color={isFocused ? Colors.brand.darkPink : '#9CA3AF'}
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g. JOHN123"
                                    placeholderTextColor="#9CA3AF"
                                    value={referralCode}
                                    onChangeText={setReferralCode}
                                    onFocus={() => setIsFocused(true)}
                                    onBlur={() => setIsFocused(false)}
                                    autoCapitalize="characters"
                                    autoCorrect={false}
                                />
                                {referralCode.length > 0 && (
                                    <TouchableOpacity onPress={() => setReferralCode('')}>
                                        <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                                    </TouchableOpacity>
                                )}
                            </View>

                            <View style={styles.benefits}>
                                <View style={styles.benefitRow}>
                                    <MaterialCommunityIcons name="heart" size={18} color={Colors.brand.darkPink} />
                                    <Text style={styles.benefitText}>Your friend gets +1 heart when you play</Text>
                                </View>
                                <View style={styles.benefitRow}>
                                    <MaterialCommunityIcons name="gift-outline" size={18} color={Colors.brand.darkPink} />
                                    <Text style={styles.benefitText}>It's a way to say thanks for the invite!</Text>
                                </View>
                            </View>

                            <View style={styles.finePrintRow}>
                                <MaterialCommunityIcons name="information-outline" size={14} color="#6B7280" />
                                <Text style={styles.finePrint}>
                                    Don't have a code? - just skip and start playing!
                                </Text>
                            </View>
                        </View>
                    </ScrollView>

                    {/* Fixed Bottom Actions */}
                    <View style={[styles.bottomActions, { paddingBottom: insets.bottom + 16 }]}>
                        <TouchableOpacity
                            style={[styles.primaryButton, (!referralCode || isLoading) && styles.primaryButtonDisabled]}
                            onPress={handleContinue}
                            activeOpacity={0.9}
                            disabled={!referralCode || isLoading}
                        >
                            <LinearGradient
                                colors={referralCode && !isLoading ? ["#F472B6", "#FB7185"] : ["#E5E7EB", "#D1D5DB"]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.primaryButtonGradient}
                            />
                            {isLoading ? (
                                <ActivityIndicator color="#9CA3AF" size="small" />
                            ) : (
                                <Text style={[styles.primaryButtonText, !referralCode && styles.primaryButtonTextDisabled]}>
                                    Apply Code
                                </Text>
                            )}
                        </TouchableOpacity>
                        {!isKeyboardVisible && (
                            <TouchableOpacity style={styles.secondaryButton} onPress={handleSkip} activeOpacity={0.9}>
                                <Text style={styles.secondaryButtonText}>I don't have a code</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 8,
    },
    logoBadge: {
        height: 56,
        width: 56,
        borderRadius: 28,
        backgroundColor: Colors.brand.darkPink,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        shadowColor: '#000',
        shadowOpacity: 0.18,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 8 },
        elevation: 4,
    },
    title: {
        fontSize: 24,
        lineHeight: 34,
        fontWeight: '900',
        color: '#1F2937',
        letterSpacing: -0.2,
        textAlign: 'center',
    },
    subtitle: {
        marginTop: 12,
        fontSize: 15,
        color: '#4B5563',
        fontWeight: '600',
        letterSpacing: -0.1,
        textAlign: 'center',
        paddingHorizontal: 10,
        lineHeight: 22,
    },
    infoCard: {
        borderRadius: 18,
        borderWidth: 2,
        borderColor: '#F1F5F9',
        backgroundColor: '#ffffff',
        padding: 20,
    },
    cardShadow: {
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 8 },
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 14,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        paddingHorizontal: 14,
        paddingVertical: 12,
        marginBottom: 18,
    },
    inputContainerFocused: {
        borderColor: Colors.brand.darkPink,
        backgroundColor: '#FFF7FA',
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 16,
        fontWeight: '700',
        color: '#0F172A',
        letterSpacing: 1,
        paddingVertical: 0,
    },
    benefits: {
        marginTop: 4,
    },
    benefitRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
    },
    benefitText: {
        marginLeft: 10,
        color: '#334155',
        fontSize: 14,
        fontWeight: '600',
        flex: 1,
    },
    finePrintRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginTop: 16,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    finePrint: {
        marginLeft: 6,
        color: '#6B7280',
        fontSize: 12,
        flex: 1,
        lineHeight: 18,
    },
    bottomActions: {
        paddingTop: 12,
        paddingHorizontal: 20,
        gap: 8,
        backgroundColor: '#FFF7FA',
    },
    primaryButton: {
        backgroundColor: 'transparent',
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        overflow: 'hidden',
    },
    primaryButtonDisabled: {
        opacity: 0.7,
    },
    primaryButtonGradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        borderRadius: 14,
    },
    primaryButtonText: {
        color: '#ffffff',
        fontSize: 17,
        fontWeight: '800',
    },
    primaryButtonTextDisabled: {
        color: '#9CA3AF',
    },
    secondaryButton: {
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: 'center',
    },
    secondaryButtonText: {
        color: '#0F172A',
        fontSize: 14,
        fontWeight: '700',
        opacity: 0.5,
    },
});
