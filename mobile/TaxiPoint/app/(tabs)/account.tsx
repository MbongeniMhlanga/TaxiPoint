import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function AccountScreen() {
    const router = useRouter();
    const { isAdmin, user, logout } = useAuth();
    const colorScheme = useColorScheme();
    const theme = colorScheme ?? 'light';
    const themeColors = Colors[theme];
    const isDark = theme === 'dark';

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

    const handleLogout = () => {
        logout();
        router.replace('/(tabs)');
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.header}>
                    <View style={styles.headerInfo}>
                        <View>
                            <Text style={[styles.headerTitle, { color: themeColors.text }]}>Profile</Text>
                            {user && (
                                <Text style={[styles.headerSubtitle, { color: themeColors.textSecondary }]}>{user.email}</Text>
                            )}
                        </View>
                        <TouchableOpacity onPress={() => router.push('/account/profile')}>
                            {user?.profileImage ? (
                                <Image source={{ uri: user.profileImage }} style={styles.headerAvatar} />
                            ) : (
                                <View style={[styles.headerAvatar, { backgroundColor: themeColors.tint }]}>
                                    <Text style={styles.avatarInitial}>
                                        {(user?.firstName?.charAt(0) || user?.email.charAt(0) || '?').toUpperCase()}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                {isAdmin && (
                    <>
                        <Text style={[styles.sectionHeaderTitle, { color: themeColors.textSecondary }]}>ADMINISTRATION</Text>
                        <View style={[styles.section, { backgroundColor: themeColors.surface }]}>
                            <TouchableOpacity
                                style={[styles.item, styles.lastItem]}
                                onPress={() => router.push('/admin/dashboard')}
                            >
                                <View style={styles.itemLeft}>
                                    <IconSymbol size={24} name="shield.fill" color={themeColors.tint} style={styles.icon} />
                                    <Text style={[styles.itemTitle, { color: themeColors.text }]}>Management</Text>
                                </View>
                                <IconSymbol size={20} name="chevron.right" color={themeColors.icon} />
                            </TouchableOpacity>
                        </View>
                    </>
                )}

                <Text style={[styles.sectionHeaderTitle, { color: themeColors.textSecondary }]}>SETTING</Text>
                <View style={[styles.section, { backgroundColor: themeColors.surface }]}>
                    {menuItems.map((item, index) => (
                        <TouchableOpacity
                            key={item.title}
                            style={[
                                styles.item,
                                { borderBottomColor: themeColors.border },
                                index === menuItems.length - 1 && styles.lastItem,
                            ]}
                            onPress={() => router.push(item.route as any)}
                        >
                            <View style={styles.itemLeft}>
                                <IconSymbol size={24} name={item.icon} color={themeColors.tint} style={styles.icon} />
                                <Text style={[styles.itemTitle, { color: themeColors.text }]}>{item.title}</Text>
                            </View>
                            <IconSymbol size={20} name="chevron.right" color={themeColors.icon} />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Example Logout Button - Optional but good for Account page */}
                <TouchableOpacity
                    style={[styles.logoutButton, { borderColor: themeColors.tint }]}
                    onPress={handleLogout}
                >
                    <Text style={[styles.logoutText, { color: themeColors.tint }]}>Log Out</Text>
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
    headerInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerAvatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitial: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
    },
    headerSubtitle: {
        fontSize: 16,
        marginTop: 5,
        opacity: 0.7,
    },
    sectionHeaderTitle: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 8,
        marginLeft: 4,
        textTransform: 'uppercase',
        letterSpacing: 1,
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
