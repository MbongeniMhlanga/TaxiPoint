import { ThemedText } from '@/components/themed-text';
import { API_BASE_URL } from '@/config';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Feather } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface TaxiRank {
    id: string;
    name: string;
    description: string;
    address: string;
    latitude: number;
    longitude: number;
    district: string;
    routesServed: string[];
    hours: Record<string, string>;
    phone: string;
    facilities: Record<string, any>;
}

interface TaxiRankForm {
    name: string;
    description: string;
    address: string;
    latitude: string;
    longitude: string;
    district: string;
    routesServed: string;
    hours: string;
    phone: string;
    facilities: string;
}

export default function AdminDashboard() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { user, logout: logoutFromContext } = useAuth();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const theme = colorScheme ?? 'light';
    const colors = Colors[theme];

    // User info from context or params (fallback)
    const [token] = useState<string>(user?.token || (params.token as string) || '');
    const [userEmail] = useState<string>(user?.email || (params.email as string) || 'Admin');

    // State
    const [taxiRanks, setTaxiRanks] = useState<TaxiRank[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [totalUsers, setTotalUsers] = useState(0);
    const [activeIncidents, setActiveIncidents] = useState(0);
    const [userStats, setUserStats] = useState({ users: 0, admins: 0, total: 0 });
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [showFormModal, setShowFormModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentRankId, setCurrentRankId] = useState<string | null>(null);
    const [formLoading, setFormLoading] = useState(false);
    const [form, setForm] = useState<TaxiRankForm>({
        name: '',
        description: '',
        address: '',
        latitude: '0',
        longitude: '0',
        district: '',
        routesServed: '',
        hours: '{}',
        phone: '',
        facilities: '{}',
    });

    const fetchTaxiRanks = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/taxi-ranks?page=0&size=1000`);
            const data = await res.json();
            setTaxiRanks(data.content || []);
        } catch (err) {
            console.error('Fetch ranks error:', err);
        }
    };

    const fetchStatistics = async () => {
        if (!token) return;
        try {
            const headers = { Authorization: `Bearer ${token}` };

            const [usersRes, incidentsRes, statsRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/stats/users/count`, { headers }),
                fetch(`${API_BASE_URL}/api/stats/incidents/active`, { headers }),
                fetch(`${API_BASE_URL}/api/stats/users/distribution`, { headers })
            ]);

            if (usersRes.ok) setTotalUsers(await usersRes.json());
            if (incidentsRes.ok) setActiveIncidents(await incidentsRes.json());
            if (statsRes.ok) setUserStats(await statsRes.json());
        } catch (err) {
            console.error('Fetch stats error:', err);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await Promise.all([fetchTaxiRanks(), fetchStatistics()]);
        setRefreshing(false);
    };

    const initialize = async () => {
        setLoading(true);
        await Promise.all([fetchTaxiRanks(), fetchStatistics()]);
        setLoading(false);
    };

    useEffect(() => {
        initialize();
    }, []);

    const handleLogout = () => {
        Alert.alert('Logout', 'Are you sure you want to logout?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Logout',
                style: 'destructive',
                onPress: () => {
                    logoutFromContext();
                    router.replace('/');
                }
            }
        ]);
    };

    const handleEdit = (rank: TaxiRank) => {
        setIsEditing(true);
        setCurrentRankId(rank.id);
        setForm({
            name: rank.name,
            description: rank.description || '',
            address: rank.address,
            latitude: String(rank.latitude),
            longitude: String(rank.longitude),
            district: rank.district,
            routesServed: Array.isArray(rank.routesServed) ? rank.routesServed.join(', ') : '',
            hours: JSON.stringify(rank.hours || {}),
            phone: rank.phone || '',
            facilities: JSON.stringify(rank.facilities || {}),
        });
        setShowFormModal(true);
    };

    const handleDelete = (id: string) => {
        Alert.alert('Delete Rank', 'Are you sure you want to delete this taxi rank?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        const res = await fetch(`${API_BASE_URL}/api/taxi-ranks/${id}`, {
                            method: 'DELETE',
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        if (res.ok) {
                            setTaxiRanks(prev => prev.filter(r => r.id !== id));
                            Alert.alert('Success', 'Taxi rank deleted successfully');
                        } else {
                            throw new Error('Failed to delete');
                        }
                    } catch (err) {
                        Alert.alert('Error', 'Failed to delete rank');
                    }
                }
            }
        ]);
    };

    const handleSubmit = async () => {
        setFormLoading(true);
        try {
            const payload = {
                name: form.name,
                description: form.description,
                address: form.address,
                latitude: Number(form.latitude),
                longitude: Number(form.longitude),
                district: form.district,
                routesServed: form.routesServed.split(',').map(r => r.trim()).filter(r => r),
                hours: JSON.parse(form.hours),
                facilities: JSON.parse(form.facilities),
                phone: form.phone,
            };

            const url = isEditing
                ? `${API_BASE_URL}/api/taxi-ranks/${currentRankId}`
                : `${API_BASE_URL}/api/taxi-ranks`;

            const method = isEditing ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error('Failed to save');

            Alert.alert('Success', `Taxi rank ${isEditing ? 'updated' : 'added'} successfully`);
            setShowFormModal(false);
            fetchTaxiRanks();
        } catch (err) {
            Alert.alert('Error', 'Failed to save taxi rank. Check JSON fields formatting.');
        } finally {
            setFormLoading(false);
        }
    };

    const filteredRanks = taxiRanks.filter(rank =>
        rank.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rank.district.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Statistics Calculation
    const districtData = taxiRanks.reduce((acc: any, rank) => {
        const district = rank.district || 'Unknown';
        acc[district] = (acc[district] || 0) + 1;
        return acc;
    }, {});

    const chartData = Object.keys(districtData).map((key) => ({
        name: key,
        count: districtData[key],
    })).sort((a, b) => b.count - a.count).slice(0, 5);

    const maxCount = Math.max(...chartData.map(d => d.count), 1);

    const StatCard = ({ title, value, icon, color, subText, subTextColor }: any) => (
        <View style={[styles.statCard, { backgroundColor: colors.secondaryBackground, borderColor: colors.border }]}>
            <View style={styles.statHeader}>
                <View>
                    <ThemedText style={styles.statTitle}>{title}</ThemedText>
                    <ThemedText style={styles.statValue}>{value}</ThemedText>
                </View>
                <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
                    <Feather name={icon} size={20} color={color} />
                </View>
            </View>
            <ThemedText style={[styles.statSubText, { color: subTextColor || colors.textSecondary }]}>{subText}</ThemedText>
        </View>
    );

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color={colors.tint} />
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <View>
                    <ThemedText type="title" style={styles.headerTitle}>Management Console</ThemedText>
                    <ThemedText style={{ color: colors.textSecondary }}>Welcome, {userEmail}</ThemedText>
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity
                        onPress={() => router.push('/(tabs)/explore')}
                        style={[styles.headerButton, { backgroundColor: colors.secondaryBackground }]}
                    >
                        <Feather name="map" size={20} color={colors.tint} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={handleLogout}
                        style={[styles.headerButton, { backgroundColor: colors.secondaryBackground }]}
                    >
                        <Feather name="log-out" size={20} color={colors.error} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />
                }
            >
                {/* Bento Stats */}
                <View style={styles.statsGrid}>
                    <StatCard
                        title="Total Taxi Ranks"
                        value={taxiRanks.length}
                        icon="map"
                        color="#3B82F6"
                        subText="+2.5% from last month"
                        subTextColor="#10B981"
                    />
                    <StatCard
                        title="Active Districts"
                        value={Object.keys(districtData).length}
                        icon="filter"
                        color="#8B5CF6"
                        subText="Coverage across city"
                    />
                    <StatCard
                        title="Total Users"
                        value={totalUsers.toLocaleString()}
                        icon="users"
                        color="#10B981"
                        subText="Registered users"
                    />
                    <StatCard
                        title="Active Incidents"
                        value={activeIncidents}
                        icon="alert-triangle"
                        color="#EF4444"
                        subText="Unresolved"
                        subTextColor="#EF4444"
                    />
                </View>

                {/* Charts Section */}
                <View style={[styles.card, { backgroundColor: colors.secondaryBackground, borderColor: colors.border }]}>
                    <ThemedText style={styles.cardTitle}>Ranks per District</ThemedText>
                    <View style={styles.chartContainer}>
                        {chartData.map((item, index) => (
                            <View key={index} style={styles.chartRow}>
                                <ThemedText style={styles.chartLabel} numberOfLines={1}>{item.name}</ThemedText>
                                <View style={styles.barContainer}>
                                    <View style={[styles.bar, { width: `${(item.count / maxCount) * 100}%`, backgroundColor: colors.tint }]} />
                                </View>
                                <ThemedText style={styles.chartValue}>{item.count}</ThemedText>
                            </View>
                        ))}
                    </View>
                </View>

                {/* User Distribution Card */}
                <View style={[styles.card, { backgroundColor: colors.secondaryBackground, borderColor: colors.border }]}>
                    <ThemedText style={styles.cardTitle}>User Distribution</ThemedText>
                    <View style={styles.distributionContainer}>
                        <View style={styles.distributionRow}>
                            <View style={[styles.dot, { backgroundColor: '#3B82F6' }]} />
                            <ThemedText style={{ flex: 1 }}>Users</ThemedText>
                            <ThemedText type="defaultSemiBold">{userStats.users}</ThemedText>
                        </View>
                        <View style={styles.distributionRow}>
                            <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
                            <ThemedText style={{ flex: 1 }}>Admins</ThemedText>
                            <ThemedText type="defaultSemiBold">{userStats.admins}</ThemedText>
                        </View>
                        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                            <View style={[styles.progressFill, { width: `${(userStats.users / userStats.total) * 100}%`, backgroundColor: '#3B82F6' }]} />
                            <View style={[styles.progressFill, { width: `${(userStats.admins / userStats.total) * 100}%`, backgroundColor: '#10B981' }]} />
                        </View>
                    </View>
                </View>

                {/* Management Header */}
                <View style={styles.sectionHeader}>
                    <ThemedText type="subtitle">Rank Management</ThemedText>
                    <TouchableOpacity
                        style={[styles.addButton, { backgroundColor: colors.tint }]}
                        onPress={() => {
                            setIsEditing(false);
                            setForm({
                                name: '',
                                description: '',
                                address: '',
                                latitude: '0',
                                longitude: '0',
                                district: '',
                                routesServed: '',
                                hours: '{}',
                                phone: '',
                                facilities: '{}',
                            });
                            setShowFormModal(true);
                        }}
                    >
                        <Feather name="plus" size={20} color="#fff" />
                        <ThemedText style={styles.addButtonText}>Add Rank</ThemedText>
                    </TouchableOpacity>
                </View>

                {/* Search */}
                <View style={[styles.searchBar, { backgroundColor: colors.secondaryBackground, borderColor: colors.border }]}>
                    <Feather name="search" size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
                    <TextInput
                        placeholder="Search ranks..."
                        placeholderTextColor={colors.textSecondary}
                        value={searchTerm}
                        onChangeText={setSearchTerm}
                        style={[styles.searchInput, { color: colors.text }]}
                    />
                </View>

                {/* Rank List */}
                {filteredRanks.map((rank) => (
                    <View key={rank.id} style={[styles.rankItem, { backgroundColor: colors.secondaryBackground, borderColor: colors.border }]}>
                        <View style={{ flex: 1 }}>
                            <ThemedText type="defaultSemiBold">{rank.name}</ThemedText>
                            <ThemedText style={styles.rankMeta}>{rank.district} • {Array.isArray(rank.routesServed) ? rank.routesServed.length : 0} routes</ThemedText>
                            <ThemedText style={[styles.rankAddress, { color: colors.textSecondary }]} numberOfLines={1}>{rank.address}</ThemedText>
                        </View>
                        <View style={styles.actionButtons}>
                            <TouchableOpacity onPress={() => handleEdit(rank)} style={styles.actionButton}>
                                <Feather name="edit-3" size={18} color={colors.tint} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleDelete(rank.id)} style={styles.actionButton}>
                                <Feather name="trash-2" size={18} color={colors.error} />
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Form Modal */}
            <Modal visible={showFormModal} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, justifyContent: 'flex-end' }}>
                        <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                                <ThemedText type="subtitle">{isEditing ? 'Edit Taxi Rank' : 'Add New Rank'}</ThemedText>
                                <TouchableOpacity onPress={() => setShowFormModal(false)}>
                                    <Feather name="x" size={24} color={colors.text} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
                                <View style={styles.inputGroup}>
                                    <ThemedText style={styles.label}>Name</ThemedText>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: colors.secondaryBackground, borderColor: colors.border, color: colors.text }]}
                                        value={form.name}
                                        onChangeText={(val) => setForm(f => ({ ...f, name: val }))}
                                        placeholder="Enter rank name"
                                        placeholderTextColor={colors.textSecondary}
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <ThemedText style={styles.label}>District</ThemedText>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: colors.secondaryBackground, borderColor: colors.border, color: colors.text }]}
                                        value={form.district}
                                        onChangeText={(val) => setForm(f => ({ ...f, district: val }))}
                                        placeholder="e.g. Pretoria Central"
                                        placeholderTextColor={colors.textSecondary}
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <ThemedText style={styles.label}>Address</ThemedText>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: colors.secondaryBackground, borderColor: colors.border, color: colors.text }]}
                                        value={form.address}
                                        onChangeText={(val) => setForm(f => ({ ...f, address: val }))}
                                        placeholder="Full street address"
                                        placeholderTextColor={colors.textSecondary}
                                    />
                                </View>

                                <View style={[styles.row, { gap: 12 }]}>
                                    <View style={[styles.inputGroup, { flex: 1 }]}>
                                        <ThemedText style={styles.label}>Latitude</ThemedText>
                                        <TextInput
                                            style={[styles.input, { backgroundColor: colors.secondaryBackground, borderColor: colors.border, color: colors.text }]}
                                            value={form.latitude}
                                            onChangeText={(val) => setForm(f => ({ ...f, latitude: val }))}
                                            keyboardType="numeric"
                                        />
                                    </View>
                                    <View style={[styles.inputGroup, { flex: 1 }]}>
                                        <ThemedText style={styles.label}>Longitude</ThemedText>
                                        <TextInput
                                            style={[styles.input, { backgroundColor: colors.secondaryBackground, borderColor: colors.border, color: colors.text }]}
                                            value={form.longitude}
                                            onChangeText={(val) => setForm(f => ({ ...f, longitude: val }))}
                                            keyboardType="numeric"
                                        />
                                    </View>
                                </View>

                                <View style={styles.inputGroup}>
                                    <ThemedText style={styles.label}>Routes (comma separated)</ThemedText>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: colors.secondaryBackground, borderColor: colors.border, color: colors.text }]}
                                        value={form.routesServed}
                                        onChangeText={(val) => setForm(f => ({ ...f, routesServed: val }))}
                                        placeholder="M1, M2, M3"
                                        placeholderTextColor={colors.textSecondary}
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <ThemedText style={styles.label}>Hours (JSON)</ThemedText>
                                    <TextInput
                                        style={[styles.input, styles.monoInput, { backgroundColor: colors.secondaryBackground, borderColor: colors.border, color: colors.text }]}
                                        value={form.hours}
                                        onChangeText={(val) => setForm(f => ({ ...f, hours: val }))}
                                        multiline
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <ThemedText style={styles.label}>Facilities (JSON)</ThemedText>
                                    <TextInput
                                        style={[styles.input, styles.monoInput, { backgroundColor: colors.secondaryBackground, borderColor: colors.border, color: colors.text }]}
                                        value={form.facilities}
                                        onChangeText={(val) => setForm(f => ({ ...f, facilities: val }))}
                                        multiline
                                    />
                                </View>

                                <TouchableOpacity
                                    style={[styles.submitButton, { backgroundColor: colors.tint, opacity: formLoading ? 0.7 : 1 }]}
                                    onPress={handleSubmit}
                                    disabled={formLoading}
                                >
                                    {formLoading ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.submitButtonText}>{isEditing ? 'Save Changes' : 'Create Rank'}</ThemedText>}
                                </TouchableOpacity>
                                <View style={{ height: 40 }} />
                            </ScrollView>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    headerActions: {
        flexDirection: 'row',
        gap: 8,
    },
    headerButton: {
        padding: 10,
        borderRadius: 12,
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollContent: {
        padding: 20,
        gap: 20,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    statCard: {
        width: '48%',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        gap: 12,
    },
    statHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    statTitle: {
        fontSize: 12,
        fontWeight: '500',
        opacity: 0.7,
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 4,
    },
    statIconContainer: {
        padding: 8,
        borderRadius: 10,
    },
    statSubText: {
        fontSize: 10,
        fontWeight: '600',
    },
    card: {
        padding: 20,
        borderRadius: 20,
        borderWidth: 1,
        gap: 16,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    chartContainer: {
        gap: 12,
    },
    chartRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    chartLabel: {
        width: 80,
        fontSize: 12,
    },
    barContainer: {
        flex: 1,
        height: 8,
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 4,
        overflow: 'hidden',
    },
    bar: {
        height: '100%',
        borderRadius: 4,
    },
    chartValue: {
        width: 20,
        fontSize: 12,
        fontWeight: 'bold',
        textAlign: 'right',
    },
    distributionContainer: {
        gap: 12,
    },
    distributionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    progressBar: {
        height: 12,
        borderRadius: 6,
        flexDirection: 'row',
        overflow: 'hidden',
        marginTop: 4,
    },
    progressFill: {
        height: '100%',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        gap: 6,
    },
    addButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
    },
    rankItem: {
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    rankMeta: {
        fontSize: 12,
        opacity: 0.6,
        marginVertical: 4,
    },
    rankAddress: {
        fontSize: 12,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        padding: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        height: '90%',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        overflow: 'hidden',
    },
    modalHeader: {
        padding: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
    },
    formScroll: {
        padding: 24,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        opacity: 0.8,
    },
    input: {
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        fontSize: 16,
    },
    monoInput: {
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: 12,
        minHeight: 80,
        textAlignVertical: 'top',
    },
    row: {
        flexDirection: 'row',
    },
    submitButton: {
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 12,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    }
});
