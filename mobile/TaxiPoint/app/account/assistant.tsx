import { API_BASE_URL } from '@/config';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Feather } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

type Message = { id: string; role: 'user' | 'assistant'; content: string };
const suggestions = ['Find taxi ranks near me', 'Are there any reported delays?', 'How do I find a route and fare?'];

function AnimatedText({ content, speed = 22 }: { content: string; speed?: number }) {
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
  const greeting = `Hi ${user?.name || 'there'}! I'm your TaxiPoint commuter assistant. How can I help with your trip today?`;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const askQuestion = async (question = input) => {
    const prompt = question.trim();
    if (!prompt || loading || !user?.token) return;
    const userMessage: Message = { id: `${Date.now()}-user`, role: 'user', content: prompt };
    setInput('');
    setMessages((current) => [...current, userMessage]);
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
        body: JSON.stringify({ message: prompt, history: [...messages, userMessage] }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || data.error || 'The assistant is unavailable right now.');
      setMessages((current) => [...current, { id: `${Date.now()}-assistant`, role: 'assistant', content: data.reply ?? data.text ?? 'I could not generate a response.' }]);
    } catch (error) {
      Alert.alert('Assistant unavailable', error instanceof Error ? error.message : 'Please try again shortly.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}><View style={[styles.headerIcon, { backgroundColor: colors.tint }]}><Feather name="cpu" size={22} color="#fff" /></View><View><Text style={[styles.headerTitle, { color: colors.text }]}>TaxiPoint Assistant</Text><Text style={{ color: colors.success, fontSize: 12 }}>● Ready to help you plan your trip</Text></View></View>
        <ScrollView style={styles.messages} contentContainerStyle={styles.messagesContent} keyboardShouldPersistTaps="handled">
          <View style={styles.row}><View style={[styles.avatar, { backgroundColor: `${colors.tint}18` }]}><Feather name="cpu" size={15} color={colors.tint} /></View><View style={[styles.bubble, { backgroundColor: colors.secondaryBackground }]}><Text style={{ color: colors.text, lineHeight: 20 }}><AnimatedText content={greeting} speed={28} /></Text></View></View>
          {messages.map((message) => <View key={message.id} style={[styles.row, message.role === 'user' && styles.userRow]}>{message.role === 'assistant' && <View style={[styles.avatar, { backgroundColor: `${colors.tint}18` }]}><Feather name="cpu" size={15} color={colors.tint} /></View>}<View style={[styles.bubble, { backgroundColor: message.role === 'user' ? colors.tint : colors.secondaryBackground }, message.role === 'user' && styles.userBubble]}><Text style={{ color: message.role === 'user' ? '#fff' : colors.text, lineHeight: 20 }}>{message.role === 'assistant' ? <AnimatedText content={message.content} /> : message.content}</Text></View>{message.role === 'user' && <View style={[styles.avatar, { backgroundColor: `${colors.tint}18` }]}><Feather name="user" size={15} color={colors.tint} /></View>}</View>)}
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
  suggestions: { gap: 8, paddingHorizontal: 14, paddingBottom: 10 },
  suggestion: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 9 },
  composer: { margin: 14, marginTop: 4, borderWidth: 1, borderRadius: 16, padding: 7, paddingLeft: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: { flex: 1, minHeight: 38, fontSize: 14 },
  send: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
