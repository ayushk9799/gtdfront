import React, { useState, useMemo, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { MMKV } from 'react-native-mmkv';
import { Colors } from '../../constants/Colors';
import { updateUser } from '../store/slices/userSlice';
import { API_BASE } from '../../constants/Api';
import googleAuth from '../services/googleAuth';
import CloudBottom from '../components/CloudBottom';
import LinearGradient from 'react-native-linear-gradient';

const SUBTLE_PINK_GRADIENT = ['#FFF7FA', '#FFEAF2', '#FFD6E5'];

export default function EditAccountScreen() {
    const navigation = useNavigation();
    const dispatch = useDispatch();
    const insets = useSafeAreaInsets();
    const storage = useMemo(() => new MMKV(), []);
    const { userData, status } = useSelector(state => state.user);

    // Get user from MMKV storage
    const user = useMemo(() => {
        try {
            const raw = storage.getString('user');
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }, [storage]);

    // Form states
    const [name, setName] = useState(userData?.name || user?.name || '');
    const [isUpdating, setIsUpdating] = useState(false);

    // Email is read-only
    const email = user?.email || userData?.email || '';

    const handleUpdate = useCallback(async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Name cannot be empty');
            return;
        }

        const userId = user?.userId || user?._id || user?.id || userData?._id;
        if (!userId) {
            Alert.alert('Error', 'Unable to identify user. Please try logging out and back in.');
            return;
        }

        setIsUpdating(true);

        try {
            const result = await dispatch(updateUser({
                userId,
                userData: { name: name.trim() }
            })).unwrap();

            // Update local storage with new name
            try {
                const storedUserStr = storage.getString('user');
                if (storedUserStr) {
                    const storedUser = JSON.parse(storedUserStr);
                    storedUser.name = name.trim();
                    storage.set('user', JSON.stringify(storedUser));
                }
            } catch (e) {
                console.warn('Failed to update local storage:', e);
            }

            Alert.alert('Success', 'Your profile has been updated', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            Alert.alert('Error', error?.message || 'Failed to update profile. Please try again.');
        } finally {
            setIsUpdating(false);
        }
    }, [name, user, userData, dispatch, storage, navigation]);

    const handleDeleteAccount = useCallback(async () => {
        Alert.alert(
            'Delete Account',
            'Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data, including game progress, scores, and premium subscriptions.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const userId = user?.userId || user?._id || user?.id || userData?._id;
                            if (!userId) {
                                Alert.alert('Error', 'Unable to identify user. Please try logging out and back in.');
                                return;
                            }

                            // Call backend delete endpoint
                            const response = await fetch(`${API_BASE}/api/users/${userId}`, {
                                method: 'DELETE',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                            });

                            const data = await response.json();

                            if (!response.ok || data?.error) {
                                Alert.alert('Error', data?.error || 'Failed to delete account. Please try again.');
                                return;
                            }

                            // Clear all local storage
                            try {
                                storage.clearAll();
                            } catch (e) {
                                console.warn('Error clearing local storage:', e);
                            }

                            // Sign out from Google
                            try { await googleAuth.signOut(); } catch { }
                            try { await googleAuth.revoke?.(); } catch { }

                            // Reset navigation to Login screen
                            setTimeout(() => {
                                try {
                                    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
                                } catch { }
                            }, 0);
                        } catch (err) {
                            Alert.alert('Error', err?.message || 'Failed to delete account. Please try again.');
                        }
                    },
                },
            ]
        );
    }, [user, userData, storage, navigation]);

    const isLoading = isUpdating || status === 'loading';

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <LinearGradient
                colors={SUBTLE_PINK_GRADIENT}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFill}
            />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.flex1}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={styles.backButton}
                        activeOpacity={0.7}
                    >
                        <MaterialCommunityIcons name="arrow-left" size={24} color="#1E1E1E" />
                    </TouchableOpacity>
                    <View style={styles.headerPlaceholder} />
                </View>

                <ScrollView
                    contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Avatar */}
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>
                                {name?.[0]?.toUpperCase?.() || email?.[0]?.toUpperCase?.() || 'U'}
                            </Text>
                        </View>
                    </View>

                    {/* Form */}
                    <View style={styles.formContainer}>
                        {/* Name Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Name</Text>
                            <View style={styles.inputWrapper}>
                                <MaterialCommunityIcons
                                    name="account-outline"
                                    size={20}
                                    color="#6C6C6C"
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    style={styles.textInput}
                                    value={name}
                                    onChangeText={setName}
                                    placeholder="Enter your name"
                                    placeholderTextColor="#A0A0A0"
                                    autoCapitalize="words"
                                    autoCorrect={false}
                                    editable={!isLoading}
                                />
                            </View>
                        </View>

                        {/* Email Input (Disabled) */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Email</Text>
                            <View style={[styles.inputWrapper, styles.inputDisabled]}>
                                <MaterialCommunityIcons
                                    name="email-outline"
                                    size={20}
                                    color="#A0A0A0"
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    style={[styles.textInput, styles.textInputDisabled]}
                                    value={email}
                                    placeholder="Your email"
                                    placeholderTextColor="#A0A0A0"
                                    editable={false}
                                    selectTextOnFocus={false}
                                />
                                <MaterialCommunityIcons
                                    name="lock-outline"
                                    size={18}
                                    color="#A0A0A0"
                                    style={styles.lockIcon}
                                />
                            </View>
                            <Text style={styles.helperText}>
                                Email cannot be changed
                            </Text>
                        </View>
                    </View>

                    {/* Update Button */}
                    <TouchableOpacity
                        onPress={handleUpdate}
                        activeOpacity={0.85}
                        disabled={isLoading}
                        style={[styles.updateButton, isLoading && styles.updateButtonDisabled]}
                    >
                        {isLoading ? (
                            <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                            <View style={styles.buttonContent}>
                                <MaterialCommunityIcons name="check" size={20} color="#ffffff" />
                                <Text style={styles.updateButtonText}>Update Profile</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    {/* Danger Zone Section */}
                    <View style={styles.dangerZoneContainer}>
                        <View style={styles.dangerZoneHeader}>
                            <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#DC2626" />
                            <Text style={styles.dangerZoneTitle}>Danger Zone</Text>
                        </View>
                        <Text style={styles.dangerZoneDescription}>
                            Actions here are irreversible. Please proceed with caution.
                        </Text>
                    </View>

                    {/* Delete Account Button */}
                    <TouchableOpacity
                        onPress={handleDeleteAccount}
                        activeOpacity={0.85}
                        style={styles.deleteButton}
                    >
                        <View style={styles.buttonContent}>
                            <MaterialCommunityIcons name="delete-outline" size={20} color="#DC2626" />
                            <Text style={styles.deleteButtonText}>Delete Account</Text>
                        </View>
                    </TouchableOpacity>
                    <View style={{ position: 'relative', height: 160, marginTop: 24, marginHorizontal: -20 }}>
                        <CloudBottom height={160} color={"#FF407D"} style={{ opacity: 0.35 }} />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    flex1: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E1E1E',
    },
    headerPlaceholder: {
        width: 40,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 24,
    },
    avatarContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#FFE0EA',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: Colors.brand.darkPink,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    avatarText: {
        fontSize: 40,
        fontWeight: '800',
        color: Colors.brand.darkPink,
    },
    formContainer: {
        gap: 20,
        marginBottom: 32,
    },
    inputGroup: {
        gap: 8,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4A5568',
        marginLeft: 4,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.04)',
    },
    inputDisabled: {
        backgroundColor: '#F8F8F8',
    },
    inputIcon: {
        marginRight: 12,
    },
    lockIcon: {
        marginLeft: 8,
    },
    textInput: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
        color: '#1E1E1E',
        padding: 0,
    },
    textInputDisabled: {
        color: '#8A8A8A',
    },
    helperText: {
        fontSize: 12,
        color: '#8A8A8A',
        marginLeft: 4,
        fontStyle: 'italic',
    },
    updateButton: {
        backgroundColor: Colors.brand.darkPink,
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: Colors.brand.darkPink,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    updateButtonDisabled: {
        opacity: 0.7,
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    updateButtonText: {
        color: '#ffffff',
        fontWeight: '700',
        fontSize: 16,
    },
    deleteButton: {
        backgroundColor: '#FEF2F2',
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
    },
    deleteButtonText: {
        color: '#DC2626',
        fontWeight: '700',
        fontSize: 16,
    },
    dangerZoneContainer: {
        marginTop: 32,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: 'rgba(220, 38, 38, 0.15)',
        alignItems: 'center',
    },
    dangerZoneHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginBottom: 6,
    },
    dangerZoneTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#DC2626',
    },
    dangerZoneDescription: {
        fontSize: 12,
        color: '#8A8A8A',
        marginBottom: 4,
        textAlign: 'center',
    },
});
