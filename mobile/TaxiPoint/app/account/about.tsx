import { Colors } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import { ArrowRight, Heart, MapPin, Shield, TrendingUp, Users, Zap } from 'lucide-react-native';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';

const { width } = Dimensions.get('window');

export default function AboutScreen() {
    const colorScheme = useColorScheme();
    const theme = colorScheme ?? 'light';
    const colors = Colors[theme];
    const isDark = theme === 'dark';
    const router = useRouter();

    // Theme colors
    const backgroundColors = isDark
        ? [colors.background, colors.secondaryBackground, colors.background]
        : [colors.background, '#EFF6FF', '#FAF5FF']; // Finer gradients for light mode

    const cardBg = colors.surface;
    const textColor = colors.text;
    const subTextColor = colors.textSecondary;
    const primaryColor = colors.tint;

    const features = [
        {
            icon: MapPin,
            title: 'Real-Time Locations',
            description: 'Find taxi ranks instantly with live location data.',
            colors: ['#3B82F6', '#2563EB'], // blue-500 to blue-600
        },
        {
            icon: Users,
            title: 'Community Driven',
            description: 'Built by commuters, for commuters.',
            colors: ['#A855F7', '#9333EA'], // purple-500 to purple-600
        },
        {
            icon: Shield,
            title: 'Safety First',
            description: 'Report and view incidents in real-time.',
            colors: ['#22C55E', '#16A34A'], // green-500 to green-600
        },
        {
            icon: Zap,
            title: 'Lightning Fast',
            description: 'Optimized performance for instant info.',
            colors: ['#EAB308', '#CA8A04'], // yellow-500 to yellow-600
        },
        {
            icon: Heart,
            title: 'Made with Care',
            description: 'Designed for the SA commuting community.',
            colors: ['#EF4444', '#DC2626'], // red-500 to red-600
        },
        {
            icon: TrendingUp,
            title: 'Always Improving',
            description: 'Regular updates based on your feedback.',
            colors: ['#6366F1', '#4F46E5'], // indigo-500 to indigo-600
        },
    ];

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            <LinearGradient
                colors={backgroundColors}
                style={styles.gradientContainer}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {/* Header / Nav - Custom since we hid the default header */}
                    {/* Hero Section */}
                    <LinearGradient
                        colors={[primaryColor, '#9333EA']} // Keeping the secondary purple for premium feel
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.heroSection}
                    >
                        <View style={styles.heroContent}>
                            <View style={styles.iconContainer}>
                                <MapPin size={40} color="#FFFFFF" />
                            </View>
                            <Text style={styles.heroTitle}>About TaxiPoint</Text>
                            <Text style={styles.heroSubtitle}>
                                Your trusted companion for navigating South Africa's taxi network
                            </Text>
                        </View>
                    </LinearGradient>

                    {/* Mission Section */}
                    <View style={[styles.missionCard, { backgroundColor: cardBg }]}>
                        <Text style={[styles.sectionTitle, { color: textColor }]}>Our Mission</Text>
                        <Text style={[styles.missionText, { color: subTextColor }]}>
                            TaxiPoint was created to make commuting easier and safer for everyone. We provide real-time
                            information about taxi ranks, help you navigate the city, and keep you informed about incidents
                            that might affect your journey.
                        </Text>
                    </View>

                    {/* Features Grid */}
                    <View style={styles.featuresCompleteContainer}>
                        <View style={styles.featuresGrid}>
                            {features.map((feature, index) => (
                                <View key={index} style={[styles.featureCard, { backgroundColor: cardBg, width: (width - 60) / 2 }]}>
                                    <LinearGradient
                                        colors={feature.colors}
                                        style={styles.featureIconContainer}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                    >
                                        <feature.icon size={24} color="#FFFFFF" />
                                    </LinearGradient>
                                    <Text style={[styles.featureTitle, { color: textColor }]}>{feature.title}</Text>
                                    <Text style={[styles.featureDescription, { color: subTextColor }]}>{feature.description}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Stats Section */}
                    <LinearGradient
                        colors={[primaryColor, '#9333EA']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.statsSection}
                    >
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>5+</Text>
                            <Text style={styles.statLabel}>Taxi Ranks</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>3</Text>
                            <Text style={styles.statLabel}>Districts</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>24/7</Text>
                            <Text style={styles.statLabel}>Updates</Text>
                        </View>
                    </LinearGradient>

                    {/* CTA Section */}
                    <View style={styles.ctaSection}>
                        <Text style={[styles.ctaTitle, { color: textColor }]}>Ready to Get Started?</Text>
                        <Text style={[styles.ctaText, { color: subTextColor }]}>
                            Join thousands of commuters who trust TaxiPoint.
                        </Text>
                        <TouchableOpacity onPress={() => router.push('/taxi-ranks/taxiranks')}>
                            <LinearGradient
                                colors={[primaryColor, '#9333EA']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.ctaButton}
                            >
                                <Text style={styles.ctaButtonText}>Explore Taxi Ranks</Text>
                                <ArrowRight size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>

                    <View style={{ height: 40 }} />
                </ScrollView>
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradientContainer: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    heroSection: {
        paddingVertical: 60,
        paddingHorizontal: 20,
        alignItems: 'center',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    heroContent: {
        alignItems: 'center',
    },
    iconContainer: {
        width: 80,
        height: 80,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    heroTitle: {
        fontSize: 32,
        color: '#FFFFFF',
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    heroSubtitle: {
        fontSize: 18,
        color: '#BFDBFE', // blue-100
        textAlign: 'center',
        maxWidth: 300,
    },
    missionCard: {
        margin: 20,
        padding: 24,
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 12,
        textAlign: 'center',
    },
    missionText: {
        fontSize: 16,
        lineHeight: 24,
        textAlign: 'center',
    },
    featuresCompleteContainer: {
        paddingHorizontal: 20,
    },
    featuresGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 16,
    },
    featureCard: {
        padding: 16,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        marginBottom: 16,
    },
    featureIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    featureTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    featureDescription: {
        fontSize: 13,
        lineHeight: 18,
    },
    statsSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        margin: 20,
        padding: 30,
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 5,
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statNumber: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 14,
        color: '#BFDBFE',
    },
    ctaSection: {
        alignItems: 'center',
        padding: 20,
        marginBottom: 20,
    },
    ctaTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
    },
    ctaText: {
        fontSize: 16,
        marginBottom: 24,
        textAlign: 'center',
    },
    ctaButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 50,
        shadowColor: Colors.light.tint, // Use a fixed shadow color for consistency or primaryColor
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    ctaButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
    },
});
