import { ThemedText } from '@/components/themed-text';
import { API_BASE_URL } from '@/config';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Loader } from '@/components/loader';
import { getErrorMessage } from '@/utils/errorMessage';
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
    routeFares?: Record<string, number>;
    currency?: string;
    hours: Record<string, string>;
    phone: string;
    facilities: Record<string, any>;
}

type CorrectionType =
    | 'WRONG_ROUTE_NUMBER'
    | 'MISSING_ROUTE'
    | 'WRONG_FARE'
    | 'RANK_CLOSED'
    | 'MISSING_RANK'
    | 'ROUTE_CHANGE'
    | 'OTHER';

type ReviewDecision = 'APPROVE' | 'REJECT';

interface CorrectionSubmission {
    id: string;
    rankNameSnapshot?: string | null;
    correctionType: CorrectionType;
    description: string;
    status: string;
    confirmationsCount: number;
    rejectionsCount: number;
    autoApproved: boolean;
    submittedByName?: string | null;
    submittedByEmail?: string | null;
    reviewNotes?: string | null;
    createdAt?: string | null;
}

interface TaxiRankForm {
    name: string;
    description: string;
    address: string;
    latitude: string;
    longitude: string;
    district: string;
    routesServed: string;
    currency: string;
    hours: string;
    phone: string;
    facilities: string;
}

export default function AdminDashboard() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { user, logout: logoutFromContext } = useAuth();
    const colorScheme = useColorScheme();
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
    const [pendingCorrections, setPendingCorrections] = useState<CorrectionSubmission[]>([]);
    const [correctionsLoading, setCorrectionsLoading] = useState(true);

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
        currency: 'ZAR',
        hours: '{}',
        phone: '',
        facilities: '{}',
    });
    const [routeFareMap, setRouteFareMap] = useState<Record<string, number>>({});
    const [routeFareDraft, setRouteFareDraft] = useState<{ route: string; fare: string }>({ route: '', fare: '' });
    const [showRoutePicker, setShowRoutePicker] = useState(false);
    const [reviewNotesDrafts, setReviewNotesDrafts] = useState<Record<string, string>>({});

    const fetchTaxiRanks = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/taxi-ranks?page=0&size=1000`);
            if (!res.ok) {
                throw new Error(getErrorMessage(res.status, await res.text(), 'admin'));
            }
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
            else throw new Error(getErrorMessage(usersRes.status, await usersRes.text(), 'admin'));

            if (incidentsRes.ok) setActiveIncidents(await incidentsRes.json());
            else throw new Error(getErrorMessage(incidentsRes.status, await incidentsRes.text(), 'admin'));

            if (statsRes.ok) setUserStats(await statsRes.json());
            else throw new Error(getErrorMessage(statsRes.status, await statsRes.text(), 'admin'));
        } catch (err) {
            console.error('Fetch stats error:', err);
        }
    };

    const routeOptions = Array.from(
        new Set(
            form.routesServed
                .split(',')
                .map((route) => route.trim())
                .filter(Boolean)
        )
    );

    const saveRouteFareDraft = () => {
        const route = routeFareDraft.route.trim();
        const fareValue = routeFareDraft.fare.trim();

        if (!route) {
            Alert.alert('Missing route', 'Please choose a destination or route.');
            return;
        }

        if (!fareValue) {
            Alert.alert('Missing fare', 'Please enter a fare amount.');
            return;
        }

        if (routeOptions.length > 0 && !routeOptions.includes(route)) {
            Alert.alert('Invalid route', 'Please choose a route from the routes you already entered.');
            return;
        }

        const amount = Number(fareValue);
        if (!Number.isFinite(amount)) {
            Alert.alert('Invalid fare', 'Please enter a valid fare amount.');
            return;
        }

        setRouteFareMap((prev) => ({
            ...prev,
            [route]: amount,
        }));
        setRouteFareDraft({ route: '', fare: '' });
    };

    const editRouteFare = (route: string) => {
        const fare = routeFareMap[route];
        setRouteFareDraft({ route, fare: String(fare) });
    };

    const removeRouteFare = (route: string) => {
        setRouteFareMap((prev) => {
            const next = { ...prev };
            delete next[route];
            return next;
        });

        setRouteFareDraft((prev) =>
            prev.route === route ? { route: '', fare: '' } : prev
        );
    };

    const fetchPendingCorrections = async () => {
        if (!token) {
            setPendingCorrections([]);
            setCorrectionsLoading(false);
            return;
        }

        try {
            setCorrectionsLoading(true);
            const res = await fetch(`${API_BASE_URL}/api/submissions/pending`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) {
                throw new Error(getErrorMessage(res.status, await res.text(), 'admin'));
            }

            const data = await res.json();
            setPendingCorrections(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Fetch pending corrections error:', err);
            setPendingCorrections([]);
        } finally {
            setCorrectionsLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await Promise.all([fetchTaxiRanks(), fetchStatistics(), fetchPendingCorrections()]);
        setRefreshing(false);
    };

    const initialize = async () => {
        setLoading(true);
        await Promise.all([fetchTaxiRanks(), fetchStatistics(), fetchPendingCorrections()]);
        setLoading(false);
    };

    useEffect(() => {
        initialize();

        // Real-time WebSockets for Management
        const connections: WebSocket[] = [];

        // 1. Stats Socket
        try {
            const statsWs = new WebSocket('wss://taxipoint-backend.onrender.com/ws/stats');
            statsWs.onmessage = (event) => {
                const update = JSON.parse(event.data);
                if (update.type === 'USER_COUNT') setTotalUsers(update.value);
                if (update.type === 'INCIDENT_COUNT') setActiveIncidents(update.value);
                if (update.type === 'DISTRIBUTION') setUserStats(update.value);
            };
            connections.push(statsWs);
        } catch (e) { console.error('WS Stats error:', e); }

        // 2. Taxi Ranks Socket
        try {
            const rankWs = new WebSocket('wss://taxipoint-backend.onrender.com/ws/ranks');
            rankWs.onmessage = (event) => {
                const rank = JSON.parse(event.data);
                setTaxiRanks((prev) => {
                    const exists = prev.find(r => r.id === rank.id);
                    if (exists) return prev.map(r => r.id === rank.id ? rank : r);
                    return [...prev, rank];
                });
            };
            connections.push(rankWs);
        } catch (e) { console.error('WS Ranks error:', e); }

        return () => {
            connections.forEach(ws => ws.close());
        };
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
            currency: rank.currency || 'ZAR',
            hours: JSON.stringify(rank.hours || {}),
            phone: rank.phone || '',
            facilities: JSON.stringify(rank.facilities || {}),
        });
        setRouteFareMap(rank.routeFares || {});
        setRouteFareDraft({ route: '', fare: '' });
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
                            throw new Error(getErrorMessage(res.status, await res.text(), 'admin'));
                        }
                    } catch (err) {
                        Alert.alert('Delete Failed', err instanceof Error ? err.message : 'Could not delete the taxi rank.');
                    }
                }
            }
        ]);
    };

    const formatCorrectionType = (type: CorrectionType) => {
        const labels: Record<CorrectionType, string> = {
            WRONG_ROUTE_NUMBER: 'Wrong route number',
            MISSING_ROUTE: 'Missing route',
            WRONG_FARE: 'Wrong fare',
            RANK_CLOSED: 'Rank closed',
            MISSING_RANK: 'Missing rank',
            ROUTE_CHANGE: 'Route change',
            OTHER: 'Other',
        };

        return labels[type] ?? type;
    };

    const reviewCorrection = async (submissionId: string, decision: ReviewDecision) => {
        if (!token) {
            Alert.alert('Error', 'Authentication token missing. Log in again.');
            return;
        }

        try {
            const res = await fetch(`${API_BASE_URL}/api/submissions/${submissionId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    decision,
                    reviewNotes: reviewNotesDrafts[submissionId] || '',
                }),
            });

            if (!res.ok) {
                throw new Error(getErrorMessage(res.status, await res.text(), 'admin'));
            }

            Alert.alert('Success', `Correction ${decision === 'APPROVE' ? 'approved' : 'rejected'} successfully.`);
            setReviewNotesDrafts((prev) => {
                const next = { ...prev };
                delete next[submissionId];
                return next;
            });
            await fetchPendingCorrections();
        } catch (err) {
            Alert.alert('Review Failed', err instanceof Error ? err.message : 'Could not update that correction.');
        }
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
                routeFares: routeFareMap,
                currency: form.currency || 'ZAR',
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

            if (!res.ok) throw new Error(getErrorMessage(res.status, await res.text(), 'admin'));

            Alert.alert('Success', `Taxi rank ${isEditing ? 'updated' : 'added'} successfully`);
            setShowFormModal(false);
            setRouteFareMap({});
            setRouteFareDraft({ route: '', fare: '' });
            fetchTaxiRanks();
        } catch (err) {
            Alert.alert('Save Failed', err instanceof Error ? err.message : 'We could not save that taxi rank right now.');
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
                <Loader message="Loading admin dashboard..." />
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

                <View style={[styles.card, { backgroundColor: colors.secondaryBackground, borderColor: colors.border }]}>
                    <View style={styles.sectionHeader}>
                        <ThemedText type="subtitle">Correction Review Queue</ThemedText>
                        <TouchableOpacity
                            onPress={fetchPendingCorrections}
                            style={[styles.addButton, { backgroundColor: colors.tint, paddingVertical: 8, paddingHorizontal: 12 }]}
                        >
                            <Feather name="refresh-cw" size={16} color="#fff" />
                            <ThemedText style={styles.addButtonText}>Refresh</ThemedText>
                        </TouchableOpacity>
                    </View>

                    {correctionsLoading ? (
                        <View style={{ paddingVertical: 16, alignItems: 'center' }}>
                            <ActivityIndicator color={colors.tint} />
                        </View>
                    ) : pendingCorrections.length === 0 ? (
                        <ThemedText style={{ color: colors.textSecondary, marginTop: 6 }}>
                            No pending corrections right now.
                        </ThemedText>
                    ) : (
                        <View style={{ gap: 12, marginTop: 6 }}>
                            {pendingCorrections.map((submission) => (
                                <View key={submission.id} style={[styles.correctionCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                                    <View style={styles.correctionTopRow}>
                                        <View style={{ flex: 1 }}>
                                            <ThemedText style={{ color: colors.text, fontSize: 16, fontWeight: '800' }} numberOfLines={1}>
                                                {submission.rankNameSnapshot ?? 'Taxi rank'}
                                            </ThemedText>
                                            <ThemedText style={{ color: colors.textSecondary, marginTop: 2 }}>
                                                {formatCorrectionType(submission.correctionType)}
                                            </ThemedText>
                                        </View>
                                        <View style={[styles.statusChip, { backgroundColor: submission.status === 'FLAGGED' ? '#FEF3C7' : '#DBEAFE' }]}>
                                            <ThemedText style={{ color: submission.status === 'FLAGGED' ? '#92400E' : '#1D4ED8', fontSize: 11, fontWeight: '800' }}>
                                                {submission.status}
                                            </ThemedText>
                                        </View>
                                    </View>
                                    <ThemedText style={{ color: colors.text, marginTop: 8, lineHeight: 20 }}>
                                        {submission.description}
                                    </ThemedText>
                                    <ThemedText style={{ color: colors.textSecondary, fontSize: 12 }}>
                                        Submitted by {submission.submittedByName || submission.submittedByEmail || 'Unknown user'}
                                    </ThemedText>
                                    <View style={styles.correctionMetaRow}>
                                        <ThemedText style={{ color: colors.textSecondary, fontSize: 12 }}>{submission.confirmationsCount} confirmations</ThemedText>
                                        <ThemedText style={{ color: colors.textSecondary, fontSize: 12 }}>{submission.rejectionsCount} rejections</ThemedText>
                                        {submission.autoApproved ? <ThemedText style={{ color: colors.textSecondary, fontSize: 12 }}>Auto-approved</ThemedText> : null}
                                    </View>
                                    {submission.reviewNotes ? (
                                        <ThemedText style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }} numberOfLines={2}>
                                            Notes: {submission.reviewNotes}
                                        </ThemedText>
                                    ) : null}
                                    <View style={styles.reviewNoteField}>
                                        <ThemedText style={styles.reviewNoteLabel}>Review notes</ThemedText>
                                        <TextInput
                                            value={reviewNotesDrafts[submission.id] ?? ''}
                                            onChangeText={(value) => setReviewNotesDrafts((prev) => ({ ...prev, [submission.id]: value }))}
                                            placeholder="Add a short note for the record..."
                                            placeholderTextColor={colors.textSecondary}
                                            multiline
                                            textAlignVertical="top"
                                            style={[
                                                styles.reviewNoteInput,
                                                {
                                                    color: colors.text,
                                                    backgroundColor: colors.background,
                                                    borderColor: colors.border,
                                                },
                                            ]}
                                        />
                                    </View>
                                    <View style={styles.correctionActionsRow}>
                                        <TouchableOpacity
                                            style={[styles.correctionActionButton, { backgroundColor: '#DCFCE7' }]}
                                            onPress={() => reviewCorrection(submission.id, 'APPROVE')}
                                        >
                                            <Feather name="check" size={16} color="#166534" />
                                            <ThemedText style={{ color: '#166534', fontWeight: '800' }}>Approve</ThemedText>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.correctionActionButton, { backgroundColor: '#FEE2E2' }]}
                                            onPress={() => reviewCorrection(submission.id, 'REJECT')}
                                        >
                                            <Feather name="x" size={16} color="#991B1B" />
                                            <ThemedText style={{ color: '#991B1B', fontWeight: '800' }}>Reject</ThemedText>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}
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
                                currency: 'ZAR',
                                hours: '{}',
                                phone: '',
                                facilities: '{}',
                            });
                            setRouteFareMap({});
                            setRouteFareDraft({ route: '', fare: '' });
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
                                    <View style={styles.sectionHeader}>
                                        <ThemedText style={styles.label}>Route Fares</ThemedText>
                                        <TouchableOpacity
                                            onPress={saveRouteFareDraft}
                                            style={[styles.addButton, { backgroundColor: colors.tint, paddingVertical: 8, paddingHorizontal: 12 }]}
                                        >
                                            <Feather name="plus" size={16} color="#fff" />
                                            <ThemedText style={styles.addButtonText}>
                                                {routeFareMap[routeFareDraft.route] !== undefined ? 'Update Fare' : 'Add Fare'}
                                            </ThemedText>
                                        </TouchableOpacity>
                                    </View>
                                    <ThemedText style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 10 }}>
                                        Optional. Choose from the routes above and pair each one with a fare, or leave the section empty if you do not have fares yet.
                                    </ThemedText>

                                    {routeOptions.length === 0 ? (
                                        <View style={[styles.emptyFareHint, { borderColor: colors.border, backgroundColor: colors.secondaryBackground }]}>
                                            <ThemedText style={{ color: colors.textSecondary, fontSize: 12 }}>
                                                Enter routes first, then choose one from the dropdown below.
                                            </ThemedText>
                                        </View>
                                    ) : (
                                        <View style={{ gap: 12 }}>
                                            <View style={styles.routeFareDraftRow}>
                                                <TouchableOpacity
                                                    onPress={() => setShowRoutePicker(true)}
                                                    style={[styles.routePickerButton, { backgroundColor: colors.secondaryBackground, borderColor: colors.border }]}
                                                >
                                                    <ThemedText style={{ color: routeFareDraft.route ? colors.text : colors.textSecondary }}>
                                                        {routeFareDraft.route || 'Select destination / route'}
                                                    </ThemedText>
                                                    <Feather name="chevron-down" size={18} color={colors.textSecondary} />
                                                </TouchableOpacity>
                                                <TextInput
                                                    style={[styles.routeFareInput, { backgroundColor: colors.secondaryBackground, borderColor: colors.border, color: colors.text }]}
                                                    value={routeFareDraft.fare}
                                                    onChangeText={(val) => setRouteFareDraft((prev) => ({ ...prev, fare: val }))}
                                                    placeholder="Fare"
                                                    placeholderTextColor={colors.textSecondary}
                                                    keyboardType="numeric"
                                                />
                                            </View>

                                            <View style={[styles.savedFaresBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                                                <View style={styles.sectionHeader}>
                                                    <ThemedText style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '700' }}>Saved fares</ThemedText>
                                                    <ThemedText style={{ color: colors.textSecondary, fontSize: 12 }}>{Object.keys(routeFareMap).length} saved</ThemedText>
                                                </View>

                                                {Object.keys(routeFareMap).length > 0 ? (
                                                    <View style={{ gap: 10 }}>
                                                        {Object.entries(routeFareMap).map(([route, fare]) => (
                                                            <View key={route} style={[styles.savedFareItem, { backgroundColor: colors.secondaryBackground, borderColor: colors.border }]}>
                                                                <View>
                                                                    <ThemedText style={{ color: colors.text, fontWeight: '700' }}>{route}</ThemedText>
                                                                    <ThemedText style={{ color: colors.textSecondary, fontSize: 12 }}>R{Math.round(Number(fare))}</ThemedText>
                                                                </View>
                                                                <View style={styles.savedFareActions}>
                                                                    <TouchableOpacity
                                                                        onPress={() => editRouteFare(route)}
                                                                        style={[styles.savedFareActionButton, { backgroundColor: colors.tint + '20' }]}
                                                                    >
                                                                        <ThemedText style={{ color: colors.tint, fontWeight: '700', fontSize: 12 }}>Edit</ThemedText>
                                                                    </TouchableOpacity>
                                                                    <TouchableOpacity
                                                                        onPress={() => removeRouteFare(route)}
                                                                        style={[styles.savedFareActionButton, { backgroundColor: colors.error + '20' }]}
                                                                    >
                                                                        <ThemedText style={{ color: colors.error, fontWeight: '700', fontSize: 12 }}>Remove</ThemedText>
                                                                    </TouchableOpacity>
                                                                </View>
                                                            </View>
                                                        ))}
                                                    </View>
                                                ) : (
                                                    <ThemedText style={{ color: colors.textSecondary, fontSize: 12 }}>
                                                        No fares added yet. Add one route and fare at a time.
                                                    </ThemedText>
                                                )}
                                            </View>
                                        </View>
                                    )}
                                </View>

                                <View style={styles.inputGroup}>
                                    <ThemedText style={styles.label}>Currency</ThemedText>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: colors.secondaryBackground, borderColor: colors.border, color: colors.text }]}
                                        value={form.currency}
                                        onChangeText={(val) => setForm(f => ({ ...f, currency: val.toUpperCase() }))}
                                        placeholder="ZAR"
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

            <Modal
                visible={showRoutePicker}
                transparent
                animationType="fade"
                onRequestClose={() => setShowRoutePicker(false)}
            >
                <View style={styles.routePickerOverlay}>
                    <View style={[styles.routePickerSheet, { backgroundColor: colors.background, borderColor: colors.border }]}>
                        <View style={styles.routePickerHeader}>
                            <ThemedText type="subtitle">Choose a route</ThemedText>
                            <TouchableOpacity onPress={() => setShowRoutePicker(false)}>
                                <Feather name="x" size={20} color={colors.text} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
                            {routeOptions.map((route) => (
                                <TouchableOpacity
                                    key={route}
                                    onPress={() => {
                                        setRouteFareDraft((prev) => ({ ...prev, route }));
                                        setShowRoutePicker(false);
                                    }}
                                    style={[styles.routePickerOption, { borderBottomColor: colors.border }]}
                                >
                                    <ThemedText style={{ color: colors.text, fontWeight: '600' }}>{route}</ThemedText>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
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
    correctionCard: {
        borderWidth: 1,
        borderRadius: 16,
        padding: 14,
        gap: 10,
    },
    statusChip: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
    },
    correctionTopRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
    },
    correctionMetaRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    correctionActionsRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 4,
    },
    correctionActionButton: {
        flex: 1,
        minHeight: 44,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    reviewNoteField: {
        gap: 8,
        marginTop: 4,
    },
    reviewNoteLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#6B7280',
    },
    reviewModalCard: {
        width: '92%',
        maxHeight: '80%',
        borderRadius: 24,
        borderWidth: 1,
        overflow: 'hidden',
    },
    reviewModalContent: {
        padding: 20,
        gap: 16,
    },
    reviewSummary: {
        borderWidth: 1,
        borderRadius: 16,
        padding: 14,
    },
    reviewNotesInput: {
        minHeight: 110,
        textAlignVertical: 'top',
    },
    reviewNoteInput: {
        minHeight: 110,
        textAlignVertical: 'top',
        borderWidth: 1,
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 14,
    },
    reviewActionsRow: {
        flexDirection: 'row',
        gap: 10,
    },
    reviewSecondaryButton: {
        flex: 1,
        minHeight: 48,
        borderRadius: 14,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    reviewPrimaryButton: {
        flex: 1,
        minHeight: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyFareHint: {
        borderWidth: 1,
        borderStyle: 'dashed',
        borderRadius: 14,
        padding: 14,
    },
    routeFareDraftRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    routePickerButton: {
        flex: 1,
        minHeight: 48,
        borderWidth: 1,
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    routeFareInput: {
        width: 110,
        minHeight: 48,
        borderWidth: 1,
        borderRadius: 14,
        paddingHorizontal: 14,
        fontSize: 16,
    },
    savedFaresBox: {
        borderWidth: 1,
        borderRadius: 16,
        padding: 14,
        gap: 12,
    },
    savedFareItem: {
        borderWidth: 1,
        borderRadius: 14,
        padding: 12,
        gap: 10,
    },
    savedFareActions: {
        flexDirection: 'row',
        gap: 8,
    },
    savedFareActionButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
    },
    routePickerOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.35)',
        padding: 16,
    },
    routePickerSheet: {
        borderWidth: 1,
        borderRadius: 20,
        overflow: 'hidden',
        maxHeight: '65%',
    },
    routePickerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
    },
    routePickerOption: {
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
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
