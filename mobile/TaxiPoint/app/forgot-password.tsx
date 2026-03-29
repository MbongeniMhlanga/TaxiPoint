import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { 
  ActivityIndicator, 
  Alert, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  View 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedText } from '@/components/themed-text';
import { API_BASE_URL } from '@/config';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const router = useRouter();
  const colorScheme = useColorScheme();

  const theme = colorScheme ?? 'light';
  const colors = Colors[theme];
  const isDark = theme === 'dark';

  const handleForgotPassword = async () => {
    if (!email || !email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        let errorMsg = 'Failed to send reset link';
        try {
          const data = await response.json();
          errorMsg = data.message || errorMsg;
        } catch (e) {}
        
        Alert.alert('Request Failed', errorMsg);
        return;
      }

      setIsSent(true);
    } catch (error: any) {
      console.error('Forgot Password Error:', error);
      Alert.alert('Connection Error', 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}>
            <Feather name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.header}>
            <LinearGradient
              colors={['#3B82F6', '#2563EB']}
              style={styles.logoContainer}>
              <Feather name="lock" size={32} color="#fff" />
            </LinearGradient>
            <ThemedText type="title" style={styles.title}>Forgot Password?</ThemedText>
            <ThemedText style={styles.subtitle}>
              {isSent 
                ? "Check your email for instructions to reset your password." 
                : "Enter your email address and we'll send you a link to reset your password."}
            </ThemedText>
          </View>

          {!isSent ? (
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <ThemedText style={styles.label}>Email Address</ThemedText>
                <View style={[styles.inputWrapper, { backgroundColor: colors.secondaryBackground, borderColor: colors.border }]}>
                  <Feather name="mail" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="example@email.com"
                    placeholderTextColor={colors.textSecondary}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleForgotPassword}
                disabled={loading}>
                <LinearGradient
                  colors={['#3B82F6', '#2563EB']}
                  style={styles.submitGradient}>
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <ThemedText style={styles.submitText}>Send Reset Link</ThemedText>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.successContainer}>
              <View style={[styles.successCircle, { backgroundColor: '#F0FDF4' }]}>
                <Feather name="check-circle" size={48} color="#16A34A" />
              </View>
              <ThemedText style={styles.successTitle}>Email Sent!</ThemedText>
              <ThemedText style={styles.successMessage}>
                We've sent a recovery link to your email address.
              </ThemedText>
              
              <TouchableOpacity
                style={[styles.loginLink, { marginTop: 32 }]}
                onPress={() => router.replace('/')}>
                <ThemedText style={{ color: colors.tint, fontWeight: 'bold' }}>Back to Login</ThemedText>
              </TouchableOpacity>
            </View>
          )}

          {!isSent && (
            <TouchableOpacity 
              style={styles.loginLink} 
              onPress={() => router.back()}>
              <ThemedText>Remember password? </ThemedText>
              <ThemedText style={{ color: colors.tint, fontWeight: 'bold' }}>Sign In</ThemedText>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    elevation: 8,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  form: {
    gap: 24,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 60,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  submitButton: {
    height: 60,
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 12,
    elevation: 4,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  submitGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  successCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  loginLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 48,
  },
});
