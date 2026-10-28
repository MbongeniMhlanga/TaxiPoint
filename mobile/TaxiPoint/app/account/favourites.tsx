import { API_BASE_URL } from '@/config';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Feather } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Linking, RefreshControl, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface TaxiRank {
  id: string;
  name: string;
  address: string;
  district: string;
  routesServed: string[];
  phone: string;
}

export default function FavouritesScreen() {
  const { user } = useAuth();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const [favorites, setFavorites] = useState<TaxiRank[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadFavorites = useCallback(async () => {
    if (!user?.token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/favourites`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (!response.ok) throw new Error('Unable to load favourites');
      setFavorites(await response.json());
    } catch {
      Alert.alert('Could not load favourites', 'Please try again in a moment.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.token]);

  useEffect(() => { void loadFavorites(); }, [loadFavorites]);

  const removeFavorite = async (rank: TaxiRank) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/favourites/${rank.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      if (!response.ok) throw new Error('Unable to remove favourite');
      setFavorites((current) => current.filter((item) => item.id !== rank.id));
    } catch {
      Alert.alert('Could not remove favourite', 'Please try again.');
    }
  };

  const renderFavorite = ({ item }: { item: TaxiRank }) => (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.cardTop}>
        <View style={styles.cardTitleArea}>
          <Text style={[styles.district, { color: colors.tint }]}>{item.district}</Text>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
          <View style={styles.addressRow}><Feather name="map-pin" size={15} color={colors.tint} /><Text style={[styles.address, { color: colors.textSecondary }]} numberOfLines={2}>{item.address}</Text></View>
        </View>
        <TouchableOpacity onPress={() => void removeFavorite(item)} style={styles.removeButton} accessibilityLabel={`Remove ${item.name} from favourites`}>
          <Feather name="trash-2" size={18} color={colors.error} />
        </TouchableOpacity>
      </View>

      {item.routesServed?.length > 0 && <View style={styles.routeList}>{item.routesServed.slice(0, 4).map((route) => <Text key={route} style={[styles.route, { color: colors.tint, backgroundColor: `${colors.tint}18` }]}>{route}</Text>)}</View>}
      <View style={[styles.actions, { borderTopColor: colors.border }]}>
        <TouchableOpacity style={[styles.primaryAction, { backgroundColor: colors.tint }]} onPress={() => void Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(item.address)}`)}>
          <Feather name="navigation" size={16} color="#fff" /><Text style={styles.primaryActionText}>Directions</Text>
        </TouchableOpacity>
        {!!item.phone && <TouchableOpacity style={[styles.callAction, { borderColor: colors.border }]} onPress={() => void Linking.openURL(`tel:${item.phone}`)}><Feather name="phone" size={16} color={colors.text} /><Text style={[styles.callText, { color: colors.text }]}>Call</Text></TouchableOpacity>}
      </View>
    </View>
  );

  if (loading) return <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}><ActivityIndicator color={colors.tint} /></SafeAreaView>;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id}
        renderItem={renderFavorite}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void loadFavorites(); }} tintColor={colors.tint} />}
        ListHeaderComponent={<View style={styles.header}><View style={[styles.headerIcon, { backgroundColor: `${colors.tint}18` }]}><Feather name="heart" size={25} color={colors.tint} /></View><Text style={[styles.title, { color: colors.text }]}>Favourites</Text><Text style={[styles.subtitle, { color: colors.textSecondary }]}>Your saved taxi ranks, ready when you need them.</Text><Text style={[styles.count, { color: colors.tint }]}>{favorites.length} saved</Text></View>}
        ListEmptyComponent={<View style={[styles.empty, { backgroundColor: colors.surface, borderColor: colors.border }]}><Feather name="heart" size={30} color={colors.tint} /><Text style={[styles.emptyTitle, { color: colors.text }]}>No favourites yet</Text><Text style={[styles.emptyText, { color: colors.textSecondary }]}>Open a taxi rank and tap the heart icon to save it here.</Text></View>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 32 },
  header: { alignItems: 'center', marginBottom: 22 },
  headerIcon: { width: 58, height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  title: { fontSize: 30, fontWeight: '800' },
  subtitle: { fontSize: 15, textAlign: 'center', marginTop: 6 },
  count: { fontWeight: '700', marginTop: 12 },
  card: { borderWidth: 1, borderRadius: 20, padding: 16, marginBottom: 14 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  cardTitleArea: { flex: 1 },
  district: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.7 },
  name: { fontSize: 19, fontWeight: '800', marginTop: 4 },
  addressRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
  address: { flex: 1, fontSize: 13, lineHeight: 18 },
  removeButton: { padding: 8 },
  routeList: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 14 },
  route: { borderRadius: 12, paddingHorizontal: 9, paddingVertical: 5, fontSize: 11, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 8, borderTopWidth: 1, marginTop: 15, paddingTop: 14 },
  primaryAction: { flex: 1, borderRadius: 12, paddingVertical: 11, flexDirection: 'row', gap: 7, alignItems: 'center', justifyContent: 'center' },
  primaryActionText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  callAction: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, flexDirection: 'row', gap: 7, alignItems: 'center', justifyContent: 'center' },
  callText: { fontWeight: '700', fontSize: 13 },
  empty: { borderWidth: 1, borderStyle: 'dashed', borderRadius: 20, padding: 30, alignItems: 'center' },
  emptyTitle: { fontSize: 17, fontWeight: '700', marginTop: 12 },
  emptyText: { fontSize: 14, textAlign: 'center', marginTop: 7, lineHeight: 20 },
});
