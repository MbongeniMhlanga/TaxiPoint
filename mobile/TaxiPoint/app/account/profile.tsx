import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ProfileScreen() {
    const { user, updateUser } = useAuth();
    const colorScheme = useColorScheme();
    const theme = colorScheme ?? 'light';
    const colors = Colors[theme];
    const router = useRouter();

    const [firstName, setFirstName] = useState(user?.firstName || "");
    const [lastName, setLastName] = useState(user?.lastName || "");
    const [profileImage, setProfileImage] = useState(user?.profileImage || null);

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
            // Auto-save the image
            await updateUser({ profileImage: uri });
        }
    };

    const handleUpdateProfile = async () => {
        if (!firstName.trim() || !lastName.trim()) {
            Alert.alert("Error", "First Name and Last Name cannot be empty.");
            return;
        }

        setLoading(true);

        try {
            // In a real app, you would send this to your backend
            // For now, we update the local persistent context
            await updateUser({
                firstName,
                lastName,
                profileImage: profileImage || undefined
            });

            Alert.alert("Success", "Profile updated successfully!");
        } catch (e: any) {
            Alert.alert("Update Failed", "An error occurred while updating your profile.");
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
            <Stack.Screen options={{ title: 'Your Profile' }} />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

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
                            <IconSymbol name="gearshape.fill" size={16} color={tintColor} />
                        </View>
                    </TouchableOpacity>
                    <Text style={[styles.emailHint, { color: subTextColor }]}>{user?.email}</Text>
                </View>

                <View style={[styles.card, { backgroundColor: cardBg }]}>
                    <Text style={[styles.sectionTitle, { color: tintColor }]}>Personal Details</Text>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: subTextColor }]}>First Name</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: inputBg, borderColor: inputBorder, color: textColor }]}
                            value={firstName}
                            onChangeText={setFirstName}
                            placeholder="Enter first name"
                            placeholderTextColor={subTextColor}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: subTextColor }]}>Surname</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: inputBg, borderColor: inputBorder, color: textColor }]}
                            value={lastName}
                            onChangeText={setLastName}
                            placeholder="Enter surname"
                            placeholderTextColor={subTextColor}
                        />
                    </View>
                </View>

                {/* Security Section (Placeholder for UI consistency) */}
                <View style={[styles.card, { backgroundColor: cardBg, marginTop: 20 }]}>
                    <Text style={[styles.sectionTitle, { color: tintColor }]}>Security</Text>
                    <Text style={[styles.subtitle, { color: subTextColor }]}>
                        Password change features will be available in the next update.
                    </Text>
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
