import { Colors } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

export default function SettingsScreen() {
    const { theme, setTheme, colorScheme } = useTheme();
    const currentTheme = colorScheme ?? 'light';
    const colors = Colors[currentTheme];
    const isDark = currentTheme === 'dark';

    const [notifications, setNotifications] = useState(true);
    const [loading, setLoading] = useState(false);

    // Use colors from centralized theme
    const bgColor = colors.background;
    const cardBg = colors.surface;
    const textColor = colors.text;
    const sectionBg = colors.secondaryBackground;
    const borderColor = colors.border;
    const tintColor = colors.tint;

    const toggleTheme = (value: boolean) => {
        setTheme(value ? 'dark' : 'light');
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            // Simulate API
            await new Promise(resolve => setTimeout(resolve, 1000));
            Alert.alert("Success", "Settings saved successfully!");
        } catch (e) {
            Alert.alert("Error", "Failed to save settings");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: bgColor }]}>
            <Stack.Screen options={{ title: 'Settings' }} />

            <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
                <Text style={[styles.title, { color: tintColor }]}>User Settings</Text>

                {/* Notifications */}
                <View style={[styles.optionRow, { backgroundColor: sectionBg, borderColor }]}>
                    <Text style={[styles.optionLabel, { color: textColor }]}>Enable Notifications</Text>
                    <Switch
                        value={notifications}
                        onValueChange={setNotifications}
                        trackColor={{ false: '#767577', true: tintColor }}
                        thumbColor={'#fff'}
                    />
                </View>

                {/* Dark Mode */}
                <View style={[styles.optionRow, { backgroundColor: sectionBg, borderColor }]}>
                    <Text style={[styles.optionLabel, { color: textColor }]}>Dark Mode</Text>
                    <Switch
                        value={isDark}
                        onValueChange={toggleTheme}
                        trackColor={{ false: '#767577', true: tintColor }}
                        thumbColor={'#fff'}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.button, { backgroundColor: tintColor, opacity: loading ? 0.7 : 1 }]}
                    onPress={handleSave}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Save Settings</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    card: {
        padding: 24,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 24,
    },
    optionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderRadius: 8,
        marginBottom: 16,
        borderWidth: 1,
    },
    optionLabel: {
        fontSize: 16,
        fontWeight: '500',
    },
    button: {
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 8,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
