import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRouter } from 'expo-router';
import React from 'react';
import { Platform, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function AccountScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const isDark = colorScheme === 'dark';

    const menuItems = [
        {
            title: 'Profile',
            icon: 'person.circle.fill' as const,
            route: '/account/profile',
        },
        {
            title: 'About',
            icon: 'info.circle.fill' as const,
            route: '/account/about',
        },
        {
            title: 'Settings',
            icon: 'gearshape.fill' as const,
            route: '/account/settings',
        },
        {
            title: 'Support',
            icon: 'questionmark.circle.fill' as const,
            route: '/account/support',
        },
    ];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.header}>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>Account</Text>
                </View>

                <View style={[styles.section, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
                    {menuItems.map((item, index) => (
                        <TouchableOpacity
                            key={item.title}
                            style={[
                                styles.item,
                                { borderBottomColor: isDark ? '#38383A' : '#E5E5EA' },
                                index === menuItems.length - 1 && styles.lastItem,
                            ]}
                            onPress={() => router.push(item.route as any)}
                        >
                            <View style={styles.itemLeft}>
                                <IconSymbol size={24} name={item.icon} color={theme.tint} style={styles.icon} />
                                <Text style={[styles.itemTitle, { color: theme.text }]}>{item.title}</Text>
                            </View>
                            <IconSymbol size={20} name="chevron.right" color={theme.icon} />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Example Logout Button - Optional but good for Account page */}
                <TouchableOpacity style={[styles.logoutButton, { borderColor: theme.tint }]}>
                    <Text style={[styles.logoutText, { color: theme.tint }]}>Log Out</Text>
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 20,
    },
    header: {
        marginBottom: 30,
        marginTop: Platform.OS === 'ios' ? 0 : 20,
    },
    headerTitle: {
        fontSize: 34,
        fontWeight: 'bold',
    },
    section: {
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 24,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
    },
    lastItem: {
        borderBottomWidth: 0,
    },
    itemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    icon: {
        marginRight: 12,
    },
    itemTitle: {
        fontSize: 17,
        fontWeight: '500',
    },
    logoutButton: {
        marginTop: 20,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
    },
    logoutText: {
        fontSize: 17,
        fontWeight: '600',
    },
});
