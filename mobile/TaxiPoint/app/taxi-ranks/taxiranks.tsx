import { API_BASE_URL } from '@/config';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Linking,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

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

export default function TaxiRanksScreen() {
    const [taxiRanks, setTaxiRanks] = useState<TaxiRank[]>([]);
    const [selectedRank, setSelectedRank] = useState<TaxiRank | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    useEffect(() => {
        fetchTaxiRanks();
    }, []);

    const fetchTaxiRanks = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/taxi-ranks?page=0&size=1000`);
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setTaxiRanks(data.content || []);
        } catch (err: any) {
            console.error(err);
            Alert.alert('Error', 'Failed to fetch taxi ranks');
        } finally {
            setLoading(false);
        }
    };

    const filteredRanks = taxiRanks.filter(rank =>
        rank.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rank.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rank.address.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const bgColor = isDark ? '#111827' : '#F9FAFB';
    const cardBg = isDark ? '#1F2937' : '#FFFFFF';
    const textColor = isDark ? '#FFFFFF' : '#111827';
    const subTextColor = isDark ? '#9CA3AF' : '#4B5563';
    const borderColor = isDark ? '#374151' : '#E5E7EB';

    const renderHours = (hours: Record<string, string>) => {
        if (!hours || Object.keys(hours).length === 0) return <Text style={{ color: subTextColor }}>Not available</Text>;
        return Object.entries(hours).map(([day, time]) => (
            <View key={day} style={styles.hourRow}>
                <Text style={{ color: textColor, fontWeight: '500' }}>{day}:</Text>
                <Text style={{ color: subTextColor }}>{time}</Text>
            </View>
        ));
    };

    const renderItem = ({ item }: { item: TaxiRank }) => (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: cardBg, borderColor }]}
            onPress={() => setSelectedRank(item)}
            activeOpacity={0.7}
        >
            <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: textColor }]}>{item.name}</Text>
                    <Text style={styles.cardDistrict}>{item.district}</Text>
                </View>
                <View style={styles.mapIconBg}>
                    <Feather name="map-pin" size={20} color="#2563EB" />
                </View>
            </View>

            <View style={styles.cardBody}>
                <View style={styles.infoRow}>
                    <Feather name="map-pin" size={16} color="#9CA3AF" />
                    <Text style={[styles.infoText, { color: subTextColor }]} numberOfLines={2}>
                        {item.address}
                    </Text>
                </View>
                {item.phone ? (
                    <View style={styles.infoRow}>
                        <Feather name="phone" size={16} color="#9CA3AF" />
                        <Text style={[styles.infoText, { color: subTextColor }]}>{item.phone}</Text>
                    </View>
                ) : null}
            </View>

            <View style={[styles.cardFooter, { borderColor }]}>
                <Text style={styles.viewDetailsText}>View Details →</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }}>
            <Stack.Screen options={{ headerShown: false }} />
            <LinearGradient
                colors={isDark ? ['#111827', '#1F2937', '#111827'] : ['#F9FAFB', '#EFF6FF', '#FAF5FF']}
                style={{ flex: 1 }}
            >
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                            <Feather name="x" size={24} color={textColor} />
                        </TouchableOpacity>
                        <View>
                            <Text style={[styles.headerTitle, { color: textColor }]}>Taxi Ranks Directory</Text>
                            <Text style={[styles.headerSubtitle, { color: subTextColor }]}>Browse all available taxi ranks</Text>
                        </View>
                    </View>

                    {/* Search Bar */}
                    <View style={[styles.searchContainer, { backgroundColor: cardBg, borderColor }]}>
                        <Feather name="search" size={20} color={subTextColor} style={{ marginRight: 10 }} />
                        <TextInput
                            style={[styles.searchInput, { color: textColor }]}
                            placeholder="Search by name, district, or address..."
                            placeholderTextColor={subTextColor}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>

                    {loading ? (
                        <View style={styles.centerContent}>
                            <ActivityIndicator size="large" color="#2563EB" />
                            <Text style={{ marginTop: 10, color: subTextColor }}>Loading taxi ranks...</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={filteredRanks}
                            renderItem={renderItem}
                            keyExtractor={item => item.id}
                            contentContainerStyle={styles.listContent}
                            ListEmptyComponent={
                                <View style={styles.centerContent}>
                                    <Text style={{ color: subTextColor, fontSize: 16 }}>No taxi ranks found.</Text>
                                </View>
                            }
                        />
                    )}

                    {/* Detail Modal */}
                    <Modal
                        visible={!!selectedRank}
                        animationType="slide"
                        transparent={true}
                        onRequestClose={() => setSelectedRank(null)}
                    >
                        <View style={styles.modalOverlay}>
                            <View style={[styles.modalContent, { backgroundColor: cardBg }]}>
                                {selectedRank && (
                                    <>
                                        <LinearGradient
                                            colors={['#2563EB', '#9333EA']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                            style={styles.modalHeader}
                                        >
                                            <TouchableOpacity
                                                onPress={() => setSelectedRank(null)}
                                                style={styles.closeModalButton}
                                            >
                                                <Feather name="x" size={20} color="#FFFFFF" />
                                            </TouchableOpacity>
                                            <View style={styles.modalHeaderContent}>
                                                <View style={styles.largeIconBg}>
                                                    <Feather name="map-pin" size={28} color="#2563EB" />
                                                </View>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={styles.modalTitleWhite}>{selectedRank.name}</Text>
                                                    <Text style={styles.modalSubtitleWhite}>{selectedRank.district}</Text>
                                                </View>
                                            </View>
                                        </LinearGradient>

                                        <ScrollView contentContainerStyle={styles.modalBody}>
                                            {selectedRank.description ? (
                                                <View style={styles.section}>
                                                    <Text style={[styles.sectionHeader, { color: textColor }]}>About</Text>
                                                    <Text style={[styles.sectionText, { color: subTextColor }]}>{selectedRank.description}</Text>
                                                </View>
                                            ) : null}

                                            <View style={styles.section}>
                                                <Text style={[styles.sectionHeader, { color: textColor }]}>Location</Text>
                                                <View style={styles.infoRow}>
                                                    <Feather name="map-pin" size={20} color={subTextColor} />
                                                    <Text style={[styles.sectionText, { color: subTextColor, flex: 1 }]}>{selectedRank.address}</Text>
                                                </View>
                                            </View>

                                            {selectedRank.phone ? (
                                                <View style={styles.section}>
                                                    <Text style={[styles.sectionHeader, { color: textColor }]}>Contact</Text>
                                                    <TouchableOpacity
                                                        style={[styles.callButton, { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.2)' : '#F0FDF4', borderColor: isDark ? '#14532D' : '#BBF7D0' }]}
                                                        onPress={() => Linking.openURL(`tel:${selectedRank.phone}`)}
                                                    >
                                                        <View style={styles.phoneIconBg}>
                                                            <Feather name="phone" size={20} color="#FFFFFF" />
                                                        </View>
                                                        <View>
                                                            <Text style={{ color: subTextColor, fontSize: 12 }}>Call Now</Text>
                                                            <Text style={{ color: textColor, fontSize: 16, fontWeight: '600' }}>{selectedRank.phone}</Text>
                                                        </View>
                                                    </TouchableOpacity>
                                                </View>
                                            ) : null}

                                            {selectedRank.hours && Object.keys(selectedRank.hours).length > 0 ? (
                                                <View style={styles.section}>
                                                    <View style={styles.rowCenter}>
                                                        <Feather name="clock" size={20} color={textColor} style={{ marginRight: 8 }} />
                                                        <Text style={[styles.sectionHeader, { color: textColor, marginBottom: 0 }]}>Operating Hours</Text>
                                                    </View>
                                                    <View style={[styles.hoursContainer, { backgroundColor: isDark ? '#111827' : '#F9FAFB' }]}>
                                                        {renderHours(selectedRank.hours)}
                                                    </View>
                                                </View>
                                            ) : null}

                                            {selectedRank.routesServed && selectedRank.routesServed.length > 0 ? (
                                                <View style={styles.section}>
                                                    <Text style={[styles.sectionHeader, { color: textColor }]}>Routes Served</Text>
                                                    <View style={styles.tagsContainer}>
                                                        {selectedRank.routesServed.map((route, idx) => (
                                                            <View key={idx} style={[styles.tag, { backgroundColor: isDark ? 'rgba(37, 99, 235, 0.3)' : '#DBEAFE' }]}>
                                                                <Text style={{ color: isDark ? '#93C5FD' : '#1D4ED8', fontSize: 12, fontWeight: '500' }}>{route}</Text>
                                                            </View>
                                                        ))}
                                                    </View>
                                                </View>
                                            ) : null}

                                            <TouchableOpacity
                                                style={styles.navigateButton}
                                                onPress={() => {
                                                    const url = Platform.select({
                                                        ios: `maps:0,0?q=${selectedRank.latitude},${selectedRank.longitude}(${selectedRank.name})`,
                                                        android: `geo:0,0?q=${selectedRank.latitude},${selectedRank.longitude}(${selectedRank.name})`,
                                                        default: `https://www.google.com/maps/search/?api=1&query=${selectedRank.latitude},${selectedRank.longitude}`
                                                    });
                                                    Linking.openURL(url!);
                                                }}
                                            >
                                                <LinearGradient
                                                    colors={['#2563EB', '#9333EA']}
                                                    start={{ x: 0, y: 0 }}
                                                    end={{ x: 1, y: 0 }}
                                                    style={styles.navigateButtonGradient}
                                                >
                                                    <Feather name="navigation" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                                                    <Text style={styles.navigateButtonText}>Get Directions</Text>
                                                </LinearGradient>
                                            </TouchableOpacity>
                                            <View style={{ height: 40 }} />
                                        </ScrollView>
                                    </>
                                )}
                            </View>
                        </View>
                    </Modal>
                </View>
            </LinearGradient>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    header: {
        marginBottom: 20,
    },
    backButton: {
        marginBottom: 10,
        alignSelf: 'flex-start'
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 16,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 20,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        height: 300,
    },
    listContent: {
        paddingBottom: 20,
    },
    card: {
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    cardDistrict: {
        fontSize: 14,
        color: '#2563EB',
        fontWeight: '500',
    },
    mapIconBg: {
        backgroundColor: '#DBEAFE', // blue-100
        padding: 8,
        borderRadius: 8,
    },
    cardBody: {
        gap: 8,
        marginBottom: 16,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    infoText: {
        fontSize: 14,
    },
    cardFooter: {
        borderTopWidth: 1,
        paddingTop: 12,
    },
    viewDetailsText: {
        color: '#2563EB',
        fontWeight: '600',
        fontSize: 14,
    },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        height: '90%',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        overflow: 'hidden',
    },
    modalHeader: {
        padding: 24,
        paddingTop: 40,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },
    closeModalButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 20,
        zIndex: 10,
    },
    modalHeaderContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    largeIconBg: {
        backgroundColor: '#EFF6FF',
        padding: 12,
        borderRadius: 12
    },
    modalTitleWhite: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF'
    },
    modalSubtitleWhite: {
        fontSize: 16,
        color: '#DBEAFE'
    },

    modalBody: {
        padding: 24,
        gap: 24
    },
    section: {
        gap: 8
    },
    sectionHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8
    },
    sectionText: {
        fontSize: 16,
        lineHeight: 24
    },
    callButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        gap: 12
    },
    phoneIconBg: {
        backgroundColor: '#16A34A',
        padding: 8,
        borderRadius: 8
    },
    hoursContainer: {
        padding: 16,
        borderRadius: 12,
        gap: 8
    },
    hourRow: {
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    rowCenter: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8
    },
    tag: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20
    },
    navigateButton: {
        marginTop: 8,
        borderRadius: 12,
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    navigateButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12
    },
    navigateButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600'
    }
});
