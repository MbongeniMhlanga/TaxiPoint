import { API_BASE_URL } from '@/config';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Feather } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';

type CorrectionType =
  | 'WRONG_ROUTE_NUMBER'
  | 'MISSING_ROUTE'
  | 'WRONG_FARE'
  | 'RANK_CLOSED'
  | 'MISSING_RANK'
  | 'ROUTE_CHANGE'
  | 'OTHER';

interface CorrectionSubmission {
  id: string;
  rankId?: string | null;
  rankNameSnapshot?: string | null;
  correctionType: CorrectionType;
  description: string;
  details?: Record<string, any> | null;
  status: string;
  confirmationsCount: number;
  rejectionsCount: number;
  autoApproved: boolean;
  reviewedByEmail?: string | null;
  reviewNotes?: string | null;
  createdAt?: string | null;
}

const formatCorrectionType = (type: string) => {
  const labels: Record<string, string> = {
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

const formatStatus = (status: string) => status.charAt(0) + status.slice(1).toLowerCase();

export default function CorrectionsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  const colors = Colors[theme];
  const [submissions, setSubmissions] = useState<CorrectionSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadHistory = useCallback(async (showSpinner = true) => {
    if (!user?.token) {
      setSubmissions([]);
      setLoading(false);
      return;
    }

    if (showSpinner) setLoading(true);
    else setRefreshing(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/submissions/mine`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });

      if (!res.ok) {
        setSubmissions([]);
        return;
      }

      const data = await res.json();
      setSubmissions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load correction history:', err);
      setSubmissions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.token]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors.secondaryBackground }]}>
          <Feather name="chevron-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <ThemedText type="subtitle">Correction History</ThemedText>
          <Text style={{ color: colors.textSecondary, marginTop: 2 }}>
            Track the corrections you’ve submitted.
          </Text>
        </View>
        <TouchableOpacity onPress={() => loadHistory(false)} style={[styles.refreshButton, { backgroundColor: colors.tint }]}>
          <Feather name="refresh-cw" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={{ color: colors.textSecondary, marginTop: 12 }}>Loading corrections...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadHistory(false)} tintColor={colors.tint} />}
        >
          {submissions.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.secondaryBackground, borderColor: colors.border }]}>
              <Feather name="inbox" size={28} color={colors.tint} />
              <ThemedText type="defaultSemiBold" style={{ marginTop: 12 }}>No corrections yet</ThemedText>
              <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 8, lineHeight: 20 }}>
                When you submit a correction from a taxi rank detail page, it will show up here.
              </Text>
            </View>
          ) : (
            submissions.map((item) => (
              <View key={item.id} style={[styles.card, { backgroundColor: colors.secondaryBackground, borderColor: colors.border }]}>
                <View style={styles.cardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontSize: 18, fontWeight: '800' }}>
                      {item.rankNameSnapshot ?? 'Taxi rank'}
                    </Text>
                    <Text style={{ color: colors.textSecondary, marginTop: 4 }}>
                      {formatCorrectionType(item.correctionType)}
                    </Text>
                  </View>
                  <View style={[styles.statusChip, { backgroundColor: item.status === 'APPROVED' ? '#DCFCE7' : item.status === 'REJECTED' ? '#FEE2E2' : '#DBEAFE' }]}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: item.status === 'APPROVED' ? '#166534' : item.status === 'REJECTED' ? '#991B1B' : '#1D4ED8' }}>
                      {formatStatus(item.status)}
                    </Text>
                  </View>
                </View>

                <Text style={{ color: colors.text, marginTop: 10, lineHeight: 20 }}>
                  {item.description}
                </Text>

                <View style={styles.metaRow}>
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                    {item.confirmationsCount} confirmations
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                    {item.rejectionsCount} rejections
                  </Text>
                  {item.autoApproved ? <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Auto-approved</Text> : null}
                </View>

                {item.reviewNotes ? (
                  <View style={[styles.notesBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 4 }}>Review notes</Text>
                    <Text style={{ color: colors.text, lineHeight: 18 }}>{item.reviewNotes}</Text>
                  </View>
                ) : null}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 16,
    gap: 12,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    gap: 10,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  notesBox: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginTop: 4,
  },
});
