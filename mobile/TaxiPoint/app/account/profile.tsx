import { IconSymbol } from '@/components/ui/icon-symbol';
import { API_BASE_URL } from '@/config';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ProfileScreen() {
    const { user, updateUser } = useAuth();
    const colorScheme = useColorScheme();
    const theme = colorScheme ?? 'light';
    const colors = Colors[theme];
    const router = useRouter();

    const [firstName, setFirstName] = useState(user?.firstName || "");
    const [lastName, setLastName] = useState(user?.lastName || "");
    const [email, setEmail] = useState(user?.email || "");
    const [profileImage, setProfileImage] = useState(user?.profileImage || null);

    // Password management
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // 🔄 Fetch full user profile on mount if missing name/surname
    useEffect(() => {
        const fetchProfile = async () => {
            if (!user?.token) return;
            try {
                const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
                    headers: { 'Authorization': `Bearer ${user.token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.name) setFirstName(data.name);
                    if (data.surname) setLastName(data.surname);
                    if (data.email) setEmail(data.email);
                    // Update context too
                    updateUser({ firstName: data.name, lastName: data.surname, email: data.email });
                }
            } catch (e) {
                console.error("Failed to fetch profile:", e);
            }
        };

        if (!firstName || !lastName) {
            fetchProfile();
        }
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        // Re-fetch profile data
        if (user?.token) {
            try {
                const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
                    headers: { 'Authorization': `Bearer ${user.token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setFirstName(data.name || "");
                    setLastName(data.surname || "");
                    setEmail(data.email || "");
                    updateUser({ firstName: data.name, lastName: data.surname, email: data.email });
                }
            } catch (e) {
                console.error(e);
            }
        }
        setRefreshing(false);
    };

    const bgColor = colors.background;
    const cardBg = colors.surface;
    const textColor = colors.text;
    const subTextColor = colors.textSecondary;
    const inputBg = colors.secondaryBackground;
    const inputBorder = colors.border;
    const tintColor = colors.tint;

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'We need access to your gallery to change your profile picture.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });

        if (!result.canceled) {
            const uri = result.assets[0].uri;
            setProfileImage(uri);
            // In a real app, upload this to a server
            await updateUser({ profileImage: uri });
        }
    };

    const handleUpdateProfile = async () => {
        if (!firstName.trim() || !lastName.trim() || !email.trim()) {
            Alert.alert("Error", "Please fill in all mandatory fields (Name, Surname, Email).");
            return;
        }

        setLoading(true);

        try {
            // 1. Update Profile Info
            const profileRes = await fetch(`${API_BASE_URL}/api/users/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user?.token}`
                },
                body: JSON.stringify({
                    name: firstName,
                    surname: lastName,
                    email: email
                }),
            });

            if (!profileRes.ok) throw new Error("Profile update failed");

            // 2. Handle Password Change (if current password is provided)
            if (currentPassword) {
                if (newPassword !== confirmPassword) {
                    Alert.alert("Error", "New passwords do not match.");
                    setLoading(false);
                    return;
                }
                if (newPassword.length < 6) {
                    Alert.alert("Error", "New password must be at least 6 characters.");
                    setLoading(false);
                    return;
                }

                const passRes = await fetch(`${API_BASE_URL}/api/users/change-password`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${user?.token}`
                    },
                    body: JSON.stringify({
                        currentPassword,
                        newPassword
                    }),
                });

                if (!passRes.ok) {
                    const errData = await passRes.json();
                    throw new Error(errData.message || "Password change failed");
                }
            }

            // Success: Update Context
            await updateUser({
                firstName,
                lastName,
                email,
                profileImage: profileImage || undefined
            });

            Alert.alert("Success", "Profile updated successfully!");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");

        } catch (e: any) {
            Alert.alert("Update Failed", e.message || "An error occurred while updating your profile.");
        } finally {
            setLoading(false);
        }
    };

    const getInitials = () => {
        const f = firstName.charAt(0) || user?.email.charAt(0) || "?";
        const l = lastName.charAt(0) || "";
        return (f + l).toUpperCase();
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={[styles.container, { backgroundColor: bgColor }]}
        >
            <Stack.Screen options={{ title: 'Edit Profile' }} />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tintColor} />
                }
            >

                {/* Profile Avatar Section */}
                <View style={styles.avatarContainer}>
                    <TouchableOpacity onPress={pickImage} activeOpacity={0.8}>
                        {profileImage ? (
                            <Image source={{ uri: profileImage }} style={styles.avatar} />
                        ) : (
                            <View style={[styles.avatar, { backgroundColor: tintColor }]}>
                                <Text style={styles.avatarText}>{getInitials()}</Text>
                            </View>
                        )}
                        <View style={[styles.changePhotoBtn, { backgroundColor: cardBg }]}>
                            <IconSymbol name="camera.fill" size={16} color={tintColor} />
                        </View>
                    </TouchableOpacity>
                    <Text style={[styles.emailHint, { color: subTextColor }]}>Manage your account details</Text>
                </View>

                <View style={[styles.card, { backgroundColor: cardBg }]}>
                    <Text style={[styles.sectionTitle, { color: tintColor }]}>Personal Info</Text>

                    <View style={styles.row}>
                        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                            <Text style={[styles.label, { color: subTextColor }]}>Name</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: inputBg, borderColor: inputBorder, color: textColor }]}
                                value={firstName}
                                onChangeText={setFirstName}
                                placeholder="Name"
                                placeholderTextColor={subTextColor}
                            />
                        </View>

                        <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                            <Text style={[styles.label, { color: subTextColor }]}>Surname</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: inputBg, borderColor: inputBorder, color: textColor }]}
                                value={lastName}
                                onChangeText={setLastName}
                                placeholder="Surname"
                                placeholderTextColor={subTextColor}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: subTextColor }]}>Email Address</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: inputBg, borderColor: inputBorder, color: textColor }]}
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            placeholder="Email"
                            placeholderTextColor={subTextColor}
                        />
                    </View>
                </View>

                <View style={[styles.card, { backgroundColor: cardBg, marginTop: 20 }]}>
                    <Text style={[styles.sectionTitle, { color: tintColor }]}>Change Password</Text>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: subTextColor }]}>Current Password</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: inputBg, borderColor: inputBorder, color: textColor }]}
                            value={currentPassword}
                            onChangeText={setCurrentPassword}
                            secureTextEntry
                            placeholder="••••••••"
                            placeholderTextColor={subTextColor}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: subTextColor }]}>New Password</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: inputBg, borderColor: inputBorder, color: textColor }]}
                            value={newPassword}
                            onChangeText={setNewPassword}
                            secureTextEntry
                            placeholder="Minimum 6 characters"
                            placeholderTextColor={subTextColor}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: subTextColor }]}>Confirm New Password</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: inputBg, borderColor: inputBorder, color: textColor }]}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry
                            placeholder="Repeat new password"
                            placeholderTextColor={subTextColor}
                        />
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.button, { backgroundColor: tintColor, opacity: loading ? 0.7 : 1 }]}
                    onPress={handleUpdateProfile}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Save Changes</Text>
                    )}
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        alignItems: 'center',
        marginBottom: 24,
        position: 'relative',
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5,
    },
    avatarText: {
        color: '#fff',
        fontSize: 40,
        fontWeight: 'bold',
    },
    changePhotoBtn: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        padding: 10,
        borderRadius: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    emailHint: {
        marginTop: 10,
        fontSize: 14,
        fontWeight: '500',
    },
    card: {
        padding: 20,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    subtitle: {
        fontSize: 14,
        marginBottom: 16,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        marginBottom: 6,
        fontWeight: '500',
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
    },
    button: {
        marginTop: 24,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
