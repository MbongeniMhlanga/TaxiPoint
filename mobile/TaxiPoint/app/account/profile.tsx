import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ProfileScreen() {
    const { colorScheme } = useTheme();
    const theme = colorScheme ?? 'light';
    const colors = Colors[theme];
    const router = useRouter();

    // Mock initial user data - In a real app, retrieve this from AuthContext
    const [name, setName] = useState("John");
    const [surname, setSurname] = useState("Doe");

    // Password management
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [loading, setLoading] = useState(false);

    const bgColor = colors.background;
    const cardBg = colors.surface;
    const textColor = colors.text;
    const subTextColor = colors.textSecondary;
    const inputBg = colors.secondaryBackground;
    const inputBorder = colors.border;
    const tintColor = colors.tint;

    const handleUpdateProfile = async () => {
        // Basic Validation
        if (!name.trim() || !surname.trim()) {
            Alert.alert("Error", "Name and Surname cannot be empty.");
            return;
        }

        if (newPassword || confirmPassword) {
            if (!currentPassword) {
                Alert.alert("Error", "Please enter your current password to set a new one.");
                return;
            }
            if (newPassword !== confirmPassword) {
                Alert.alert("Error", "New passwords do not match.");
                return;
            }
            if (newPassword.length < 6) {
                Alert.alert("Error", "New password must be at least 6 characters.");
                return;
            }
        }

        setLoading(true);

        try {
            // Simulate API check for current password
            // In reality: await api.updateProfile({ ... })
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Mock check for demonstration
            if (currentPassword && currentPassword !== "password123") {
                throw new Error("Incorrect current password");
            }

            Alert.alert("Success", "Profile updated successfully!");

            // Reset sensitive fields
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");

        } catch (e: any) {
            Alert.alert("Update Failed", e.message || "An error occurred while updating your profile.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={[styles.container, { backgroundColor: bgColor }]}
        >
            <Stack.Screen options={{ title: 'Your Profile' }} />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Profile Avatar Placeholder */}
                <View style={styles.avatarContainer}>
                    <View style={[styles.avatar, { backgroundColor: tintColor }]}>
                        <Text style={styles.avatarText}>{name[0]}{surname[0]}</Text>
                    </View>
                    <TouchableOpacity style={[styles.changePhotoBtn, { backgroundColor: cardBg }]}>
                        <IconSymbol name="gearshape.fill" size={16} color={tintColor} />
                    </TouchableOpacity>
                </View>

                <View style={[styles.card, { backgroundColor: cardBg }]}>
                    <Text style={[styles.sectionTitle, { color: tintColor }]}>Personal Details</Text>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: subTextColor }]}>First Name</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: inputBg, borderColor: inputBorder, color: textColor }]}
                            value={name}
                            onChangeText={setName}
                            placeholder="Enter first name"
                            placeholderTextColor={subTextColor}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: subTextColor }]}>Surname</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: inputBg, borderColor: inputBorder, color: textColor }]}
                            value={surname}
                            onChangeText={setSurname}
                            placeholder="Enter surname"
                            placeholderTextColor={subTextColor}
                        />
                    </View>
                </View>

                <View style={[styles.card, { backgroundColor: cardBg, marginTop: 20 }]}>
                    <Text style={[styles.sectionTitle, { color: tintColor }]}>Security</Text>
                    <Text style={[styles.subtitle, { color: subTextColor }]}>
                        Leave blank if you don't want to change your password.
                    </Text>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: subTextColor }]}>Current Password</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: inputBg, borderColor: inputBorder, color: textColor }]}
                            value={currentPassword}
                            onChangeText={setCurrentPassword}
                            placeholder="Current password"
                            placeholderTextColor={subTextColor}
                            secureTextEntry
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: subTextColor }]}>New Password</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: inputBg, borderColor: inputBorder, color: textColor }]}
                            value={newPassword}
                            onChangeText={setNewPassword}
                            placeholder="New password"
                            placeholderTextColor={subTextColor}
                            secureTextEntry
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: subTextColor }]}>Confirm New Password</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: inputBg, borderColor: inputBorder, color: textColor }]}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            placeholder="Confirm new password"
                            placeholderTextColor={subTextColor}
                            secureTextEntry
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
    avatarContainer: {
        alignItems: 'center',
        marginBottom: 24,
        position: 'relative',
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
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
        fontSize: 36,
        fontWeight: 'bold',
    },
    changePhotoBtn: {
        position: 'absolute',
        bottom: 0,
        right: '35%',
        padding: 8,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
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
