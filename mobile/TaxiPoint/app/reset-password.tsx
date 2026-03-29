import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
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

export default function ResetPasswordScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null);
  
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  useEffect(() => {
    if (token) {
      validateToken(token);
    } else {
      setValidating(false);
      setIsTokenValid(false);
    }
  }, [token]);

  const validateToken = async (resetToken: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/reset-password/validate?token=${encodeURIComponent(resetToken)}`);
      const data = await response.json();
      setIsTokenValid(!!data.valid);
    } catch (error) {
      console.error('Token validation error:', error);
      setIsTokenValid(false);
    } finally {
      setValidating(false);
    }
  };

  const handleResetPassword = async () => {
    if (password.length < 6) {
      Alert.alert('Short Password', 'Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password, confirmPassword }),
      });

      if (!response.ok) {
        let errorMsg = 'Failed to reset password';
        try {
          const data = await response.json();
          errorMsg = data.message || errorMsg;
        } catch (e) {}
        
        Alert.alert('Reset Failed', errorMsg);
        return;
      }

      Alert.alert('Success', 'Password reset successfully!', [
        { text: 'Login', onPress: () => router.replace('/') }
      ]);
    } catch (error: any) {
      console.error('Reset Password Error:', error);
      Alert.alert('Connection Error', 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
        <ThemedText style={{ marginTop: 16 }}>Validating reset link...</ThemedText>
      </View>
    );
  }

  if (isTokenValid === false) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.center}>
          <Feather name="x-circle" size={80} color={Colors.light.error} />
          <ThemedText type="title" style={styles.errorTitle}>Invalid Link</ThemedText>
          <ThemedText style={styles.errorSubtitle}>
            This password reset link is invalid or has expired.
          </ThemedText>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.tint }]}
            onPress={() => router.replace('/forgot-password')}>
            <ThemedText style={styles.actionButtonText}>Request New Link</ThemedText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <LinearGradient
              colors={['#3B82F6', '#2563EB']}
              style={styles.logoContainer}>
              <Feather name="refresh-cw" size={32} color="#fff" />
            </LinearGradient>
            <ThemedText type="title" style={styles.title}>Reset Password</ThemedText>
            <ThemedText style={styles.subtitle}>Enter a new password for your account.</ThemedText>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>New Password</ThemedText>
              <View style={[styles.inputWrapper, { backgroundColor: colors.secondaryBackground, borderColor: colors.border }]}>
                <Feather name="key" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Enter new password"
                  placeholderTextColor={colors.textSecondary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Feather name={showPassword ? "eye-off" : "eye"} size={20} color={colors.tint} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>Confirm Password</ThemedText>
              <View style={[styles.inputWrapper, { backgroundColor: colors.secondaryBackground, borderColor: colors.border }]}>
                <Feather name="check-shield" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Confirm new password"
                  placeholderTextColor={colors.textSecondary}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleResetPassword}
              disabled={loading || password.length < 6 || password !== confirmPassword}>
              <LinearGradient
                colors={loading || password.length < 6 || password !== confirmPassword ? ['#9CA3AF', '#6B7280'] : ['#3B82F6', '#2563EB']}
                style={styles.submitGradient}>
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <ThemedText style={styles.submitText}>Save New Password</ThemedText>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
    marginTop: 32,
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
  },
  errorTitle: {
    marginTop: 24,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#EF4444',
  },
  errorSubtitle: {
    textAlign: 'center',
    marginTop: 8,
    opacity: 0.7,
    paddingHorizontal: 24,
    lineHeight: 22,
  },
  actionButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 32,
    elevation: 4,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
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
});
