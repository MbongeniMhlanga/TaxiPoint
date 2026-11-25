import { API_BASE_URL } from '@/config';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

type TripOption = {
  rankId?: string | null;
  name: string;
  address?: string | null;
  district?: string | null;
  routes?: string[];
  currency?: string;
  fares?: Record<string, number>;
  incidents?: { description: string }[];
};
type TripPlan = {
  origin: string;
  destination: string;
  summary: string;
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  legs?: { from: string; to: string; distanceMeters: number; durationSeconds: number }[];
};
type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  tripOptions?: TripOption[];
  tripPlan?: TripPlan | null;
};
const suggestions = ['Find taxi ranks near me', 'Are there any reported delays?', 'How do I find a route and fare?'];

function AnimatedText({ content, speed = 12 }: { content: string; speed?: number }) {
  const [visible, setVisible] = useState('');
  useEffect(() => {
    let index = 0;
    setVisible('');
    const timer = setInterval(() => {
      index += 1;
      setVisible(content.slice(0, index));
      if (index >= content.length) clearInterval(timer);
    }, speed);
    return () => clearInterval(timer);
  }, [content, speed]);
  return <Text>{visible}{visible.length < content.length ? <Text style={{ color: '#2563EB' }}>|</Text> : null}</Text>;
}

export default function AssistantScreen() {
  const { user } = useAuth();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const router = useRouter();
  const greeting = `Hi ${user?.name || 'there'}! I'm your TaxiPoint commuter assistant. How can I help with your trip today?`;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const formatDistance = (meters = 0) => meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`;
  const formatDuration = (seconds = 0) => {
    const minutes = Math.max(1, Math.round(seconds / 60));
    return minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${minutes} min`;
  };

  const getCurrentLocation = async (question: string) => {
    if (!/\bnear me\b|\bnearby\b|\bclose to me\b/i.test(question)) return null;
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== 'granted') return null;
    const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    return { latitude: location.coords.latitude, longitude: location.coords.longitude };
  };

  const askQuestion = async (question = input) => {
    const prompt = question.trim();
    if (!prompt || loading || !user?.token) return;
    const userMessage: Message = { id: `${Date.now()}-user`, role: 'user', content: prompt };
    setInput('');
    setMessages((current) => [...current, userMessage]);
    setLoading(true);
    try {
      const location = await getCurrentLocation(prompt);
      const response = await fetch(`${API_BASE_URL}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
        body: JSON.stringify({
          message: prompt,
          history: [...messages, userMessage].map(({ role, content }) => ({ role, content })),
          latitude: location?.latitude,
          longitude: location?.longitude,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || data.error || 'The assistant is unavailable right now.');
      setMessages((current) => [...current, {
        id: `${Date.now()}-assistant`,
        role: 'assistant',
        content: data.reply ?? data.text ?? 'I could not generate a response.',
        tripOptions: Array.isArray(data.tripOptions) ? data.tripOptions : [],
        tripPlan: data.tripPlan ?? null,
      }]);
    } catch (error) {
      Alert.alert('Assistant unavailable', error instanceof Error ? error.message : 'Please try again shortly.');
    } finally {
      setLoading(false);
    }
  };

  const showRankOnMap = (option: TripOption) => {
    if (!option.rankId && !option.name) return;
    router.push({
      pathname: '/(tabs)/explore',
      params: { rankId: option.rankId ?? '', rankName: option.name },
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
        <View style={[styles.header, { borderBottomColor: colors.border }]}><View style={[styles.headerIcon, { backgroundColor: colors.tint }]}><Feather name="cpu" size={22} color="#fff" /></View><View><Text style={[styles.headerTitle, { color: colors.text }]}>TaxiPoint Assistant</Text><Text style={{ color: colors.success, fontSize: 12 }}>● Ready to help you plan your trip</Text></View></View>
        <ScrollView style={styles.messages} contentContainerStyle={styles.messagesContent} keyboardShouldPersistTaps="handled">
          <View style={styles.row}><View style={[styles.avatar, { backgroundColor: `${colors.tint}18` }]}><Feather name="cpu" size={15} color={colors.tint} /></View><View style={[styles.bubble, { backgroundColor: colors.secondaryBackground }]}><Text style={{ color: colors.text, lineHeight: 20 }}><AnimatedText content={greeting} speed={16} /></Text></View></View>
          {messages.map((message) => <React.Fragment key={message.id}>
            <View style={[styles.row, message.role === 'user' && styles.userRow]}>{message.role === 'assistant' && <View style={[styles.avatar, { backgroundColor: `${colors.tint}18` }]}><Feather name="cpu" size={15} color={colors.tint} /></View>}<View style={[styles.bubble, { backgroundColor: message.role === 'user' ? colors.tint : colors.secondaryBackground }, message.role === 'user' && styles.userBubble]}><Text style={{ color: message.role === 'user' ? '#fff' : colors.text, lineHeight: 20 }}>{message.role === 'assistant' ? <AnimatedText content={message.content} /> : message.content}</Text></View>{message.role === 'user' && <View style={[styles.avatar, { backgroundColor: `${colors.tint}18` }]}><Feather name="user" size={15} color={colors.tint} /></View>}</View>
            {message.role === 'assistant' && message.tripPlan && <View style={[styles.planCard, { backgroundColor: colors.secondaryBackground, borderColor: colors.border }]}><Text style={[styles.cardTitle, { color: colors.text }]}>{message.tripPlan.origin} → {message.tripPlan.destination}</Text><Text style={{ color: colors.textSecondary }}>{message.tripPlan.summary}</Text><Text style={[styles.cardMeta, { color: colors.tint }]}>{formatDistance(message.tripPlan.totalDistanceMeters)} · {formatDuration(message.tripPlan.totalDurationSeconds)}</Text></View>}
            {message.role === 'assistant' && (message.tripOptions?.length ?? 0) > 0 && <View style={styles.options}><Text style={[styles.sectionTitle, { color: colors.text }]}>Suggested taxi ranks</Text>{message.tripOptions?.map((option, index) => <TouchableOpacity key={`${message.id}-option-${index}`} activeOpacity={0.75} onPress={() => showRankOnMap(option)} style={[styles.optionCard, { backgroundColor: colors.secondaryBackground, borderColor: colors.border }]}><View style={styles.optionHeader}><Text style={[styles.cardTitle, { color: colors.text, flex: 1 }]}>{option.name}</Text><Feather name="map-pin" size={17} color={colors.tint} /></View><Text style={{ color: colors.textSecondary }}>{option.address || option.district || 'Taxi rank'}</Text>{option.routes?.length ? <Text style={{ color: colors.tint, marginTop: 5 }}>{option.routes.slice(0, 3).join(', ')}</Text> : null}{option.incidents?.length ? <Text style={{ color: colors.error, marginTop: 5 }}>{option.incidents.length} active incident{option.incidents.length === 1 ? '' : 's'}</Text> : null}<Text style={[styles.viewOnMap, { color: colors.tint }]}>Tap to view on map</Text></TouchableOpacity>)}</View>}
          </React.Fragment>)}
          {loading && <View style={styles.row}><View style={[styles.avatar, { backgroundColor: `${colors.tint}18` }]}><Feather name="cpu" size={15} color={colors.tint} /></View><ActivityIndicator color={colors.tint} /></View>}
        </ScrollView>
        {messages.length === 0 && <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestions}>{suggestions.map((suggestion) => <TouchableOpacity key={suggestion} onPress={() => void askQuestion(suggestion)} style={[styles.suggestion, { backgroundColor: `${colors.tint}12`, borderColor: `${colors.tint}35` }]}><Text style={{ color: colors.tint, fontSize: 12, fontWeight: '600' }}>{suggestion}</Text></TouchableOpacity>)}</ScrollView>}
        <View style={[styles.composer, { borderColor: colors.border, backgroundColor: colors.secondaryBackground }]}><Feather name="message-circle" size={19} color={colors.textSecondary} /><TextInput value={input} onChangeText={setInput} onSubmitEditing={() => void askQuestion()} placeholder="Ask about your journey..." placeholderTextColor={colors.textSecondary} style={[styles.input, { color: colors.text }]} editable={!loading} returnKeyType="send" /><TouchableOpacity onPress={() => void askQuestion()} disabled={!input.trim() || loading} style={[styles.send, { backgroundColor: colors.tint, opacity: input.trim() && !loading ? 1 : 0.4 }]}><Feather name="send" size={17} color="#fff" /></TouchableOpacity></View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 18, borderBottomWidth: 1 },
  headerIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '800', marginBottom: 3 },
  messages: { flex: 1 },
  messagesContent: { padding: 18, gap: 16 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
  userRow: { justifyContent: 'flex-end' },
  avatar: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  bubble: { maxWidth: '82%', borderRadius: 17, borderTopLeftRadius: 5, paddingHorizontal: 14, paddingVertical: 11 },
  userBubble: { borderTopLeftRadius: 17, borderTopRightRadius: 5 },
  suggestions: { gap: 8, height: 58, alignItems: 'center', paddingHorizontal: 14 },
  suggestion: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 9, minHeight: 38, justifyContent: 'center' },
  composer: { margin: 14, marginTop: 4, borderWidth: 1, borderRadius: 16, padding: 7, paddingLeft: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: { flex: 1, minHeight: 38, fontSize: 14 },
  send: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  options: { width: '100%', gap: 8, marginLeft: 39 },
  sectionTitle: { fontSize: 14, fontWeight: '800', marginBottom: 2 },
  optionCard: { borderWidth: 1, borderRadius: 14, padding: 12, width: '88%' },
  optionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  viewOnMap: { marginTop: 8, fontSize: 12, fontWeight: '800' },
  planCard: { marginLeft: 39, width: '88%', borderWidth: 1, borderRadius: 14, padding: 12, gap: 5 },
  cardTitle: { fontSize: 15, fontWeight: '800' },
  cardMeta: { marginTop: 4, fontSize: 13, fontWeight: '700' },
});
