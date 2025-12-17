import { Stack } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';

export default function SupportScreen() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const bgColor = isDark ? '#111827' : '#F9FAFB'; // gray-900 : gray-50
    const cardBg = isDark ? '#1F2937' : '#FFFFFF';
    const textColor = isDark ? '#FFFFFF' : '#111827';
    const subTextColor = isDark ? '#D1D5DB' : '#4B5563';
    const inputBg = isDark ? '#111827' : '#F9FAFB';
    const inputBorder = isDark ? '#374151' : '#D1D5DB';

    const handleSubmit = async () => {
        if (!name || !email || !message) {
            Alert.alert("Error", "Please fill in all fields.");
            return;
        }

        setLoading(true);
        try {
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1500));
            Alert.alert("Success", "Your message has been sent! We'll get back to you soon.");
            setName("");
            setEmail("");
            setMessage("");
        } catch (err) {
            Alert.alert("Error", "Failed to send message. Try again later.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={[styles.container, { backgroundColor: bgColor }]}
        >
            <Stack.Screen options={{ title: 'Support' }} />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={[styles.card, { backgroundColor: cardBg }]}>
                    <Text style={[styles.title, { color: isDark ? '#60A5FA' : '#2563EB' }]}>Support</Text>
                    <Text style={[styles.description, { color: subTextColor }]}>
                        Having issues? Fill out the form below and our support team will reach out to you.
                    </Text>

                    <View style={styles.form}>
                        <TextInput
                            style={[styles.input, { backgroundColor: inputBg, borderColor: inputBorder, color: textColor }]}
                            placeholder="Your Name"
                            placeholderTextColor={subTextColor}
                            value={name}
                            onChangeText={setName}
                        />

                        <TextInput
                            style={[styles.input, { backgroundColor: inputBg, borderColor: inputBorder, color: textColor }]}
                            placeholder="Your Email"
                            placeholderTextColor={subTextColor}
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />

                        <TextInput
                            style={[
                                styles.input,
                                styles.textArea,
                                { backgroundColor: inputBg, borderColor: inputBorder, color: textColor }
                            ]}
                            placeholder="Your Message"
                            placeholderTextColor={subTextColor}
                            value={message}
                            onChangeText={setMessage}
                            multiline
                            textAlignVertical="top"
                        />

                        <TouchableOpacity
                            style={[styles.button, { opacity: loading ? 0.7 : 1 }]}
                            onPress={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.buttonText}>Send Message</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        padding: 20,
        justifyContent: 'center',
    },
    card: {
        padding: 24,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 3,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    description: {
        fontSize: 16,
        marginBottom: 24,
        lineHeight: 22,
    },
    form: {
        gap: 16,
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 14,
        fontSize: 16,
    },
    textArea: {
        height: 120,
    },
    button: {
        backgroundColor: '#2563EB', // blue-600
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 8,
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
